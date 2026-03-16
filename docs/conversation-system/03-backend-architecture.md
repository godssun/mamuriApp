# 대화형 AI 코멘트 백엔드 아키텍처 설계서

## 1. 데이터베이스 스키마 설계

### 1.1 새 테이블: conversation_messages

```sql
-- V10__create_conversation_messages.sql
CREATE TABLE conversation_messages (
    id BIGSERIAL PRIMARY KEY,
    diary_id BIGINT NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('USER', 'AI')),
    content TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    model_name VARCHAR(50),
    prompt_version VARCHAR(20),
    token_count INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(diary_id, sequence_number)
);

CREATE INDEX idx_conv_msg_diary_id ON conversation_messages(diary_id);
CREATE INDEX idx_conv_msg_diary_seq ON conversation_messages(diary_id, sequence_number);
CREATE INDEX idx_conv_msg_user_created ON conversation_messages(user_id, created_at DESC);
```

### 1.2 구독 티어 추가

```sql
-- V11__add_subscription_tier.sql
ALTER TABLE users
ADD COLUMN subscription_tier VARCHAR(20) NOT NULL DEFAULT 'FREE'
    CHECK (subscription_tier IN ('FREE', 'MEDIUM', 'PREMIUM'));

UPDATE users SET subscription_tier = 'PREMIUM'
WHERE subscription_status IN ('ACTIVE', 'TRIALING');
```

### 1.3 기존 ai_comments 마이그레이션

```sql
-- V12__migrate_ai_comments_to_conversations.sql
INSERT INTO conversation_messages (diary_id, user_id, role, content, sequence_number,
    model_name, prompt_version, created_at)
SELECT ac.diary_id, d.user_id, 'AI', ac.content, 0,
    ac.model_name, ac.prompt_version, ac.created_at
FROM ai_comments ac
JOIN diaries d ON ac.diary_id = d.id
WHERE NOT EXISTS (
    SELECT 1 FROM conversation_messages cm
    WHERE cm.diary_id = ac.diary_id AND cm.sequence_number = 0
);
```

---

## 2. 구독 티어 모델

### SubscriptionTier Enum

```java
public enum SubscriptionTier {
    FREE(0, 1, 20, false),
    MEDIUM(4900, 5, 100, false),
    PREMIUM(9900, -1, -1, true);

    private final int monthlyPrice;
    private final int maxRepliesPerDiary;
    private final int monthlyAiCommentQuota;
    private final boolean unlimitedReplies;

    public boolean canReply(int currentReplyCount) {
        if (unlimitedReplies) return true;
        return currentReplyCount < maxRepliesPerDiary;
    }
}
```

---

## 3. API 엔드포인트

### Controller

```java
@RestController
@RequestMapping("/api/diaries/{diaryId}/conversation")
public class ConversationController {

    @PostMapping("/reply")
    public ResponseEntity<ApiResponse<ConversationReplyResponse>> sendReply(
            @PathVariable Long diaryId,
            @Valid @RequestBody ConversationReplyRequest request,
            @AuthenticationPrincipal UserDetails userDetails);

    @GetMapping
    public ResponseEntity<ApiResponse<ConversationHistoryResponse>> getConversation(
            @PathVariable Long diaryId,
            @AuthenticationPrincipal UserDetails userDetails);
}
```

### DTOs

```java
// Request
@Data
public class ConversationReplyRequest {
    @NotBlank @Size(max = 500)
    private String content;
}

// Response
@Data @Builder
public class ConversationReplyResponse {
    private Long userMessageId;
    private Long aiMessageId;
    private String aiResponse;
    private Integer remainingReplies; // null = unlimited
    private LocalDateTime createdAt;
}

// History
@Data @Builder
public class ConversationHistoryResponse {
    private Long diaryId;
    private List<ConversationMessage> messages;
    private ConversationLimits limits;
}
```

### 에러 코드

| HTTP | 코드 | 설명 |
|------|------|------|
| 403 | REPLY_LIMIT_EXCEEDED | 답변 횟수 초과 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 속도 제한 |
| 400 | INVALID_INPUT | 빈 메시지, 500자 초과 |
| 404 | DIARY_NOT_FOUND | 일기 없음 |
| 403 | UNAUTHORIZED | 본인 일기 아님 |

---

## 4. Service Layer

### ConversationService 핵심 로직

```
sendReply(diaryId, userId, content):
  1. 권한 검증 (본인 일기인지)
  2. 입력 검증 (빈 메시지, 500자 초과)
  3. Rate limit 검사
  4. 답변 제한 검사 (tier.canReply(currentCount))
     - crisis_flag 활성 시 제한 무시
  5. 안전 검사 (사용자 답변에도 crisis keyword 체크)
  6. 사용자 메시지 저장 (sequence_number = N)
  7. AI 응답 생성 (최근 10개 메시지 컨텍스트)
  8. AI 메시지 저장 (sequence_number = N+1)
  9. 남은 횟수 계산 후 응답 반환
```

---

## 5. AI 프롬프트 전략

### 컨텍스트 윈도우

- 최근 **10개 메시지**만 프롬프트에 포함
- 일기 원문은 첫 대화에서만 포함
- 토큰 예산: ~2,500 (입력) + ~300 (출력)

### 프롬프트 구조 (대화형)

```
시스템 지시 (200 토큰)
+ 일기 원문 (500 토큰, 첫 대화만)
+ 대화 히스토리 (1,500 토큰)
+ 응답 지시 (톤, 말투, 길이)
```

### 감정 일관성

- 대화 시작 시 감정 태그 저장
- 프롬프트에 "초기 감정: 좌절, 외로움" 명시
- AI 응답 2-4문장 제한

---

## 6. 비용 통제

### 다층 방어

| 레벨 | 메커니즘 | 구현 |
|------|----------|------|
| L1 | 일기당 답변 제한 | SubscriptionTier.canReply() |
| L2 | 분당 요청 제한 | Rate Limiter |
| L3 | 일일 AI 호출 제한 | Service Layer |
| L4 | 월간 비용 모니터링 | Grafana 알림 |

### 비용 추정

- 대화 1턴당: ~$0.0005
- FREE 사용자 월: ~$0.026
- MEDIUM 사용자 월: ~$0.057
- PREMIUM 사용자 월: ~$0.145

---

## 7. 마이그레이션 전략

### 단계별 롤아웃 (4주)

1. **1주차**: V10~V12 마이그레이션, 기존 데이터 복사
2. **2주차**: Feature flag로 10% 사용자 활성화
3. **3주차**: 50% → 100% 확대
4. **4주차**: 레거시 ai_comments 읽기 전용 전환

### Feature Flags

```java
CONVERSATION_ENABLED      // 대화 기능 활성화
USE_CONVERSATION_MESSAGES // 신규 테이블 사용
LEGACY_AI_COMMENTS        // 기존 테이블 병행 저장
```

---

## 8. 보안

- 권한 검증: 본인 일기에만 답변 가능
- 입력 검증: XSS/SQL Injection 방지, 500자 제한
- Rate limiting: 분당/시간당 요청 제한
- 안전 검사: 사용자 답변에도 crisis keyword 체크
- 로깅: 메시지 본문 평문 로깅 금지

---

## 9. Entity 클래스

```java
@Entity
@Table(name = "conversation_messages")
public class ConversationMessage {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "diary_id")
    private Diary diary;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String role;     // "USER" or "AI"
    private String content;
    private Integer sequenceNumber;
    private String modelName;
    private String promptVersion;
    private Integer tokenCount;
    private LocalDateTime createdAt;
}
```

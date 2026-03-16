# AI 대화 시스템 구현 계획

## 개발 일정: 5주

---

## Phase 1: 데이터베이스 및 핵심 엔티티 (3일)

### 1.1 Flyway 마이그레이션 작성
- [ ] `V10__create_conversation_messages.sql` - conversation_messages 테이블 생성
- [ ] `V11__add_subscription_tier.sql` - users 테이블에 subscription_tier 컬럼 추가
- [ ] `V12__migrate_ai_comments_to_conversations.sql` - 기존 ai_comments 데이터 마이그레이션

### 1.2 Entity 클래스
- [ ] `ConversationMessage.java` 엔티티 생성 (diary, user, role, content, sequenceNumber)
- [ ] `SubscriptionTier.java` enum 생성 (FREE/MEDIUM/PREMIUM + canReply 로직)
- [ ] `User.java` 수정 - subscriptionTier 필드 추가

### 1.3 Repository
- [ ] `ConversationMessageRepository.java` 생성
  - `findByDiaryIdOrderBySequenceNumber()`
  - `countByDiaryIdAndRole()`
  - `findRecentByDiaryId()` (최근 N개)

---

## Phase 2: 백엔드 API (5일)

### 2.1 Service Layer
- [ ] `ConversationService.java` 생성
  - `sendReply()` - 핵심 로직 (권한 검증 → 입력 검증 → 제한 검사 → 안전 검사 → 저장 → AI 생성)
  - `getConversation()` - 대화 이력 조회
  - 헬퍼: `validateDiaryOwnership()`, `countUserReplies()`, `calculateRemainingReplies()`

### 2.2 PromptBuilder 확장
- [ ] `buildConversationPrompt()` 메서드 추가
  - 대화 히스토리 포함 (최근 10개 메시지)
  - 일기 원문 (첫 대화에서만)
  - 톤/말투 설정 반영
  - 감정 일관성 지시

### 2.3 Controller
- [ ] `ConversationController.java` 생성
  - `POST /api/diaries/{diaryId}/conversation/reply`
  - `GET /api/diaries/{diaryId}/conversation`

### 2.4 DTO
- [ ] `ConversationReplyRequest.java` (@NotBlank, @Size(max=500))
- [ ] `ConversationReplyResponse.java` (userMessageId, aiMessageId, aiResponse, remainingReplies)
- [ ] `ConversationHistoryResponse.java` (messages, limits)

### 2.5 예외 처리
- [ ] `ReplyLimitExceededException` 추가
- [ ] `GlobalExceptionHandler` 에 핸들러 추가

### 2.6 SecurityConfig 업데이트
- [ ] `/api/diaries/*/conversation/**` 경로 인증 설정

---

## Phase 3: AiCommentService 통합 (2일)

### 3.1 초기 AI 코멘트 → conversation_messages 저장
- [ ] `AiCommentService.generateInitialComment()` 수정
  - conversation_messages에 sequence_number=0으로 첫 AI 메시지 저장
  - Feature flag로 레거시 ai_comments 병행 저장

### 3.2 Safety Check 확장
- [ ] `SafetyCheckService`에 사용자 reply 검사 로직 추가
- [ ] Crisis flag 활성 시 제한 무시 로직

### 3.3 AI Usage Logging
- [ ] 대화 답변도 ai_usage_log에 비용 기록

---

## Phase 4: 프론트엔드 API 클라이언트 (1일)

### 4.1 API 함수 추가
- [ ] `client.ts`에 conversation API 추가
  ```typescript
  conversationApi.getConversation(diaryId)
  conversationApi.sendReply(diaryId, content)
  ```

### 4.2 타입 정의
- [ ] `types/index.ts`에 ConversationMessage, ReplyLimit 타입 추가
- [ ] SubscriptionTier enum 추가 (FREE/MEDIUM/PREMIUM)

---

## Phase 5: 프론트엔드 UI (7일)

### 5.1 대화 스레드 컴포넌트 (3일)
- [ ] `ConversationThread.tsx` - 메시지 목록 컴포넌트
- [ ] `ConversationBubble.tsx` - AI 메시지 말풍선
- [ ] `UserBubble.tsx` - 사용자 메시지 말풍선
- [ ] `TypingIndicator.tsx` - AI 타이핑 인디케이터
- [ ] `MessageInput.tsx` - 답장 입력 + 전송 버튼
- [ ] `ReplyCounter.tsx` - 남은 횟수 표시

### 5.2 DiaryDetailScreen 확장 (2일)
- [ ] 기존 AI 댓글 영역을 ConversationThread로 교체
- [ ] 대화 이력 로드 (GET /conversation)
- [ ] 답장 전송 로직
- [ ] 로딩/에러 상태 처리
- [ ] KeyboardAvoidingView 적용

### 5.3 구독 관련 UI (2일)
- [ ] `UpgradePromptCard.tsx` - 인라인 업그레이드 안내
- [ ] `UpgradeModal.tsx` - 블로킹 업그레이드 모달
- [ ] 제한 도달 시 입력 비활성화
- [ ] 티어별 남은 횟수 표시

---

## Phase 6: 테스트 (3일)

### 6.1 백엔드 단위 테스트
- [ ] `ConversationServiceTest.java`
  - FREE 1회 성공, 2회 차단
  - MEDIUM 5회 성공, 6회 차단
  - PREMIUM 무제한
  - Crisis flag 예외 처리
  - 권한 검증 (타인 일기 차단)

### 6.2 백엔드 통합 테스트
- [ ] `ConversationControllerTest.java`
  - API 전체 흐름 테스트
  - 에러 코드 검증 (400, 403, 404, 429)

### 6.3 프론트엔드 테스트
- [ ] MessageInput 컴포넌트 테스트 (글자 수 제한, 보내기 조건)
- [ ] ReplyCounter 표시 테스트

---

## Phase 7: Rate Limiting 및 모니터링 (2일)

### 7.1 Rate Limiting
- [ ] Rate limit 로직 구현 (Redis 또는 인메모리)
- [ ] 티어별 분당/시간당 제한 설정
- [ ] 429 응답 + Retry-After 헤더

### 7.2 모니터링
- [ ] AI 사용량 로깅 (conversation 답변 포함)
- [ ] 대화 기능 사용률 쿼리 작성
- [ ] 비용 모니터링 쿼리

---

## Phase 8: Feature Flag 및 배포 (2일)

### 8.1 Feature Flag
- [ ] `CONVERSATION_ENABLED` flag 추가
- [ ] 프론트엔드: flag에 따라 답장 UI 표시/숨김
- [ ] 백엔드: flag에 따라 API 활성화

### 8.2 배포 준비
- [ ] API 문서 업데이트 (`API_CONTRACT.md`)
- [ ] 프로덕션 마이그레이션 계획
- [ ] 롤백 계획 수립

---

## 의존성 관계

```
Phase 1 (DB + Entity)
  ↓
Phase 2 (Backend API) ← Phase 3 (AI 통합)
  ↓
Phase 4 (Frontend API Client)
  ↓
Phase 5 (Frontend UI)
  ↓
Phase 6 (Tests) + Phase 7 (Rate Limit)
  ↓
Phase 8 (Feature Flag + 배포)
```

---

## 주요 기술 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| AI 모델 | GPT-4o-mini | 비용 효율 (GPT-4o 대비 1/10) |
| 컨텍스트 윈도우 | 최근 10개 메시지 | 토큰 제한 + 충분한 맥락 |
| 메시지 저장 | 별도 테이블 | 기존 ai_comments와 분리, 확장성 |
| 구독 티어 | DB enum | Stripe webhook과 연동 |
| Rate limit | Redis (향후) | MVP에서는 인메모리 가능 |
| Feature flag | 기존 FeatureFlags 확장 | 단계적 롤아웃 지원 |

---

## 파일 생성/수정 목록

### 새로 생성할 파일

**Backend:**
- `src/main/resources/db/migration/V10__create_conversation_messages.sql`
- `src/main/resources/db/migration/V11__add_subscription_tier.sql`
- `src/main/resources/db/migration/V12__migrate_ai_comments_to_conversations.sql`
- `src/main/java/.../subscription/entity/SubscriptionTier.java`
- `src/main/java/.../diary/entity/ConversationMessage.java`
- `src/main/java/.../diary/repository/ConversationMessageRepository.java`
- `src/main/java/.../diary/service/ConversationService.java`
- `src/main/java/.../diary/controller/ConversationController.java`
- `src/main/java/.../diary/dto/ConversationReplyRequest.java`
- `src/main/java/.../diary/dto/ConversationReplyResponse.java`
- `src/main/java/.../diary/dto/ConversationHistoryResponse.java`
- `src/main/java/.../global/exception/ReplyLimitExceededException.java`
- `src/test/java/.../diary/service/ConversationServiceTest.java`
- `src/test/java/.../diary/controller/ConversationControllerTest.java`

**Frontend:**
- `mobile/src/components/conversation/ConversationThread.tsx`
- `mobile/src/components/conversation/ConversationBubble.tsx`
- `mobile/src/components/conversation/UserBubble.tsx`
- `mobile/src/components/conversation/TypingIndicator.tsx`
- `mobile/src/components/conversation/MessageInput.tsx`
- `mobile/src/components/conversation/ReplyCounter.tsx`
- `mobile/src/components/subscription/UpgradePromptCard.tsx`
- `mobile/src/components/subscription/UpgradeModal.tsx`

### 수정할 파일

**Backend:**
- `src/main/java/.../user/entity/User.java` (subscriptionTier 필드)
- `src/main/java/.../ai/service/PromptBuilder.java` (대화형 프롬프트)
- `src/main/java/.../ai/service/AiCommentService.java` (conversation_messages 저장)
- `src/main/java/.../global/config/SecurityConfig.java` (경로 추가)
- `src/main/java/.../global/feature/FeatureFlags.java` (CONVERSATION_ENABLED)

**Frontend:**
- `mobile/src/api/client.ts` (conversation API 추가)
- `mobile/src/types/index.ts` (ConversationMessage, ReplyLimit 타입)
- `mobile/src/screens/DiaryDetailScreen.tsx` (대화 UI 통합)

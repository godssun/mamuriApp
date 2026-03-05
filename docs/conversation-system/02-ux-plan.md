# AI 대화 기능 UX 설계

## 설계 개요

- **작성일**: 2026-03-01
- **대상 화면**: 일기 상세 화면(대화 스레드), 구독 제한 상태, 업그레이드 프롬프트
- **구현**: React Native + Expo

---

## 1. 화면 플로우

### 일기 상세 → 대화 스레드

```
DiaryDetailScreen (확장)
├── ScrollView
│   ├── DiaryContentCard (접을 수 있음)
│   │   ├── DiaryDate
│   │   ├── DiaryTitle
│   │   └── DiaryContent
│   ├── ConversationThread
│   │   ├── ConversationBubble (AI) []
│   │   │   ├── Avatar emoji
│   │   │   ├── AI name
│   │   │   ├── Message text
│   │   │   └── Timestamp
│   │   ├── UserBubble []
│   │   │   ├── Message text
│   │   │   └── Timestamp
│   │   └── TypingIndicator (conditional)
│   └── ErrorBubble (conditional)
└── MessageInputContainer (fixed bottom)
    ├── ReplyCounter (FREE/MEDIUM only)
    ├── TextInput
    ├── CharacterCounter
    └── SendButton
```

---

## 2. UI 상태

### Initial State (AI 댓글 + 답장 입력)
- 상단: 일기 내용 (흰색 카드, border-radius 16px)
- 중간: AI 댓글 말풍선 (왼쪽 정렬, `#FFF0EB`)
- 하단: 답장 입력 (하단 고정)

### Active Conversation (대화 진행 중)
- AI 메시지: 왼쪽 정렬, `#FFF0EB`, 아바타 + 이름
- 사용자 메시지: 오른쪽 정렬, `#F8F8F8`, 아바타 없음
- 12px 간격, 자동 스크롤

### AI Typing Indicator
- 왼쪽 정렬 말풍선, 점 3개 애니메이션
- "마음이가 생각 중이에요..." 텍스트
- 입력 비활성화

### Reply Limit Reached
- 입력창 비활성화 (opacity 0.5)
- 부드러운 업그레이드 제안
- "플랜 알아보기" 버튼

### Error State
- 에러 말풍선 (`#FFEBEB`)
- "다시 시도" 버튼

---

## 3. 디자인 시스템

### 색상
- Background: `#FFF9F5`
- Primary: `#FF9B7A`
- Text: `#2D2D2D`
- Secondary: `#999`, `#666`
- AI bubble: `#FFF0EB`
- User bubble: `#F8F8F8`
- Error: `#FFEBEB`, `#D64545`

### 메시지 구분
- **AI 메시지**: 왼쪽, `#FFF0EB`, 아바타 이모지 + AI 이름
- **사용자 메시지**: 오른쪽, `#F8F8F8`, 아바타 없음
- **타임스탬프**: 각 메시지 아래, "오후 3:24" 형식, 11px, `#999`

---

## 4. Copy & Microcopy (한국어)

### 답장 입력 플레이스홀더
- "마음이에게 답장하기..."
- (AI 이름 커스텀 시: "{AI이름}에게 답장하기...")

### 답장 가능 횟수
- FREE: "답장 가능 횟수: 1회 남음"
- MEDIUM: "답장 가능 횟수: 5회 남음" → "3회 남음" → ...
- PREMIUM: 표시 없음
- 제한 도달: "답장 제한에 도달했습니다"

### 업그레이드 프롬프트
```
타이틀: 더 깊은 대화를 원하시나요?
본문: 프리미엄 플랜에서는 일기마다 제한 없이
      마음이와 대화를 나눌 수 있어요.
```

### AI 타이핑
- "마음이가 생각 중이에요..."

### 에러
- AI 실패: "답장을 받을 수 없습니다. 잠시 후 다시 시도해 주세요."
- 네트워크: "네트워크 연결을 확인해 주세요"
- 글자 수 초과: "메시지는 500자 이하로 작성해 주세요"

---

## 5. 인터랙션 상세

### 메시지 입력 규칙
- 최대 500자
- 실시간 카운터: "234/500"
- 500자 초과: 카운터 빨간색, 보내기 비활성화
- 보내기 조건: 텍스트 > 0 && ≤ 500 && 제한 남음 && AI 대기 아님

### 스크롤 동작
- 시간순 (오래된 → 최신)
- 새 메시지 도착 시 자동 스크롤
- 위로 스크롤하여 일기 재확인 가능

### KeyboardAvoidingView
- iOS: padding 방식
- Android: resize 방식

---

## 6. 구독 인지 (Subscription Awareness)

### 제한 도달 전
- 남은 횟수 조용히 표시 (12px, `#FF9B7A`)

### 제한 도달 후
1. **인라인 프롬프트**: 대화 아래 카드로 표시, 무시 가능
2. **블로킹 모달**: 전송 시도 시만 표시, "나중에" 옵션
3. **Paywall 이동**: 대화 맥락 유지

---

## 7. 감정적 안전

### AI 응답 가이드라인

**절대 금지:**
- 판단/평가하기
- 해결책 강요
- 긍정성 강요
- 전문가 흉내
- 불안감 조성

**필수:**
- 감정 반영 및 인정
- 부드러운 공감
- 사용자 페이스 존중
- 위기 시 전문 도움 권유

### 대화 종료 존중
- 답장 안 하면 강요 없음
- 일기는 혼자만의 공간이기도 함

---

## 8. TypeScript 타입

```typescript
type ConversationMessage = {
  id: string;
  type: 'ai' | 'user';
  content: string;
  createdAt: string;
};

type ReplyLimit = {
  tier: 'FREE' | 'MEDIUM' | 'PREMIUM';
  used: number;
  limit: number; // -1 = unlimited
  canReply: boolean;
};
```

---

## 9. API 연동

```typescript
// 답장 보내기
POST /api/diaries/{diaryId}/conversation/reply
Request: { content: string }
Response: {
  userMessage: ConversationMessage,
  aiMessage: ConversationMessage,
  replyLimit: ReplyLimit
}

// 대화 내역 조회
GET /api/diaries/{diaryId}/conversation
Response: {
  messages: ConversationMessage[],
  replyLimit: ReplyLimit
}
```

---

## 10. 구현 우선순위

1. **Phase 1**: 말풍선 UI, 답장 입력/전송, 타이핑 인디케이터
2. **Phase 2**: 티어별 제한, 업그레이드 프롬프트/모달
3. **Phase 3**: 에러 처리, 재시도 메커니즘
4. **Phase 4**: 애니메이션, 햅틱 피드백, 일기 접기/펼치기

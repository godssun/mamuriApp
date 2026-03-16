# [2026-02-27] Premium Subscription + AI Quota 구현 세션

## Metadata

| Field | Value |
|-------|-------|
| Project | Mamuri |
| Feature | Premium + AI Quota |
| Session Type | Backend / Frontend / QA |
| AI Roles Used | monetization-strategist, growth-analyst, pm, backend-reviewer, frontend-reviewer, qa, ai-safety-reviewer, sre |
| Risk Level | HIGH |
| Build Status | Implementation Complete |
| Outcome | Phase 1-7 전체 구현 완료, 78개 테스트 통과, PR #1 생성 |
| Date | 2026-02-27 |
| PR | https://github.com/godssun/mamuriApp/pull/1 |

---

## Session Overview

이전 설계 세션에서 완성된 계획(7 Phase, 60+ QA 케이스, 3 ADR)을 기반으로 프리미엄 구독 + AI 쿼터 시스템의 전체 구현을 완료했다.

**핵심 성과**:
- 백엔드 Phase 1-4: Stripe 연동, 쿼터 시스템, 안전 우선 아키텍처 구현
- 프론트엔드 Phase 5-6: 구독 UI, 페이월, 위기 배너, 쿼터 표시
- 테스트 Phase 7: 49개 신규 테스트 (전체 78개 통과)
- PR #1 생성 → main 브랜치 머지 대기

**핵심 제약 준수**: 위기 유저는 절대 페이월에 차단되지 않음 (SafetyCheck > QuotaCheck, InOrder 테스트 검증)

---

## Backend Review Summary

### 구현된 아키텍처

1. **SafetyCheck → QuotaCheck 순서 보장**: DiaryService에서 SafetyCheck를 먼저 실행, 위기 감지 시 crisisFlagUntil 7일 설정, 이후 QuotaCheck에서 위기 플래그 확인
2. **Optimistic Lock**: User.@Version으로 동시성 보호
3. **Stripe 웹훅 멱등성**: SubscriptionEvent.stripeEventId UNIQUE 제약으로 중복 처리 방지
4. **Feature Flag**: FeatureFlags.quotaEnforcementEnabled (기본 OFF)로 점진적 롤아웃
5. **Lazy Reset**: quotaResetDate가 과거이면 자동 리셋 (Cron 실패 대비)
6. **AI 사용량 추적**: AiUsageLog 테이블에 모델명, 토큰 수, 예상 비용(KRW) 기록

### 해결된 위험 요소

| 위험 | 해결 방법 |
|------|----------|
| SafetyCheck 순서 미보장 | DiaryService에서 명시적 순서 + InOrder 테스트 |
| 쿼터 동시성 | User.@Version (Optimistic Lock) |
| 웹훅 멱등성 | subscription_events 테이블 UNIQUE 제약 |
| 쿼터 리셋 실패 | Lazy Reset 폴백 + QuotaResetScheduler |
| 위기 키워드 사각지대 | 14→26개 확장 (간접/완곡 표현 포함) |

---

## Backend Changes Applied

### 신규 파일 (16개)

| 파일 | 설명 |
|------|------|
| `V5__add_subscription_fields.sql` | DB 마이그레이션 (구독/쿼터/로그 테이블) |
| `SubscriptionStatus.java` | 구독 상태 enum (FREE/TRIALING/ACTIVE/PAST_DUE/CANCELED) |
| `SubscriptionEvent.java` | 웹훅 멱등성 엔티티 |
| `SubscriptionEventRepository.java` | 멱등성 검증 리포지토리 |
| `SubscriptionService.java` | Stripe 연동 (Checkout, Webhook, Cancel) |
| `SubscriptionController.java` | 구독 API (POST /checkout, GET /status, POST /cancel) |
| `StripeWebhookController.java` | Stripe 웹훅 수신/서명 검증 |
| `SubscriptionStatusResponse.java` | 구독 상태 응답 DTO |
| `CheckoutRequest.java` | Checkout 요청 DTO |
| `CheckoutResponse.java` | Checkout 응답 DTO |
| `FeatureFlags.java` | Feature Flag 설정 (@ConfigurationProperties) |
| `StripeProperties.java` | Stripe 설정 (@ConfigurationProperties) |
| `AiUsageLog.java` | AI 사용량 로그 엔티티 |
| `AiUsageLogRepository.java` | AI 사용량 리포지토리 |
| `QuotaResetScheduler.java` | 월간 쿼터 벌크 리셋 |

### 수정 파일 (12개)

| 파일 | 변경 내용 |
|------|----------|
| `build.gradle.kts` | Stripe SDK 의존성 추가 |
| `application.yml` | stripe, feature 설정 블록 추가 |
| `User.java` | 9개 구독/쿼터 필드 + 8개 메서드 (isPremium, hasCrisisFlag 등) |
| `UserRepository.java` | findByStripeCustomerId, bulkResetQuota 추가 |
| `DiaryService.java` | SafetyCheck→QuotaCheck→AiComment→QuotaIncrement 플로우 |
| `AiCommentService.java` | generateComment(diary, user, isSafe) 시그니처 변경 + AI 사용량 로깅 |
| `SafetyCheckService.java` | 위기 키워드 14→26개 확장 |
| `ErrorCode.java` | QUOTA_EXCEEDED(429), PREMIUM_REQUIRED(402) 추가 |
| `SecurityConfig.java` | /api/stripe/webhook permitAll 추가 |
| `LlmResponse.java` | totalTokens 필드 추가 |
| `OpenAiProvider.java` | usage.total_tokens 추출 |
| `MamuriAppApplication.java` | @EnableScheduling 추가 |

---

## Frontend Review Summary

### 구현된 화면/컴포넌트

| 파일 | 유형 | 설명 |
|------|------|------|
| `SubscriptionContext.tsx` | Context | isPremium, quotaRemaining, hasCrisisFlag, refresh() |
| `PaywallScreen.tsx` | Screen | 쿼터 소진 안내 + 프리미엄 혜택 + CTA |
| `SubscriptionScreen.tsx` | Screen | 플랜 선택, 쿼터 프로그레스 바, 구독 취소 |
| `CrisisBanner.tsx` | Component | 긴급 연락처 (1393, 1577-0199) |
| `SoftUpsellModal.tsx` | Component | Lv.5 부드러운 프리미엄 소개 |

### 수정된 화면

| 파일 | 변경 내용 |
|------|----------|
| `App.tsx` | SubscriptionProvider 감싸기 |
| `WriteDiaryScreen.tsx` | 쿼터 카운터, 429→Paywall 리다이렉트, CrisisBanner |
| `SettingsScreen.tsx` | 구독 관리 섹션 추가 |
| `navigation/index.tsx` | Paywall, Subscription 라우트 추가 |
| `types/index.ts` | SubscriptionStatusType, SubscriptionInfo, CheckoutResponse |
| `api/client.ts` | subscriptionApi (getStatus, createCheckout, cancel) |

---

## QA Summary

### 자동화 테스트 결과

| 테스트 파일 | 테스트 수 | 상태 |
|------------|----------|------|
| UserTest.java | 10 | PASS |
| SafetyCheckServiceTest.java | 30 | PASS |
| DiaryServiceQuotaTest.java | 8 | PASS |
| SubscriptionServiceTest.java | 1 | PASS |
| (기존 테스트) | 29 | PASS |
| **총계** | **78** | **ALL PASS** |

### P0 안전 테스트 검증 결과

| 테스트 ID | 시나리오 | 결과 |
|-----------|---------|------|
| DQ-01 | 위기 유저는 쿼터 초과해도 AI 코멘트 수신 | PASS |
| DQ-02 | SafetyCheck가 QuotaCheck보다 먼저 실행 (InOrder) | PASS |
| DQ-03 | 위기 감지 시 7일 crisisFlag 설정 | PASS |
| DQ-04 | 무료 유저 쿼터(20) 초과 시 QUOTA_EXCEEDED | PASS |
| DQ-05 | 프리미엄 유저는 쿼터 무제한 | PASS |
| DQ-06 | AI 실패 시 쿼터 미증가 | PASS |
| DQ-07 | Feature Flag OFF 시 쿼터 검사 건너뜀 | PASS |
| DQ-08 | Lazy Reset 정상 동작 | PASS |

### TypeScript 타입 체크

```
npx tsc --noEmit → 통과 (에러 없음)
```

---

## Code Changes

### 커밋 이력

| Hash | 메시지 | 변경 |
|------|--------|------|
| `3ebbc1f` | feat(backend): add premium subscription, AI quota, and Stripe integration | 33 files, +915 |
| `5412d5d` | feat(mobile): add premium subscription UI, paywall, and quota display | 11 files, +1030 |
| `ed0ce4d` | test(premium): add subscription, quota, safety, and entity tests (49 cases) | 4 files, +698 |
| `f71d075` | chore: add premium feature agents, skills, and release plan docs | 16 files, +1113 |

### 총 변경량

- **신규 파일**: ~25개
- **수정 파일**: ~15개
- **총 라인**: +3,756 / -53

---

## Verification

- [x] `./gradlew compileJava` — 전체 Phase 컴파일 성공
- [x] `./gradlew test` — 78개 전체 통과
- [x] `npx tsc --noEmit` — TypeScript 타입 체크 통과
- [x] P0 안전 테스트 전수 통과
- [x] Feature Flag OFF 상태에서 기존 플로우 호환성 확인
- [x] PR #1 생성 완료
- [ ] Stripe test key로 E2E 결제 플로우 검증
- [ ] Feature Flag ON + 실제 쿼터 소진 시나리오 테스트
- [ ] Expo 실행 후 UI 확인

---

## Open Risks

| 리스크 | 심각도 | 상태 | 대응 |
|--------|--------|------|------|
| Stripe test key 미설정 (E2E 미검증) | HIGH | 미해결 | Stripe Dashboard에서 test key 발급 후 검증 |
| LocalStubProvider에서 totalTokens=0 | LOW | 수용 | 개발 환경에서는 비용 추적 불필요 |
| SoftUpsellModal 트리거 조건 미구현 | MEDIUM | 미해결 | Lv.5 도달 시 표시 로직 추가 필요 |
| IAP(인앱결제) 미지원 | MEDIUM | 계획됨 | Post-MVP에서 Apple/Google IAP 추가 |
| 한국어 위기 표현 우회 (초성, 기호) | LOW | 계획됨 | Phase 3에서 AI 기반 감지 도입 |

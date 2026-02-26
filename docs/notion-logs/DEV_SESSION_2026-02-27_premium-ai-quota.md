# [2026-02-27] Premium Subscription + AI Quota 설계 세션

## Metadata

| Field | Value |
|-------|-------|
| Project | Mamuri |
| Feature | Premium + AI Quota |
| Session Type | Backend / Frontend / QA / Architecture |
| AI Roles Used | monetization-strategist, growth-analyst, pm, backend-reviewer, frontend-reviewer, qa, ai-safety-reviewer, sre |
| Risk Level | HIGH |
| Build Status | Planning Complete |
| Outcome | 릴리즈 플랜 완성: 60+ QA 케이스, 안전 가드, 롤백 전략 포함 |
| Date | 2026-02-27 |

---

## Session Overview

Mamuri AI 일기 앱에 프리미엄 구독 모델(₩4,900/월, ₩49,000/년)과 AI 쿼터 시스템(무료 20건/월)을 도입하기 위한 종합 설계 세션을 진행했다. 8개 전문 AI 에이전트를 활용하여 전략 수립부터 QA 체크리스트까지 전체 파이프라인을 완료했다.

**핵심 제약 조건**: 위기 상황 사용자는 절대로 페이월에 차단되어서는 안 된다.

---

## Backend Review Summary

### 핵심 발견사항
1. **쿼터 동시성 보호**: `@Version`(Optimistic Lock)으로 race condition 방지 필수
2. **실행 순서 보장**: SafetyCheck → QuotaCheck → DiarySave (트랜잭션 내)
3. **Stripe 웹훅 멱등성**: `subscription_events` 테이블의 `stripe_event_id` UNIQUE 제약
4. **상태 머신**: SubscriptionStatus enum(FREE→TRIALING→ACTIVE→PAST_DUE→CANCELED)
5. **Redis 불필요**: MVP 단계에서 JPA 1차 캐시로 충분 (DAU 10K 이후 검토)

### 위험 요소
- Service 레벨 쿼터 검증 (JWT 수준이 아닌 DiaryService에서)
- Grace Period 3일 초과 시 FREE 자동 전환 로직 필요
- 쿼터 리셋 Cron Job 실패 시 Lazy Reset 폴백 필요

---

## Backend Changes Applied

**이번 세션은 설계/계획 단계로, 코드 변경은 없음.** 구현 계획:

### 신규 파일 (8개)
- `SubscriptionStatus.java` - 구독 상태 enum
- `SubscriptionService.java` - Stripe 연동, 상태 전환
- `StripeWebhookController.java` - 웹훅 수신/검증
- `QuotaResetScheduler.java` - 월간 쿼터 리셋
- `FeatureFlags.java` - Feature Flag 관리
- `SubscriptionEvent.java` - 웹훅 이벤트 엔티티
- `AiUsageLog.java` - AI 사용량 로그 엔티티
- `V5__add_subscription_fields.sql` - DB 마이그레이션

### 수정 파일 (5개)
- `User.java` - 구독 필드, @Version, isPremium(), incrementQuota()
- `DiaryService.java` - SafetyCheck → QuotaCheck → Save 순서
- `SafetyCheckService.java` - 키워드 13→25개 확장
- `ErrorCode.java` - QUOTA_EXCEEDED, PREMIUM_REQUIRED
- `build.gradle.kts` - Stripe SDK 의존성

---

## Frontend Review Summary

### 핵심 발견사항
1. **SubscriptionContext 분리**: AuthContext와 별도 관리 (관심사 분리)
2. **이중 쿼터 체크**: 로컬 Optimistic + 서버 Pessimistic
3. **Stripe WebView 폴링**: 결제 완료 감지를 위한 폴링 메커니즘
4. **접근성 패턴**: 페이월, 업셀 모달에 WCAG 2.1 AA 준수

### 신규 화면
- PaywallScreen - 쿼터 소진 시 표시
- SubscriptionScreen - 구독 관리
- SoftUpsellModal - 소프트 업셀 (Lv.5, 14일 연속)
- CrisisBanner - 위기 감지 시 긴급 연락처

---

## QA Summary

### 테스트 매트릭스
- **총 60+ 케이스**: P0 28개, P1 25개, P2 7개
- **무료 vs 프리미엄**: 9개 시나리오 (FP-001~009)
- **위기 유저 보호**: 6개 시나리오 (CR-001~006) - 모두 P0
- **쿼터 관리**: 9개 시나리오 (QT-001~009)
- **결제 플로우**: 8개 시나리오 (PAY-001~008)
- **엣지 케이스**: 10개 (EDG-001~010)
- **수익 리스크**: 7개 (REV-001~007)
- **안전 차단**: 5개 (SAF-001~005)

### P0 출시 차단 조건
1. 위기 유저에게 페이월 절대 미표시
2. SafetyCheck > QuotaCheck 실행 순서 보장
3. 웹훅 멱등성 검증
4. 쿼터 동시성 보호 검증
5. 위기 키워드 25개 이상 적용

---

## Code Changes

이번 세션은 설계 단계. 생성된 산출물:

| 파일 | 설명 |
|------|------|
| `docs/PREMIUM_RELEASE_PLAN.md` | 릴리즈 플랜 (전체 종합) |
| `docs/notion-logs/DEV_SESSION_*.md` | 이 Dev Session 로그 |
| `docs/notion-logs/ADR_*.md` | 아키텍처 결정 기록 3건 |
| `docs/notion-logs/QA_*.md` | QA 엔트리 |

---

## Verification

- [x] 전략 수립 완료 (monetization-strategist, growth-analyst)
- [x] PRD 작성 완료 (pm: FR 7개, NFR 4개, AC 7개)
- [x] 백엔드 아키텍처 리뷰 완료 (backend-reviewer)
- [x] 프론트엔드 상태 관리 리뷰 완료 (frontend-reviewer)
- [x] QA 회귀 체크리스트 작성 완료 (qa: 60+ 케이스)
- [x] AI 안전성 리뷰 완료 (ai-safety-reviewer)
- [x] SRE 배포 준비 체크리스트 완료 (sre)
- [x] 릴리즈 플랜 문서화 완료
- [ ] 구현 시작 (다음 세션)

---

## Open Risks

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| 위기 키워드 13개로는 사각지대 존재 | HIGH | 25개로 확장 + Phase 3에서 AI 기반 감지 |
| SafetyCheck 실행 순서 미보장 | HIGH | @Transactional 내 명시적 순서 구현 |
| Stripe 웹훅 장애 시 구독 불일치 | MEDIUM | 수동 동기화 API + Stripe 3일 재시도 |
| 쿼터 리셋 Cron 실패 | MEDIUM | Lazy Reset 폴백 메커니즘 |
| AI 비용 모니터링 부재 | MEDIUM | ai_usage_log 테이블 + 일간 ₩10,000 알림 |
| 한국어 위기 표현 우회 (초성, 기호 삽입) | LOW | Phase 2에서 패턴 매칭 강화 |
| 프리미엄 유저 AI 응답 품질 차별화 금지 | LOW | 프롬프트 동일 유지, QA에서 검증 |

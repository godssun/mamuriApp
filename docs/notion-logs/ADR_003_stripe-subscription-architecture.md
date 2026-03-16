# ADR-003: Stripe 구독 아키텍처

## Metadata

| Field | Value |
|-------|-------|
| Project | Mamuri |
| Dev Session | [2026-02-27] Premium + AI Quota |
| Status | Accepted |
| Date | 2026-02-27 |

---

## Context

프리미엄 구독 결제를 처리할 결제 시스템을 선택하고, 웹훅 안정성, 상태 관리, 롤백 전략을 결정해야 한다.

---

## Decision

**Stripe Checkout + Webhook 기반 구독 관리를 사용한다.**

아키텍처:
1. **Checkout Session**: 서버에서 생성 → 클라이언트 WebView에서 결제
2. **Webhook 수신**: `customer.subscription.created/updated/deleted` 이벤트 처리
3. **멱등성 보장**: `subscription_events` 테이블에 `stripe_event_id` UNIQUE 저장
4. **상태 머신**: FREE → TRIALING → ACTIVE → PAST_DUE → CANCELED
5. **Grace Period**: 결제 실패 후 3일 유예
6. **Feature Flag**: 점진적 롤아웃 (10% → 50% → 100%)

---

## Alternatives Considered

| 대안 | 장점 | 단점 | 기각 사유 |
|------|------|------|-----------|
| Apple IAP + Google Play | 네이티브 UX | 30% 수수료, 복잡한 구현 | MVP에서 과도한 복잡성 |
| 자체 결제 시스템 | 수수료 없음 | PCI-DSS 준수 필요, 개발 비용 | 보안 리스크 |
| PayPal | 글로벌 지원 | 한국 시장 약세 | 타겟 시장 부적합 |
| Toss Payments | 한국 시장 최적화 | 구독 기능 제한 | 반복 결제 기능 미성숙 |

---

## Trade-offs

- **선택**: Stripe (수수료 2.9% + ₩30)
- **장점**: 안정적 웹훅, 구독 관리 내장, Customer Portal, 글로벌 확장 가능
- **단점**: 한국 원화 결제 시 환전 수수료, IAP 대비 비네이티브 UX
- **수용 근거**: MVP 속도 우선, IAP는 Post-MVP에서 추가

---

## Long-Term Impact

- IAP 추가 시 SubscriptionService에 추상화 레이어 필요
- Stripe Customer Portal로 구독 관리 UI 비용 절감
- 웹훅 실패 대비 수동 동기화 API 준비
- 환불 정책은 Stripe Dashboard에서 관리 (코드 변경 불필요)

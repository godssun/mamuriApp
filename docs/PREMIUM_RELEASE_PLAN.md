# Premium Subscription + AI Quota - Release Plan

## 기능 개요

Mamuri AI 일기 앱에 프리미엄 구독 모델과 AI 쿼터 시스템을 도입한다.

| 항목 | 내용 |
|------|------|
| 기능명 | Premium Subscription + AI Quota |
| 브랜치 | `feat/premium-subscription` |
| 예상 기간 | 3-4주 (개발) + 2주 (QA/소프트 론칭) |
| 위험도 | HIGH (결제, 안전 시스템 연동) |

---

## 1. 가격 모델

| 항목 | Free | Premium |
|------|------|---------|
| 월 가격 | ₩0 | ₩4,900/월 |
| 연간 가격 | - | ₩49,000/년 (17% 할인) |
| AI 코멘트 | 20건/월 | 무제한 |
| AI 친구 레벨 | Lv.1-5 | 무제한 |
| 위기 보호 | 항상 제공 | 항상 제공 |

**AI 비용**: GPT-4o-mini ~₩0.24/건, 프리미엄 유저 월 30건 기준 ~₩7.2/유저

---

## 2. 구현 범위

### 2.1 Backend (Spring Boot)

#### DB 마이그레이션 (V5)
```sql
-- users 테이블 확장
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) NOT NULL DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN current_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN grace_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN quota_used INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN quota_reset_date DATE;
ALTER TABLE users ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- 구독 이벤트 테이블 (멱등성)
CREATE TABLE subscription_events (
    id BIGSERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id BIGINT REFERENCES users(id),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 사용량 로그
CREATE TABLE ai_usage_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    diary_id BIGINT REFERENCES diaries(id),
    model_name VARCHAR(100),
    total_tokens INT,
    estimated_cost_krw DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_subscription ON users(subscription_status);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id);
CREATE INDEX idx_sub_events_stripe ON subscription_events(stripe_event_id);
CREATE INDEX idx_ai_usage_user ON ai_usage_log(user_id, created_at DESC);
```

#### 새로운 파일
| 파일 | 설명 |
|------|------|
| `SubscriptionStatus.java` | enum: FREE, TRIALING, ACTIVE, PAST_DUE, CANCELED |
| `SubscriptionService.java` | Stripe Checkout, 상태 전환, 쿼터 관리 |
| `StripeWebhookController.java` | 웹훅 수신, 서명 검증, 멱등성 처리 |
| `QuotaResetScheduler.java` | 월간 쿼터 리셋 (Lazy Reset 포함) |
| `FeatureFlags.java` | Feature Flag 관리 |
| `SubscriptionEvent.java` | 웹훅 이벤트 엔티티 |
| `AiUsageLog.java` | AI 사용량 로그 엔티티 |

#### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `User.java` | 구독 필드 추가, `@Version`, `isPremium()`, `incrementQuota()` |
| `DiaryService.java` | SafetyCheck → 쿼터 체크 → 일기 저장 순서 보장 |
| `SafetyCheckService.java` | 키워드 13→25개 확장 |
| `ErrorCode.java` | QUOTA_EXCEEDED, PREMIUM_REQUIRED 추가 |
| `build.gradle.kts` | Stripe SDK, Resilience4j 의존성 추가 |

#### API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/subscription/checkout` | Stripe Checkout 세션 생성 |
| GET | `/api/subscription/status` | 구독 상태 조회 |
| POST | `/api/subscription/cancel` | 구독 취소 |
| POST | `/api/stripe/webhook` | Stripe 웹훅 수신 |
| GET | `/api/quota/status` | 쿼터 현황 조회 |

### 2.2 Frontend (React Native)

#### 새로운 파일
| 파일 | 설명 |
|------|------|
| `SubscriptionContext.tsx` | 구독 상태 전역 관리 (AuthContext와 분리) |
| `PaywallScreen.tsx` | 쿼터 소진 시 페이월 화면 |
| `SubscriptionScreen.tsx` | 구독 관리 화면 |
| `SoftUpsellModal.tsx` | 소프트 업셀 모달 (Lv.5, 14일 연속) |
| `CrisisBanner.tsx` | 위기 감지 시 긴급 연락처 배너 |
| `subscriptionApi.ts` | 구독 관련 API 클라이언트 |

#### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `WriteDiaryScreen.tsx` | 쿼터 카운터 UI, QUOTA_EXCEEDED 에러 핸들링 |
| `SettingsScreen.tsx` | 구독 관리 메뉴 추가 |
| `types/index.ts` | SubscriptionStatus, QuotaInfo 타입 추가 |

---

## 3. 핵심 안전 가드

### P0 (출시 차단 조건)

1. **위기 유저 페이월 절대 차단**: SafetyCheck가 쿼터 체크보다 항상 먼저 실행
2. **실행 순서 보장**: `@Transactional` + 명확한 SafetyCheck → QuotaCheck → Save 순서
3. **위기 키워드 확장**: 13개 → 25개 (간접/완곡 표현 포함)
4. **긴급 연락처**: 모든 위기 응답에 1393, 1577-0199 포함
5. **위기 플래그 자동 연장**: 7일 내 재발 시 자동 리셋
6. **웹훅 멱등성**: `subscription_events.stripe_event_id` UNIQUE
7. **Optimistic Lock**: `User.@Version`으로 쿼터 동시성 보호
8. **Feature Flag**: 점진적 롤아웃 가능

---

## 4. 롤아웃 전략

### Phase 1: 내부 테스트 (1주)
- Feature Flag OFF (기본)
- 개발자 계정으로만 활성화
- P0 테스트 28건 전수 검증
- Stripe Test Mode 사용

### Phase 2: 소프트 론칭 (2주)
- Feature Flag 10% 활성화 (신규 가입자)
- 페이월 표시하되 "계속 무료로 사용하기" 버튼 제공
- 위기 감지 정확도 모니터링
- AI 비용 추적 시작

### Phase 3: 제한적 시행 (2주)
- Feature Flag 50% 활성화
- 기존 유저 포함
- 쿼터 강제 적용 시작
- A/B 테스트: 소프트 업셀 vs 하드 페이월

### Phase 4: 전면 시행
- Feature Flag 100%
- 모든 사용자 적용
- 위기 감지 정확도 >95% 확인 후

---

## 5. 롤백 플랜

| 시나리오 | 대응 |
|---------|------|
| 위기 유저 페이월 노출 | 즉시 Feature Flag OFF → 전체 무료 전환 |
| Stripe 웹훅 장애 | 수동 동기화 API 실행 |
| 쿼터 동시성 버그 | Feature Flag OFF (쿼터 체크 비활성화) |
| AI 비용 폭증 | 일 ₩10,000 초과 시 알림, 필요시 쿼터 강화 |
| DB 마이그레이션 실패 | 롤백 스크립트 (컬럼 DROP) 즉시 실행 |

---

## 6. 의존성 추가

### Backend (build.gradle.kts)
```kotlin
// Stripe
implementation("com.stripe:stripe-java:25.0.0")

// Circuit Breaker (Post-MVP)
// implementation("io.github.resilience4j:resilience4j-spring-boot3:2.1.0")
```

### Frontend (package.json)
```json
{
  "@stripe/stripe-react-native": "^0.37.0"
}
```

### 환경 변수 추가
```yaml
# application-*.yml
stripe:
  api-key: ${STRIPE_API_KEY}
  webhook-secret: ${STRIPE_WEBHOOK_SECRET}
  price-monthly: ${STRIPE_PRICE_MONTHLY_ID}
  price-yearly: ${STRIPE_PRICE_YEARLY_ID}

feature:
  premium-enabled: false
  quota-enforcement-enabled: false
```

---

## 7. 모니터링 체크리스트

- [ ] AI 비용 일간 대시보드 (₩10,000/일 알림)
- [ ] Stripe 웹훅 성공/실패율
- [ ] 쿼터 소진율 (무료 유저 20건 도달 비율)
- [ ] 위기 이벤트 발생 빈도
- [ ] 구독 전환율 (무료 → 프리미엄)
- [ ] Feature Flag 활성화 비율

---

## 8. 법적 체크리스트

- [ ] 서비스 약관: AI 면책 조항 추가
- [ ] 개인정보 처리방침: SafetyEvent 민감정보 동의
- [ ] 구독 약관: 환불 정책, 자동 결제 안내
- [ ] 의료 면책: "본 서비스는 의료 서비스가 아닙니다" 명시

---

## 9. 성공 지표

| 지표 | 목표 | 측정 시점 |
|------|------|-----------|
| 무료→프리미엄 전환율 | 5-8% | 출시 후 3개월 |
| 구독 유지율 (월간) | 85%+ | 출시 후 6개월 |
| AI 비용/유저/월 | <₩10 | 지속 모니터링 |
| 위기 감지 정확도 | >95% | 출시 전 필수 |
| NPS 점수 | 50+ | 분기별 |

---

## 10. AI 에이전트 활용 내역

| Step | 에이전트 | 역할 |
|------|---------|------|
| 1 | monetization-strategist | 가격 모델, 비용 시뮬레이션 |
| 1 | growth-analyst | 리텐션 전략, 분석 이벤트 22개 |
| 2 | pm | PRD: FR 7개, NFR 4개, AC 7개 |
| 4 | backend-reviewer | Optimistic Lock, 웹훅 멱등성, 상태 머신 |
| 4 | frontend-reviewer | SubscriptionContext 분리, 접근성 패턴 |
| 5 | qa | 회귀 체크리스트 60+건 (P0: 28건) |
| 5 | ai-safety-reviewer | 위기 감지 사각지대, 키워드 확장, 법적 리스크 |
| 5 | sre | AI 비용 모니터링, Fallback, Feature Flag |

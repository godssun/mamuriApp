# QA Entry: Premium + AI Quota

## Metadata

| Field | Value |
|-------|-------|
| Project | Mamuri |
| Feature | Premium + AI Quota |
| Dev Session | [2026-02-27] Premium + AI Quota |
| QA Type | Pre-implementation Review |
| Date | 2026-02-27 |

---

## Critical Issues Found

### CRITICAL (출시 차단)

1. **위기 키워드 13개로 사각지대 존재** (ai-safety-reviewer)
   - "사라지고 싶어", "포기하고 싶어" 등 간접 표현 미감지
   - 대응: 25개로 확장 필수

2. **SafetyCheck 실행 순서 미보장** (backend-reviewer)
   - 현재 코드에 QuotaCheck보다 SafetyCheck가 먼저 실행된다는 보장 없음
   - 대응: @Transactional 내 명시적 순서 구현

3. **쿼터 동시성 보호 없음** (backend-reviewer)
   - 동시 일기 작성 시 race condition 발생 가능
   - 대응: User.@Version (Optimistic Lock) 추가

### HIGH

4. **위기 응답에 긴급 연락처 미포함** (ai-safety-reviewer)
   - 현재 안전 응답에 1393, 1577-0199 포함되어 있으나, 향후 쿼터 우회 경로에서도 동일하게 포함 필요

5. **Stripe 웹훅 멱등성 미구현** (sre)
   - 중복 이벤트 처리 시 구독 상태 이상 가능
   - 대응: subscription_events 테이블 UNIQUE 제약

6. **AI 비용 모니터링 부재** (sre)
   - 비용 폭증 감지 불가
   - 대응: ai_usage_log 테이블 + 일간 알림

---

## Blockers

| Blocker | 영향 | 해결 방안 | 상태 |
|---------|------|-----------|------|
| 위기 키워드 확장 | P0 안전 | 25개로 확장 | 미착수 |
| SafetyCheck 순서 보장 | P0 안전 | 코드 리팩토링 | 미착수 |
| @Version 추가 | P0 동시성 | User 엔티티 수정 | 미착수 |
| Stripe 테스트 키 발급 | P0 결제 | Stripe 대시보드 설정 | 미착수 |

---

## Release Readiness

| 항목 | 상태 | 비고 |
|------|------|------|
| 설계 완료 | ✅ | 전체 아키텍처 확정 |
| P0 테스트 케이스 작성 | ✅ | 28건 |
| P1 테스트 케이스 작성 | ✅ | 25건 |
| 코드 구현 | ❌ | 다음 세션에서 시작 |
| P0 테스트 실행 | ❌ | 구현 후 |
| 통합 테스트 | ❌ | 구현 후 |
| 성능 테스트 | ❌ | 구현 후 |
| 보안 검증 | ❌ | 구현 후 |
| Feature Flag 설정 | ❌ | 구현 후 |

**전체 릴리즈 준비도: 30%** (설계/계획 완료, 구현 미착수)

---

## Regression Scope

### 기존 기능 영향 분석

| 기능 | 영향도 | 회귀 테스트 필요 |
|------|--------|-----------------|
| 일기 CRUD | HIGH | User 엔티티 변경으로 전수 테스트 필요 |
| AI 코멘트 생성 | HIGH | DiaryService 수정으로 전수 테스트 필요 |
| 위기 감지 | HIGH | SafetyCheckService 키워드 확장 |
| JWT 인증 | LOW | 변경 없음, 스모크 테스트만 |
| AI 톤 설정 | LOW | 변경 없음, 스모크 테스트만 |
| 컴패니언 레벨업 | MEDIUM | 쿼터와 레벨업 상호작용 검증 필요 |

### 자동화 우선순위

1. **즉시**: DiaryService 쿼터 로직 단위 테스트
2. **구현 시**: SafetyCheck 키워드 확장 테스트
3. **통합**: Stripe 웹훅 → 구독 상태 전환 테스트
4. **Post-MVP**: E2E (페이월 표시, 결제 플로우)

# ADR-001: 쿼터 강제 적용 전략

## Metadata

| Field | Value |
|-------|-------|
| Project | Mamuri |
| Dev Session | [2026-02-27] Premium + AI Quota |
| Status | Accepted |
| Date | 2026-02-27 |

---

## Context

무료 유저의 AI 코멘트를 월 20건으로 제한해야 한다. 쿼터 검증 위치, 동시성 처리, 위기 유저 예외 처리 방법을 결정해야 한다.

---

## Decision

**DiaryService 레벨에서 쿼터를 검증한다.**

실행 순서:
1. SafetyCheck (위기 감지) - 항상 먼저
2. 위기 플래그 확인 (7일 이내 SafetyEvent 존재 시 쿼터 무시)
3. QuotaCheck (isPremium이 아닌 경우만)
4. 일기 저장
5. AI 코멘트 생성
6. 쿼터 증가 (AI 성공 후)

동시성은 `User.@Version` (Optimistic Lock)으로 보호한다.

---

## Alternatives Considered

| 대안 | 장점 | 단점 | 기각 사유 |
|------|------|------|-----------|
| JWT 클레임에 구독 상태 포함 | 매 요청 DB 조회 불필요 | 실시간 상태 반영 불가, 토큰 갱신 전 불일치 | 상태 동기화 문제 |
| Redis 기반 카운터 | 빠른 조회, 원자적 증가 | 추가 인프라, MVP 과도 | DAU <10K에서 불필요 |
| API Gateway 레벨 Rate Limit | 인프라 수준 보호 | 위기 유저 예외 처리 어려움 | 비즈니스 로직 분리 불가 |
| 클라이언트 측 쿼터 검증 | 즉각 UI 피드백 | 우회 가능, 신뢰할 수 없음 | 보안 취약 |

---

## Trade-offs

- **선택**: DB 기반 서비스 레벨 검증
- **장점**: 정확한 상태 관리, 위기 유저 예외 처리 용이, MVP에 적합
- **단점**: 매 일기 작성 시 DB 조회 1회 추가 (~5ms)
- **수용 근거**: DAU 10K 이하에서 성능 영향 무시 가능

---

## Long-Term Impact

- DAU 10K 초과 시 Redis 카운터로 마이그레이션 필요
- 쿼터 증가를 AI 성공 후로 배치함으로써 AI 실패 시 쿼터 미차감 보장
- Optimistic Lock 실패 시 사용자에게 재시도 요청 (빈도: <0.1%)

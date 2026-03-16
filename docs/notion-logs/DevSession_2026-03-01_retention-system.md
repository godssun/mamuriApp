# Dev Session: Retention System Design

## Meta
- **Date**: 2026-03-01
- **Duration**: ~30min
- **Branch**: feat/companion-growth-system
- **Type**: Design / Architecture Review

## Project
- **Name**: Mamuri (마무리)
- **Description**: AI 감성 일기 앱

## Feature
- **Name**: Daily Retention Loop System
- **Description**: AI 후속 질문, 캘린더 스트릭, 사용자 참여 트리거 3가지 리텐션 기능 설계
- **Priority**: P0 (스트릭), P1 (후속 질문, 참여 트리거)

## AI Roles Used

| Role | Agent Type | Purpose |
|------|-----------|---------|
| PM | pm | 제품 명세서 작성 (요구사항, 수용 기준, 엣지 케이스, KPI) |
| UX Planner | ux-planner | UI 플로우 설계, Figma 프롬프트, 컴포넌트 계층 |
| Backend Reviewer | backend-reviewer | 아키텍처 리뷰, DB 스키마, API 설계, 비용 분석 |
| QA | qa | 테스트 매트릭스 141개, 안전 차단 항목, 회귀 체크리스트 |
| Explorer | Explore | 현재 코드베이스 탐색 및 상태 파악 |

## Outcome

### 산출물
1. `docs/retention-system/01-product-spec.md` — 제품 명세서
2. `docs/retention-system/02-ux-flows.md` — UX 플로우 및 디자인 가이드
3. `docs/retention-system/03-backend-review.md` — 백엔드 아키텍처 리뷰
4. `docs/retention-system/04-qa-plan.md` — QA 계획서

### 핵심 결정사항 (ADR)

#### ADR-1: AI 후속 질문은 동일 LLM 호출로 생성
- **결정**: 별도 API 호출 대신 프롬프트에 JSON 형식 출력 추가
- **근거**: 비용 +15% (vs +100%), 지연 +200ms (vs +1000ms)
- **Fallback**: JSON 파싱 실패 시 사전 정의 템플릿 질문 사용

#### ADR-2: 스트릭은 users 테이블에 Denormalization
- **결정**: current_streak, longest_streak, last_diary_date 컬럼 추가
- **근거**: 읽기 O(1) vs 실시간 계산 O(n), 읽기 빈도 >>> 쓰기 빈도
- **제약**: 백데이팅 MVP에서 미지원

#### ADR-3: 후속 질문은 Feature Flag로 단계적 출시
- **결정**: 프리미엄 10% → 50% → 100% → 전체 사용자
- **근거**: 비용 예측 가능성, JSON 파싱 실패율 모니터링

### 주요 수치
- 테스트 케이스: 141개
- P0-CRITICAL 안전 항목: 8개
- 예상 비용 증가: 일기당 +15% (~₩0.035)
- 1만 사용자 월 비용 증가: ~₩3,500
- 목표 D7 리텐션 개선: +15%p

## Next Steps
1. V6 Flyway 마이그레이션 작성 (followup_question + streak 컬럼)
2. AI 프롬프트 v3 작성 및 JSON 파싱 로직 구현
3. 스트릭 비즈니스 로직 구현 (User.updateStreak)
4. 모바일 UI 컴포넌트 구현 (StreakHeader, FollowUpQuestionCard, EmptyTodayState)
5. 핵심 단위 테스트 작성 (스트릭 계산, 위기 시 후속 질문 억제)

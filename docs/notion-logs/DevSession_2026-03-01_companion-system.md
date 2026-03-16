# Dev Session: AI Companion Personalization System Design

## Meta
- **Date**: 2026-03-01
- **Duration**: ~45min
- **Branch**: feat/companion-growth-system
- **Type**: Design / Architecture Review / QA Planning

## Project
- **Name**: Mamuri (마무리)
- **Description**: AI 감성 일기 앱

## Feature
- **Name**: AI Companion Personalization System
- **Description**: AI 컴패니언(마음이) 개인화 — 아바타 선택, 말투 스타일(존댓말/반말), 성격 톤 확장(realistic 추가), 프롬프트 v4 설계
- **Priority**: P0 (개인화 핵심), P1 (프리미엄 연동, 캐싱)

## AI Roles Used

| Role | Agent Type | Purpose |
|------|-----------|---------|
| PM | pm | 제품 사양서 — 시나리오, 기능 요구사항, 수용 기준, 엣지 케이스, 수익화 영향 |
| UX Planner | ux-planner | UI 플로우 설계 — 온보딩, 아바타 선택, 설정 화면, Figma 프롬프트 |
| Backend Reviewer | backend-reviewer | 아키텍처 리뷰 — DB 스키마, API 설계, 보안, 위험요소, 수익화 통합 |
| QA | qa | 테스트 매트릭스 87개, 안전 차단 항목, 회귀 체크리스트 |
| Prompt Designer | direct (Step 4) | 프롬프트 v4 설계 — 말투/톤 변수, 템플릿 확장, 위기 상황 독립성 |

## Session Overview

리텐션 시스템(후속 질문, 스트릭) 구현 완료 후, AI 컴패니언 개인화 시스템 설계를 진행했다. 사용자가 AI 친구의 아바타, 말투, 성격을 커스터마이징하여 "나만의 친구" 경험을 강화하는 것이 목표.

5개 역할의 에이전트를 병렬 실행하여 제품 사양, UX 설계, 백엔드 아키텍처 리뷰, QA 계획, 프롬프트 설계를 동시에 완료했다.

## Backend Review Summary

### DB 스키마 결정: UserSettings 확장 (Option B)

**비교된 옵션**:
- Option A: users 테이블 확장 → 비대화 위험
- **Option B: user_settings 확장** → 기존 패턴 일관성, 0 추가 쿼리 ⭐
- Option C: ai_companions 신규 테이블 → 과도한 복잡도

**새 컬럼 (V7 마이그레이션)**:
- `ai_avatar VARCHAR(10) DEFAULT '🐱'` — 이모지 아바타 (8종)
- `ai_speech_style VARCHAR(20) DEFAULT 'formal'` — 말투 (formal/casual)
- `ai_personality_tone VARCHAR(20) DEFAULT 'warm'` — 성격 톤 (warm/calm/cheerful/realistic)
- CHECK 제약 조건으로 허용 값 강제

### API 설계

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/companion/settings` | 개인화 설정 조회 |
| PUT | `/api/companion/settings` | 개인화 설정 업데이트 |

기존 `/api/companion` (프로필 조회/이름 변경) 및 `/api/companion/streak` 은 변경 없음.

### 핵심 위험요소 (Ranked)

1. **🚨 프롬프트 조합 폭발** — 톤 4 × 말투 2 = 8가지 조합 → 템플릿 기반 조립으로 해결
2. **⚠️ Feature Flag 미준비** — AI 성장 시스템 비활성화 인프라 부재 → Togglz 도입 권장
3. **⚠️ N+1 쿼리** — UserSettings 매번 조회 → Fetch Join + 캐싱으로 해결
4. **ℹ️ 프롬프트 버전 관리** — v3→v4 전환 추적 → prompt_version 필드 활용

## Backend Changes Applied

이 세션은 설계 전용 세션이며, 코드 변경은 수행하지 않았다.

**설계 완료, 구현 대기 항목**:
- V7 Flyway 마이그레이션 (ai_avatar, ai_speech_style, ai_personality_tone)
- UserSettings 엔티티 확장 (SpeechStyle, PersonalityTone enum)
- CompanionService.updateSettings() 구현
- CompanionController 설정 엔드포인트 추가
- PromptBuilder SPEECH_STYLE_MAP 및 realistic 톤 추가
- ai_comment_v4.txt 프롬프트 템플릿

## Frontend Review Summary

### UX 설계 핵심

1. **아바타 선택 모달** — CompanionScreen에서 프로필 이모지 탭 → 8종 그리드 선택
2. **설정 화면 확장** — 말투 스타일 토글 (존댓말/반말), 성격 톤 라디오 버튼 (4가지)
3. **실시간 프리뷰** — 설정 변경 시 예시 문구 표시 (옵티미스틱 업데이트)
4. **온보딩 연동** — MVP에서 별도 온보딩 없음, 기본값 사용 후 설정에서 변경

### 컬러 시스템 유지
- 배경: `#FFF9F5`, 주요: `#FF9B7A`, 텍스트: `#2D2D2D`

## QA Summary

- **총 테스트 케이스**: 87개
- **P0-CRITICAL (안전/블로커)**: 12개
- **P0 (매출-리스크)**: 8개
- **회귀 테스트**: 36개
- **엣지 케이스**: 31개

### 주요 테스트 카테고리
- 컴패니언 온보딩: 18 케이스
- 프로필 편집: 15 케이스
- AI 프롬프트 개인화: 20 케이스
- 프리미엄/쿼터 연동: 12 케이스
- 위기 상황 안전성: 10 케이스
- 회귀 테스트: 12 케이스

## Code Changes

### 산출물 (설계 문서)
1. `docs/retention-system/05-companion-product-spec.md` — 제품 사양서 (12 섹션, 수용 기준 6개)
2. `docs/retention-system/06-companion-ux-plan.md` — UX 설계 (Figma 프롬프트, 화면 설계)
3. `docs/retention-system/07-companion-backend-review.md` — 백엔드 아키텍처 리뷰 (11 섹션, 1557줄)
4. `docs/retention-system/08-companion-qa-plan.md` — QA 계획서 (87 테스트 케이스)
5. `docs/retention-system/09-companion-prompt-design.md` — 프롬프트 v4 설계 (9 섹션)

## Verification

- [x] 5개 설계 문서 모두 작성 완료
- [x] 제품 사양서 — 시나리오, 기능 요구사항, 수용 기준, 엣지 케이스 포함
- [x] 백엔드 리뷰 — DB 스키마 옵션 비교, API 설계, 보안 검토, 위험요소 랭킹
- [x] 프롬프트 설계 — v3→v4 변경점, 말투별 예시 응답, 위기 상황 독립성 확인
- [x] QA 계획 — P0-CRITICAL 12개 포함, 위기 안전성 테스트 명시
- [x] 모든 문서에서 AI 성장 시스템은 feature flag 비활성화 유지 원칙 준수

## Open Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| 프롬프트 조합 8가지의 AI 응답 품질 일관성 | Medium | A/B 테스트, 프롬프트 버전별 만족도 추적 |
| Feature Flag 인프라 부재 (Togglz 미도입) | Medium | MVP에서는 코드 레벨 분기로 대체 가능 |
| 프리미엄 전용 기능 범위 미확정 | Low | MVP에서 전체 무료, Post-MVP에서 수익화 전환 |
| casual 말투에서 위기 상황 톤 부조화 | Low | 위기 감지 시 설정 무시, 안전 메시지 고정 |

## Architecture Decisions (ADR)

### ADR-1: UserSettings 확장 (신규 테이블 생성 대신)
- **결정**: user_settings 테이블에 3개 컬럼 추가
- **근거**: 기존 패턴 일관성, 프롬프트 빌더 통합 (0 추가 쿼리), 마이그레이션 최소화
- **대안**: ai_companions 신규 테이블 → 외래키 재구성 비용, 3개 조인 필요

### ADR-2: 프롬프트 v4 — 템플릿 변수 기반 조립
- **결정**: `{{speechStyleInstruction}}` 변수 추가, TONE_MAP에 realistic 추가
- **근거**: 프롬프트 조합 폭발 방지 (8가지 → 2개 MAP 조합), 유지보수 단순화
- **대안**: LLM 자율 조립 → 일관성 제어 불가

### ADR-3: 아바타는 프롬프트에 미포함 (UI-only)
- **결정**: 아바타 이모지는 UI에서만 표시, 프롬프트에 전달하지 않음
- **근거**: 토큰 절약, AI 응답 품질에 무관, 시각적 애착은 UI로 충분

### ADR-4: 기존 aiTone 필드 유지 (삭제 안 함)
- **결정**: 기존 aiTone 필드 deprecated 마킹 후 유지, 신규 personalityTone으로 마이그레이션
- **근거**: 하위 호환성, 기존 데이터 보존, 점진적 전환

## Monetization Impact

### 비용 분석
- 시스템 프롬프트 토큰: 120 → 150 (+25%)
- 총 토큰: 420 → 450 (+7%)
- 1만 사용자 월간 추가 비용: ~$45 (₩60,000)

### 수익 전망
- 프리미엄 전환율 +1.2%p → 120명 × ₩9,900 = ₩1,188,000/월
- 순수익 증가: ₩1,128,000/월 (ROI 1,880%)

### 예상 리텐션 효과
- D7 리텐션 +8%p (개인화 사용자 vs 미사용자)
- AI 만족도 향상 (말투 선택으로 재시도율 -15%)

## Next Steps

1. V7 Flyway 마이그레이션 작성 (ai_avatar, ai_speech_style, ai_personality_tone)
2. UserSettings 엔티티 확장 (SpeechStyle, PersonalityTone enum)
3. CompanionService 설정 CRUD 구현
4. CompanionController 설정 엔드포인트 추가
5. PromptBuilder 확장 (SPEECH_STYLE_MAP, realistic 톤, v4 템플릿)
6. ai_comment_v4.txt 프롬프트 파일 작성
7. 모바일 UI — 아바타 선택 모달, 설정 화면 말투/톤 UI
8. 단위 테스트 (프롬프트 조립 8가지 조합, 기본값 fallback, 위기 상황)

# 탭 구조 개편 + 일정 탭 도입 QA 체크리스트

작성일: 2026-04-17
브랜치: feature/tab-restructure-schedule
총 커밋: 8개 (안정 기준 2개 + 구조 개편 6개)

---

## 변경 요약

안 C: 마음이탭을 일정 탭으로 교체, 마음이 요소를 Home 카드·Settings로 승계.

| 단계 | 커밋 | 내용 |
|------|------|------|
| 1 | `00f47e3` | Settings "AI 친구" 섹션 (톤/말투/aiEnabled) |
| 2 | `7c79c88` | Home 마음이 앰비언트 카드 (아바타·관계바·gear) |
| 3 | `0e1b7c4` | Companion 탭 제거 → Schedule 탭 (플레이스홀더) |
| 4 | `e472e53` | 백엔드 schedule 도메인 + V29 마이그레이션 |
| 5 | `71d643f` | 프론트 일정 MVP (월간·오늘·CRUD·알림) |
| 6 | `87b1fb6` | Home 오늘 일정 미니 카드 |

---

## 검증 시나리오

### 1) 탭 네비게이션 기본 동작
- [ ] Home → 일기 → 일정 → 돌아보기 4탭 전환 정상
- [ ] 하단 탭 라벨 (홈/일기/일정/돌아보기) i18n 반영
- [ ] 중앙 + 버튼 → WriteDiary 진입
- [ ] Schedule 탭 아이콘(달력 형태) 정상 렌더

### 2) Settings "AI 친구" 섹션
- [ ] Settings 진입 → 구독 다음에 "AI 친구" 섹션 표시
- [ ] AI 응답 토글(Switch) on/off → 서버 반영
- [ ] AI 톤 칩 4개 선택 → 즉시 UI 반영 + 서버 저장
- [ ] AI 말투 칩 2개 선택 → 동일
- [ ] 다른 탭으로 이동 → Settings 재진입 → 값 유지

### 3) Home "마음이 카드"
- [ ] 프로필 로드 완료 시 아바타·이름·관계바 표시
- [ ] companionName SSoT: Settings에서 이름 변경 후 Home 복귀 → 카드 이름 갱신
- [ ] 카드 탭 / gear 아이콘 → Settings 이동
- [ ] AI 메시지(companionApi.getMessage) 한 줄 표시

### 4) Home "오늘 일정 미니 카드"
- [ ] 일정 0건일 때 섹션 미표시
- [ ] 일정 생성 후 Home 복귀 → 미니 카드 1~3건 표시
- [ ] 미니 카드 탭 → Schedule 탭 이동
- [ ] "전체보기" → Schedule 탭 이동

### 5) Schedule 월간 뷰
- [ ] 월 이동 (‹/›) 정상
- [ ] 오늘 날짜 강조 (accent bold)
- [ ] 일정이 있는 날짜에 도트 표시
- [ ] 날짜 탭 → 해당 일의 일정 목록 갱신
- [ ] 새로고침(pull-to-refresh)

### 6) Schedule CRUD
- [ ] FAB(+) → 생성 모달 열림
- [ ] 제목 입력, 시작/종료 시간 선택, 메모, 종일 토글
- [ ] 저장 → 목록에 즉시 반영
- [ ] 기존 일정 탭 → 편집 모달 → 수정 저장
- [ ] 삭제 확인 Alert → 삭제 후 목록 갱신
- [ ] 빈 제목 저장 시도 → 경고 Alert
- [ ] 종료 < 시작 저장 시도 → 경고 Alert

### 7) 알림
- [ ] 일정 생성 시 5분 전 로컬 알림 등록 (앱 권한 허용 시)
- [ ] 이미 지난 시간의 일정 → 알림 미등록

### 8) 일기 연결
- [ ] 편집 모달 → "이 일정에서의 기분을 기록하기" 탭 → WriteDiary 이동
- [ ] linkedDiaryId가 있는 일정 → "연결된 일기 열기" 표시 → DiaryDetail 이동
- [ ] 일정 카드에 "일기와 연결됨" 배지 표시

### 9) 백엔드
- [ ] `./gradlew compileJava` 통과
- [ ] Flyway V29 마이그레이션 정상(PostgreSQL 기동 시)
- [ ] POST /api/schedules → 201 Created
- [ ] GET /api/schedules?from=...&to=... → 200 OK
- [ ] GET /api/schedules/today → 200 OK
- [ ] PUT /api/schedules/{id} → 200 OK
- [ ] DELETE /api/schedules/{id} → 200 OK

### 10) 회귀 체크
- [ ] 로그아웃 → 재로그인 → 4탭 정상, companionName 정상
- [ ] 신규 가입 → CompanionSetup → 이름 설정 → MainTabs 정상 진입
- [ ] 일기 작성 → 저장 → 상세 → 뒤로가기 → 목록 정상 (이전 수정분 회귀 없음)
- [ ] AI 이름 변경 → ChatBubble 반영 (이전 수정분 회귀 없음)
- [ ] 과거 날짜 일기 조회 / 아카이브 → 정상
- [ ] 광고 배너 / 구독 화면 정상

---

## 롤백 절차

```bash
# 전체 구조 개편 이전 안정 상태로 복귀:
git checkout redesign/shared-components-v3

# 특정 단계만 revert (예: 단계 3 마음이탭 제거):
git revert 0e1b7c4

# feature 브랜치 삭제 (실험 완전 폐기):
git branch -D feature/tab-restructure-schedule
```

---

## 정적 검증 결과

| 검증 | 결과 |
|------|------|
| tsc --noEmit (mobile) | exit=0, 에러 0개 (모든 단계 후) |
| gradlew compileJava | BUILD SUCCESSFUL (단계 4 후) |
| i18n 키 | 4개 로캘(ko/en/ja/zh) 완전 동기 |
| git diff —stat | 총 8 커밋, 약 1,600줄 추가 |

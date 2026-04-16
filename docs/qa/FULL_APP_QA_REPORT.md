# Mamuri 앱 전체 QA 리포트

## 날짜: 2026-03-30
## QA 방식: 8개 전문 팀 병렬 코드 기반 QA

---

## 1. 팀 구성

| # | 팀 | 범위 |
|---|-----|------|
| 1 | Auth/Onboarding | 인증 흐름, Welcome~Home 전환 |
| 2 | Diary Flow | 감정선택~에디터~저장~상세 |
| 3 | Subscription/Premium | Paywall, 게이트, 가격, 구독 상태 |
| 4 | Companion/AI | 대화, AI 댓글, 관계, 제한 |
| 5 | Settings/i18n | 설정 화면, 언어 전환, 번역 누락 |
| 6 | Archive/Report | 아카이브, 리포트, 캘린더 |
| 7 | Custom Sticker | 스티커 MVP 전체 흐름 |
| 8 | Regression/E2E | 네비게이션, 타입, 크로스컷 |

---

## 2. 이번 턴에서 수정한 항목 (12건)

### FIX-01: crisisFlag가 모든 프리미엄 기능 개방 (CRITICAL -> 수정)
- **파일**: `SubscriptionContext.tsx:225-228`
- **문제**: `hasCrisisFlag`일 때 `PREMIUM_ENTITLEMENTS` 전체 반환 (커스텀 스티커, 테마, 폰트 포함)
- **수정**: 위기 시 AI 한도만 확장 (`aiConversationDailyLimit: 30, aiCommentDailyLimit: 10`), 나머지는 FREE 유지

### FIX-02: PremiumGate 이모지 잔존 (HIGH -> 수정)
- **파일**: `PremiumGate.tsx:75, 84`
- **문제**: `⭐` 이모지가 iOS 26 시뮬레이터에서 `?`로 렌더링
- **수정**: View 기반 PRO 배지로 교체

### FIX-03: EmotionPickerScreenV3 하드코딩 한국어 6건 (HIGH -> 수정)
- **파일**: `EmotionPickerScreenV3.tsx:105, 118, 151, 173-174, 227`
- **수정**: 모든 문자열을 `t()` 번역 키로 교체 + 4개 언어 키 추가

### FIX-04: EmotionCalendarV3 하드코딩 한국어 2건 (HIGH -> 수정)
- **파일**: `EmotionCalendarV3.tsx:105, 194`
- **수정**: `t('calendar.archiveTitle')`, `t('calendar.monthDistribution')` 적용

### FIX-05: DiaryPageDetailV3 placeholder 하드코딩 (HIGH -> 수정)
- **파일**: `DiaryPageDetailV3.tsx:307`
- **수정**: `t('diary.continuePlaceholder')` 적용

### FIX-06: client.ts 하드코딩 에러 메시지 3건 (HIGH -> 수정)
- **파일**: `client.ts:236, 293, 303`
- **수정**: `i18n.t('error.authExpired')`, `i18n.t('error.parseError')` 적용

### FIX-07: SubscriptionContext 구매/복원 실패 Alert 한국어 (HIGH -> 수정)
- **파일**: `SubscriptionContext.tsx:168, 187`
- **수정**: `i18n.t('premium.purchaseFailed')`, `i18n.t('premium.restoreFailed')` 적용

### FIX-08: ChatBubble '마무리' 하드코딩 (HIGH -> 수정)
- **파일**: `ChatBubble.tsx:64`
- **수정**: `t('companion.defaultName')` 적용

### FIX-09: Settings 구독관리 버튼이 자기 자신으로 navigate (HIGH -> 수정)
- **파일**: `SettingsScreenV2.tsx:207`
- **수정**: `isPremium ? openManagement() : navigate('Paywall')` 로 변경

### FIX-10: signup() AUTH_PROVIDER_KEY 미저장 (HIGH -> 수정)
- **파일**: `AuthContext.tsx:80-84`
- **수정**: signup 후 `SecureStore.setItemAsync(AUTH_PROVIDER_KEY, 'EMAIL')` 추가

### FIX-11: forceLogout() consentStorage 미정리 (HIGH -> 수정)
- **파일**: `AuthContext.tsx:37-42`
- **수정**: `consentStorage.clear()` 호출 추가

### FIX-12: i18n 번역 키 추가 (4개 언어)
- emotion.pickPrimary/pickSecondary/pickSubtitle/tagPrompt/tagSub/startWithThis
- calendar.archiveTitle/monthDistribution
- premium.purchaseFailed/restoreFailed
- common.retryLater
- companion.defaultName

---

## 3. 아직 남은 문제 (수정 필요, 우선순위 순)

### P0 — 배포 전 필수

| ID | 문제 | 심각도 | 유형 | 파일 |
|---|---|---|---|---|
| ~~R-01~~ | ~~편집 모드 저장 시 항상 새 일기 생성~~ | ~~CRITICAL~~ | **수정됨** | DiaryCanvasEditorV3, client.ts |
| ~~R-02~~ | ~~AI 대화 한도 초과 시 전송 버튼 미차단~~ | ~~CRITICAL~~ | **수정됨** | DiaryPageDetailV3.tsx |
| ~~R-03~~ | ~~V3 화면에서 CrisisBanner 완전 미구현~~ | ~~CRITICAL~~ | **수정됨** | DiaryPageDetailV3, CompanionChatV3 |
| ~~R-04~~ | ~~CrisisBanner 전체 텍스트 한국어 하드코딩~~ | ~~HIGH~~ | **수정됨** | CrisisBanner.tsx + 4개 i18n |

### P1 — 다음 스프린트

| ID | 문제 | 심각도 | 유형 |
|---|---|---|---|
| R-05 | CompanionSetup 기본 이름 '마음이' 하드코딩 | HIGH | i18n |
| R-06 | DIARY_FONT_OPTIONS label 번역 미적용 (labelKey 패턴 필요) | HIGH | i18n |
| R-07 | PAST_DUE/CANCELED 구독 상태 UI 미처리 | HIGH | 수익 |
| R-08 | ReportDetail 화면에 프리미엄 게이트 미연결 | MEDIUM | 수익 |
| R-09 | 프리미엄 폰트 구독 해지 후 다운그레이드 미처리 | MEDIUM | 수익 |
| R-10 | forgotPassword 버튼 onPress 없음 (데드엔드) | MEDIUM | UX |
| R-11 | en.json/ja.json settings 섹션 중복 정의 | MEDIUM | 구조 |
| R-12 | HomeStickerScreenV3/SettingsScreenV2 '마음이' fallback 하드코딩 | MEDIUM | i18n |
| ~~R-13~~ | ~~커스텀 스티커 → 일기 에디터 연결 없음~~ | ~~HIGH~~ | **수정됨** — StickerPickerSheet "내 스티커" 탭 + 에디터 연결 |
| R-14 | CompanionChatV3에 useSubscription 미임포트 (AI 쿼터 게이트 없음) | HIGH | 수익 |
| R-15 | RelationshipProgressBar maxLevel 계산 버그 | MEDIUM | UX |

### P2 — 개선 사항

| ID | 문제 | 유형 |
|---|---|---|
| R-16 | LoginScreen KeyboardAvoidingView 없음 | UX |
| R-17 | SocialNicknameScreen Back 버튼 없음 | UX |
| R-18 | ReflectionStory 초기 로딩 상태 없음 | UX |
| R-19 | 소셜 로그인 중 이메일 로그인 버튼 미비활성화 | UX |
| R-20 | 이메일 형식 검증 없음 | UX |
| R-21 | AI 데이터 동의 토글 Settings에 미존재 | 정책 |
| R-22 | appVersion locale 파일에 하드코딩 | 유지보수 |
| R-23 | Sticker addSticker stale closure 문제 | 데이터 |
| R-24 | Sticker 고아 파일 정리 로직 없음 | 데이터 |
| R-25 | subscription.yearly "17% 할인" → 실제 31% | 카피 |

---

## 4. 흐름별 QA 결과

| 흐름 | 결과 | 비고 |
|------|------|------|
| 온보딩/인증 | 부분 성공 | signup AUTH_PROVIDER 수정됨, forgotPassword 데드엔드 남음 |
| 홈→감정선택→일기작성 | 부분 성공 | i18n 수정됨, 편집 모드 저장 버그 남음 (P0) |
| 일기 목록/상세/아카이브 | 부분 성공 | placeholder 수정됨, 빈 상태 처리 미흡 |
| Companion/AI | 부분 성공 | ChatBubble 수정됨, 대화 한도 게이트 없음 (P0) |
| Reflect/리포트 | 부분 성공 | 목록 게이트 정상, ReportDetail에 개별 게이트 없음 (P1) |
| 설정 | 부분 성공 | 구독관리 버튼 수정됨, AI톤/동의 토글 누락 |
| 구독/Paywall | 부분 성공 | crisisFlag 수정됨, PremiumGate 이모지 수정됨 |
| 커스텀 스티커 | 부분 성공 → **성공** | 테두리 옵션 + 스티커 서랍 "내 스티커" 탭 + 에디터 연결 완료. 배경 제거는 향후 API 연동 |

---

## 5. 직접 테스트할 우선순위 높은 시나리오

### 최우선 (P0)
1. 기존 일기 편집 → 저장 → 중복 생성 되는지 확인
2. 무료 계정 AI 대화 3회 소진 → 4번째 전송 차단 여부
3. 앱 언어를 영어로 변경 → EmotionPicker 화면 진입 → 영어 표시 확인
4. EmotionCalendar 화면 → "감정 아카이브" 대신 영어 표시 확인
5. Paywall → 구매 실패 Alert → 영어 표시 확인

### 우선 (P1)
6. 비구독 → 프리미엄 테마 선택 → Paywall 이동 확인
7. Settings → 구독 관리 (프리미엄 상태) → App Store 관리 페이지 열림 확인
8. 회원가입 후 AUTH_PROVIDER 정상 저장 확인 (로그아웃 후 재로그인)
9. 커스텀 스티커 → 사진 선택 → 저장 → 목록 표시 확인
10. PremiumGate 화면에서 `?` 대신 PRO 배지 표시 확인

---

## 수정된 파일 목록

1. `mobile/src/contexts/SubscriptionContext.tsx` — crisisFlag 수정, i18n Alert
2. `mobile/src/contexts/AuthContext.tsx` — signup AUTH_PROVIDER, forceLogout consent
3. `mobile/src/screens_v2/components/PremiumGate.tsx` — 이모지 → PRO 배지
4. `mobile/src/screens_v2/EmotionPickerScreenV3.tsx` — 6개 하드코딩 → i18n
5. `mobile/src/screens_v2/EmotionCalendarV3.tsx` — 2개 하드코딩 → i18n
6. `mobile/src/screens_v2/DiaryPageDetailV3.tsx` — placeholder → i18n
7. `mobile/src/api/client.ts` — 3개 에러 메시지 → i18n
8. `mobile/src/screens_v2/components/ChatBubble.tsx` — '마무리' → i18n
9. `mobile/src/screens_v2/SettingsScreenV2.tsx` — 구독관리 → openManagement()
10. `mobile/src/i18n/locales/ko.json` — 12개 신규 키 추가
11. `mobile/src/i18n/locales/en.json` — 동일 키 영어 번역
12. `mobile/src/i18n/locales/ja.json` — 동일 키 일본어 번역
13. `mobile/src/i18n/locales/zh.json` — 동일 키 중국어 번역

---

## Addendum (2026-04-16): 일기 저장→상세→뒤로가기 목록 누락 근본 수정

### 증상
저장 후 상세 진입 → 뒤로가기 시 "현재 날짜의 일기 목록이 비어 보이는" 문제.
여러 번 국소 수정에도 재발해 왔음.

### 근본 원인 (구조적 모순 3종)
1. `DiaryCanvasEditorV3`에서 `diaryDate = new Date()` (오늘)로 저장하지만, 이 날짜를 상세로도 목록으로도 전달하지 않음.
2. `DiaryListScreenV2.selectedDate`는 native-stack 최하단 + unmount 없음 → long-lived local state. 외부 유일 제어 통로는 `route.params.filterDate` 뿐인데 저장 플로우가 이를 세팅하지 않음.
3. 상세 뒤로가기가 순수 `goBack()` → 목록은 stale selectedDate로 재-fetch, 오늘 저장분과 불일치.
→ "저장된 일기의 날짜 = 복귀 후 목록의 선택 날짜" 불변식이 코드에 없어 경로가 늘 때마다 재발.

### 구조적 수정
- `types/index.ts`: `DiaryDetail` 파람에 `filterDateOnBack?: string` 추가.
- `DiaryCanvasEditorV3.tsx`: 저장 후 `replace('DiaryDetail', { diaryId, filterDateOnBack: diaryDate })`.
- `DiaryPageDetailV3.tsx`: `handleBack()` 단일 핸들러로 통일(헤더 2곳 + 삭제 후 이동), Android `BackHandler` 등록. `filterDateOnBack` 있으면 `navigate('DiaryListHome', { filterDate })`, 없으면 `goBack()`.
- 목록의 기존 `useEffect([filterDate])` → `setSelectedDate` → `useFocusEffect(fetchDiaries)` 체인으로 자연스럽게 refetch.

### 수정 파일
14. `mobile/src/types/index.ts` — DiaryDetail 파람 확장
15. `mobile/src/screens_v2/DiaryCanvasEditorV3.tsx` — 저장 후 날짜 전파
16. `mobile/src/screens_v2/DiaryPageDetailV3.tsx` — handleBack + hardwareBack 통일

### 재현 방지 체크포인트
- 과거 날짜 선택 → 작성 → 저장 → 상세 → 뒤로가기 ⇒ 목록이 **저장한 일기의 날짜**로 자동 이동 + 새 일기 표시
- 오늘 작성/저장 시 ⇒ 목록 그대로 오늘, 새 일기 표시
- 일반 상세 진입(목록 탭/아카이브)은 `goBack()` 기존 동작 유지

상세 분석은 `docs/qa/DIARY_BACK_NAVIGATION_ROOT_CAUSE.md` 참조.

---

## Addendum (2026-04-16): AI 친구 이름이 댓글 작성자에 반영되지 않는 문제 근본 수정

### 증상
사용자가 AI 친구 이름을 변경해도 일기 상세의 AI 말풍선 작성자 라벨이 기본값("마무리")로 남음. 앱 재시작 시에도 동일.

### 근본 원인 (구조적 결함 3종)
1. `ChatBubble.tsx:64`가 `companionName`을 읽지 않고 `t('companion.defaultName')`만 렌더 → SSoT 미구독.
2. `SettingsScreenV2.handleSaveAiName`가 저장 성공 후 `AuthContext.setCompanionName` 호출을 누락 → Context가 stale.
3. `AuthContext.companionName`이 영속화되지 않음 → 재실행 시마다 `''` → 비동기 fetch 전까지 fallback 렌더.

→ "이름 표시는 반드시 `companionName || t('companion.defaultName')`" 라는 단일 규칙이 렌더 지점마다 달랐고, SSoT 자체도 안정적으로 공급되지 않았음.

### 구조적 수정
- `AuthContext.tsx`: AsyncStorage(`@react-native-async-storage/async-storage`)로 `companion_name` 영속화. mount hydrate / setter write / logout·forceLogout clear 3경로 모두 처리. `setCompanionName` 시그니처(`(name: string) => void`)는 유지하여 기존 호출자 무변경.
- `ChatBubble.tsx`: `useAuth()`로 `companionName` 구독, `aiDisplayName = companionName || t('companion.defaultName')` 적용.
- `SettingsScreenV2.tsx`: 이름 저장 성공 분기에서 `setCompanionName(updated.aiName || trimmed)` 호출 추가.

### Fallback 우선순위 규칙
1. `AuthContext.companionName` (AsyncStorage 복구값 → 사용자 설정·서버 반환값)
2. 비어있을 때만 `t('companion.defaultName')` (ko:"마무리", en:"Mamuri", ja:"マムリ", zh:"Mamuri")

### 수정 파일
17. `mobile/src/contexts/AuthContext.tsx` — AsyncStorage 영속화 + setter useCallback
18. `mobile/src/screens_v2/components/ChatBubble.tsx` — SSoT 구독 + fallback 패턴
19. `mobile/src/screens_v2/SettingsScreenV2.tsx` — setCompanionName 누락 호출 추가

### 재발 방지 포인트
- 새로운 AI 이름 렌더 컴포넌트는 반드시 `useAuth().companionName || t('companion.defaultName')` 패턴 사용.
- 이름 변경 API 성공 분기에서 `setCompanionName` 호출 필수. AsyncStorage 처리는 Context가 담당.
- 로그아웃 경로 신설 시 `setCompanionName('')`로 Context/Storage 동시 초기화.

### 정적 검증
- `tsc --noEmit` exit=0
- QA 체크리스트 8항목 전원 PASS (AsyncStorage hydrate/set/clear 3경로, 시그니처 유지, 훅 위치, fallback, 성공 분기 한정, v2 호환, 레거시 미영향)

상세 분석은 `docs/qa/AI_COMPANION_NAME_RENDERING_FIX.md` 참조.

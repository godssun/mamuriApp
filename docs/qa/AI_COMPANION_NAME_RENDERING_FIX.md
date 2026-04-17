# AI 친구 이름이 댓글 작성자에 반영되지 않는 문제: 근본 원인과 구조적 수정

작성일: 2026-04-16
브랜치: redesign/shared-components-v3

---

## 1. 문제 재현 경로

1. 사용자가 Settings 또는 CompanionChat에서 AI 친구 이름을 "별이"로 변경
2. 일기 작성 → 저장 → 상세 화면 진입 → AI가 응답 → `<ChatBubble sender="ai" />` 렌더
3. ChatBubble의 작성자 라벨이 **여전히 "마무리"**로 표시됨
4. 앱 강제 종료 → 재실행 → 첫 화면부터 "마무리" (서버 fetch 성공 전까지)

---

## 2. 근본 원인 (구조적 결함 3종)

### 원인 A — ChatBubble이 SSoT를 읽지 않음
`mobile/src/screens_v2/components/ChatBubble.tsx:64` (수정 전):
```tsx
<Text style={styles.aiName}>{t('companion.defaultName')}</Text>
```
- `companionName` prop도 없고, `useAuth()` 훅도 호출하지 않음
- 언제나 i18n 기본값만 출력 → ko: "마무리"
- `DiaryPageDetailV3.tsx:356`에서 ChatBubble을 호출할 때도 이름을 전달하지 않음(현재 prop 자체가 없으니 전달 불가)

### 원인 B — SettingsScreenV2가 Context를 업데이트하지 않음
`mobile/src/screens_v2/SettingsScreenV2.tsx:128-139` (수정 전): `handleSaveAiName`가 서버 PUT과 로컬 `setCompanion(updated)`만 호출하고 **`AuthContext.setCompanionName`을 호출하지 않음** → Home 탭 라벨 등 Context를 구독하는 화면이 stale.

> 비교: `CompanionSetupScreenV2.tsx:92-93`, `CompanionChatV3.tsx:99-101`은 저장 후 `setCompanionName`을 정상 호출. 즉 **"일부 경로만 SSoT를 갱신하는"** 불균형이 존재.

### 원인 C — SSoT 자체가 영속화되지 않음
`mobile/src/contexts/AuthContext.tsx:34` (수정 전): `companionName` 초기값 `''`. AsyncStorage/SecureStore 영속화 없음.

- 매 앱 시작마다 `MainTabsNavigator`의 useEffect(`navigation/index.tsx:79-85`)가 비동기로 `companionApi.getProfile()`를 호출해 채움
- 서버 응답 전까지 `companionName === ''` → 모든 구독 컴포넌트가 fallback으로 렌더
- 네트워크 실패(`.catch(() => {})`) 시 영원히 빈 문자열

### 왜 반복 재발했는가
"AI 이름 표시" 규칙이 **렌더 컴포넌트마다 제각각**이었다. 어떤 곳은 `useAuth().companionName` 사용, 어떤 곳은 자체 state, ChatBubble은 아예 i18n 기본값 하드코딩. 한 화면을 수정해도 다른 화면이 다른 규칙으로 남아 있으면 증상이 다시 드러난다.

---

## 3. 수정 방식 (SSoT + 영속화 + 통일된 fallback)

### 불변식
1. **AI 친구 이름의 단일 진실 공급원은 `AuthContext.companionName`**
2. **모든 렌더 지점은 `companionName || t('companion.defaultName')` 패턴만 사용**
3. **이름을 서버에 저장하는 모든 경로는 저장 성공 후 `setCompanionName`을 반드시 호출**
4. **`setCompanionName` 호출자는 AsyncStorage write를 신경 쓸 필요 없음** (Context 내부에서 처리)

### 변경 내역

| 파일 | 변경 |
|---|---|
| `mobile/src/contexts/AuthContext.tsx` | `AsyncStorage` import, `COMPANION_NAME_KEY` 상수. `setCompanionName`을 `useCallback`으로 감싸 state set + AsyncStorage write 병행. 앱 mount 시 `AsyncStorage.getItem`으로 저장값 복구. `logout`·`forceLogout`에서 storage clear + state clear |
| `mobile/src/screens_v2/components/ChatBubble.tsx` | `useAuth()` 호출, `aiDisplayName = companionName \|\| t('companion.defaultName')`, 라벨이 `aiDisplayName` 사용 |
| `mobile/src/screens_v2/SettingsScreenV2.tsx` | `useAuth()`에서 `setCompanionName` 구조 분해. `handleSaveAiName` 성공 분기에서 `setCompanionName(updated.aiName \|\| trimmed)` 호출 |

호출자 측 타입 시그니처(`(name: string) => void`)는 유지되므로 기존 호출자(CompanionSetupScreenV2, CompanionChatV3, navigation/index.tsx, AICommentScreenV2)는 변경 불필요.

---

## 4. Fallback 우선순위 규칙 (수정 후 최종)

```
displayAiName = companionName (truthy)
              ?? AsyncStorage에서 복구된 값
              ?? 사용자 설정·서버 반환값
              : t('companion.defaultName')   // ko:"마무리", en:"Mamuri", ja:"マムリ", zh:"Mamuri"
```

| 상태 | `companionName` 값 | 화면 표시 |
|---|---|---|
| 신규 가입 직후, `getProfile` 완료 전 | `''` | i18n 기본값 (ko: "마무리") |
| 사용자 이름 설정 후 | 설정값 | 설정값 |
| 앱 재시작 (네트워크 정상) | AsyncStorage 복구값 → getProfile 재검증 | 설정값 (first paint부터) |
| 앱 재시작 (오프라인) | AsyncStorage 복구값 | 설정값 |
| 로그아웃 후 재로그인 | `''` → getProfile로 채움 | 새 사용자의 설정값 |

"사용자 설정값이 존재하는 한 fallback으로 덮이지 않는다"가 코드로 보장된다.

---

## 5. 재발 방지 포인트

향후 AI 이름을 표시하거나 변경하는 코드를 추가할 때:

- **새로운 렌더 컴포넌트**: 반드시 `useAuth().companionName || t('companion.defaultName')` 패턴을 사용한다. `t('companion.defaultName')` 단독 사용 금지.
- **새로운 이름 변경 경로**: 서버 저장 성공 후 `setCompanionName(newName)` 호출이 필수. AsyncStorage 처리는 Context가 담당하므로 호출자는 setter 한 줄만.
- **로그아웃 추가 로직**: 새로운 로그아웃 경로를 만들 때 `setCompanionName('')` 또는 AsyncStorage clear를 잊지 말 것.
- **서버 API 변경**: `CompanionProfile.aiName` 필드가 사라지거나 이름이 바뀌면 Context와 ChatBubble의 fallback 패턴이 그대로 보호 역할을 수행.

---

## 6. 검증

### 정적
- `cd mobile && ./node_modules/.bin/tsc --noEmit` → **exit=0, 에러 0개** (2026-04-16)
- QA agent 체크리스트 8항목 전원 PASS (AsyncStorage hydrate/set/clear 3경로, setCompanionName 시그니처 유지, useAuth 훅 위치, ChatBubble fallback, Settings 성공 분기 한정, v2 호환, 레거시 미영향, tsc exit=0)

### 사용자 수동 확인 시나리오
1. Settings → 이름을 "별이"로 변경 → 즉시 Home 탭 라벨 / 일기 상세 ChatBubble 이름이 "별이"
2. 일기 작성 → 저장 → 상세 진입 → AI 응답 버블 이름이 "별이"
3. 앱 강제 종료 → 재실행 → 첫 렌더부터 "별이"
4. 비행기 모드 + 앱 재실행 → 여전히 "별이" (AsyncStorage 복구)
5. 로그아웃 → 새 계정 로그인 → 이전 사용자의 "별이"가 남지 않음

---

## 7. 범위 밖

- 레거시 `mobile/src/screens/` 하위 (DiaryDetailScreen, CompanionScreen, SettingsScreen) — 라우팅되지 않음
- `mobile/src/components/conversation/*` — 라우팅되지 않음
- `AICommentScreenV2` — 이미 자체 state로 이름 관리, 이번 수정에도 영향 없음
- i18n 기본값 텍스트 변경 — 이번 수정은 문자열이 아닌 구조 문제

# 일기 저장 → 상세 → 뒤로가기 시 목록이 비어 보이는 문제: 근본 원인과 구조적 수정

작성일: 2026-04-16
브랜치: redesign/shared-components-v3
관련 화면: `DiaryListScreenV2`, `DiaryCanvasEditorV3`, `DiaryPageDetailV3`

---

## 1. 문제 재현 경로

1. 사용자가 일기 목록(`DiaryListScreenV2`)에서 임의의 날짜를 선택한 상태(예: 어제, 혹은 이전에 선택해 둔 날짜)
2. 작성 버튼으로 `DiaryCanvasEditorV3` 진입 (날짜 파라미터 전달 없음)
3. 저장 성공 → `navigation.replace('DiaryDetail', { diaryId })` 로 상세 진입
4. 상세(`DiaryPageDetailV3`)에서 뒤로가기 → `navigation.goBack()` → `DiaryListHome`으로 복귀
5. **목록 화면의 `selectedDate`가 이전 값 그대로라서 "다른 날짜"의 일기만 조회됨**
6. 방금 저장한 일기(= 오늘 날짜)는 목록에 보이지 않음 → 사용자 눈에는 "목록이 비어 보임"

오늘 날짜에서 저장하더라도, 앱이 장시간 켜진 상태에서 자정을 넘기면 `selectedDate`는 "어제의 Date 객체"를 유지하므로 같은 증상이 재발한다.

---

## 2. 근본 원인 (data-flow 관점)

세 가지 구조적 모순이 겹쳐 있다.

### 원인 A — 저장된 일기 날짜가 목록으로 전파되지 않음
`DiaryCanvasEditorV3.tsx:323-324` 는 저장 시 `diaryDate = new Date()` (오늘)로 강제 고정한다. 그러나 이 날짜는 어디에도 전달되지 않는다.

```ts
// Before
navigation.replace('DiaryDetail', { diaryId: diary.id });
```

### 원인 B — 목록의 `selectedDate`는 long-lived local state
`DiaryListScreenV2.tsx:68-77`:
```ts
const filterDate = route.params?.filterDate;
const initialDate = filterDate ? new Date(filterDate + 'T00:00:00') : new Date();
const [selectedDate, setSelectedDate] = useState(initialDate);

useEffect(() => {
  if (filterDate) {
    setSelectedDate(new Date(filterDate + 'T00:00:00'));
    navigation.setParams({ filterDate: undefined } as any);
  }
}, [filterDate]);
```

- `useState(initialDate)`의 초기값은 첫 마운트 시에만 쓰인다.
- 목록 화면은 native-stack의 최하단이라 상세 진입 시에도 **unmount 되지 않는다**. 따라서 뒤로가기 후에도 기존 `selectedDate`가 그대로 살아남는다.
- 외부에서 `selectedDate`를 바꿀 수 있는 유일한 통로는 `route.params.filterDate`인데, 저장 플로우는 이를 세팅하지 않는다.

### 원인 C — 뒤로가기가 `goBack()`이기 때문
`DiaryPageDetailV3.tsx:243` 의 뒤로가기는 순수 `navigation.goBack()`이라서 route params 갱신 없이 이전 스크린으로만 복귀. 목록 화면은 stale state를 그대로 재사용한다.

### 왜 반복 재발했는가
이전 수정들은 주로 "특정 진입 경로에서 selectedDate를 오늘로 강제 리셋"하는 식의 **증상 수정**이었을 것으로 추정된다. 그러나 목록 `selectedDate`가 과거 값이 되는 경로는 여러 갈래(EmotionCalendar, DiaryArchive, 탭 리셋, 자정 경과 등)로 존재한다. 한 경로를 막으면 다른 경로에서 다시 뚫리는 구조다.

즉, 구조적으로는 **"일기 저장 후 목록 필터 == 방금 저장한 일기의 날짜"** 라는 불변식(invariant)이 데이터 흐름에 박혀 있지 않았다. 이 불변식이 없으면 selectedDate가 과거 값이 되는 새로운 경로가 생길 때마다 문제가 재발한다.

---

## 3. 수정 방식 (구조적 접근)

### 불변식
> "저장 직후 진입한 상세 화면에서 뒤로가기를 누르면, 목록의 선택 날짜는 반드시 **방금 저장한 일기의 날짜**와 일치한다."

이 불변식을 route params와 navigation dispatch로 명시적으로 보장한다.

### 변경 내역

| 파일 | 변경 |
|---|---|
| `mobile/src/types/index.ts:376` | `DiaryDetail` 파람에 선택적 `filterDateOnBack?: string` 추가 |
| `mobile/src/screens_v2/DiaryCanvasEditorV3.tsx:434` | 저장 후 `replace('DiaryDetail', { diaryId, filterDateOnBack: diaryDate })` 로 일기 날짜 명시 전달 |
| `mobile/src/screens_v2/DiaryPageDetailV3.tsx` | ① `handleBack()` 도입: `filterDateOnBack` 있으면 `navigate('DiaryListHome', { filterDate })`, 없으면 기존 `goBack()`. ② 헤더 뒤로가기 버튼 2곳 + 삭제 후 이동 1곳을 모두 `handleBack()`으로 통일. ③ Android `BackHandler.hardwareBackPress`에도 같은 경로 등록하여 물리/제스처 뒤로가기도 동일 동작 |

### 왜 이 수정이 재발을 막는가
1. 저장된 일기의 **실제 날짜**가 상세 → 목록으로 명시적으로 흘러간다. 더 이상 암묵적 "오늘"이 아니다.
2. 목록의 `useEffect([filterDate])`가 이미 존재하므로, route params로 filterDate가 들어오면 `selectedDate`를 자동으로 업데이트한다. `useFocusEffect`는 `selectedDate` 변화에 반응해 재-fetch한다. 별도 refetch 플래그 불필요.
3. `filterDateOnBack`은 저장 플로우에서만 세팅되므로, 일반 상세 진입(목록 클릭, 아카이브 등)은 기존 `goBack()` 동작을 그대로 유지한다. 회귀 리스크가 국소화된다.
4. native-stack의 `navigate('DiaryListHome', params)`는 이미 스택에 있는 `DiaryListHome`까지 pop하면서 params를 병합하므로, 상세 → 목록 복귀 동작은 기존 UX와 동일하다.
5. Android 하드웨어 뒤로가기도 별도 리스너로 동일 경로를 태우므로, 헤더 버튼 / iOS 스와이프 / Android 뒤로가기 간 동작 차이가 없다.

---

## 4. 재발 방지 포인트

향후 추가 작업 시 아래를 지키면 같은 부류의 문제가 재발하지 않는다.

- 목록 `selectedDate`는 route params(`filterDate`)로만 외부 제어해야 한다. 다른 경로(context/글로벌 스토어)에서 직접 바꾸지 말 것.
- 저장·편집 등 "특정 날짜 일기를 조작"하는 모든 흐름은 완료 후 목록으로 복귀할 때 해당 날짜를 `filterDate`로 전달해야 한다.
- 상세에서 목록으로 돌아가는 모든 경로(`handleBack`, 삭제 후 이동, hardwareBack)는 반드시 하나의 핸들러로 통일해야 한다. 중복 구현이 생기면 재발 포인트가 된다.

---

## 5. 검증

- TypeScript: `npx tsc --noEmit` (mobile) → **오류 없음** (exit=0, 2026-04-16)
- 런타임 검증 시나리오는 `FULL_APP_QA_REPORT.md` 의 "뒤로가기 일기 목록" 섹션 참조.

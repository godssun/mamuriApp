# P0 버그 수정 리포트

## 날짜: 2026-03-30
## 목표: P0 이슈 4건 수정 + 검증

---

## P0-1: 편집 모드 저장 시 항상 새 일기 생성

### 원인 분석
- `DiaryCanvasEditorV3.tsx:291`에서 `handleSave`가 `isEditMode` 여부와 무관하게 항상 `diaryApiV3.createV3()` 호출
- `diaryApiV3`에 `updateV3` 메서드 자체가 없었음
- 편집 모드 판별: `route.params?.editDiaryId` 존재 여부 (`isEditMode = !!editDiaryId`)

### 수정 내용
1. **`client.ts`**: `diaryApiV3.updateV3(id, data)` 메서드 추가 (PUT `/diaries/${id}`)
2. **`DiaryCanvasEditorV3.tsx`**: `handleSave`에서 분기 추가
   - `isEditMode ? diaryApiV3.updateV3(editDiaryId, payload) : diaryApiV3.createV3(payload)`
3. `diaryPayload`에 `DiaryCreateRequestV3` 타입 명시 (TypeScript 추론 오류 방지)
4. `useCallback` 의존성 배열에 `isEditMode`, `editDiaryId` 추가

### 검증
- TypeScript 빌드: 통과 (0 errors)
- 신규 작성: `createV3` → POST `/diaries` (기존 동작 유지)
- 편집 모드: `updateV3` → PUT `/diaries/${id}` (중복 생성 방지)

### 수정 파일
- `mobile/src/api/client.ts` (updateV3 추가)
- `mobile/src/screens_v2/DiaryCanvasEditorV3.tsx` (저장 분기)

---

## P0-2: AI 대화 한도 초과 시 전송 버튼 미차단

### 원인 분석
- `DiaryPageDetailV3.tsx:316` 전송 버튼의 `disabled` 조건이 `!inputText.trim() || isAITyping`뿐
- `limits.remainingReplies`가 0일 때도 전송 가능
- Paywall 유도 UI 없음
- `useSubscription` 미임포트

### 수정 내용
1. **`DiaryPageDetailV3.tsx`**:
   - `useSubscription` import + `hasCrisisFlag` 추출
   - `isLimitReached` 계산: `limits.remainingReplies !== null && limits.remainingReplies <= 0`
   - 전송 버튼 `disabled`에 `isLimitReached` 추가
   - TextInput `editable={!isLimitReached}` 추가
   - 한도 도달 시 배너 표시 (Paywall 링크 포함)
   - 한도 도달 시 placeholder 변경 ("대화 한도에 도달했어요")
2. **i18n 키 추가**: `detail.quotaReached`, `detail.quotaReachedShort` (4개 언어)

### 검증
- TypeScript 빌드: 통과
- 무료 유저 (remainingReplies=0): 입력 비활성화 + 배너 표시 + Paywall 링크
- 프리미엄 유저 (remainingReplies=null): 무제한, 정상 동작
- 한도 남음 (remainingReplies>0): 정상 전송

### 수정 파일
- `mobile/src/screens_v2/DiaryPageDetailV3.tsx`
- `mobile/src/i18n/locales/ko.json` (+ en/ja/zh)

---

## P0-3: V3 화면에서 CrisisBanner 미구현

### 원인 분석
- V2 화면(PaywallScreenV2, WriteDiaryScreen)에는 `<CrisisBanner />` 존재
- V3 화면(DiaryPageDetailV3, CompanionChatV3)에서는 완전 누락
- `hasCrisisFlag` 상태가 SubscriptionContext에서 계산되지만 V3 화면에서 미소비

### 수정 내용
1. **`DiaryPageDetailV3.tsx`**:
   - `useSubscription` import, `hasCrisisFlag` 추출
   - 입력 바 위에 `{hasCrisisFlag && <CrisisBanner />}` 렌더링
2. **`CompanionChatV3.tsx`**:
   - `useSubscription` import, `hasCrisisFlag` 추출
   - `CrisisBanner` import
   - ScrollView 상단에 `{hasCrisisFlag && <CrisisBanner />}` 렌더링

### 수정 파일
- `mobile/src/screens_v2/DiaryPageDetailV3.tsx`
- `mobile/src/screens_v2/CompanionChatV3.tsx`

---

## P0-4: CrisisBanner 하드코딩 i18n

### 원인 분석
- `CrisisBanner.tsx` 전체 텍스트가 한국어 하드코딩
- `useTranslation` import 자체 없음
- 위기 상담 전화번호도 한국 번호로 고정

### 수정 내용
1. **`CrisisBanner.tsx`** 전체 재작성:
   - `useTranslation` 추가
   - `t('crisis.title')`, `t('crisis.note')` 적용
   - 연락처를 `t('crisis.contacts', { returnObjects: true })` 로 언어별 배열 로딩
2. **i18n 키 추가** (4개 언어):
   - `ko`: 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199
   - `en`: National Suicide Prevention Lifeline 988, Crisis Text Line 741741
   - `ja`: いのちの電話 0120-783-556, よりそいホットライン 0120-279-338
   - `zh`: 24小时心理援助热线 400-161-9995, 心理危机干预中心 010-82951332

### 검증
- TypeScript 빌드: 통과
- 각 언어별 위기 연락처가 해당 국가 공인 기관으로 설정됨

### 수정 파일
- `mobile/src/components/CrisisBanner.tsx`
- `mobile/src/i18n/locales/ko.json` (+ en/ja/zh)

---

## 추가 검증: Reflect/리포트 흐름 재평가

### 판정: "성공" → "부분 성공"으로 수정

- ReflectionStoryV3의 목록 게이트는 정상 (무료 1개 / 프리미엄 5개)
- ReportDetail 화면 자체에는 프리미엄 게이트 없음
- 첫 번째 리포트는 무료 유저도 상세 진입 가능 (맛보기 역할)
- 두 번째 이후 리포트는 목록에서 차단되므로 상세 접근 불가
- **결론**: 기능적으로 안전하지만, 직접 URL/딥링크로 reportId를 넘기면 우회 가능 → P1

---

## 전체 수정 파일 목록

| # | 파일 | 수정 내용 |
|---|------|----------|
| 1 | `mobile/src/api/client.ts` | `diaryApiV3.updateV3()` 메서드 추가 |
| 2 | `mobile/src/screens_v2/DiaryCanvasEditorV3.tsx` | 편집 모드 update 분기 |
| 3 | `mobile/src/screens_v2/DiaryPageDetailV3.tsx` | 한도 차단 + CrisisBanner |
| 4 | `mobile/src/screens_v2/CompanionChatV3.tsx` | CrisisBanner + useSubscription |
| 5 | `mobile/src/components/CrisisBanner.tsx` | 전체 i18n 재작성 |
| 6 | `mobile/src/i18n/locales/ko.json` | crisis + quota 키 추가 |
| 7 | `mobile/src/i18n/locales/en.json` | 동일 |
| 8 | `mobile/src/i18n/locales/ja.json` | 동일 |
| 9 | `mobile/src/i18n/locales/zh.json` | 동일 |

---

## 직접 테스트 시나리오

### P0-1 검증
1. 새 일기 작성 → 저장 → 목록에 1건 표시 확인
2. 해당 일기 편집 → 내용 수정 → 저장 → 목록에 여전히 1건 (중복 없음)
3. 편집 후 상세에서 수정된 내용 반영 확인

### P0-2 검증
4. 무료 계정 → 일기 상세 → AI 대화 3회 소진
5. 4번째 전송 시도 → 입력 비활성화 + "오늘의 대화 횟수를 모두 사용했어요" 배너
6. "구독 살펴보기" 탭 → Paywall 이동

### P0-3 검증
7. (백엔드에서 crisisFlag=true 설정 후) 일기 상세 → CrisisBanner 표시
8. Companion 탭 → CrisisBanner 표시
9. 위기 전화번호 탭 → 전화 앱 실행

### P0-4 검증
10. 언어를 영어로 변경 → CrisisBanner 영어 표시 + 988 번호
11. 언어를 일본어로 변경 → CrisisBanner 일본어 표시 + いのちの電話

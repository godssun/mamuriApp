# 구독 MVP 버그 수정 노트

## 수정 날짜: 2026-03-29

---

## Bug 1: Navigation 에러 — EmotionPicker → WriteDiary

### 증상
`The action 'NAVIGATE' with payload {"name":"DiaryList",...} was not handled by any navigator.`

### 원인
`EmotionPickerScreenV3`는 `MainStack`에 있지만, `DiaryList`/`WriteDiary`는 `MainTab` 안의 `DiaryStack`에 있음. cross-tab nested navigation 경로가 잘못됨.

### 수정
```
// Before (잘못된 경로)
nav.navigate('DiaryList', { screen: 'WriteDiary', params: {...} })

// After (올바른 경로: MainStack → MainTabs → DiaryList → WriteDiary)
nav.navigate('MainTabs', {
  screen: 'DiaryList',
  params: { screen: 'WriteDiary', params: {...} },
})
```

### 파일
- `screens_v2/EmotionPickerScreenV3.tsx:78`

---

## Bug 2: Premium Gate 미동작 — 테마/폰트 무제한 적용

### 증상
비구독 상태에서 PRO 테마/폰트를 클릭해도 그냥 적용됨. Paywall 안 뜸.

### 원인
- 에디터: `thm.premium` 체크 조건이 `!appTheme.diaryFontKey` (의미 없는 조건)
- 설정: `updateAppearance()` 호출 시 premium 체크 없음
- PRO 배지는 있지만 실제 차단 로직 없음

### 수정
**에디터 (DiaryCanvasEditorV3.tsx):**
```typescript
if (thm.premium && !entitlements.canUsePremiumThemes) {
  setShowThemeSheet(false);
  navigation.navigate('Paywall');
  return;
}
```

**설정 (SettingsScreenV2.tsx):**
```typescript
if (opt.premium && !isPremium) {
  navigation.navigate('Paywall');
  return;
}
```

### 파일
- `screens_v2/DiaryCanvasEditorV3.tsx:551-556`
- `screens_v2/SettingsScreenV2.tsx:306`

---

## Bug 3: Paywall에 `?` 표시

### 증상
Paywall 상단 아이콘이 `?`로 렌더링됨.

### 원인
`✦` (U+2748 HEAVY TEARDROP SPOKED ASTERISK)는 표준 emoji가 아닌 유니코드 장식 문자. 일부 기기/폰트에서 글리프가 없어 `?`로 fallback.

### 수정
`✦` → `⭐` (표준 emoji, 모든 기기에서 렌더링 보장)

### 파일
- `screens_v2/PaywallScreenV3.tsx` (2곳)
- `screens_v2/components/PremiumGate.tsx` (2곳)

---

## 커스텀 스티커 상태

### 현재 구현 범위
- `CustomStickerContext` 존재 (저장/삭제/목록 API)
- `CustomSticker` 타입 정의 완료
- **화면 없음** — 진입점, 편집 화면, 목록 화면 미구현
- **App.tsx에 Provider 미연결**
- **StickerPickerSheet에 "내 스티커" 탭 없음**

### 남은 작업
1. App.tsx에 CustomStickerProvider 추가
2. 커스텀 스티커 제작 화면 구현 (사진 선택 → 미리보기 → 저장)
3. StickerPickerSheet에 "내 스티커" 탭 추가
4. 에디터에서 커스텀 스티커 사용 연결
5. Premium gate 연결 (비구독자 → Paywall)

---

## 남은 이슈

| 이슈 | 심각도 | 상태 |
|------|--------|------|
| 커스텀 스티커 화면 미구현 | 중간 | 다음 턴 |
| 고급 리포트 premium gate 미연결 | 낮음 | 다음 턴 |
| 서버 구독 동기화 (RevenueCat Webhook) | 중간 | 다음 턴 |
| AI 댓글/대화 제한 실제 연동 | 중간 | 서버 연동 시 |

# 런타임 QA 리포트

## 날짜: 2026-03-30

## 수정 항목

### 1. Paywall 이모지 깨짐 → View 기반으로 완전 교체
- **문제**: `✦`, `⭐`, `✂️💬🎨📊` 이모지가 iOS 26 시뮬레이터에서 `?`로 렌더링
- **원인**: iOS 26 beta 시뮬레이터의 `AppleColorEmoji.ttc` 누락 + color 속성 충돌
- **수정**: 모든 이모지를 View 기반 UI로 교체
  - Hero: `⭐` → sage 원형 PRO 배지
  - 혜택 아이콘: `✂️💬🎨📊` → 번호 원형 배지 (1, 2, 3, 4)
  - 구독 중: `⭐` → 큰 PRO 배지
- **파일**: `PaywallScreenV3.tsx`, `PremiumGate.tsx`

### 2. StoreKit Config 가격 오표시 → USD 단위로 수정
- **문제**: `$55,000.00` / `$6,600.00` 표시
- **원인**: StoreKit Config의 `displayPrice`가 원화 정수(`"6600"`)로 설정 → USD로 해석
- **수정**: `"6600"` → `"4.99"`, `"55000"` → `"39.99"`
- **파일**: `ios/Products.storekit`

### 3. 커스텀 스티커 MVP 화면 신규 구현
- **문제**: Context만 존재, 화면/진입점 없음
- **수정**:
  - `CustomStickerScreenV3.tsx` 신규 생성
  - 비구독자: PRO 잠금 화면 + Paywall 유도
  - 구독자: 사진 선택 → 미리보기 → 스티커 저장 → 내 스티커 목록
  - Settings에 진입점 추가
  - App.tsx에 CustomStickerProvider 연결
  - navigation에 CustomSticker route 추가
  - 4개 언어 번역 추가
- **파일**: `CustomStickerScreenV3.tsx`, `App.tsx`, `navigation/index.tsx`, `types/index.ts`, `SettingsScreenV2.tsx`, 4개 i18n 파일

### 4. 리포트 premium gate 연결
- **문제**: PremiumGate 컴포넌트 있지만 리포트 화면에 미연결
- **수정**:
  - 비구독자: 리포트 1개만 표시 + "구독 살펴보기" PRO 카드
  - 구독자: 리포트 5개까지 표시
- **파일**: `ReflectionStoryV3.tsx`

## 테스트 시나리오

### 비구독 상태
| # | 시나리오 | 예상 결과 |
|---|---------|-----------|
| 1 | 홈 → 감정 선택 → 확인 | 일기 작성 화면 진입 |
| 2 | 에디터 → 테마 → "따뜻한 줄노트" (PRO) | Paywall 모달 |
| 3 | 설정 → 폰트 → "손글씨" (PRO) | Paywall 이동 |
| 4 | 설정 → "커스텀 스티커" | 스티커 화면 → PRO 잠금 → Paywall |
| 5 | 돌아보기 → 리포트 | 1개만 표시 + PRO 유도 카드 |
| 6 | Paywall 화면 | PRO 배지, 혜택 4개, 가격 정상 표시, `?` 없음 |

### 구독 상태 (StoreKit에서 구매 후)
| # | 시나리오 | 예상 결과 |
|---|---------|-----------|
| 7 | 에디터 → 테마 → "밤하늘" (PRO) | 정상 적용 |
| 8 | 설정 → 폰트 → "손글씨" (PRO) | 정상 적용 |
| 9 | 설정 → "커스텀 스티커" | 사진 선택 화면 진입 |
| 10 | 돌아보기 → 리포트 | 5개까지 표시 |

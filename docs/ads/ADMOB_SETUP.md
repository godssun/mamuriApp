# AdMob 연동 가이드

> 최종 업데이트: 2026-04-02

## AdMob App ID

| Platform | App ID |
|----------|--------|
| iOS | `ca-app-pub-1553144894464526~1709408384` |
| Android | `ca-app-pub-1553144894464526~3481227423` |

## Banner Ad Unit ID

| Platform | Ad Unit ID |
|----------|-----------|
| iOS | `ca-app-pub-1553144894464526/2429998078` |
| Android | `ca-app-pub-1553144894464526/2220116646` |

## 설정 위치

### App ID → `mobile/app.config.ts`

```typescript
[
  'react-native-google-mobile-ads',
  {
    androidAppId: 'ca-app-pub-1553144894464526~3481227423',
    iosAppId: 'ca-app-pub-1553144894464526~1709408384',
  },
],
```

Expo config plugin이 자동으로:
- iOS: `Info.plist`에 `GADApplicationIdentifier` 추가
- Android: `AndroidManifest.xml`에 `com.google.android.gms.ads.APPLICATION_ID` 추가

### SDK 초기화 → `mobile/App.tsx`

```typescript
import mobileAds from 'react-native-google-mobile-ads';
mobileAds().initialize();
```

### 배너 컴포넌트 → `mobile/src/components/AdBanner.tsx`

- `__DEV__`에서는 Google 테스트 배너 ID 사용 (정책 위반 방지)
- 프로덕션에서만 실제 Ad Unit ID 사용
- `isPremium` 구독자에게는 광고 미표시

## 배너 배치 위치

| 화면 | 위치 | 이유 |
|------|------|------|
| DiaryListScreenV2 | 날짜 네비게이션 아래, 일기 목록 위 | 브라우징 화면, 자연스러운 시각적 경계 |

### 피한 화면
- 홈 (감정 선택 흐름 방해)
- 일기 작성 (몰입 방해)
- AI 대화 (대화 흐름 방해)
- Paywall (구매 전환 방해)

## 구독자 광고 제거 구조

```typescript
const { isPremium } = useSubscription();
if (isPremium) return null; // 배너 렌더링 안 함
```

- `isPremium`은 RevenueCat entitlement OR 서버 구독 상태 기반
- 프리미엄 구독자는 모든 광고가 자동으로 숨겨짐

## 빌드 & 테스트

### 네이티브 리빌드 필요

AdMob App ID는 네이티브 설정이므로 **반드시 네이티브 리빌드 필요**:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
# 또는 EAS 빌드
eas build --platform android --profile production
```

### 테스트 확인

1. 일기 목록 화면 진입
2. 날짜 네비게이션 아래에 "Test Ad" 워터마크가 있는 배너 표시
3. 프리미엄 구독 상태에서는 배너 미표시

## 흔한 오류

| 증상 | 원인 | 해결 |
|------|------|------|
| `GADApplicationIdentifier missing` | App ID 미설정 | app.config.ts 확인 |
| 배너 안 뜸 (에러 없음) | 네이티브 리빌드 안 함 | `npx expo run:ios/android` |
| 실기기에서 빈 배너 | Ad Unit ID 미활성 | AdMob 콘솔에서 상태 확인 |
| 정책 위반 경고 | 개발 중 실제 ID로 클릭 | `__DEV__`에서 TestIds 사용 |

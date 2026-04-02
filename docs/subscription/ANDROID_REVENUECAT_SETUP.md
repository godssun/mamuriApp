# Android RevenueCat 연동 가이드

> 최종 업데이트: 2026-04-01

## 구조 개요

iOS와 Android는 **같은 RevenueCat 프로젝트** 안에서 별도 앱으로 등록되어 있다.

```
Mamuri Project (RevenueCat)
├── Apps
│   ├── Mamuri (iOS)      → appl_iUll...
│   └── Mamuri (Android)  → goog_XXXX...
├── Entitlements
│   └── premium           → iOS + Android 상품 모두 연결
├── Offerings
│   └── default
│       ├── $rc_monthly   → iOS + Android mamuri_premium_monthly
│       └── $rc_annual    → iOS + Android mamuri_premium_yearly
└── Products
    ├── mamuri_premium_monthly (iOS - App Store)
    ├── mamuri_premium_yearly  (iOS - App Store)
    ├── mamuri_premium_monthly (Android - Google Play)
    └── mamuri_premium_yearly  (Android - Google Play)
```

## 플랫폼별 API Key 분기

### 코드 (`mobile/src/services/iap.ts`)

```typescript
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// 초기화 시 플랫폼별 자동 분기
const apiKey = Platform.OS === 'ios'
  ? REVENUECAT_API_KEY_IOS
  : REVENUECAT_API_KEY_ANDROID;
```

### 환경변수 설정 위치

| 위치 | iOS | Android |
|------|-----|---------|
| `mobile/.env` (로컬 개발) | `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...` | `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...` |
| EAS production 환경 | `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` |

### 중요: `.env`는 `.gitignore`에 포함

`.env` 파일은 git에 커밋되지 않으므로, **EAS production 빌드에서는 EAS 환경변수를 반드시 등록해야 한다.**

```bash
# EAS 환경변수 등록
eas env:create --environment production \
  --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY \
  --value goog_XXXXXXXX \
  --visibility plaintext --type string

# 확인
eas env:list --environment production
```

## 상품 구조

| Platform | Product ID | Period | Price (KRW) |
|----------|-----------|--------|-------------|
| iOS | mamuri_premium_monthly | 월간 | ₩6,600 |
| iOS | mamuri_premium_yearly | 연간 | ₩55,000 |
| Android | mamuri_premium_monthly | 월간 | ₩6,600 |
| Android | mamuri_premium_yearly | 연간 | ₩55,000 |

Google Play 구독은 **구독 > 기본 플랜** 2단계 구조:
- 구독 ID: `mamuri_premium_monthly` / `mamuri_premium_yearly`
- 기본 플랜 ID: `monthly-plan` / `yearly-plan`

## Entitlement / Offering 매핑

- **Entitlement**: `premium` — 양 플랫폼 4개 상품 모두 연결
- **Offering**: `default` — $rc_monthly + $rc_annual 패키지에 양 플랫폼 상품 연결
- RevenueCat SDK가 플랫폼에 맞는 상품을 자동 선택

## 코드 변경 없이 동작하는 이유

앱 코드는 **RevenueCat SDK 추상화**를 통해 플랫폼 무관하게 동작:

1. `iapService.initialize()` → Platform.OS 기반 key 선택 → `Purchases.configure()`
2. `iapService.getProducts()` → `Purchases.getOfferings()` → 플랫폼에 맞는 상품 반환
3. `iapService.purchase()` → `Purchases.purchasePackage()` → 플랫폼 스토어에서 결제
4. `iapService.checkPremium()` → `customerInfo.entitlements.active['premium']` → 플랫폼 무관

## 흔한 오류 포인트

| 증상 | 원인 | 해결 |
|------|------|------|
| `[IAP] RevenueCat API key not configured` | `.env` 또는 EAS에 key 미등록 | key 등록 후 재빌드 |
| `Error fetching offerings` | RevenueCat 대시보드에서 offering/product 미연결 | 대시보드 확인 |
| `Loaded 0 products` | Google Play Console에서 상품 비활성 상태 | 상품 활성화 |
| 구매 후 premium 미반영 | entitlement 미연결 | RevenueCat → Entitlements 확인 |
| 테스트 구매 실패 | 라이선스 테스터 미등록 | Play Console → 설정 → 라이선스 테스트 |

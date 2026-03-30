# 마무리 프리미엄 구독 MVP

## 확정 상품 구조

| Product ID | 기간 | 가격 (KRW) | Apple Tier |
|-----------|------|-----------|-----------|
| `mamuri_premium_monthly` | 월간 | ₩6,600 | Tier 8 |
| `mamuri_premium_yearly` | 연간 | ₩55,000 | Tier 69 |

- Subscription Group: `mamuri_premium`
- 할인율: 31% (연간 vs 월간×12)
- 무료 체험: 7일 (양 상품 모두)

## 각국 가격

| 국가 | 월간 | 연간 |
|------|------|------|
| 🇰🇷 한국 | ₩6,600 | ₩55,000 |
| 🇺🇸 미국 | $4.99 | $39.99 |
| 🇯🇵 일본 | ¥700 | ¥5,800 |
| 🇨🇳 중국 | ¥28 | ¥253 |

## 프리미엄 혜택

| 기능 | 무료 | Premium |
|------|------|---------|
| 일기 작성 | 무제한 | 무제한 |
| 기본 스티커 | 전체 | 전체 |
| AI 댓글 | 1회/일 | 10회/일 |
| AI 대화 | 3회/일 | 30회/일 |
| 커스텀 스티커 | ✗ | ✓ |
| 프리미엄 테마 | 기본 3종 | 전체 |
| 프리미엄 폰트 | 기본 2종 | 전체 |
| 고급 리포트 | ✗ | ✓ |

## 기술 구조

### IAP Provider
- **RevenueCat** (`react-native-purchases`)
- Entitlement ID: `premium`
- Offering ID: `default`
- Packages: `monthly`, `annual`

### RevenueCat 대시보드 설정 (완료)
- Products: `mamuri_premium_monthly`, `mamuri_premium_yearly`
- Entitlement: `premium`
- Offering: `default`
- Packages: monthly → `mamuri_premium_monthly`, annual → `mamuri_premium_yearly`

### 초기화 순서 (중요)
```
1. Purchases.configure(apiKey)     ← SDK 초기화
2. Purchases.getCustomerInfo()     ← premium 상태 확인
3. Purchases.getOfferings()        ← 상품 목록 조회 (configure 이후에만 가능)
4. subscriptionApi.getStatus()     ← 서버 상태 (AI 할당량 등)
```

**configure 전에 offerings/customerInfo를 읽으면 실패**하므로
`iapService.initialize()` 완료 후에만 상품 조회를 실행합니다.

### 데이터 흐름
```
App Store → RevenueCat SDK → iapService.checkPremium()
                                    ↓
                          SubscriptionContext.iapPremium
                                    ↓
                          entitlements (FREE or PREMIUM)
                                    ↓
                          PremiumGate / PaywallScreenV3 / 화면별 분기
```

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `mobile/.env` | `EXPO_PUBLIC_REVENUECAT_IOS_KEY` 설정 |
| `services/iap.ts` | RevenueCat 래퍼 — configure/login/getProducts/purchase/restore |
| `contexts/SubscriptionContext.tsx` | IAP + 서버 통합, 초기화 순서 보장, AppState 복귀 시 갱신 |
| `screens_v2/PaywallScreenV3.tsx` | 구독 Paywall — 실제 상품 데이터 표시, 구매/복원 |
| `screens_v2/components/PremiumGate.tsx` | 프리미엄 기능 잠금 게이트 + PRO 배지 |
| `navigation/index.tsx` | Paywall 라우트 (modal presentation) |
| `types/index.ts` | PremiumEntitlements, IAP_PRODUCTS, Paywall route |

### 환경 변수
```bash
# mobile/.env
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_iUllxbQMhlnvWfQPSdHlNIKTOGj
# EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx  # Android 추가 시
```

## Sandbox 테스트 순서

### 사전 준비
1. App Store Connect → Users and Access → Sandbox → Testers → 테스트 계정 생성
2. **실기기** (시뮬레이터에서는 IAP 불가) iPhone → 설정 → App Store → Sandbox Account 로그인
3. `npx expo prebuild --clean` (native module 포함 빌드)
4. `npx expo run:ios --device` 또는 EAS dev client 빌드

### 테스트 흐름
1. 앱 로그인
2. Settings 또는 Home에서 Paywall 진입
3. 콘솔에서 확인:
   - `[IAP] RevenueCat initialized` — SDK 초기화 성공
   - `[IAP] Loaded 2 products` — 상품 조회 성공
4. Paywall에서 가격 표시 확인 (RevenueCat에서 가져온 실제 가격)
5. 연간 선택 → "구독 시작하기" 탭 → Sandbox 결제 시트
6. 결제 완료 → `isPremium = true` 확인
7. 프리미엄 테마/폰트 PRO 배지 해제 확인
8. "구매 복원" 탭 → 기존 구매 복원 확인

### Sandbox 자동 갱신 주기
| 실제 기간 | Sandbox 기간 |
|----------|-------------|
| 1주 | 3분 |
| 1개월 | 5분 |
| 1년 | 1시간 |

### 디버깅
- RevenueCat 대시보드 → Customers → 테스트 계정 검색 → 구독 상태 확인
- 앱 콘솔 `[IAP]` 태그로 로그 추적
- `__DEV__` 모드에서 RevenueCat LOG_LEVEL.DEBUG 활성

## Premium Gate 연결 현황

| 기능 | gate 방식 | 파일 |
|------|-----------|------|
| 프리미엄 테마 (warm/night) | PRO 배지 표시 | DiaryCanvasEditorV3 |
| 프리미엄 폰트 (round/pen) | PRO 배지 표시 | SettingsScreenV2 |
| 커스텀 스티커 | PremiumGate 컴포넌트 | (진입점 구현 예정) |
| 고급 리포트 | PremiumGate 컴포넌트 | (진입점 구현 예정) |
| AI 확장 | entitlements.aiCommentDailyLimit | Backend 연동 |

## 다음 단계

### 서버 연동 (PHASE 2)
- [ ] RevenueCat Webhook → Backend API (구독 상태 동기화)
- [ ] 서버에서 receipt 검증
- [ ] App Store Server Notifications V2 엔드포인트

### 커스텀 스티커 (PHASE 3)
- [ ] 배경 제거 API 연동
- [ ] 스티커 편집 화면
- [ ] 에디터 StickerPickerSheet에 "내 스티커" 탭 추가

### 고급 리포트 (PHASE 4)
- [ ] 월간 감정 분석 화면
- [ ] AI 기반 회고 요약

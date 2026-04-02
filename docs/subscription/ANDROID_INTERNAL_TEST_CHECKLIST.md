# Android 내부 테스트 체크리스트

> 최종 업데이트: 2026-04-01

## 사전 조건

- [x] RevenueCat에 Google Play 앱 연결
- [x] Android 상품 import (monthly/yearly)
- [x] Entitlement `premium` 연결
- [x] Offering `default` 패키지 연결
- [x] Android SDK key 발급 (`goog_tbkQLfrQJwHjaOCrEyCAXLSfbdE`)
- [x] `.env`에 `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` 추가
- [x] EAS production 환경에 Android key 등록
- [ ] Android AAB 빌드 (key 포함)
- [ ] Play Console 내부 테스트 업로드
- [ ] 라이선스 테스터 등록

## AAB 빌드

```bash
cd mobile
eas build --platform android --profile production --non-interactive
```

빌드 로그에서 확인:
```
Resolved "production" environment for the build.
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_tbkQLfrQJwHjaOCrEyCAXLSfbdE  ← 반드시 포함
```

## Play Console 내부 테스트 업로드

1. https://play.google.com/console → 마무리 앱
2. **테스트** → **내부 테스트** → **새 릴리스 만들기**
3. AAB 파일 업로드
4. 릴리스 노트:
   ```
   v2.1.1
   - 구독 결제 연동 (RevenueCat + Google Play Billing)
   - 키보드 UX 개선
   - 구독 상품 로딩 안정화
   ```
5. **릴리스 검토** → **내부 테스트로 출시**

## 라이선스 테스터 등록

1. Play Console → **설정** → **라이선스 테스트**
2. 본인 Gmail 주소 추가
3. 라이선스 응답: `RESPOND_NORMALLY`

> 라이선스 테스터는 실제 결제 없이 테스트 카드로 구독 가능

## 테스트 앱 설치

1. 내부 테스트 → **테스터** 탭 → **테스트 참여 링크** 복사
2. 테스터 Gmail 계정이 로그인된 Android 기기에서 링크 열기
3. Google Play에서 "테스터로 참여" → 앱 설치

## 실기기 구독 테스트 순서

### 1. RevenueCat 초기화 확인
- 앱 실행
- 로그캣에서 `[IAP] RevenueCat initialized` 확인
- `[RevenueCat] ✅ RevenueCat SDK is configured correctly` 확인

### 2. Paywall 상품 로딩
- 설정 또는 프리미엄 기능 → Paywall 진입
- `[IAP] Loaded 2 products` 로그 확인
- 월간/연간 상품 카드 2개 표시 확인
- 가격 표시 확인 (₩6,600 / ₩55,000)

### 3. 구매 테스트
- 월간 또는 연간 선택
- 구독 버튼 클릭
- Google Play 결제 시트 표시 확인
- **테스트 카드**로 결제 (라이선스 테스터이므로 실제 과금 없음)
- `[RevenueCat] 💰 Purchased product` 로그 확인

### 4. Premium 활성화 확인
- 구매 후 `isPremium: true` 확인
- 프리미엄 기능 접근:
  - 커스텀 스티커 만들기
  - AI 대화 확장 (일일 30회)
  - 프리미엄 텍스처 테마
  - 고급 감정 리포트

### 5. 앱 재시작 후 유지 확인
- 앱 완전 종료 → 재실행
- 자동으로 premium 상태 유지 확인
- RevenueCat가 customerInfo 캐시에서 entitlement 확인

### 6. 구매 복원 테스트
- Paywall → "구매 복원" 버튼
- 이전 구매가 정상 복원되는지 확인

## 테스트 구독 동작 특징

| 항목 | 실제 구독 | 테스트 구독 |
|------|----------|-----------|
| 결제 | 실제 카드 | 테스트 카드 (과금 없음) |
| 갱신 주기 | 1개월/1년 | 5분/30분 |
| 최대 갱신 | 무제한 | 6회 후 자동 취소 |
| 유예 기간 | 있음 | 없음 |

## 흔한 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| "상품 정보를 불러올 수 없습니다" | API key 미포함 빌드 | EAS env 확인 후 재빌드 |
| Google Play 결제 시트 미표시 | 라이선스 테스터 미등록 | Play Console 설정 확인 |
| 구매 후 premium 미반영 | entitlement 미연결 | RevenueCat 대시보드 확인 |
| "이 기기에서 구매할 수 없습니다" | 내부 테스트 미참여 | 테스트 참여 링크로 설치 |

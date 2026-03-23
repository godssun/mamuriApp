# Mamuri 스토어 출시 가이드 v1.0

> 작성일: 2026-03-20
> 대상: Google Play Store + Apple App Store 동시 출시
> 앱 특성: AI 일기 앱, 소셜 로그인, 계정 삭제, 다국어, 외부 LLM 사용

---

## PART 0 — 현재 출시 준비도 요약

### 전체 준비도: ~70%

### 이미 완료된 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| 앱 이름 / slug / version | ✅ | `Mamuri` / `mamuri` / `1.0.0` |
| Bundle ID (iOS) | ✅ | `com.mamuri.app` |
| Package Name (Android) | ✅ | `com.mamuri.app` |
| Apple Team ID | ✅ | `D4X7QXD8Y5` 설정됨 |
| 앱 아이콘 (1024x1024) | ✅ | `icon.png`, `adaptive-icon.png` |
| 스플래시 스크린 | ✅ | `splash-icon.png` |
| EAS Build 설정 | ✅ | `eas.json` production 프로필, autoIncrement |
| 프로덕션 API URL | ✅ | `https://api.mamuri.app/api` |
| HTTPS / SSL | ✅ | certbot + nginx 설정 완료 |
| 소셜 로그인 (Google/Apple) | ✅ | Firebase Auth 통합 |
| 계정 삭제 플로우 | ✅ | 3단계 (경고→사유→확인), 소셜 유저 지원 |
| AI 동의 모달 | ✅ | 명시적 동의, 거부 가능 |
| AI 응답 신고 기능 | ✅ | 4가지 사유 (부적절/부정확/공격적/기타) |
| 위기 감지 플래그 | ✅ | 백엔드 crisisFlag 지원 |
| 다국어 지원 | ✅ | 한/영/일/중 4개 언어 |
| 개인정보처리방침 문서 | ✅ | `docs/legal/privacy-policy.md` + HTML |
| 이용약관 문서 | ✅ | `docs/legal/terms-of-service.md` + HTML |
| 앱 내 정책 링크 | ✅ | 로그인/회원가입/설정/AI동의 모달에 포함 |
| ITSAppUsesNonExemptEncryption | ✅ | `false` 설정 (수출 규정 면제) |
| 세로 모드 고정 | ✅ | `orientation: 'portrait'` |
| 백엔드 프로덕션 배포 | ✅ | Docker + nginx + PostgreSQL |

### 제출 전 반드시 해야 할 항목 (Blockers)

| # | 항목 | 심각도 | 예상 소요 |
|---|------|--------|----------|
| B1 | 개발자 계정 등록 (Apple $99/년 + Google $25 일회) | 🔴 필수 | 1~3일 (승인 대기) |
| B2 | 개인정보처리방침/이용약관 웹 호스팅 | 🔴 필수 | 1시간 |
| B3 | 스토어 스크린샷 제작 (규격 맞춤) | 🔴 필수 | 2~3시간 |
| B4 | 구독 결제 비활성화 확인 (Stripe 웹 결제 → 리젝 사유) | 🔴 필수 | 1시간 |
| B5 | 심사용 데모 계정 준비 | 🔴 필수 | 1시간 |
| B6 | 스토어 메타데이터 작성 (제목, 설명, 키워드) | 🔴 필수 | 2시간 |
| B7 | 데이터 안전 / 개인정보 레이블 작성 | 🔴 필수 | 2시간 |
| B8 | 콘텐츠 등급 설문 (IARC) | 🔴 필수 | 30분 |

### 권장하지만 선택적인 항목

| 항목 | 이유 | 예상 소요 |
|------|------|----------|
| expo-updates 설치 | 핫픽스 OTA 배포 가능 | 2시간 |
| 앱 미리보기 동영상 | 전환율 향상 | 3시간 |
| Firebase Crashlytics | 프로덕션 크래시 추적 | 2시간 |
| Feature Graphic (Google Play) | 선택이지만 추천 | 1시간 |

---

### 출시 차단 요인 TOP 3

1. **Apple/Google 개발자 계정 미등록** — 계정 없으면 빌드도 업로드 불가
2. **개인정보처리방침 미호스팅** — 두 스토어 모두 공개 URL 필수
3. **Stripe 웹 결제 활성 시 iOS 리젝** — 디지털 콘텐츠는 IAP 필수 (현재 `@ts-nocheck`로 비활성 상태이므로 v1.0에서 구독 UI 진입점만 숨기면 OK)

### 스토어 리젝 위험 TOP 5

1. **AI 앱 투명성 부족** (Apple Guideline 5.6.5) — AI가 생성한 콘텐츠임을 명확히 고지 필요
2. **계정 삭제 미흡** (Apple Guideline 5.1.1(v)) — ✅ 이미 구현됨
3. **IAP 우회** (Apple Guideline 3.1.1) — 구독 화면이 Stripe 웹으로 연결되면 즉시 리젝
4. **개인정보 레이블 불일치** (양 스토어) — 실제 수집 데이터와 선언 불일치 시 리젝
5. **심사용 로그인 정보 미제공** (Apple) — 소셜 로그인만 있으면 심사 불가

### v1.0 가장 안전한 출시 경로

```
1. 구독/결제 UI 진입점 완전히 숨기기 (FREE 티어만 운영)
2. 개인정보처리방침/이용약관 mamuri.app에 호스팅
3. 심사용 이메일 계정 + 미리 채워진 일기 데이터 준비
4. 스크린샷 규격 맞춰 제작 (실기기 캡처)
5. AI 콘텐츠 생성 고지 문구 스토어 설명에 포함
6. Google Play 먼저 제출 → 피드백 반영 → Apple 제출
```

---

## PART 1 — Google Play Store 출시 가이드

### 1.1 사전 준비

#### 개발자 계정 등록
1. [Google Play Console](https://play.google.com/console) 접속
2. **등록비**: $25 (일회성)
3. 본인 확인 (개인 개발자): 신분증 + 주소 확인
4. 승인까지 **2~7일** 소요 (자동 심사 후 수동 확인 가능)
5. 개발자 프로필 작성: 이름, 이메일, 웹사이트, 전화번호

#### EAS 로그인 및 프로젝트 연결
```bash
# EAS CLI 로그인
cd mobile
npx eas login

# 프로젝트가 EAS에 연결되어 있는지 확인
npx eas project:info

# 연결 안 되어 있으면
npx eas init
```

### 1.2 릴리스 빌드 생성

#### Android AAB 빌드 (EAS Build)
```bash
cd mobile

# 프로덕션 빌드 (AAB 포맷, Google Play 제출용)
npx eas build --platform android --profile production

# 빌드 상태 확인
npx eas build:list --platform android
```

- EAS가 자동으로 **키스토어** 생성 및 관리 (첫 빌드 시)
- `versionCode` 자동 증가 (`autoIncrement: true`)
- 빌드 완료 시 AAB 파일 다운로드 링크 제공

#### 빌드 전 체크리스트
- [ ] `app.config.ts`의 `version`이 `1.0.0`인지 확인
- [ ] `__DEV__`가 false일 때 API URL이 `https://api.mamuri.app/api`인지 확인
- [ ] `google-services.json`이 프로덕션 Firebase 프로젝트 설정인지 확인
- [ ] 구독 화면 진입점이 숨겨져 있는지 확인

### 1.3 Google Play Console 업로드

#### 앱 등록
1. Play Console → **앱 만들기**
2. 앱 정보 입력:
   - 앱 이름: `마무리 - AI 일기`
   - 기본 언어: 한국어
   - 앱 유형: 앱 (게임 아님)
   - 무료/유료: 무료
   - 선언: 개발자 프로그램 정책 동의

#### 내부 테스트 트랙 (먼저 권장)
1. **테스트** → **내부 테스트** → **새 릴리스 만들기**
2. AAB 파일 업로드
3. 릴리스 이름: `1.0.0 (1)`
4. 릴리스 노트 입력 (한국어)
5. 테스터 이메일 추가 → 테스트 진행
6. 문제 없으면 **프로덕션**으로 승격

#### 프로덕션 릴리스
1. **프로덕션** → **새 릴리스 만들기**
2. 내부 테스트에서 사용한 AAB 선택 또는 새로 업로드
3. 릴리스 노트 작성
4. **검토를 위해 제출**

#### EAS Submit 자동화 (선택)
```bash
# eas.json에 submit 설정 추가 후
npx eas submit --platform android --latest
```

### 1.4 스토어 등록 정보 (Store Listing)

#### 필수 에셋

| 에셋 | 사양 | 수량 |
|------|------|------|
| 앱 아이콘 | 512 x 512 PNG (32비트, 투명 불가) | 1 |
| 스크린샷 | 최소 1080 x 1920 (16:9 또는 9:16) | 최소 2장, 권장 6장 |
| Feature Graphic | 1024 x 500 PNG/JPEG | 1 (권장) |
| 짧은 설명 | 최대 80자 | 1 |
| 상세 설명 | 최대 4000자 | 1 |

#### 스크린샷 촬영 가이드
```
권장 해상도: 1080 x 1920 (Pixel 6 기준)
촬영 방법:
1. Android 에뮬레이터에서 Pixel 6 Pro 선택
2. 프로덕션 빌드 설치 또는 preview 빌드로 캡처
3. 더미 데이터로 채워진 화면 캡처
4. 6장 권장: 일기 목록, 일기 작성, AI 코멘트, AI 채팅, 설정, 로그인
```

#### 스토어 설명 (한국어)

**짧은 설명** (80자):
```
매일 쓰는 일기에 AI 친구가 따뜻한 답장을 보내줘요. 마무리와 하루를 마무리하세요.
```

**상세 설명** (초안):
```
마무리는 매일의 감정을 기록하고, AI 친구의 따뜻한 응답을 받을 수 있는 일기 앱이에요.

주요 기능:
- 매일 일기를 쓰면 AI 친구가 공감과 격려의 답장을 보내줘요
- AI 친구와 자연스러운 대화를 나눌 수 있어요
- AI 친구의 이름, 프로필 사진, 말투를 원하는 대로 바꿀 수 있어요
- 다크 모드, 글꼴 변경, 글자 크기 조절 등 나만의 환경을 만들 수 있어요
- 한국어, English, 日本語, 中文 지원

AI 투명성 안내:
- 이 앱은 외부 AI 서비스(LLM)를 활용하여 응답을 생성합니다
- AI 응답은 참고용이며, 전문적인 상담이나 의료 조언을 대체하지 않습니다
- 사용자의 일기 내용은 AI 응답 생성을 위해서만 사용됩니다
- 상세 내용은 개인정보처리방침을 참고해 주세요

안전 안내:
- 위기 상황 감지 시 전문 도움 안내를 제공합니다
- AI 응답이 부적절한 경우 신고할 수 있습니다

문의: support@mamuri.app
```

### 1.5 정책 양식 작성

#### 콘텐츠 등급 (IARC)
1. Play Console → **정책** → **앱 콘텐츠** → **콘텐츠 등급**
2. 설문 응답:
   - 폭력: 없음
   - 성적 콘텐츠: 없음
   - 약물: 없음
   - 사용자 생성 콘텐츠: **예** (일기 작성)
   - AI 생성 콘텐츠: **예** (AI 응답)
3. 예상 등급: **전체이용가** 또는 **12세 이상**

#### 데이터 안전 (Data Safety)

| 데이터 유형 | 수집 | 공유 | 용도 |
|------------|------|------|------|
| 이메일 주소 | 예 | 아니오 | 계정 관리, 인증 |
| 비밀번호 | 예 | 아니오 | 인증 |
| 사용자 콘텐츠 (일기) | 예 | 아니오 | 앱 기능, AI 응답 생성 |
| AI 응답 데이터 | 예 | 아니오 | 앱 기능 |
| 기기 식별자 | 아니오 | 아니오 | — |
| 위치 | 아니오 | 아니오 | — |
| 충돌 로그 | 선택적 | 아니오 | 앱 안정성 |

- **데이터 암호화**: 예 (HTTPS/TLS)
- **데이터 삭제 요청**: 예 (계정 삭제 기능)
- **독립적 보안 검토**: 아니오

#### AI 생성 콘텐츠 선언 (2024년 신규)
Google Play는 **AI 생성 콘텐츠**를 사용하는 앱에 대해 추가 선언을 요구할 수 있음:
- AI가 생성한 콘텐츠임을 사용자에게 알리는지: **예** (AI 동의 모달)
- 사용자가 AI 콘텐츠를 신고할 수 있는지: **예** (신고 기능)
- 부적절한 AI 콘텐츠 모니터링 방법: 사용자 신고 + 백엔드 로깅

#### 광고 ID
- **광고 ID 사용**: 아니오
- **아동 대상**: 아니오

### 1.6 흔한 리젝 사유 및 대응

| 리젝 사유 | Mamuri 관련도 | 대응 |
|-----------|-------------|------|
| 메타데이터 정책 위반 | 중간 | 과장 표현 금지, "최고의" 등 사용 자제 |
| 사용자 데이터 정책 | 높음 | Data Safety 정확히 작성 |
| AI 콘텐츠 투명성 | 높음 | 스토어 설명에 AI 사용 명시 |
| 기능 미작동 | 낮음 | 프로덕션 서버 정상 확인 |
| 결제 정책 | 높음 | 구독 UI 숨기거나 IAP로 교체 |

### 1.7 제출 전 테스트 체크리스트

- [ ] 프로덕션 빌드를 실기기에 설치하여 전체 플로우 테스트
- [ ] 이메일 회원가입 → 일기 작성 → AI 코멘트 수신 → AI 채팅
- [ ] Google 소셜 로그인 (Android 실기기)
- [ ] 계정 삭제 플로우 (이메일 유저 + 소셜 유저)
- [ ] 네트워크 끊김 시 앱 크래시 없음 확인
- [ ] 4개 언어 전환 테스트
- [ ] 다크 모드 / 라이트 모드 전환
- [ ] 백그라운드 → 포그라운드 전환 시 정상 동작

---

## PART 2 — Apple App Store 출시 가이드

### 2.1 사전 준비

#### Apple Developer Program 등록
1. [Apple Developer](https://developer.apple.com/programs/) 접속
2. **등록비**: $99/년 (개인)
3. Apple ID 필요 (이미 있다면 바로 등록 가능)
4. 본인 확인 후 승인까지 **24~48시간** (개인 기준)
5. 등록 완료 후 **App Store Connect** 접근 가능

#### Apple Developer 설정
```bash
# EAS에서 Apple 자격 증명 설정
# 빌드 시 자동으로 프로비저닝 프로필 생성
npx eas credentials --platform ios
```

- EAS가 **Distribution Certificate**, **Provisioning Profile** 자동 관리
- 수동 관리도 가능하지만 EAS 자동 관리 권장

### 2.2 릴리스 빌드 생성

#### iOS IPA 빌드 (EAS Build)
```bash
cd mobile

# 프로덕션 빌드 (IPA 포맷, App Store 제출용)
npx eas build --platform ios --profile production

# 빌드 상태 확인
npx eas build:list --platform ios
```

- 첫 빌드 시 Apple Developer 계정 로그인 필요
- 자동으로 Provisioning Profile 생성
- `buildNumber` 자동 증가
- 빌드 완료까지 **15~30분** (EAS 서버)

#### 빌드 전 체크리스트
- [ ] Apple Team ID (`D4X7QXD8Y5`)가 정확한지 확인
- [ ] `GoogleService-Info.plist`가 프로덕션 Firebase 프로젝트인지 확인
- [ ] `ITSAppUsesNonExemptEncryption: false` 설정 확인
- [ ] `bundleIdentifier: 'com.mamuri.app'` 확인
- [ ] 구독 화면 진입점이 숨겨져 있는지 확인

### 2.3 App Store Connect 설정

#### 앱 등록
1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. **나의 앱** → **새로운 앱**
3. 입력 정보:
   - 플랫폼: iOS
   - 이름: `마무리 - AI 일기` (30자 이내)
   - 기본 언어: 한국어
   - 번들 ID: `com.mamuri.app`
   - SKU: `mamuri-app-ios`
4. **만들기** 클릭

#### 빌드 업로드

**방법 1: EAS Submit (권장)**
```bash
# 가장 최근 빌드를 App Store Connect에 업로드
npx eas submit --platform ios --latest
```

**방법 2: Transporter 앱**
1. Mac App Store에서 **Transporter** 다운로드
2. EAS에서 IPA 다운로드
3. Transporter에 IPA 드래그 앤 드롭
4. 업로드 완료 후 App Store Connect에서 확인

### 2.4 메타데이터 및 에셋

#### 필수 스크린샷

| 기기 | 해상도 | 최소 수량 |
|------|--------|----------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | 최소 3장, 권장 6장 |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | (선택, 6.7"로 대체 가능) |
| iPad 12.9" (선택) | 2048 x 2732 | 0 (iPad 미지원 시 생략 가능) |

#### 스크린샷 촬영 가이드
```
방법 1: iOS 시뮬레이터 (Xcode)
1. Xcode → Window → Devices and Simulators
2. iPhone 15 Pro Max 시뮬레이터 선택
3. 빌드 설치: npx eas build --platform ios --profile preview
4. Cmd+S로 스크린샷 캡처

방법 2: 실기기
1. 프로덕션 빌드를 TestFlight으로 배포
2. 실기기에서 캡처
3. 해상도 확인 (1290 x 2796 이상)

권장 스크린샷 6장:
1. 일기 목록 (캘린더 뷰)
2. 일기 작성 화면
3. AI 코멘트 수신
4. AI 대화 화면
5. 컴패니언 프로필 / 설정
6. 로그인 화면 (소셜 로그인 버튼 포함)
```

#### 앱 정보

| 필드 | 내용 |
|------|------|
| 앱 이름 | 마무리 - AI 일기 |
| 부제 | AI 친구와 함께 하루를 마무리하세요 |
| 카테고리 | 라이프스타일 (기본) / 건강 및 피트니스 (보조) |
| 설명 | (Google Play와 동일 내용, Apple 톤에 맞게 수정) |
| 키워드 | 일기,다이어리,AI,감정,기록,친구,공감,마음,심리,저널 (100자 이내) |
| 지원 URL | https://mamuri.app |
| 마케팅 URL | https://mamuri.app (선택) |
| 개인정보 처리방침 URL | https://mamuri.app/privacy |

#### 심사 정보 (중요!)

```
심사 참고 사항에 반드시 포함할 내용:

"이 앱은 외부 AI 서비스(LLM API)를 활용하여 사용자의 일기에
공감적인 응답을 생성합니다. AI가 생성한 콘텐츠임을 사용자에게
명확히 고지하며, 부적절한 응답은 신고할 수 있습니다.

테스트 계정:
- 이메일: reviewer@mamuri.app
- 비밀번호: [비밀번호]

테스트 방법:
1. 위 계정으로 로그인
2. 일기 작성 버튼 터치
3. 아무 일기 내용 작성 후 저장
4. AI 코멘트가 자동으로 표시됩니다
5. AI 코멘트를 터치하면 대화를 이어갈 수 있습니다

소셜 로그인은 Google과 Apple을 지원하며,
Apple 로그인은 실기기에서만 테스트 가능합니다."
```

### 2.5 Apple 개인정보 레이블 (App Privacy)

App Store Connect → **앱 프라이버시** 에서 설정:

| 데이터 유형 | 수집 여부 | 사용자 연결 | 추적 | 용도 |
|------------|----------|-----------|------|------|
| 이메일 주소 | 예 | 예 | 아니오 | 앱 기능 |
| 이름 (닉네임) | 예 | 예 | 아니오 | 앱 기능 |
| 사용자 콘텐츠 | 예 | 예 | 아니오 | 앱 기능 |
| 식별자 (User ID) | 예 | 예 | 아니오 | 앱 기능 |
| 진단 데이터 | 선택적 | 아니오 | 아니오 | 앱 성능 분석 |

- **데이터 추적**: 아니오 (ATT 프레임워크 불필요)
- **제3자 공유**: 아니오 (AI API는 데이터 처리 목적으로만 사용)

### 2.6 Apple 심사 리젝 위험 및 대응

#### AI 앱 특화 리젝 위험

| 가이드라인 | 위험도 | 설명 | Mamuri 대응 |
|-----------|--------|------|------------|
| **5.6.5 AI/ML** | 🔴 높음 | AI 생성 콘텐츠 앱은 투명성/신고/모더레이션 필요 | ✅ 동의 모달 + 신고 기능 구현됨 |
| **5.1.1(v) 계정 삭제** | 🟢 낮음 | 계정 생성 가능한 앱은 삭제도 가능해야 함 | ✅ 3단계 삭제 플로우 구현됨 |
| **3.1.1 IAP** | 🔴 높음 | 디지털 콘텐츠 결제는 IAP만 허용 | ⚠️ 구독 UI 숨겨야 함 |
| **2.1 앱 완성도** | 중간 | 크래시, 미완성 기능 | 충분한 테스트 필요 |
| **4.0 디자인** | 낮음 | 기본적인 UX 품질 | ✅ Design System v2 적용 |
| **5.1.2 데이터 사용** | 중간 | 수집 데이터와 개인정보 레이블 일치 | 정확히 작성 필요 |

#### 일반적인 리젝 사유

| 사유 | 확률 | 대응 |
|------|------|------|
| 로그인 불가 (심사관) | 높음 | 데모 계정 + 상세 테스트 가이드 제공 |
| 기능 미작동 | 중간 | 프로덕션 서버 안정성 확인 |
| 메타데이터 불일치 | 중간 | 스크린샷과 실제 앱 일치 확인 |
| Sign in with Apple 누락 | 낮음 | ✅ 이미 구현됨 |
| HTTPS 미사용 | 낮음 | ✅ 이미 구현됨 |

### 2.7 제출 전 테스트 체크리스트

- [ ] TestFlight으로 프로덕션 빌드 배포 및 실기기 테스트
- [ ] Apple 로그인 실기기 테스트 (시뮬레이터에서는 작동 안 함)
- [ ] Google 로그인 iOS 테스트
- [ ] 이메일 회원가입 → 일기 → AI 코멘트 → AI 채팅 전체 플로우
- [ ] 계정 삭제 테스트 (이메일 + 소셜)
- [ ] 다크 모드 전환
- [ ] 4개 언어 전환
- [ ] 노치/다이나믹 아일랜드 레이아웃 확인
- [ ] iPad에서 동작 확인 (supportsTablet: true이므로)
- [ ] 백그라운드/포그라운드 전환
- [ ] 네트워크 끊김 시 앱 안정성

---

## PART 3 — 스토어별 제출 프로세스 비교

| 항목 | Google Play | Apple App Store |
|------|-------------|----------------|
| 개발자 등록비 | $25 (일회) | $99/년 |
| 첫 심사 기간 | 3~7일 | 1~3일 (보통 24시간) |
| 업데이트 심사 | 수시간~1일 | 수시간~1일 |
| 빌드 형식 | AAB | IPA |
| 빌드 명령어 | `eas build --platform android` | `eas build --platform ios` |
| 업로드 명령어 | `eas submit --platform android` | `eas submit --platform ios` |
| 테스트 배포 | 내부 테스트 트랙 | TestFlight |
| 스크린샷 해상도 | 1080 x 1920+ | 1290 x 2796 (6.7") |
| AI 정책 | 데이터 안전 선언 | Guideline 5.6.5 |
| 계정 삭제 | 필수 (2024~) | 필수 (Guideline 5.1.1(v)) |
| 소셜 로그인 | Google 필수가 아님 | Sign in with Apple 필수 (타 소셜 있을 시) |
| 결제 | Google Play Billing 또는 외부 가능 | IAP만 허용 (디지털 콘텐츠) |

---

## PART 4 — 빌드부터 출시까지 실행 순서

### Phase 1: 기반 준비 (Day 1~2)

```
□ Apple Developer Program 등록 ($99)
□ Google Play Console 개발자 등록 ($25)
□ 개인정보처리방침 + 이용약관을 mamuri.app에 호스팅
  - docs/legal/privacy-policy-web.html → mamuri.app/privacy
  - docs/legal/terms-of-service-web.html → mamuri.app/terms
□ 심사용 데모 계정 생성 (reviewer@mamuri.app)
  - 미리 일기 3~5개 작성
  - AI 코멘트가 생성된 상태로 준비
□ 구독/결제 UI 진입점 숨기기 확인
```

### Phase 2: 에셋 준비 (Day 2~3)

```
□ 스크린샷 촬영 (Android 1080x1920, iOS 1290x2796)
  - 일기 목록, 일기 작성, AI 코멘트, AI 채팅, 설정, 로그인
  - 한국어 기본, 영어 추가 권장
□ Feature Graphic 제작 (Google Play, 1024x500)
□ 스토어 설명 작성 (한국어 + 영어)
□ 스크린샷에 텍스트 오버레이 추가 (선택, Figma/Canva 활용)
```

### Phase 3: 빌드 및 테스트 (Day 3~4)

```
□ Android 프로덕션 빌드: eas build --platform android --profile production
□ iOS 프로덕션 빌드: eas build --platform ios --profile production
□ Android: 내부 테스트 트랙에 업로드 → 실기기 테스트
□ iOS: TestFlight 배포 → 실기기 테스트
□ 전체 플로우 QA (아래 체크리스트 참조)
```

### Phase 4: 스토어 제출 (Day 4~5)

```
□ Google Play Console:
  - 스토어 등록정보 작성
  - 데이터 안전 작성
  - 콘텐츠 등급 설문
  - 프로덕션 릴리스 제출

□ App Store Connect:
  - 앱 정보 + 메타데이터 입력
  - 개인정보 레이블 설정
  - 심사 정보 + 데모 계정 입력
  - 심사 제출
```

### Phase 5: 심사 및 출시 (Day 5~10)

```
□ Apple 심사 결과 대기 (24~48시간)
  - 리젝 시 사유 확인 → 수정 → 재제출
□ Google Play 심사 결과 대기 (3~7일)
  - 리젝 시 사유 확인 → 수정 → 재제출
□ 승인 후 출시일 설정 (즉시 또는 예약)
□ 출시 후 첫 24시간 모니터링
```

---

## 부록 A — EAS Submit 설정

`eas.json`에 submit 설정 추가:

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "production": { "autoIncrement": true }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "앱스토어커넥트에서-확인",
        "appleTeamId": "D4X7QXD8Y5"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## 부록 B — 다국어 스토어 설명

### English (en)

**Short description:**
```
Write daily journals and receive warm AI responses. End your day with Mamuri.
```

**Full description:**
```
Mamuri is a diary app where you can record your daily emotions
and receive warm, empathetic responses from an AI companion.

Key Features:
- Write daily journals and get caring AI responses
- Have natural conversations with your AI companion
- Customize your companion's name, avatar, and speaking style
- Dark mode, font changes, and text size adjustments
- Supports Korean, English, Japanese, and Chinese

AI Transparency:
- This app uses external AI services (LLM) to generate responses
- AI responses are for reference only and do not replace professional counseling
- Your diary content is used only for generating AI responses
- See our Privacy Policy for details

Contact: support@mamuri.app
```

### 日本語 (ja)

**短い説明:**
```
毎日の日記にAIの友達が温かい返事を送ります。マムリと一日を締めくくりましょう。
```

### 中文 (zh)

**简短描述:**
```
每天写日记，AI朋友会送上温暖的回复。用Mamuri结束美好的一天。
```

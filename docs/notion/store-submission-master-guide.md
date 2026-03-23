# 마무리(Mamuri) 스토어 제출 마스터 가이드

> 최종 업데이트: 2026-03-23
> 문서 목적: Apple App Store + Google Play Store 실제 심사 제출을 위한 완전 가이드

---

## 현재 제출 준비 상태 요약

### 전체 준비도: ~85%

| 영역 | 준비도 | 상태 |
|------|--------|------|
| 앱 설정 (Bundle ID, 버전, 아이콘) | 100% | ✅ 완료 |
| 인증 (이메일 + Google + Apple) | 100% | ✅ 완료 |
| 계정 삭제 기능 | 100% | ✅ 완료 |
| AI 동의 모달 | 100% | ✅ 완료 |
| AI 응답 신고 기능 | 100% | ✅ 완료 |
| 개인정보처리방침 / 이용약관 | 100% | ✅ 웹 호스팅 완료 |
| 다국어 (ko/en/ja/zh) | 100% | ✅ 완료 |
| 스토어 메타데이터 (텍스트) | 95% | ✅ 복사-붙여넣기 준비 |
| 스크린샷 (iPhone + iPad) | 90% | ⚠️ 내용 품질 점검 필요 |
| EAS 빌드 시스템 | 100% | ✅ 완료 |
| 프로덕션 백엔드 | 100% | ✅ 라이브 (api.mamuri.app) |
| Feature Graphic (Google) | 0% | 🔴 미제작 |
| 콘솔 설정 (수동 작업) | 0% | 🔴 App Store Connect / Play Console에서 직접 입력 필요 |

---

## PART 1 — 현재 준비 상태 상세 감사

### ✅ 이미 완료된 항목 (레포 확인 완료)

#### 앱 설정
- `app.config.ts`: name="Mamuri", bundleIdentifier/package="com.mamuri.app", version="1.0.0"
- iOS: appleTeamId="D4X7QXD8Y5", ITSAppUsesNonExemptEncryption=false
- Android: adaptiveIcon 설정, edgeToEdgeEnabled=true
- EAS: production 프로필 autoIncrement, ascAppId="6760908812"

#### 인증 시스템
- 이메일/비밀번호 (JWT access + refresh 토큰)
- Google Sign-In (Firebase Auth 경유)
- Apple Sign-In (Firebase Auth 경유, nonce 기반 보안)
- 토큰 자동 갱신, 토큰 재사용 감지, 강제 로그아웃

#### 계정 삭제
- `DeleteAccountModalV2.tsx`: 3단계 (경고 → 이유 선택 → 비밀번호/확인)
- `AccountController.java`: POST /api/user/delete-account
- DB: cascade 삭제 + 감사 로그 (anonymized)
- 이메일 사용자: 비밀번호 확인 / 소셜 사용자: 텍스트 확인

#### AI 규정 준수
- `AiConsentModal.tsx`: 첫 사용 시 AI 데이터 처리 동의 모달
- `ReportModal.tsx`: AI 응답 신고 (부적절/부정확/공격적/기타)
- `SafetyCheckService.java`: 위기 키워드 12개 감지 → 안전 메시지 + 핫라인
- 프롬프트에 AI 면책 조항 포함

#### 법적 문서
- 개인정보처리방침: `docs/legal/privacy-policy.md` + `web/privacy.html`
- 이용약관: `docs/legal/terms-of-service.md` + `web/terms.html`
- 웹 호스팅: `https://mamuri.app/privacy` (200 OK), `https://mamuri.app/terms` (200 OK)
- 설정 화면에서 링크 연결 완료

#### 스크린샷
- iPhone: 11장, 1284×2778px (6.5" 표준)
- iPad: 9장, 2048×2732px (12.9" 표준)
- 라이트 모드 + 다크 모드 모두 포함

#### 스토어 메타데이터
- `docs/store-metadata.md`: 앱 이름, 설명, 키워드, 카테고리 등 4개 언어 준비

#### 백엔드
- `https://api.mamuri.app/actuator/health` → 200 OK
- Blue-Green 배포 (nginx + Docker)
- Flyway 마이그레이션 V1-V19
- Rate limiting, 보안 헤더, CORS 설정 완료

### 🔴 제출 전 반드시 해결해야 할 항목

| # | 항목 | 이유 | 예상 소요 |
|---|------|------|-----------|
| 1 | Google Play Feature Graphic | 1024×500px 필수 에셋 | 1시간 |
| 2 | App Store Connect 메타데이터 입력 | 콘솔에서 직접 입력 필요 | 1-2시간 |
| 3 | Play Console 메타데이터 입력 | 콘솔에서 직접 입력 필요 | 1-2시간 |
| 4 | 콘텐츠 등급 설문 (IARC) | 양쪽 스토어 필수 | 30분 |
| 5 | Apple 앱 개인정보 레이블 | App Store Connect 필수 입력 | 30분 |
| 6 | Google 데이터 안전 섹션 | Play Console 필수 입력 | 30분 |
| 7 | 심사용 데모 계정 준비 | Apple 심사관이 로그인 테스트 | 15분 |
| 8 | 프로덕션 빌드 테스트 | EAS production 빌드 실기기 확인 | 1-2시간 |
| 9 | AI Provider 프로덕션 전환 확인 | stub → openai 확인 | 15분 |

### ⚠️ 거절 위험 항목

| 위험 | 설명 | 대응 |
|------|------|------|
| AI 콘텐츠 정책 (Apple 4.7) | AI 앱에 대한 Apple의 강화된 심사 | AI 동의 모달 + 신고 기능 이미 구현 ✅ |
| 구독/결제 (Apple) | Stripe 코드 존재하나 v1.0은 전기능 무료 | 구독 UI 제거/비활성화 확인 필요 |
| 소셜 로그인 (Apple) | Google 로그인 제공 시 Apple 로그인 필수 | 이미 구현 ✅ |
| 계정 삭제 | iOS 1.5.1, Android 정책 필수 | 이미 구현 ✅ |
| 개인정보처리방침 접근성 | 앱 내 + 스토어 URL 모두 필요 | 설정 화면 링크 + 웹 호스팅 ✅ |
| 스크린샷 해상도 | Apple 6.7" (1290×2796) 선호 | 6.5" (1284×2778) 수락됨, 가능하면 6.7"도 추가 |
| 멘탈헬스 관련 콘텐츠 | Apple 심사에서 민감하게 볼 수 있음 | 위기 감지 + 안전 메시지 + 면책 조항 ✅ |

### 📋 콘솔에서 직접 확인해야 할 항목

아래 항목은 레포에서 확인할 수 없으므로, 직접 콘솔에서 확인 필요:

1. **Apple Developer 계정**: $99/년 결제 및 신원 확인 완료 여부
2. **Google Play Developer 계정**: $25 일회 결제 완료 여부
3. **App Store Connect**: 앱 레코드 생성 여부 (App ID 6760908812 확인)
4. **Firebase Console**: 프로덕션 환경 OAuth 설정 (redirect URI 등)
5. **도메인**: `mamuri.app` SSL 인증서 유효 기간
6. **이메일**: `support@mamuri.app` 수신 가능 여부 (Apple이 연락 가능해야 함)
7. **OpenAI API**: 프로덕션 API 키 유효 + 크레딧 잔여량

---

## PART 2 — Apple App Store 제출 가이드

### 2.1 사전 준비

#### 필수 계정
- Apple Developer Program ($99/년) — 이미 가입 여부 확인
- App Store Connect 접속: https://appstoreconnect.apple.com

#### EAS 제출 설정 (이미 구성됨)
```json
// eas.json의 submit 섹션
"submit": {
  "production": {
    "ios": {
      "ascAppId": "6760908812",
      "appleTeamId": "D4X7QXD8Y5"
    }
  }
}
```

### 2.2 App Store Connect — 앱 정보 (App Information)

이 페이지에서 입력할 항목:

| 필드 | 입력값 | 비고 |
|------|--------|------|
| 앱 이름 | 마무리 - AI 일기 | 30자 이내, 변경 시 심사 필요 |
| 부제 | AI 친구와 함께 하루를 마무리하세요 | 30자 이내 |
| 기본 언어 | Korean | |
| 번들 ID | com.mamuri.app | 변경 불가 |
| SKU | mamuri-app-ios | 내부 식별용 |
| 기본 카테고리 | 라이프스타일 | |
| 보조 카테고리 | 건강 및 피트니스 | 선택사항 |
| 콘텐츠 권한 | 타사 콘텐츠 없음 | AI 생성은 자사 서비스 |
| 연령 등급 | 12+ 또는 17+ | 아래 설문 참고 |

### 2.3 App Store Connect — 가격 및 구매 가능 여부

| 필드 | 입력값 |
|------|--------|
| 가격 | 무료 |
| 지역 | 전 세계 (모든 국가/지역) |
| 인앱 구매 | 없음 (v1.0) |

> ⚠️ **중요**: v1.0은 전기능 무료입니다. 만약 앱 내에 구독 화면이 보이면 Apple이 거절할 수 있습니다. `FEATURE_PREMIUM_ENABLED=false`로 설정되어 있는지, 구독 관련 UI가 완전히 숨겨져 있는지 확인하세요.

### 2.4 App Store Connect — 앱 개인정보 (App Privacy)

Apple은 앱이 수집하는 데이터를 카테고리별로 선언해야 합니다.

#### 데이터 수집 여부
→ **예, 데이터를 수집합니다**

#### 수집 데이터 유형별 선언

| 데이터 유형 | 수집 여부 | 사용 목적 | 사용자 연결 | 추적 |
|------------|-----------|-----------|------------|------|
| 이메일 주소 | ✅ | 앱 기능, 계정 식별 | 예 | 아니오 |
| 이름 (닉네임) | ✅ | 앱 기능, 개인화 | 예 | 아니오 |
| 사용자 ID | ✅ | 앱 기능 | 예 | 아니오 |
| 사용자 콘텐츠 (일기) | ✅ | 앱 기능 | 예 | 아니오 |
| 검색 기록 | ❌ | - | - | - |
| 위치 | ❌ | - | - | - |
| 사진 | ✅ | 앱 기능 (아바타) | 예 | 아니오 |
| 건강 및 피트니스 | ❌ | - | - | - |
| 진단 데이터 | ❌ | - | - | - |
| 광고 데이터 | ❌ | - | - | - |
| 구매 기록 | ❌ | - | - | - |

#### 추적 여부
→ **아니오** (IDFA 미사용, 제3자 광고/분석 SDK 없음)

### 2.5 App Store Connect — 연령 등급 설문

| 질문 | 답변 | 이유 |
|------|------|------|
| 만화 또는 판타지 폭력 | 없음 | |
| 현실적 폭력 | 없음 | |
| 성적 콘텐츠 및 노출 | 없음 | |
| 의료/의학 정보 | 없음 | AI는 의료 조언을 하지 않음 |
| 공포/호러 테마 | 없음 | |
| 노골적인 언어 | 빈도 낮음/없음 | 사용자 일기 내용에 따라 |
| 도박 | 없음 | |
| 알코올, 약물, 담배 참조 | 없음 | |
| 무제한 웹 접근 | 아니오 | |
| 경쟁, 대회 | 아니오 | |
| 사용자 간 소통 | 아니오 | AI와 대화만 |

**예상 등급**: 12+ (감정 일기 + AI 콘텐츠) 또는 17+ (위기 감지 기능 포함 시)

> 💡 **팁**: Apple은 AI가 멘탈헬스 관련 응답을 하는 경우 17+로 분류할 수 있습니다. 설문 작성 시 "의료/의학 정보" 항목에 대해 솔직하게 답변하되, AI가 전문 상담을 대체하지 않는다는 점을 심사 노트에 명시하세요.

### 2.6 App Store Connect — 버전 정보 (Version Information)

#### 스크린샷

**필수 디바이스 (iPhone)**:
- 6.5" 디스플레이 (iPhone 11 Pro Max): **1284 × 2778px** — 우리가 가진 해상도 ✅
- 또는 6.7" 디스플레이 (iPhone 14 Pro Max): 1290 × 2796px — 가능하면 이것도 추가
- 최소 3장, 최대 10장

**필수 디바이스 (iPad — supportsTablet: true이므로 필수)**:
- iPad Pro 12.9" (6세대): **2048 × 2732px** — 우리가 가진 해상도 ✅
- 최소 3장, 최대 10장

**업로드할 스크린샷 (추천 순서)**:

iPhone (5-6장 추천, 라이트 모드 중심):
1. `01-diary-list.png` — 일기 목록 + 캘린더
2. `02-diary-detail.png` — 일기 상세 + AI 답변
3. `03-diary-write.png` — 일기 작성
4. `04-companion.png` — AI 친구 프로필
5. `07-diary-list-dark.png` — 다크 모드 (선택)
6. `10-login.png` — 로그인 화면 (선택)

iPad (4-5장 추천):
1. `ipad-01-diary-list.png`
2. `ipad-02-diary-detail.png`
3. `ipad-03-diary-write.png`
4. `ipad-04-companion.png`
5. `ipad-05-settings.png`

> ⚠️ **스크린샷 품질 점검**: 현재 스크린샷은 시뮬레이터에서 캡처한 것으로 보입니다. 제출 전에 다음을 확인하세요:
> - 스크린샷의 내용이 실제 프로덕션 앱과 일치하는지
> - 더미 데이터가 자연스러워 보이는지 (예: 일기 내용이 실제 사용 사례와 유사한지)
> - 상태바(시간, 배터리 등)가 깔끔한지
> - 스크린샷에 디버그 로그나 개발 모드 표시가 없는지

#### 프로모션 텍스트 (170자)
```
하루의 끝, 따뜻한 AI 친구에게 오늘을 이야기해 보세요. 마무리는 당신의 감정을 판단 없이 받아들이고, 진심 어린 응답으로 하루를 마무리해 줘요.
```

#### 설명 (4000자)
→ `docs/store-metadata.md`의 App Store 섹션 내용 그대로 복사

#### 키워드 (100자, 쉼표로 구분)
```
일기,다이어리,AI,감정,마음,기록,일기장,하루,공감,위로,친구,마무리,diary,emotion,journal
```

#### 지원 URL
```
https://mamuri.app
```

#### 마케팅 URL (선택)
```
https://mamuri.app
```

### 2.7 App Store Connect — 심사 정보 (App Review Information)

#### 연락처 정보
| 필드 | 입력값 |
|------|--------|
| 이름 | SUNJUN KIM |
| 전화번호 | (본인 전화번호) |
| 이메일 | sunjunapps@gmail.com |

#### 데모 계정 (필수!)
Apple 심사관이 앱 기능을 테스트할 수 있는 계정이 필요합니다.

```
이메일: reviewer@mamuri.app (또는 test-reviewer@mamuri.app)
비밀번호: (안전한 임시 비밀번호 설정)
```

> 🔴 **필수 조치**: 프로덕션 서버에 이 데모 계정을 미리 생성해두어야 합니다. 일기 샘플 데이터 2-3개와 AI 답변도 미리 있어야 심사관이 기능을 바로 확인할 수 있습니다.

#### 심사 노트 (Review Notes)

이 앱은 AI 기반 일기 앱으로, 다음 사항을 고지합니다:

```
[AI Disclosure]
This app uses OpenAI's GPT-4o-mini to generate empathetic AI responses
to user diary entries. Users are explicitly informed about AI data processing
through a consent modal before their first diary entry is processed by AI.

[Safety Features]
The app includes crisis keyword detection that identifies potentially
harmful content (self-harm, suicidal ideation) and automatically provides
safety resources including Korean crisis hotline numbers (1393, 1577-0199).
AI is NOT a substitute for professional mental health care — this is
clearly stated in both the Terms of Service and in-app disclaimers.

[Content Moderation]
Users can report inappropriate AI responses via the in-app report feature
(4 categories: inappropriate, inaccurate, offensive, other).
Reports are logged and reviewed by the development team.

[Account Deletion]
Full account deletion is available in Settings with a 3-step confirmation
flow (warning → reason selection → password verification).
All personal data is permanently deleted upon confirmation.

[Subscription]
Version 1.0 provides all features for free. No in-app purchases are
included in this version. Future versions may include optional subscriptions
through Apple's In-App Purchase system.

[Demo Account]
Email: reviewer@mamuri.app
Password: [password]
This account has pre-populated diary entries to demonstrate the AI response feature.
```

### 2.8 App Store Connect — 빌드 업로드

EAS를 사용한 빌드 및 제출 명령어:

```bash
# 1. 프로덕션 빌드
cd mobile
eas build --platform ios --profile production

# 2. 빌드 완료 후 App Store Connect에 제출
eas submit --platform ios --profile production

# 또는 빌드+제출 한번에
eas build --platform ios --profile production --auto-submit
```

### 2.9 Apple 심사 거절 가능 시나리오 및 대응

| 거절 사유 | 가능성 | 대응 방법 |
|-----------|--------|-----------|
| **4.7 AI/ML 정책 위반** | 중간 | AI 동의 모달 + 신고 기능 이미 구현. 심사 노트에 상세히 설명 |
| **5.1.1 데이터 수집** | 낮음 | 개인정보 레이블 정확히 작성, 개인정보처리방침 URL 활성 |
| **3.1.1 인앱 구매 필수** | 낮음 | v1.0은 완전 무료. 구독 UI가 보이면 위험 → 확인 필요 |
| **2.1 앱 완성도** | 낮음 | 핵심 기능 모두 동작하면 문제 없음 |
| **1.4 신체적/정신적 해로움** | 중간 | 위기 감지 + 안전 메시지 + 면책 조항으로 대응. 심사 노트 필수 |
| **메타데이터 거절** | 낮음 | 스크린샷이 실제 앱과 일치하는지 확인 |
| **Apple 로그인 누락** | 없음 | 이미 구현 ✅ |
| **계정 삭제 누락** | 없음 | 이미 구현 ✅ |

---

## PART 3 — Google Play Store 제출 가이드

### 3.1 사전 준비

#### 필수 계정
- Google Play Developer Console ($25 일회) — https://play.google.com/console
- 신원 확인 완료 여부 체크

### 3.2 Play Console — 앱 만들기

| 필드 | 입력값 |
|------|--------|
| 앱 이름 | 마무리 - AI 일기 |
| 기본 언어 | 한국어 |
| 앱 / 게임 | 앱 |
| 유료 / 무료 | 무료 |

### 3.3 Play Console — 스토어 등록정보 (Store Listing)

#### 기본 스토어 등록정보

| 필드 | 입력값 | 글자 수 |
|------|--------|---------|
| 앱 이름 | 마무리 - AI 일기 | 30자 이내 |
| 짧은 설명 | 매일 쓰는 일기에 AI 친구가 따뜻한 답장을 보내줘요. 마무리와 하루를 마무리하세요. | 80자 이내 |
| 상세 설명 | `docs/store-metadata.md` Google Play 섹션 복사 | 4000자 이내 |

#### 그래픽 에셋

| 에셋 | 사양 | 현재 상태 |
|------|------|-----------|
| 앱 아이콘 | 512×512px PNG (32bit, 알파 포함) | ✅ 1024×1024 있음 → 512로 리사이즈 필요 |
| Feature Graphic | 1024×500px PNG/JPEG | 🔴 미제작 |
| 스크린샷 | 최소 2장, 최대 8장, 320-3840px | ✅ 1284×2778 사용 가능 |

> 🔴 **Feature Graphic 제작 필요**: Google Play에서 앱 검색 시 상단에 표시되는 핵심 그래픽입니다.
> - 크기: 1024 × 500px
> - 내용 제안: 앱 로고 + "하루의 끝, 따뜻한 AI 친구" 텍스트 + 그라데이션 배경
> - 디자인 도구: Figma, Canva, 또는 직접 제작

#### 스크린샷 업로드 (Google Play)

Google Play는 디바이스 유형별로 별도 업로드:

**휴대전화 (필수)**:
- `01-diary-list.png` ~ `05-settings.png` 중 3-6장
- 해상도 1284×2778 → Google Play 기준 충족 ✅

**태블릿 (선택, 7" + 10")**:
- iPad 스크린샷 재활용 가능 (2048×2732)

#### 다국어 스토어 등록정보

Google Play Console에서 번역 추가:
- English (en) → `docs/store-metadata.md` 영문 섹션
- 日本語 (ja) → `docs/store-metadata.md` 일문 섹션
- 中文简体 (zh-Hans) → `docs/store-metadata.md` 중문 섹션

### 3.4 Play Console — 앱 콘텐츠 (App Content)

이 섹션은 반드시 모든 항목을 완료해야 게시할 수 있습니다.

#### 3.4.1 개인정보처리방침
- URL 입력: `https://mamuri.app/privacy`
- ✅ 이미 활성 상태 확인됨

#### 3.4.2 광고
- "아니요, 앱에 광고가 포함되어 있지 않습니다"

#### 3.4.3 앱 액세스 권한
- "모든 기능에 제한된 액세스 권한이 필요합니다" 선택
- 테스트용 인증 정보 입력:
  ```
  이메일: reviewer@mamuri.app
  비밀번호: [password]
  참고: 일기 작성 후 AI 응답을 확인할 수 있습니다
  ```

#### 3.4.4 콘텐츠 등급 (IARC 설문)

| 질문 | 답변 |
|------|------|
| 이 앱이 사용자 생성 콘텐츠를 포함하나요? | 예 (일기 작성) |
| AI 생성 콘텐츠를 포함하나요? | 예 (AI 응답) |
| 사용자 간 소통이 가능한가요? | 아니오 |
| 폭력적인 콘텐츠를 포함하나요? | 아니오 |
| 성적인 콘텐츠를 포함하나요? | 아니오 |
| 약물/알코올 참조가 있나요? | 아니오 |
| 도박 요소가 있나요? | 아니오 |
| 구매를 유도하나요? | 아니오 |

**예상 등급**: 전체이용가 또는 만 12세 이상

#### 3.4.5 타겟 오디언스 및 콘텐츠
- 타겟 연령대: **만 13세 이상** (이용약관에 명시됨)
- 어린이 대상 앱인가요? → **아니오**
- 교사 승인(Teacher Approved) 프로그램? → **해당 없음**

> ⚠️ **중요**: "어린이" 대상으로 선택하면 COPPA 규정 등 추가 요구사항이 발생합니다. 마무리는 어린이 대상이 아니므로 반드시 "아니오"를 선택하세요.

#### 3.4.6 데이터 안전 (Data Safety)

이 섹션은 매우 상세하게 작성해야 합니다.

**데이터 수집 개요**:

| 질문 | 답변 |
|------|------|
| 앱이 필수 사용자 데이터를 수집하나요? | 예 |
| 데이터가 암호화되어 전송되나요? | 예 (HTTPS/TLS) |
| 사용자가 데이터 삭제를 요청할 수 있나요? | 예 (앱 내 계정 삭제) |
| 삭제 요청 방법 | 앱 내 설정 → 계정 삭제 |
| 삭제 요청 URL | https://mamuri.app (또는 앱 내 직접) |

**수집 데이터 상세**:

| 데이터 유형 | 수집 | 공유 | 목적 | 선택/필수 |
|------------|------|------|------|-----------|
| 이메일 주소 | ✅ | ❌ | 계정 관리 | 필수 |
| 이름 (닉네임) | ✅ | ❌ | 앱 기능, 개인화 | 필수 |
| 사용자 ID | ✅ | ❌ | 앱 기능 | 자동 |
| 사용자 콘텐츠 (일기) | ✅ | ✅* | 앱 기능 | 필수 |
| 사진 (아바타) | ✅ | ❌ | 앱 기능 | 선택 |
| 앱 활동 (AI 사용량) | ✅ | ❌ | 서비스 품질 | 자동 |

*일기 내용은 AI 응답 생성을 위해 OpenAI API로 전송됨 → "제3자와 공유"에 해당

**제3자 공유 상세**:
- OpenAI: 일기 내용 (최대 3000자), 닉네임, AI 친구 이름 → AI 응답 생성 목적
- Firebase (Google): OAuth 인증 토큰 → 소셜 로그인 인증 목적

#### 3.4.7 AI 생성 콘텐츠 선언

Google Play는 2024년부터 AI 생성 콘텐츠에 대한 선언을 요구합니다.

| 질문 | 답변 |
|------|------|
| AI가 콘텐츠를 생성하나요? | 예 |
| 사용자에게 AI 생성임을 고지하나요? | 예 (동의 모달 + 이용약관) |
| 부적절한 AI 콘텐츠 신고 가능? | 예 (신고 모달) |
| AI 콘텐츠 모니터링 방법? | 사용자 신고 + 백엔드 로깅 + 위기 감지 |

#### 3.4.8 정부 앱 여부
→ **아니오**

#### 3.4.9 금융 기능 여부
→ **아니오**

#### 3.4.10 건강 앱 여부
→ **아니오** (감정 기록이지만 의료/건강 앱이 아님)

### 3.5 Play Console — 릴리스 (Releases)

#### 내부 테스트 → 비공개 테스트 → 프로덕션 순서 권장

```
내부 테스트 (Internal Testing)
  → 본인 + 소수 테스터 (최대 100명)
  → 심사 없이 즉시 배포
  → 기본 기능 테스트

비공개 테스트 (Closed Testing)
  → 초대된 사용자만
  → 간략한 심사 (1-3일)
  → 피드백 수집

프로덕션 (Production)
  → 전체 공개
  → 정식 심사 (수일-수주)
```

#### EAS를 통한 Android 빌드 및 제출

```bash
# 1. 프로덕션 AAB 빌드
cd mobile
eas build --platform android --profile production

# 2. 빌드 완료 후 다운로드 또는 직접 제출
eas submit --platform android --profile production
```

> 💡 Google Play는 APK가 아닌 AAB (Android App Bundle) 형식을 요구합니다. EAS production 프로필은 기본적으로 AAB를 생성합니다.

### 3.6 Play Console — 거절 위험 시나리오

| 거절 사유 | 가능성 | 대응 |
|-----------|--------|------|
| 데이터 안전 섹션 미완성 | 높음 (가장 흔한 거절 사유) | 위 3.4.6 내용 꼼꼼히 작성 |
| AI 콘텐츠 선언 누락 | 중간 | 3.4.7 작성 |
| 계정 삭제 미구현 | 없음 | 이미 구현 ✅ |
| 개인정보처리방침 없음 | 없음 | 이미 호스팅 ✅ |
| 콘텐츠 등급 미완성 | 높음 | IARC 설문 반드시 완료 |
| 기능 비작동 (크래시) | 중간 | 프로덕션 빌드 실기기 테스트 필수 |
| 권한 설명 부적절 | 낮음 | 현재 최소 권한만 요청 ✅ |

---

## PART 4 — 스크린샷 상세 요구사항 및 평가

### Apple App Store 스크린샷 요구사항

| 디바이스 | 해상도 | 필수 여부 | 수량 | 현재 상태 |
|---------|--------|-----------|------|-----------|
| iPhone 6.7" (14 Pro Max) | 1290 × 2796 | 필수 (택1) | 최소 3장, 최대 10장 | ❌ 없음 |
| iPhone 6.5" (11 Pro Max) | 1284 × 2778 | 필수 (택1) | 최소 3장, 최대 10장 | ✅ 11장 |
| iPhone 5.5" (8 Plus) | 1242 × 2208 | 선택 | 최소 3장, 최대 10장 | ❌ 없음 |
| iPad Pro 12.9" (6세대) | 2048 × 2732 | iPad 지원 시 필수 | 최소 3장, 최대 10장 | ✅ 9장 |
| iPad Pro 13" (M4) | 2064 × 2752 | 선택 | 최소 3장, 최대 10장 | ❌ 없음 |

> **참고**: Apple은 6.5" 또는 6.7" 중 하나만 제공하면 됩니다. 6.7"을 제공하면 자동으로 다른 크기에 스케일됩니다. 현재 6.5" (1284×2778)가 있으므로 제출 가능합니다.
>
> **권장**: 가능하면 6.7" (1290×2796) 스크린샷도 추가로 생성하는 것이 좋습니다. iPhone 15 Pro Max 시뮬레이터에서 캡처하면 됩니다.

### Google Play Store 스크린샷 요구사항

| 디바이스 | 해상도 | 필수 여부 | 수량 | 현재 상태 |
|---------|--------|-----------|------|-----------|
| 휴대전화 | 320-3840px, 가로세로비 최대 2:1 | 필수 | 최소 2장, 최대 8장 | ✅ 사용 가능 |
| 7" 태블릿 | 위와 동일 | 선택 | 최소 1장 | iPad 재활용 가능 |
| 10" 태블릿 | 위와 동일 | 선택 | 최소 1장 | iPad 재활용 가능 |
| Chromebook | 위와 동일 | 선택 | - | ❌ |
| Wear OS | 위와 동일 | 선택 | - | 해당 없음 |

### 현재 스크린샷 품질 평가

**해상도**: ✅ Apple과 Google 모두 요구사항 충족

**내용 평가 (레포에서 파일만 확인 가능, 시각적 품질은 직접 확인 필요)**:
- 라이트 모드 5장 + 다크 모드 4장 + 로그인/회원가입 2장 = iPhone 11장
- iPad 라이트 5장 + 다크 4장 = iPad 9장
- 핵심 화면(일기 목록, 상세, 작성, AI 친구, 설정) 모두 포함

**직접 확인해야 할 사항**:
1. 스크린샷 내 텍스트가 선명하고 읽기 쉬운지
2. 더미 일기 내용이 자연스러운지 (실제 사용 사례처럼 보이는지)
3. AI 답변이 표시되어 있는지 (핵심 가치 전달)
4. 상태바가 깔끔한지 (시간, 배터리 등)
5. 다크 모드 스크린샷이 실제 다크 모드 사용자 경험을 보여주는지

> ⚠️ **중요**: 스크린샷 파일이 존재하고 해상도가 맞지만, 실제 시각적 품질은 이 도구로 판단할 수 없습니다. 제출 전 반드시 직접 열어서 확인하세요.

---

## PART 5 — 제출 전 테스트 권장사항

### 프로덕션 빌드 테스트

```bash
# iOS 프로덕션 빌드
cd mobile
eas build --platform ios --profile production

# Android 프로덕션 빌드
eas build --platform android --profile production
```

빌드 후 실기기 또는 시뮬레이터에서 아래 시나리오 테스트:

#### 필수 테스트 시나리오
1. **신규 가입** → 이메일 회원가입 → 닉네임 설정 → 메인 화면
2. **이메일 로그인** → 기존 계정 로그인 → 토큰 갱신 확인
3. **Google 로그인** → 소셜 로그인 → 닉네임 설정 (첫 로그인 시)
4. **Apple 로그인** (iOS만) → 소셜 로그인 → 닉네임 설정
5. **일기 작성** → 제목 + 내용 + 감정 선택 → 저장 → AI 응답 수신
6. **AI 응답 확인** → 일기 상세에서 AI 답변 표시 확인
7. **AI 대화** → AI 답변에 대해 추가 대화 가능 확인
8. **AI 동의 모달** → 첫 일기 작성 시 동의 모달 표시 확인
9. **AI 응답 신고** → 신고 모달 → 이유 선택 → 제출
10. **계정 삭제** → 설정 → 계정 삭제 → 3단계 확인 → 삭제 완료
11. **다크 모드** → 설정에서 테마 전환 → 전체 화면 정상 표시
12. **언어 변경** → 설정에서 언어 변경 → 전체 앱 번역 확인
13. **오프라인 상태** → 네트워크 끊김 시 적절한 에러 메시지
14. **앱 백그라운드/포그라운드** → 토큰 유지, 상태 복원

---

## 제출 순서 권장

### 1단계: 사전 준비 (1-2일)
- [ ] 프로덕션 빌드 테스트 (iOS + Android)
- [ ] 데모 계정 생성 (프로덕션 서버)
- [ ] 스크린샷 시각적 품질 직접 확인
- [ ] Feature Graphic 1024×500 제작
- [ ] AI Provider가 프로덕션에서 openai로 설정되어 있는지 확인
- [ ] support@mamuri.app 이메일 수신 확인

### 2단계: Google Play 제출 (먼저 권장)
- [ ] Play Console에 앱 만들기
- [ ] 스토어 등록정보 입력
- [ ] 에셋 업로드 (아이콘 512×512, Feature Graphic, 스크린샷)
- [ ] 앱 콘텐츠 전체 완료 (데이터 안전, 등급, 정책 등)
- [ ] 내부 테스트 트랙에 AAB 업로드 → 기본 테스트
- [ ] 프로덕션 트랙으로 승격 → 심사 제출

> Google Play를 먼저 하는 이유: 심사가 일반적으로 더 빠르고 (1-3일), 피드백 루프가 짧습니다.

### 3단계: Apple App Store 제출
- [ ] App Store Connect에서 버전 정보 입력
- [ ] 스크린샷 업로드 (iPhone + iPad)
- [ ] 앱 개인정보 레이블 작성
- [ ] 연령 등급 설문 완료
- [ ] 심사 정보 + 데모 계정 입력
- [ ] 심사 노트 작성 (AI 관련 상세 설명)
- [ ] EAS로 빌드 + 제출
- [ ] 심사 대기 (일반적으로 1-3일, 최대 7일)

### 4단계: 심사 후 대응
- 거절 시: 거절 사유 확인 → 수정 → 재제출
- 승인 시: 릴리스 타이밍 결정 (즉시 / 수동)

---

## 자주 묻는 질문 (FAQ)

**Q: Apple 심사에 얼마나 걸리나요?**
A: 일반적으로 24-48시간, 최대 7일. 첫 제출은 좀 더 길 수 있습니다.

**Q: Google Play 심사에 얼마나 걸리나요?**
A: 새 앱은 보통 1-7일. 내부 테스트는 심사 없이 즉시.

**Q: 동시에 양쪽 제출해도 되나요?**
A: 네, 독립적으로 진행됩니다. 다만 한쪽에서 피드백을 받아 다른 쪽에 반영하는 것이 효율적입니다.

**Q: 구독 기능이 코드에 있는데 문제되지 않나요?**
A: `FEATURE_PREMIUM_ENABLED=false`로 비활성화되어 있고, 구독 UI가 사용자에게 노출되지 않으면 문제없습니다. 심사 시 실제로 구독 화면이 접근 가능한지 확인하세요.

**Q: AI 앱이라서 거절될 가능성이 높나요?**
A: Apple은 2024년부터 AI 앱에 대한 가이드라인(4.7)을 강화했습니다. 하지만 마무리는 AI 동의, 신고, 위기 감지, 면책 조항을 모두 구현했으므로 준비가 잘 되어 있습니다. 심사 노트에서 이를 명확히 설명하는 것이 중요합니다.

**Q: 위기 감지 기능 때문에 "의료 앱"으로 분류되지 않나요?**
A: 마무리는 의료/건강 진단을 하지 않으며, 위기 감지는 안전 기능일 뿐입니다. 이용약관에 "전문 상담을 대체하지 않음"을 명시했으므로, 심사 노트에서도 이를 강조하세요.

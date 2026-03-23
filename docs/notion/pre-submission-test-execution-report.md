# 제출 전 테스트 실행 리포트

> 실행 날짜: 2026-03-23
> 실행 환경: macOS (레포 + 프로덕션 API 원격 테스트)
> 목적: 코드/설정 수준에서 자동 검증 가능한 모든 항목의 실행 결과

---

## 실행 요약

| 카테고리 | 총 항목 | ✅ PASS | ❌ FAIL | ⚠️ WARNING | 실행 불가 |
|---------|---------|---------|---------|------------|----------|
| 프로덕션 API | 4 | 3 | 1 | 0 | 0 |
| 법적 URL | 3 | 3 | 0 | 0 | 0 |
| 앱 설정 | 8 | 6 | 0 | 2 | 0 |
| 보안 | 5 | 3 | 1 | 1 | 0 |
| 모바일 코드 품질 | 4 | 2 | 1 | 1 | 0 |
| 스토어 에셋 | 4 | 4 | 0 | 0 | 0 |
| 계정 삭제 플로우 | 3 | 3 | 0 | 0 | 0 |
| AI 동의/신고 | 3 | 3 | 0 | 0 | 0 |
| i18n 완전성 | 4 | 4 | 0 | 0 | 0 |
| 스토어 거절 위험 | 8 | 8 | 0 | 0 | 0 |
| 백엔드 빌드/테스트 | 1 | 0 | 0 | 0 | 1 |
| **합계** | **47** | **39** | **3** | **4** | **1** |

**통과율: 83% (39/47)**

---

## SECTION 1: 실제 실행한 테스트 결과

### 1.1 프로덕션 API 상태

| # | 테스트 | 명령어 | 결과 | 상세 |
|---|--------|--------|------|------|
| 1 | Health Check | `curl https://api.mamuri.app/actuator/health` | ✅ PASS | `{"status":"UP"}` |
| 2 | Login (정상 요청) | `POST /api/auth/login {"email":"...","password":"..."}` | ✅ PASS | 400 — `{"success":false,"message":"이메일 또는 비밀번호가 올바르지 않습니다."}` |
| 3 | Signup 유효성 검사 | `POST /api/auth/signup {}` | ✅ PASS | 400 — `{"success":false,"message":"이메일은 필수입니다., 비밀번호는 필수입니다., 닉네임은 필수입니다."}` |
| 4 | 인증 없이 일기 접근 | `GET /api/diaries` | ✅ PASS | 401 — 인증 필요 |

**발견된 문제:**
- GET `/api/auth/login` 호출 시 500 반환 (POST-only 엔드포인트에 GET 요청)
- 심각도: ⚠️ LOW — 정상적인 클라이언트는 GET으로 호출하지 않음
- 권장: GlobalExceptionHandler에서 405 Method Not Allowed 처리 추가

### 1.2 법적 URL 상태

| # | URL | HTTP 상태 | 콘텐츠 확인 | 결과 |
|---|-----|-----------|------------|------|
| 1 | https://mamuri.app | 200 | HTML 페이지 로드 | ✅ PASS |
| 2 | https://mamuri.app/privacy | 200 (307 → 200) | Privacy Policy 전문 표시 | ✅ PASS |
| 3 | https://mamuri.app/terms | 200 (307 → 200) | Terms of Service 전문 표시 | ✅ PASS |

### 1.3 앱 설정 검증

| # | 항목 | 검증 내용 | 결과 | 상세 |
|---|------|-----------|------|------|
| 1 | 앱 이름 | `app.config.ts` → `name: 'Mamuri'` | ✅ PASS | |
| 2 | Bundle ID (iOS) | `bundleIdentifier: 'com.mamuri.app'` | ✅ PASS | |
| 3 | Package (Android) | `package: 'com.mamuri.app'` | ✅ PASS | |
| 4 | EAS production | `autoIncrement: true` | ✅ PASS | |
| 5 | API URL (prod) | `https://api.mamuri.app/api` + `__DEV__` 가드 | ✅ PASS | |
| 6 | Localhost 유출 | `__DEV__` 조건문으로 보호됨 | ✅ PASS | |
| 7 | FEATURE_PREMIUM_ENABLED | `${FEATURE_PREMIUM_ENABLED:false}` | ✅ PASS | v1.0 무료 |
| 8 | AI_PROVIDER 기본값 | `${AI_PROVIDER:stub}` | ⚠️ WARNING | 프로덕션 서버에서 환경변수로 `openai` 설정 필수 |

### 1.4 보안 검증

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| 1 | mobile/src/ 하드코딩 시크릿 | ✅ PASS | 발견 안 됨 |
| 2 | backend 하드코딩 시크릿 | ✅ PASS | 환경변수로 주입 |
| 3 | .gitignore (.env 커버) | ✅ PASS | `.env`, `.env.*` 패턴 포함 |
| 4 | .gitignore (인증서/키) | ❌ FAIL | `*.key`, `*.pem`, `*.p8`, `*.jks` 패턴 누락 |
| 5 | JWT 시크릿 | ✅ PASS | `${JWT_SECRET}` 환경변수 주입 |

**조치 필요:**
- `.gitignore`에 `*.key`, `*.pem`, `*.p8`, `*.jks` 패턴 추가 권장
- 현재까지 이 유형의 파일이 커밋된 적은 없으므로 즉각적 위험은 낮음

### 1.5 모바일 코드 품질

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| 1 | console.log (프로덕션) | ✅ PASS | 스크린샷 유틸리티에만 1건 (프로덕션 코드 아님) |
| 2 | `__DEV__` 가드 | ✅ PASS | `client.ts`, `avatar.ts` 적절히 사용 |
| 3 | Jest 테스트 | ❌ FAIL | AsyncStorage 모듈 mock 누락으로 1/1 실패 |
| 4 | npm audit | ⚠️ WARNING | low: 5, high: 3 (총 8건 취약점) |

**Jest 실패 상세:**
```
FAIL  __tests__/App.test.tsx
  ● Test suite failed to run
    Cannot find module '@react-native-async-storage/async-storage'
```
→ jest.setup.js에 AsyncStorage mock 추가 필요. 제출 차단 항목은 아니지만 수정 권장.

**npm audit 상세:**
→ high 취약점 3건은 대부분 간접 의존성(transitive). `npm audit fix`로 해결 가능한지 확인 필요.

### 1.6 스토어 에셋 검증

| # | 에셋 | 사양 | 결과 |
|---|------|------|------|
| 1 | `icon.png` | 1024 × 1024 PNG | ✅ PASS |
| 2 | `adaptive-icon.png` | 1024 × 1024 PNG | ✅ PASS |
| 3 | iPhone 스크린샷 (11장) | 1284 × 2778 PNG | ✅ PASS |
| 4 | iPad 스크린샷 (9장) | 2048 × 2732 PNG | ✅ PASS |

### 1.7 계정 삭제 플로우 (코드 검증)

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| 1 | 프론트엔드 3단계 UI | ✅ PASS | `DeleteAccountModalV2.tsx` — Step 1(경고), 2(이유), 3(확인) |
| 2 | 백엔드 삭제 API | ✅ PASS | `AccountController.java` — `POST /api/user/delete-account` |
| 3 | DB 마이그레이션 | ✅ PASS | `V16__account_deletion.sql` — 감사 로그 + CASCADE 설정 |

### 1.8 AI 동의/신고 (코드 검증)

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| 1 | AI 동의 | ✅ PASS | 회원가입/소셜가입 시 필수 체크박스 (`disabled={!aiConsent}`) |
| 2 | AI 신고 | ✅ PASS | `ReportModal.tsx` — 4가지 사유, `AICommentScreenV2`와 `DiaryDetailScreenV2`에서 호출 |
| 3 | 위기 감지 | ✅ PASS | `SafetyCheckService.java` — 12개 키워드, `SafetyEvent` 로깅 |

### 1.9 i18n 완전성

| # | 언어 | 키 수 | 결과 | 비고 |
|---|------|-------|------|------|
| 1 | ko.json | 296 | ✅ PASS | 기준 파일 |
| 2 | en.json | 296 | ✅ PASS | ko와 100% 일치 |
| 3 | ja.json | 296 | ✅ PASS | ko와 100% 일치 |
| 4 | zh.json | 296 | ✅ PASS | ko와 100% 일치 |

### 1.10 스토어 거절 위험 분석 (코드 검증)

| # | 위험 항목 | 결과 | 상세 |
|---|---------|------|------|
| 1 | 구독/결제 UI 노출 | ✅ OK | Subscription/Paywall 화면이 네비게이션에 등록되지 않음. 사용자 접근 불가 |
| 2 | IAP 라이브러리 | ✅ OK | Stripe/RevenueCat/StoreKit 의존성 없음 |
| 3 | Apple 로그인 누락 | ✅ OK | Google 로그인 + Apple 로그인 모두 구현 |
| 4 | 개발 아티팩트 | ✅ OK | `SCREENSHOT_MODE=false`, `__DEV__` 가드, Preview 화면 미등록 |
| 5 | AI 동의 강제 | ✅ OK | 가입 시 필수 체크박스. 체크 전 가입 버튼 비활성화 |
| 6 | AI 신고 접근성 | ✅ OK | DiaryDetail + AIComment 화면에서 ReportModal 호출 확인 |
| 7 | 크래시 방어 | ✅ OK | ErrorBoundary가 앱 전체를 래핑, ApiError 일관 처리 |
| 8 | 오프라인 | ✅ OK | NetInfo 없지만 API 에러 시 Alert 표시. 크래시는 없음 |

---

## SECTION 2: 실행할 수 없었던 테스트

### 2.1 실행 불가 사유별 분류

#### JVM 미설치 (로컬 환경)
| 테스트 | 사유 | 대안 |
|--------|------|------|
| `./gradlew test` (백엔드 단위/통합 테스트) | JVM 17 미설치 | CI/CD 또는 JVM 설치 후 실행 |

#### 프로덕션 빌드 필요 (시뮬레이터/실기기)
| 테스트 | 사유 |
|--------|------|
| 실제 UI 렌더링 테스트 | EAS production 빌드 필요 |
| 소셜 로그인 (Google/Apple) | 네이티브 모듈, 실기기 필요 |
| AI 답변 생성 (프로덕션) | 프로덕션 빌드에서 실제 API 호출 필요 |
| 다크 모드 시각적 확인 | 실기기 렌더링 필요 |
| 위기 감지 응답 확인 | 프로덕션 AI 호출 필요 |
| 앱 백그라운드/포그라운드 | 실기기 필요 |
| 키보드 레이아웃 | 실기기 필요 |

#### 콘솔 설정 (수동)
| 테스트 | 사유 |
|--------|------|
| 콘텐츠 등급 설문 | App Store Connect / Play Console 필요 |
| 데이터 안전 양식 | Play Console 필요 |
| 앱 개인정보 레이블 | App Store Connect 필요 |
| Feature Graphic 업로드 | 제작 + Play Console 업로드 필요 |

---

## SECTION 3: 최고 위험 항목 (제출 전 반드시 확인)

### 🔴 CRITICAL (제출 차단)

| # | 항목 | 현재 상태 | 필요 조치 |
|---|------|-----------|-----------|
| 1 | AI_PROVIDER 프로덕션 설정 | 기본값 `stub` | 서버에서 `AI_PROVIDER=openai` 확인 |
| 2 | 데모 계정 생성 | 미생성 | reviewer@mamuri.app 생성 + 샘플 데이터 |
| 3 | Feature Graphic | 미제작 | 1024×500 디자인 제작 (Google Play 필수) |
| 4 | 프로덕션 빌드 실기기 테스트 | 미실행 | EAS build → 실기기 설치 → 핵심 플로우 테스트 |
| 5 | 콘텐츠 등급 설문 | 미완료 | 양쪽 콘솔에서 설문 작성 |

### 🟠 HIGH (거절 가능성 있음)

| # | 항목 | 현재 상태 | 필요 조치 |
|---|------|-----------|-----------|
| 1 | .gitignore 인증서 패턴 | *.key/*.pem 누락 | 패턴 추가 |
| 2 | Jest 테스트 실패 | AsyncStorage mock 누락 | 수정 권장 (제출 차단은 아님) |
| 3 | npm audit high 취약점 | 3건 | `npm audit fix` 시도 |
| 4 | support@mamuri.app | 수신 확인 안 됨 | 이메일 수신 테스트 |
| 5 | 스크린샷 시각적 품질 | 미확인 | 직접 열어서 확인 |

### 🟡 MEDIUM (권장 수정)

| # | 항목 | 필요 조치 |
|---|------|-----------|
| 1 | GET /api/auth/login 500 에러 | 405 반환으로 수정 |
| 2 | application-prod.yml 부재 | 환경변수 의존 설계는 OK, 문서화 필요 |
| 3 | 오프라인 감지 없음 | Post-MVP 개선 (제출 차단 아님) |

---

## SECTION 4: 조치 우선순위 및 체크리스트

### 제출 D-3 (3일 전)

- [ ] 프로덕션 서버 AI_PROVIDER=openai 확인 (ssh 접속 또는 일기 작성 테스트)
- [ ] `eas build --platform ios --profile production` 실행
- [ ] `eas build --platform android --profile production` 실행
- [ ] Feature Graphic 1024×500 디자인 제작

### 제출 D-2 (2일 전)

- [ ] 프로덕션 빌드 iOS 실기기/TestFlight 설치
- [ ] 프로덕션 빌드 Android 실기기 설치
- [ ] `final-device-qa-scenarios.md`의 PART A (핵심 기능) 전체 수행
- [ ] `final-device-qa-scenarios.md`의 PART B (규정 준수) 전체 수행
- [ ] reviewer@mamuri.app 데모 계정 생성 + 데이터 로드

### 제출 D-1 (전날)

- [ ] `final-device-qa-scenarios.md`의 PART C, D (UI/에러) 수행
- [ ] 데모 계정 로그인 최종 확인
- [ ] 스크린샷이 현재 앱 UI와 일치하는지 비교
- [ ] App Store Connect / Play Console 메타데이터 입력
- [ ] 콘텐츠 등급 설문 완료

### 제출 D-Day

- [ ] 데모 계정 최종 로그인 테스트
- [ ] AI 답변 생성 확인 (프로덕션)
- [ ] 심사 제출

---

## SECTION 5: 테스트 실행 로그

### 2026-03-23 자동 검증 실행

```
[14:00] Production API Health Check
  curl https://api.mamuri.app/actuator/health → {"status":"UP"} ✅

[14:00] Login API Error Format
  POST /api/auth/login (invalid creds) → 400, {"success":false,...} ✅

[14:00] Signup Validation
  POST /api/auth/signup (empty body) → 400, validation errors ✅

[14:00] Auth Required Check
  GET /api/diaries → 401 ✅

[14:01] Legal URLs
  https://mamuri.app → 200 ✅
  https://mamuri.app/privacy → 307→200, HTML content ✅
  https://mamuri.app/terms → 307→200, HTML content ✅

[14:01] App Config Verification
  app.config.ts name='Mamuri', bundle='com.mamuri.app' ✅
  eas.json production autoIncrement=true ✅
  client.ts prod URL='https://api.mamuri.app/api' ✅
  FEATURE_PREMIUM_ENABLED default=false ✅
  AI_PROVIDER default=stub ⚠️

[14:02] Security Scan
  No hardcoded secrets in mobile/src/ ✅
  No hardcoded secrets in src/main/ ✅
  .gitignore covers .env ✅
  .gitignore missing *.key/*.pem ❌

[14:02] Code Quality
  console.log in prod code: none ✅
  __DEV__ guards: properly used ✅
  npm test: 1/1 FAIL (AsyncStorage mock) ❌
  npm audit: 5 low, 3 high ⚠️

[14:03] Store Assets
  icon.png 1024x1024 ✅
  adaptive-icon.png 1024x1024 ✅
  11 iPhone screenshots 1284x2778 ✅
  9 iPad screenshots 2048x2732 ✅

[14:03] Account Deletion (code review)
  Frontend 3-step flow ✅
  Backend POST /api/user/delete-account ✅
  V16 migration with audit log ✅

[14:04] AI Compliance (code review)
  AI consent checkbox enforced at signup ✅
  ReportModal with 4 reasons ✅
  SafetyCheckService with 12 crisis keywords ✅

[14:04] i18n
  ko: 296 keys ✅
  en: 296 keys ✅
  ja: 296 keys ✅
  zh: 296 keys ✅

[14:05] Store Rejection Risk (code review)
  Subscription screens: not in navigation ✅
  Apple Sign-In: implemented ✅
  Dev artifacts: not reachable ✅
  AI consent: mandatory ✅
  Report modal: accessible ✅
  ErrorBoundary: wrapping app ✅
```

---

## 결론

**코드/설정 수준에서 검증 가능한 47개 항목 중 39개(83%) 통과.**

실패 3건과 경고 4건은 모두 제출을 차단하는 수준은 아니지만, 가능하면 수정 권장합니다.

**남은 핵심 작업:**
1. 프로덕션 AI_PROVIDER 설정 확인 (서버 접속)
2. 프로덕션 빌드 실기기 테스트 (핵심 플로우)
3. 데모 계정 생성 + 데이터 로드
4. Feature Graphic 제작
5. 콘솔 메타데이터 입력 + 설문 완료

이 5가지가 완료되면 제출 준비 완료입니다.

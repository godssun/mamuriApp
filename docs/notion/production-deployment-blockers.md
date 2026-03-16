# Production Deployment Blockers

**Date:** 2026-03-16
**Branch:** `feat/companion-growth-system`
**Version:** 1.0.0
**Overall Status:** NOT READY FOR PRODUCTION

---

## BLOCKER (Must Fix Before Submission)

### B-1. Credentials Committed to Repository

**Severity:** CRITICAL
**Scope:** Backend + Mobile

`.env` 파일에 실제 API 키가 포함되어 git 히스토리에 노출됨:

| Secret | File | Risk |
|--------|------|------|
| OpenAI API Key (`sk-proj-...`) | `.env` | 과금 남용, 데이터 유출 |
| JWT Secret | `.env` | 토큰 위조 가능 |
| Google Web Client ID | `.env`, `mobile/.env` | OAuth 사칭 |
| Firebase Admin SDK JSON | `src/main/resources/mamuri-app-firebase-adminsdk-*.json` | Firebase 프로젝트 전체 접근 |

**조치:**
- [ ] OpenAI API 키 즉시 폐기 및 재발급
- [ ] Firebase 서비스 계정 키 폐기 및 재발급
- [ ] `git filter-repo`로 `.env`, Firebase JSON을 git 히스토리에서 제거
- [ ] `.gitignore` 에 이미 등록되어 있으나, 이전에 커밋된 파일이므로 `git rm --cached` 필요
- [ ] 프로덕션: 환경변수 또는 Secrets Manager로 주입

---

### B-2. 법적 문서 플레이스홀더 미완성

**Severity:** CRITICAL
**Scope:** `docs/legal/`

Privacy Policy와 Terms of Service에 다음 플레이스홀더가 남아있음:
- `[INSERT DATE]`
- `[INSERT CONTACT EMAIL]`
- `[INSERT DEVELOPER NAME OR COMPANY]`

**조치:**
- [ ] 개발자/회사 이름, 연락처 이메일, 시행일자 기입
- [ ] HTML 버전 (`privacy-policy-web.html`, `terms-of-service-web.html`)도 동일 업데이트

---

### B-3. 법적 페이지 미배포

**Severity:** CRITICAL
**Scope:** Web / App Store

앱 내에서 `Linking.openURL('https://mamuri.app/privacy')` 등으로 링크하지만, 해당 URL이 실제로 접근 불가.

**조치:**
- [ ] `mamuri.app` 도메인에 Privacy Policy, Terms of Service HTML 페이지 배포
- [ ] `https://mamuri.app/privacy` 접근 확인
- [ ] `https://mamuri.app/terms` 접근 확인

---

### B-4. EAS Production 프로필 미완성

**Severity:** CRITICAL
**Scope:** `mobile/eas.json`

Production 프로필에 `autoIncrement: true`만 설정되어 있음. 누락 항목:
- `credentialsSource` (remote/local)
- iOS Provisioning Profile / Code Signing
- Android Keystore
- `distribution: "store"`
- 환경변수 설정

**조치:**
- [ ] `eas credentials` 실행하여 iOS/Android 서명 설정
- [ ] Production 프로필에 distribution, credential, env 설정 추가
- [ ] `GOOGLE_WEB_CLIENT_ID` 등을 EAS Secrets로 이관: `eas secret:create --scope project`

---

### B-5. IAP (In-App Purchase) 미구현

**Severity:** CRITICAL
**Scope:** Mobile

Apple/Google은 디지털 상품에 대해 외부 결제를 금지. Stripe 결제 플로우는 제거됨 (v1.0 계획대로), 하지만 IAP가 없으면 유료 기능 사용 불가.

**현재 상태:** v1.0에서는 모든 사용자 무제한 무료 (`FEATURE_QUOTA_ENABLED=false`). Paywall/Subscription 화면은 네비게이션에서 제거됨.

**v1.0 대응:** 무료로 출시하므로 IAP 없어도 스토어 심사 통과 가능.
**v1.1 필수:** RevenueCat IAP 연동 후 유료 전환.

**조치 (v1.0):**
- [x] Stripe 외부 결제 코드 제거 완료
- [x] Paywall/Subscription 네비게이션 제거 완료
- [x] `FEATURE_QUOTA_ENABLED=false` 기본값 설정 완료

**조치 (v1.1):**
- [ ] `react-native-purchases` (RevenueCat) 설치
- [ ] App Store Connect / Google Play Console에서 상품 등록
- [ ] Paywall/Subscription 화면 복원 + IAP 연동
- [ ] `FEATURE_QUOTA_ENABLED=true`로 전환

---

### B-6. 개발자 연락처 정보 누락

**Severity:** HIGH
**Scope:** App Store / Google Play

Apple과 Google 모두 개발자 연락처를 필수로 요구:
- 지원 이메일
- 개발자 이름/회사명
- 개인정보보호 담당자 연락처

**조치:**
- [ ] App Store Connect: App Review Contact Information 입력
- [ ] Google Play Console: Store listing > Contacts 입력
- [ ] Privacy Policy/Terms에 연락처 기입 (B-2와 연계)

---

## WARNING (Should Fix Before Launch)

### W-1. iOS 표시 이름 오류

**Scope:** `ios/mobile/Info.plist`

`CFBundleDisplayName`이 `"mobile"`로 설정됨. 홈 화면에 "mobile"로 표시.

**조치:**
- [ ] `"Mamuri"`로 변경하거나 `app.config.ts`에서 Expo가 오버라이드하도록 설정

---

### W-2. Production Dockerfile 없음

**Scope:** Backend

Spring Boot 앱을 컨테이너화할 Dockerfile이 없음.

**조치:**
- [ ] Multi-stage Dockerfile 생성 (eclipse-temurin:17 기반)
- [ ] docker-compose에 production 프로필 추가

---

### W-3. CI/CD 파이프라인 없음

**Scope:** Repository

`.github/workflows/` 디렉토리가 존재하지 않음. 자동 빌드, 테스트, 배포 없음.

**조치:**
- [ ] GitHub Actions 워크플로우 생성 (PR: build+test, main: deploy)
- [ ] Secret scanning 활성화
- [ ] OWASP Dependency Check 추가

---

### W-4. Spring Boot Actuator 없음

**Scope:** Backend

Health check, metrics 엔드포인트가 없어 프로덕션 모니터링 불가.

**조치:**
- [ ] `spring-boot-starter-actuator` 의존성 추가
- [ ] `/actuator/health`, `/actuator/metrics` 노출 설정

---

### W-5. AiConsentModal 프라이버시 링크 미연결

**Scope:** `mobile/src/screens_v2/components/AiConsentModal.tsx`

TODO 코멘트만 있고 프라이버시 정책 링크가 실제로 열리지 않음.

**조치:**
- [ ] `Linking.openURL('https://mamuri.app/privacy')` 연결

---

### W-6. 접근성(Accessibility) 라벨 없음

**Scope:** Mobile 전체

`accessibilityLabel`, `accessibilityHint` 속성이 주요 UI 요소에 없음. 스크린 리더 사용자에게 불편.

**조치:**
- [ ] 주요 버튼, 입력 필드에 접근성 라벨 추가
- [ ] VoiceOver (iOS), TalkBack (Android) 테스트

---

### W-7. CORS Localhost 기본값

**Scope:** `src/main/java/.../WebConfig.java`

`@Value("${app.cors.allowed-origins:http://localhost:19006,http://localhost:8081}")`

프로덕션 환경변수로 오버라이드 필수. `application-prod.yml`에 `https://mamuri.app` 설정 있으나 확인 필요.

**조치:**
- [ ] 프로덕션 배포 시 `CORS_ALLOWED_ORIGINS` 환경변수 확인

---

## OK (Issues Resolved or No Action Needed)

| 항목 | 상태 | 비고 |
|------|------|------|
| Stripe 외부 결제 제거 | ✅ | v1.0 계획대로 완료 |
| Quota 비활성화 (무제한 무료) | ✅ | `FEATURE_QUOTA_ENABLED=false` |
| SecurityConfig (JWT) | ✅ | 적절한 인증/인가 설정 |
| DB 마이그레이션 (V1-V18) | ✅ | 순차적, 안전한 마이그레이션 |
| Feature Flags | ✅ | 안전한 기본값 |
| Logging (logback) | ✅ | 프로필별 적절한 레벨 |
| Error Handling | ✅ | 포괄적 에러 코드 + i18n |
| AI Disclosure | ✅ | 다층 고지 (동의 모달, 설정, 약관) |
| Crisis Safety | ✅ | 위기 배너 + 핫라인 + 안전 메시지 |
| Dark Mode | ✅ | 완전 지원 (3개 테마) |
| Loading States | ✅ | 모든 비동기 작업에 인디케이터 |
| Screenshots | ✅ | 11장 (라이트/다크 모드) |
| Social Auth (Google/Apple) | ✅ | Firebase 연동 + graceful degradation |
| 암호화/보안 | ✅ | HTTPS, Secure Store, bcrypt, JWT rotation |
| `__DEV__` 분기 | ✅ | localhost 참조 정상 분기 |
| application-prod.yml | ✅ | 모든 비밀 환경변수화 |
| i18n (4개 언어) | ✅ | ko, en, ja, zh 지원 |

---

## 필수 환경변수 목록 (Production)

### Backend

| 변수 | 용도 | 필수 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL JDBC URL | YES |
| `DB_USERNAME` | DB 사용자 | YES |
| `DB_PASSWORD` | DB 비밀번호 | YES |
| `JWT_SECRET` | JWT 서명키 (32+ chars) | YES |
| `AI_API_KEY` | OpenAI API Key | YES |
| `AI_PROVIDER` | AI 제공자 (default: stub) | NO |
| `AI_MODEL` | AI 모델 (default: gpt-4o-mini) | NO |
| `CORS_ALLOWED_ORIGINS` | 허용 도메인 (default: https://mamuri.app) | NO |
| `FEATURE_QUOTA_ENABLED` | 쿼터 활성화 (default: false) | NO |
| `FEATURE_CONVERSATION_ENABLED` | 대화 기능 (default: true) | NO |
| `FEATURE_PREMIUM_ENABLED` | 프리미엄 기능 (default: false) | NO |
| `RATE_LIMIT_ENABLED` | Rate limiting (default: true) | NO |
| `UPLOAD_DIR` | 파일 업로드 경로 (default: uploads) | NO |

### Mobile (EAS Secrets)

| 변수 | 용도 | 필수 |
|------|------|------|
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth Web Client ID | YES |

---

## 우선순위별 조치 순서

### Phase 1: 즉시 (보안)
1. 노출된 모든 API 키 폐기 및 재발급
2. git 히스토리에서 `.env`, Firebase JSON 제거
3. Firebase 서비스 계정 외부 경로로 이관

### Phase 2: 출시 전 (법적/스토어)
4. 법적 문서 플레이스홀더 기입
5. 법적 페이지 mamuri.app에 배포
6. 개발자 연락처 등록
7. EAS production 프로필 완성
8. AiConsentModal 프라이버시 링크 연결
9. iOS 표시 이름 수정

### Phase 3: 운영 준비
10. Dockerfile 생성
11. CI/CD 파이프라인 구축
12. Actuator 건강 체크 추가
13. 접근성 라벨 추가

### Phase 4: v1.1 (유료 전환)
14. RevenueCat IAP 연동
15. Paywall/Subscription 화면 복원
16. `FEATURE_QUOTA_ENABLED=true` 전환

---

**Last Updated:** 2026-03-16

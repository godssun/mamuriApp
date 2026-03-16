# Expo Go → Expo Development Build 마이그레이션

## 1. 현재 소셜 로그인 아키텍처 (As-Is)

```
[LoginScreen] → socialAuth.ts → Firebase Auth SDK (네이티브 모듈)
                                  ├── Google: @react-native-google-signin → Firebase credential → ID Token
                                  ├── Apple:  expo-apple-authentication → Firebase credential → ID Token
                                  └── Kakao:  @react-native-seoul/kakao-login → Access Token (직접 전송)
```

- Google/Apple 로그인은 Firebase Auth를 거쳐 Firebase ID Token을 백엔드로 전송
- Kakao는 Kakao SDK로 직접 Access Token을 획득하여 백엔드로 전송
- 모든 소셜 로그인은 `@react-native-firebase/auth` 네이티브 모듈에 의존

## 2. Expo Go 크래시 원인

**크래시 모듈**: `@react-native-firebase/auth` → 네이티브 모듈 `RNFBAppModule`

Expo Go는 사전에 빌드된 네이티브 바이너리만 포함한다. 커스텀 네이티브 모듈(`@react-native-firebase/*`, `@react-native-google-signin/*`, `@react-native-seoul/kakao-login`)은 Expo Go에 포함되어 있지 않다.

`require('@react-native-firebase/auth')` 호출 시:
1. JS 번들에서 네이티브 모듈 브릿지를 찾으려 함
2. `NativeModules.RNFBAppModule`이 `null` → 크래시

**현재 workaround**: `try-catch`로 `require()` 감싸서 크래시 방지 → 소셜 로그인 자체가 비활성화 상태

## 3. 옵션 비교

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. Expo Go 유지 + Firebase 제거** | Firebase를 제거하고 Expo Auth Session 등으로 대체 | 코드 변경 없이 Expo Go 유지 | 대규모 리팩토링 필요, 아키텍처 변경, 토큰 흐름 재설계 |
| **B. Expo Dev Build (채택)** | `expo-dev-client`를 사용하여 커스텀 네이티브 빌드 생성 | 최소 코드 변경, Expo 생태계 유지, 네이티브 모듈 완전 지원 | 초기 빌드 시간 (5-10분), Xcode/Android Studio 필요 |
| **C. Bare Workflow (eject)** | `expo eject`로 완전한 네이티브 프로젝트 전환 | 완전한 네이티브 제어 | Expo 관리형 장점 상실, 높은 유지보수 비용 |

## 4. 채택 근거: Expo Development Build

1. **최소 코드 변경**: 기존 `socialAuth.ts`, `AuthContext.tsx`, `LoginScreen` 변경 불필요
2. **Expo 생태계 유지**: EAS Build, OTA Update, Expo Config Plugins 계속 사용 가능
3. **네이티브 모듈 완전 지원**: Firebase, Google Sign-In, Kakao SDK 모두 정상 동작
4. **개발 워크플로우**: Expo Go 대신 커스텀 빌드 앱을 시뮬레이터/기기에 설치하여 개발

## 5. 마이그레이션 가이드

### 5.1 설치

```bash
cd mobile
npx expo install expo-dev-client
```

### 5.2 설정 파일 변환

`app.json` → `app.config.ts` (동적 설정)

- Kakao `nativeAppKey`를 환경변수(`KAKAO_NATIVE_APP_KEY`)로 주입
- iOS `googleServicesFile` 추가
- Firebase/Google/Kakao config plugins 유지

### 5.3 EAS Build 프로파일

`eas.json` 생성:
- `development`: 시뮬레이터용 (iOS)
- `development:device`: 실제 기기용
- `preview`: 내부 배포용
- `production`: 스토어 출시용

### 5.4 환경변수

`.env.example` 기반으로 `.env` 파일 생성:
- `GOOGLE_WEB_CLIENT_ID`: Firebase Console에서 확인
- `KAKAO_NATIVE_APP_KEY`: Kakao Developers에서 확인

### 5.5 Firebase 설정 파일 (수동 배치)

| 파일 | 출처 | 위치 |
|------|------|------|
| `google-services.json` | Firebase Console > Android 앱 | `mobile/` |
| `GoogleService-Info.plist` | Firebase Console > iOS 앱 | `mobile/` |

이 파일들은 `.gitignore`에 등록되어 커밋되지 않음.

### 5.6 로컬 빌드 실행

```bash
# Prebuild (네이티브 프로젝트 생성)
npx expo prebuild --clean

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android

# Metro Dev Server (빌드 후)
npm start
```

### 5.7 EAS 클라우드 빌드 (선택)

```bash
# EAS CLI 설치
npm install -g eas-cli

# 로그인
eas login

# 개발 빌드 (iOS 시뮬레이터)
eas build --profile development --platform ios

# 개발 빌드 (Android)
eas build --profile development --platform android
```

## 6. 트러블슈팅 체크리스트

### 빌드 실패

- [ ] `google-services.json`이 `mobile/` 루트에 있는지 확인
- [ ] `GoogleService-Info.plist`가 `mobile/` 루트에 있는지 확인
- [ ] `.env` 파일에 `KAKAO_NATIVE_APP_KEY`가 설정되어 있는지 확인
- [ ] Xcode 15+ 설치 확인 (iOS 빌드 시)
- [ ] CocoaPods 설치 확인: `sudo gem install cocoapods`
- [ ] Node.js 20+ 사용 중인지 확인

### 런타임 에러

- [ ] `isSocialAuthAvailable()` 반환값 확인 (dev build에서는 `true`)
- [ ] Google Sign-In 시 `webClientId`가 올바른지 확인
- [ ] Firebase Console에서 Authentication > Sign-in method에 Google/Apple 활성화 확인
- [ ] Kakao Developers에서 앱 플랫폼 설정 (iOS Bundle ID, Android Package Name)

### Expo Go로 실수로 실행

```bash
# 올바른 명령어 (dev client)
npm start  # → expo start --dev-client

# 잘못된 명령어 (Expo Go)
expo start  # → 소셜 로그인 비활성화됨
```

Dev Build 앱이 설치되어 있으면 QR 코드 스캔 시 자동으로 Dev Build 앱에서 열린다.
Dev Build 앱이 없으면 Expo Go에서 열리며 소셜 로그인은 비활성화된다.

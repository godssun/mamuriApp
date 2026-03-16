# Social Login Console Setup Guide — MamuriApp

> **Last updated**: 2025-06
> **Applies to**: Expo SDK 54 + React Native Firebase + Spring Boot 4 backend
> **Bundle ID (iOS)**: `com.mamuri.app`
> **Package name (Android)**: `com.mamuri.app`

---

## Table of Contents

- [A. Overview](#a-overview)
- [B. Firebase Console Setup](#b-firebase-console-setup)
- [C. Google Setup (Google Cloud Console)](#c-google-setup-google-cloud-console)
- [D. Apple Setup (Apple Developer Portal)](#d-apple-setup-apple-developer-portal)
- [E. Kakao Setup (Kakao Developers Console)](#e-kakao-setup-kakao-developers-console)
- [F. Expo Dev Build + EAS Setup](#f-expo-dev-build--eas-setup)
- [G. Backend Verification Checklist](#g-backend-verification-checklist)
- [H. Final End-to-End Test Plan](#h-final-end-to-end-test-plan)

---

## A. Overview

### A.1 Authentication Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo RN)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              socialAuth.ts                             │  │
│  │                                                        │  │
│  │  Google ─→ @react-native-google-signin ──┐             │  │
│  │                                          ▼             │  │
│  │                              Firebase Auth SDK         │  │
│  │                              signInWithCredential()    │  │
│  │                                          │             │  │
│  │  Apple  ─→ expo-apple-authentication  ───┘             │  │
│  │                                          │             │  │
│  │                                          ▼             │  │
│  │                              Firebase ID Token ────────┼──┼──→ Backend
│  │                                                        │  │    POST /api/auth/social
│  │  Kakao  ─→ @react-native-seoul/kakao-login             │  │    { provider, token }
│  │              │                                         │  │
│  │              └── Kakao Access Token ───────────────────┼──┼──→ Backend
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  Backend (Spring Boot 4)                      │
│                                                              │
│  SocialAuthService.verifyToken()                             │
│    ├── GOOGLE / APPLE → FirebaseAuth.verifyIdToken(token)    │
│    │   (firebase-admin SDK, firebase-service-account.json)   │
│    └── KAKAO → KakaoTokenVerifier.verify(token)              │
│        (GET https://kapi.kakao.com/v2/user/me)               │
└──────────────────────────────────────────────────────────────┘
```

### A.2 Why Expo Development Build Is Required

| Expo Go | Expo Dev Build |
|---------|---------------|
| Pre-compiled binary — no custom native modules | Custom binary — includes all native modules |
| `@react-native-firebase/*` → crash (`RNFBAppModule` not found) | Firebase, Google Sign-In, Kakao SDK all work |
| Social login disabled (try-catch fallback) | Social login fully functional |
| No Xcode/Android Studio needed | Requires Xcode (iOS) or Android Studio (Android) for local builds |

**Conclusion**: The app MUST use Expo Dev Build (or EAS Build) to support Firebase Auth native modules.

---

## B. Firebase Console Setup

> **Console**: https://console.firebase.google.com/

### B.1 Create or Select Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** (or select an existing project)
3. Enter project name (e.g., `mamuri-app`)
4. Enable/disable Google Analytics (optional)
5. Click **Create project**

### B.2 Register Apps

#### iOS App

1. **Project Settings** (gear icon) → **General** tab → **Your apps** section
2. Click the **iOS+** button
3. **Apple bundle ID**: `com.mamuri.app`
   *(Must match `ios.bundleIdentifier` in `app.config.ts`)*
4. App nickname: `MamuriApp iOS` (optional)
5. Click **Register app**
6. **Download `GoogleService-Info.plist`** → Save to `mobile/GoogleService-Info.plist`
7. Skip remaining steps (handled by Expo config plugin)

#### Android App

1. Click the **Android** button
2. **Android package name**: `com.mamuri.app`
   *(Must match `android.package` in `app.config.ts`)*
3. App nickname: `MamuriApp Android` (optional)
4. **Debug signing certificate SHA-1**: Add later (see [Section C.3](#c3-sha-1--sha-256-fingerprints))
5. Click **Register app**
6. **Download `google-services.json`** → Save to `mobile/google-services.json`
7. Skip remaining steps (handled by Expo config plugin)

### B.3 Enable Authentication Providers

1. Go to **Build** → **Authentication** (or **Authentication** in the left sidebar)
2. Click **Get started** (if first time)
3. Go to **Sign-in method** tab

#### Enable Google

1. Click **Google** in the provider list
2. Toggle **Enable**
3. Set **Project support email** (select your email)
4. Note the **Web client ID** shown — this is the `webClientId` needed in the app
   *(Also found in `google-services.json` → `client[0].oauth_client` where `client_type: 3`)*
5. Click **Save**

#### Enable Apple

1. Click **Apple** in the provider list
2. Toggle **Enable**
3. **For native iOS apps only**: You can leave Service ID, Team ID, Key ID, and Private Key **blank**
   - Firebase uses the identity token from the Apple SDK directly
   - These fields are only required for web-based Apple Sign-In
4. Click **Save**

### B.4 Download Config Files Summary

| Platform | File | Location in project | Firebase Console path |
|----------|------|--------------------|-----------------------|
| iOS | `GoogleService-Info.plist` | `mobile/GoogleService-Info.plist` | Project Settings → General → iOS app → Download |
| Android | `google-services.json` | `mobile/google-services.json` | Project Settings → General → Android app → Download |

> **CRITICAL**: These files are gitignored. Never commit them. Share securely (1Password, encrypted transfer, etc.)

### B.5 Bundle ID / Package Name Consistency Check

All of the following MUST be identical:

| Where | iOS value | Android value |
|-------|-----------|---------------|
| `app.config.ts` | `ios.bundleIdentifier: 'com.mamuri.app'` | `android.package: 'com.mamuri.app'` |
| Firebase Console | iOS app Bundle ID | Android app package name |
| `GoogleService-Info.plist` | `BUNDLE_ID` field | — |
| `google-services.json` | — | `client[0].client_info.android_client_info.package_name` |
| Apple Developer | App ID / Bundle ID | — |
| Kakao Developers | iOS Bundle ID | Android package name |
| Google Play Console | — | Package name |

---

## C. Google Setup (Google Cloud Console)

> **Console**: https://console.cloud.google.com/
>
> When you enable Google Sign-In in Firebase, Firebase automatically creates OAuth 2.0 client IDs in the linked Google Cloud project.

### C.1 Verify OAuth Consent Screen

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select the **same project** linked to your Firebase project
3. Navigate: **APIs & Services** → **OAuth consent screen**
4. If not configured:
   - User Type: **External**
   - Fill required fields: App name, User support email, Developer contact email
   - Add scopes: `email`, `profile`, `openid`
   - Save
5. For testing: Add test user emails under **Test users** tab
6. For production: Submit for **Google verification** when ready

### C.2 Verify OAuth 2.0 Client IDs

1. Navigate: **APIs & Services** → **Credentials**
2. Under **OAuth 2.0 Client IDs**, you should see auto-created entries:
   - **Web client** (auto created by Google Service) — this is the `webClientId`
   - **Android client for com.mamuri.app** (created when SHA-1 was added)
   - **iOS client for com.mamuri.app** (auto created)
3. Note the **Web client ID** (ends with `.apps.googleusercontent.com`)

#### Where to find `webClientId`

| Method | How |
|--------|-----|
| Firebase Console | Authentication → Sign-in method → Google → Web client ID |
| Google Cloud Console | APIs & Services → Credentials → OAuth 2.0 → Web client |
| `google-services.json` | `client[0].oauth_client[]` where `client_type: 3` → `client_id` |

Copy this value to `mobile/.env`:
```
GOOGLE_WEB_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
```

### C.3 SHA-1 / SHA-256 Fingerprints

Android requires SHA fingerprints registered in Firebase for Google Sign-In to work.

**You need fingerprints for**:
1. **Local debug keystore** (development)
2. **EAS Build keystore** (EAS managed)
3. **Google Play App Signing key** (production, if using Play App Signing)

#### Local Debug Keystore

```bash
# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep -E "SHA1:|SHA256:"

# Output example:
#   SHA1: AA:BB:CC:DD:...
#   SHA256: 11:22:33:44:...
```

#### EAS Build Keystore

```bash
# Prints all EAS-managed credentials including SHA fingerprints
eas credentials --platform android

# Select your project → select keystore → shows SHA-1 and SHA-256
```

#### Google Play App Signing Key (Production)

1. Open [Google Play Console](https://play.google.com/console/)
2. Select your app
3. Navigate: **Setup** → **App signing**
4. Copy **SHA-1 certificate fingerprint** under "App signing key certificate"
5. Also copy the **Upload key certificate** SHA-1 if different

#### Register Fingerprints in Firebase

1. Firebase Console → **Project Settings** → **General**
2. Under Android app, click **Add fingerprint**
3. Paste SHA-1 value (and optionally SHA-256)
4. Add ALL fingerprints: debug, EAS, and Play Store signing key
5. **Re-download `google-services.json`** after adding fingerprints — the file includes registered certificate hashes

### C.4 Common Google Sign-In Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `DEVELOPER_ERROR` / status code `10` | SHA-1 fingerprint not registered in Firebase, or `webClientId` mismatch | Register correct SHA-1 in Firebase → re-download `google-services.json`. Verify `webClientId` matches the Web client in Google Cloud Console. |
| `SIGN_IN_CANCELLED` / code `12501` | User cancelled the sign-in flow | Not an error. Handle gracefully in UI. |
| `SIGN_IN_REQUIRED` / code `4` | User is not signed in | Expected state. Trigger sign-in flow. |
| `invalid_audience` | The `webClientId` doesn't match any OAuth client | Ensure `GOOGLE_WEB_CLIENT_ID` in `.env` matches the Web client ID from Google Cloud Console. |
| `NETWORK_ERROR` / code `7` | No internet connection | Show retry UI. |
| Google Sign-In works on iOS but not Android | SHA-1 fingerprint missing for Android build type | Add ALL SHA-1 fingerprints (debug + EAS + Play Store). |
| `hasPlayServices` returns false | Google Play Services not installed (emulator) | Use an emulator with Google Play Services (Google APIs image). |

---

## D. Apple Setup (Apple Developer Portal)

> **Portal**: https://developer.apple.com/account/

### D.1 App ID / Bundle ID

1. Sign in to [Apple Developer](https://developer.apple.com/account/)
2. Navigate: **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **+** to register a new identifier (or find existing one)
4. Select **App IDs** → **App**
5. Description: `MamuriApp`
6. Bundle ID: **Explicit** → `com.mamuri.app`
7. Under **Capabilities**, check **Sign In with Apple**
8. Click **Continue** → **Register**

> If the App ID already exists, click on it → enable **Sign In with Apple** in the capabilities list → **Save**.

### D.2 Service ID (NOT Required for Native iOS)

For native iOS apps, you do NOT need to create a Service ID. Service IDs are only required for:
- Web-based Sign In with Apple (JavaScript SDK)
- Firebase Apple Sign-In on Android (not our use case)

**Our app uses native `expo-apple-authentication` on iOS only → Service ID is not needed.**

### D.3 Key Creation (NOT Required for Native iOS Firebase)

For native iOS flow where the app handles Apple authentication locally and passes the identity token to Firebase:
- **AuthKey (`.p8` file) is NOT required** for our use case
- Firebase Console's Apple provider configuration fields (Team ID, Key ID, Private Key) can be left blank for native iOS apps

These are only needed when Firebase needs to communicate with Apple's servers directly (web flow).

### D.4 Provisioning Profile

1. Navigate: **Certificates, Identifiers & Profiles** → **Profiles**
2. When creating an EAS build or local Xcode build, the provisioning profile is generated automatically if you use EAS-managed credentials
3. For manual management: Create a **Development** profile for the App ID `com.mamuri.app`

### D.5 App Store Connect Requirements

When submitting to the App Store:
- If your app offers **any third-party sign-in** (Google, Kakao, etc.), Apple **requires** you to also offer **Sign In with Apple** as an option
- This is enforced during App Review (App Store Review Guideline 4.8)
- Our app already includes Apple Sign-In — this requirement is met

### D.6 Common Apple Sign-In Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ERR_CANCELED` / code `1001` | User cancelled the Apple Sign-In sheet | Not an error. Handle gracefully. |
| `invalid_client` | Bundle ID mismatch between app and Apple Developer Portal | Verify `com.mamuri.app` matches exactly in Apple Developer → Identifiers. |
| `nonce mismatch` | The nonce sent to Apple doesn't match what Firebase expects | Ensure you hash the nonce with SHA256 for Apple's `signInAsync()` but pass the raw (unhashed) nonce to `FirebaseAuth.AppleAuthProvider.credential()`. |
| Sign In with Apple capability missing | The entitlement is not enabled in the App ID or provisioning profile | Enable "Sign In with Apple" capability in Apple Developer → Identifiers → your App ID. Then re-generate provisioning profile. For EAS: `eas credentials --platform ios`. |
| `ASAuthorizationError.notHandled` | The sign-in request was not handled | Ensure the app is running on a real device or simulator with iOS 13+ and an Apple ID signed in. |
| Identity token audience (`aud`) is `host.exp.Exponent` | Running in Expo Go instead of Dev Build | This is the core problem. The app MUST run in an Expo Dev Build. The `aud` field must be your bundle ID (`com.mamuri.app`). |
| Apple Sign-In not showing on Android | Expected — Apple Sign-In is iOS only | In our code, `signInWithApple()` throws `'Apple Sign-In is only available on iOS'` for non-iOS platforms. Hide the button on Android. |

---

## E. Kakao Setup (Kakao Developers Console)

> **Console**: https://developers.kakao.com/

### E.1 Create Application

1. Sign in to [Kakao Developers](https://developers.kakao.com/)
2. Navigate: **My Application** → **Add Application**
3. App name: `MamuriApp`
4. Company name: Your name or company
5. Click **Save**
6. Note the **Native app key** (네이티브 앱 키) — this is `KAKAO_NATIVE_APP_KEY`

### E.2 Platform Registration

Navigate: **My Application** → **App Settings** → **Platform**

#### iOS Platform

1. Click **Add Platform** → **iOS**
2. **Bundle ID**: `com.mamuri.app`
3. Save

#### Android Platform

1. Click **Add Platform** → **Android**
2. **Package name**: `com.mamuri.app`
3. **Key hash** (키 해시): Add debug and release key hashes

```bash
# Debug key hash (macOS)
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android | openssl sha1 -binary | openssl base64

# EAS managed key hash
# Run eas credentials → note the SHA-1 → convert to key hash:
echo "<SHA-1_HEX>" | xxd -r -p | openssl base64

# Example: If SHA-1 is "AA:BB:CC:DD:...", remove colons first:
echo "AABBCCDD..." | xxd -r -p | openssl base64
```

4. Save

### E.3 Kakao Login Activation

1. Navigate: **Product Settings** → **Kakao Login**
2. Toggle **Kakao Login Activation** → **ON**
3. Under **Consent Items** (동의항목), enable:
   - **Email** (이메일): Required (필수) or Optional (선택) — our backend requires email
   - **Profile (Nickname)** (프로필 닉네임): Optional
   - **Profile Image** (프로필 사진): Optional

### E.4 Redirect URI

For native SDK (`@react-native-seoul/kakao-login`), the redirect URI is handled automatically by the SDK using the custom URL scheme `kakao{NATIVE_APP_KEY}://oauth`.

No manual redirect URI configuration is needed in the Kakao Console for native app flows.

### E.5 Environment Variable

Copy the Native App Key to `mobile/.env`:
```
KAKAO_NATIVE_APP_KEY=your_native_app_key_here
```

This is injected into `app.config.ts` and used by the `@react-native-seoul/kakao-login` config plugin.

### E.6 Common Kakao Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `misconfigured: invalid android_key_hash or ios_bundle_id` | Platform settings don't match the actual app | Verify Bundle ID / Package name exactly matches `com.mamuri.app`. For Android, ensure the correct key hash is registered. |
| `KOE101` (invalid_client) | App key is wrong or app is disabled | Check `KAKAO_NATIVE_APP_KEY` in `.env` matches the Native App Key in Kakao Console. |
| `KOE006` | User denied consent | Handle gracefully — user cancelled. |
| `-401` / `this access token does not exist` or `already expired` | Token expired or invalid | Request a new login. If backend receives this, return appropriate error to client. |
| Email not returned (`email: null`) | User didn't consent to share email, or email scope not configured | In Kakao Console → Product Settings → Kakao Login → Consent Items: set Email to Required (필수동의). |
| Key hash mismatch on Android | Debug vs release keystore difference | Register BOTH debug and release key hashes in Kakao Console. For EAS builds, use the EAS keystore's hash. |

---

## F. Expo Dev Build + EAS Setup

### F.1 Prerequisites

- [x] `expo-dev-client` installed in `mobile/package.json`
- [x] `app.config.ts` created with Firebase config plugins
- [x] `eas.json` created with build profiles

### F.2 Config File Placement

```
mobile/
├── app.config.ts              ← Dynamic Expo config (committed)
├── eas.json                   ← EAS Build profiles (committed)
├── .env                       ← Secrets (gitignored)
├── .env.example               ← Template (committed)
├── google-services.json       ← Firebase Android config (gitignored)
├── GoogleService-Info.plist   ← Firebase iOS config (gitignored)
└── ...
```

### F.3 Environment Variables

| Variable | Source | Used By |
|----------|--------|---------|
| `GOOGLE_WEB_CLIENT_ID` | Firebase Console or `google-services.json` (`oauth_client` where `client_type: 3`) | `socialAuth.ts` → `GoogleSignin.configure()` |
| `KAKAO_NATIVE_APP_KEY` | Kakao Developers → App Settings → App Keys → Native App Key | `app.config.ts` → `@react-native-seoul/kakao-login` plugin |

**How Expo loads `.env`**:
- Expo SDK 54+ automatically reads `.env` files in the project root via Metro bundler
- Variables are available as `process.env.VARIABLE_NAME` at build time
- For EAS Cloud builds, set secrets via `eas secret:create`

```bash
# Set secrets for EAS Cloud builds
eas secret:create --scope project --name GOOGLE_WEB_CLIENT_ID --value "your-value"
eas secret:create --scope project --name KAKAO_NATIVE_APP_KEY --value "your-value"
```

### F.4 Local Development Build

```bash
cd mobile

# 1. Ensure .env and Firebase config files are in place
cp .env.example .env
# Edit .env with real values

# 2. Generate native projects
npx expo prebuild --clean

# 3. Build and run on iOS simulator
npx expo run:ios

# 4. Build and run on Android emulator
npx expo run:android

# 5. After initial build, start Metro dev server
npm start  # → expo start --dev-client
```

### F.5 EAS Cloud Build

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS simulator (development)
eas build --profile development --platform ios

# Build for Android (development)
eas build --profile development --platform android

# Build for real iOS device
eas build --profile development:device --platform ios
```

### F.6 Security Checklist

- [ ] `google-services.json` is in `.gitignore`
- [ ] `GoogleService-Info.plist` is in `.gitignore`
- [ ] `.env` is in `.gitignore`
- [ ] `firebase-service-account.json` (backend) is in `.gitignore`
- [ ] No API keys or secrets are hardcoded in committed files
- [ ] EAS secrets are used for cloud builds (`eas secret:list` to verify)

---

## G. Backend Verification Checklist

### G.1 Firebase Admin SDK Setup

Our backend (`FirebaseConfig.java`) initializes Firebase Admin SDK on startup.

**Setup steps**:

1. Go to Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key** → Download JSON file
3. Rename to `firebase-service-account.json`
4. Place in `src/main/resources/firebase-service-account.json`
5. **NEVER commit this file** — add to `.gitignore`

```
# In root .gitignore or src/main/resources/.gitignore
firebase-service-account.json
```

**How it works** (`FirebaseConfig.java`):
```java
var resource = new ClassPathResource("firebase-service-account.json");
FirebaseOptions options = FirebaseOptions.builder()
    .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
    .build();
FirebaseApp.initializeApp(options);
```

### G.2 Google/Apple Token Verification

Our backend (`SocialAuthService.java`) uses Firebase Admin SDK to verify ID tokens:

```java
FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
// Extracts: uid, email, name, picture
```

**What Firebase Admin SDK checks**:
- Token signature (RSA)
- Token expiration (`exp` claim)
- Issuer (`iss` must be `https://securetoken.google.com/<project-id>`)
- Audience (`aud` must be your Firebase project ID)

**Checklist**:
- [ ] `firebase-service-account.json` is present in `src/main/resources/`
- [ ] Firebase project ID in the service account JSON matches the Firebase project used by the mobile app
- [ ] Backend starts without `"Firebase already initialized"` warning → SDK initialized successfully
- [ ] Log shows `"Firebase Admin SDK initialized successfully."`

### G.3 Kakao Token Verification

Our backend (`KakaoTokenVerifier.java`) calls Kakao's user info API directly:

```java
// GET https://kapi.kakao.com/v2/user/me
// Authorization: Bearer {kakao_access_token}
```

**What it verifies**:
- The access token is valid (200 response from Kakao)
- Extracts: id, email, nickname, profile image URL

**Checklist**:
- [ ] Backend can reach `https://kapi.kakao.com` (no firewall blocking)
- [ ] Kakao app is activated in Kakao Console
- [ ] Email consent is configured as required in Kakao Console

### G.4 Common Backend Errors

| Error | Log message | Cause | Fix |
|-------|-------------|-------|-----|
| Firebase not initialized | `"firebase-service-account.json not found"` | Service account file missing | Download from Firebase Console → Service accounts |
| `FirebaseAuthException` | `"Firebase token verification failed"` | Invalid, expired, or wrong-project token | Ensure mobile app and backend use the same Firebase project |
| Token `aud` mismatch | Verification fails silently | Mobile app built with wrong Firebase config | Re-download `google-services.json` / `GoogleService-Info.plist` and rebuild |
| Kakao 401 | `"Kakao token verification failed"` | Kakao access token expired or invalid | Client should re-authenticate. Kakao access tokens expire in ~6 hours. |
| Kakao email is null | `SOCIAL_AUTH_FAILED` | User didn't consent to email | Enable email consent as required in Kakao Console |
| `SOCIAL_PROVIDER_MISMATCH` | — | User already registered with different provider | Expected behavior. Show appropriate error message to user. |

---

## H. Final End-to-End Test Plan

### H.1 Pre-Test Checklist

- [ ] Dev Build is installed on test device(s)
- [ ] `.env` contains valid `GOOGLE_WEB_CLIENT_ID` and `KAKAO_NATIVE_APP_KEY`
- [ ] `google-services.json` and `GoogleService-Info.plist` are in `mobile/`
- [ ] Backend is running with `firebase-service-account.json` in classpath
- [ ] Backend logs show `"Firebase Admin SDK initialized successfully."`
- [ ] `npm start` shows `"Using development build"` (not Expo Go)

### H.2 iOS Device Tests

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| 1 | App launches without crash | Home/Login screen displayed | ☐ |
| 2 | `isSocialAuthAvailable()` returns `true` | Social login buttons are visible | ☐ |
| 3 | Google Sign-In — happy path | Google account picker → select account → redirect to app → logged in | ☐ |
| 4 | Google Sign-In — user cancels | Returns to login screen, no error shown | ☐ |
| 5 | Apple Sign-In — happy path | Apple sheet → Face ID / password → logged in | ☐ |
| 6 | Apple Sign-In — user cancels | Returns to login screen, no error shown | ☐ |
| 7 | Apple Sign-In — "Hide My Email" | Login succeeds, email is Apple relay address | ☐ |
| 8 | Kakao Sign-In — happy path | Kakao app/webview → consent → logged in | ☐ |
| 9 | Kakao Sign-In — user cancels | Returns to login screen, no error shown | ☐ |
| 10 | New user flow | `isNewUser: true` → nickname input screen → complete signup | ☐ |
| 11 | Returning user flow | Directly logged in, no nickname prompt | ☐ |
| 12 | Email login still works | Email/password login unaffected | ☐ |
| 13 | Logout | Signs out from Firebase + social providers | ☐ |

### H.3 Android Device Tests

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| 1 | App launches without crash | Home/Login screen displayed | ☐ |
| 2 | `isSocialAuthAvailable()` returns `true` | Social login buttons visible (Apple hidden on Android) | ☐ |
| 3 | Google Sign-In — happy path | Google account picker → select → logged in | ☐ |
| 4 | Google Sign-In — user cancels | Returns to login screen gracefully | ☐ |
| 5 | Kakao Sign-In — happy path | Kakao app/webview → consent → logged in | ☐ |
| 6 | Kakao Sign-In — user cancels | Returns to login screen gracefully | ☐ |
| 7 | Apple Sign-In button is hidden | Not shown on Android (iOS only) | ☐ |
| 8 | New user flow | Nickname input → complete signup | ☐ |
| 9 | Returning user flow | Direct login, no nickname prompt | ☐ |
| 10 | Email login still works | Email/password login unaffected | ☐ |

### H.4 Backend Token Verification Logs

Check the following in backend logs during tests:

```bash
# Successful Google/Apple login
INFO  - Firebase Admin SDK initialized successfully.
# (No error logs during verifyIdToken)

# Successful Kakao login
# (No error logs during KakaoTokenVerifier.verify)

# Failed verification (expected for invalid tokens)
ERROR - Firebase token verification failed: <reason>
ERROR - Kakao token verification failed: <reason>
```

### H.5 Release Regression Checklist

Before releasing to production:

- [ ] **All SHA-1 fingerprints registered**: debug + EAS + Play Store signing key
- [ ] **Google Cloud OAuth consent screen**: Published (not "Testing" mode) or test users added
- [ ] **Kakao Console**: All key hashes registered (debug + release)
- [ ] **Apple Developer**: Sign In with Apple capability enabled on App ID
- [ ] **Firebase**: Google and Apple providers enabled
- [ ] **Backend**: `firebase-service-account.json` deployed to production server
- [ ] **EAS secrets**: `GOOGLE_WEB_CLIENT_ID` and `KAKAO_NATIVE_APP_KEY` set for production build
- [ ] **No secrets in git**: Run `git log --all -p -- '*.json' '*.plist' '.env'` to verify
- [ ] **Provider mismatch handling**: User sees clear error when trying to login with wrong provider
- [ ] **Network error handling**: Graceful UI when device is offline
- [ ] **Token refresh**: JWT access token expiry is handled (user not logged out unexpectedly)

---
---

# 소셜 로그인 콘솔 설정 가이드 — 마무리앱 (한국어)

> **최종 업데이트**: 2025-06
> **적용 환경**: Expo SDK 54 + React Native Firebase + Spring Boot 4 백엔드
> **Bundle ID (iOS)**: `com.mamuri.app`
> **Package name (Android)**: `com.mamuri.app`

---

## 목차

- [A. 개요](#a-개요)
- [B. Firebase Console 설정](#b-firebase-console-설정)
- [C. Google 설정 (Google Cloud Console)](#c-google-설정-google-cloud-console)
- [D. Apple 설정 (Apple Developer Portal)](#d-apple-설정-apple-developer-portal)
- [E. Kakao 설정 (Kakao Developers Console)](#e-kakao-설정-kakao-developers-console)
- [F. Expo Dev Build + EAS 설정](#f-expo-dev-build--eas-설정)
- [G. 백엔드 검증 체크리스트](#g-백엔드-검증-체크리스트)
- [H. 최종 E2E 테스트 계획](#h-최종-e2e-테스트-계획)

---

## A. 개요

### A.1 인증 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│                     모바일 앱 (Expo RN)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              socialAuth.ts                             │  │
│  │                                                        │  │
│  │  Google ─→ @react-native-google-signin ──┐             │  │
│  │                                          ▼             │  │
│  │                              Firebase Auth SDK         │  │
│  │                              signInWithCredential()    │  │
│  │                                          │             │  │
│  │  Apple  ─→ expo-apple-authentication  ───┘             │  │
│  │                                          │             │  │
│  │                                          ▼             │  │
│  │                              Firebase ID Token ────────┼──┼──→ 백엔드
│  │                                                        │  │    POST /api/auth/social
│  │  Kakao  ─→ @react-native-seoul/kakao-login             │  │    { provider, token }
│  │              │                                         │  │
│  │              └── Kakao Access Token ───────────────────┼──┼──→ 백엔드
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  백엔드 (Spring Boot 4)                       │
│                                                              │
│  SocialAuthService.verifyToken()                             │
│    ├── GOOGLE / APPLE → FirebaseAuth.verifyIdToken(token)    │
│    │   (firebase-admin SDK, firebase-service-account.json)   │
│    └── KAKAO → KakaoTokenVerifier.verify(token)              │
│        (GET https://kapi.kakao.com/v2/user/me)               │
└──────────────────────────────────────────────────────────────┘
```

### A.2 Expo Development Build가 필요한 이유

| Expo Go | Expo Dev Build |
|---------|---------------|
| 사전 빌드된 바이너리 — 커스텀 네이티브 모듈 불가 | 커스텀 바이너리 — 모든 네이티브 모듈 포함 |
| `@react-native-firebase/*` → 크래시 (`RNFBAppModule` 없음) | Firebase, Google Sign-In, Kakao SDK 모두 동작 |
| 소셜 로그인 비활성화 (try-catch 폴백) | 소셜 로그인 완전 동작 |
| Xcode/Android Studio 불필요 | Xcode (iOS) 또는 Android Studio (Android) 필요 |

**결론**: Firebase Auth 네이티브 모듈을 지원하려면 Expo Dev Build (또는 EAS Build)를 반드시 사용해야 한다.

---

## B. Firebase Console 설정

> **콘솔**: https://console.firebase.google.com/

### B.1 프로젝트 생성 또는 선택

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **프로젝트 추가** 클릭 (또는 기존 프로젝트 선택)
3. 프로젝트 이름 입력 (예: `mamuri-app`)
4. Google Analytics 활성화/비활성화 (선택)
5. **프로젝트 만들기** 클릭

### B.2 앱 등록

#### iOS 앱

1. **프로젝트 설정** (톱니바퀴 아이콘) → **일반** 탭 → **내 앱** 섹션
2. **iOS+** 버튼 클릭
3. **Apple 번들 ID**: `com.mamuri.app`
   *(`app.config.ts`의 `ios.bundleIdentifier`와 반드시 일치해야 함)*
4. 앱 닉네임: `MamuriApp iOS` (선택)
5. **앱 등록** 클릭
6. **`GoogleService-Info.plist` 다운로드** → `mobile/GoogleService-Info.plist`에 저장
7. 나머지 단계 건너뛰기 (Expo config plugin이 처리)

#### Android 앱

1. **Android** 버튼 클릭
2. **Android 패키지 이름**: `com.mamuri.app`
   *(`app.config.ts`의 `android.package`와 반드시 일치해야 함)*
3. 앱 닉네임: `MamuriApp Android` (선택)
4. **디버그 서명 인증서 SHA-1**: 나중에 추가 ([C.3 섹션](#c3-sha-1--sha-256-지문) 참조)
5. **앱 등록** 클릭
6. **`google-services.json` 다운로드** → `mobile/google-services.json`에 저장
7. 나머지 단계 건너뛰기 (Expo config plugin이 처리)

### B.3 인증 프로바이더 활성화

1. **빌드** → **Authentication** (또는 왼쪽 사이드바의 **인증**)
2. **시작하기** 클릭 (처음인 경우)
3. **로그인 방법** 탭으로 이동

#### Google 활성화

1. 프로바이더 목록에서 **Google** 클릭
2. **사용 설정** 토글
3. **프로젝트 지원 이메일** 설정 (본인 이메일 선택)
4. 표시된 **웹 클라이언트 ID** 기록 — 앱에서 필요한 `webClientId`
   *(`google-services.json` → `client[0].oauth_client` 중 `client_type: 3`인 항목의 `client_id`에서도 확인 가능)*
5. **저장** 클릭

#### Apple 활성화

1. 프로바이더 목록에서 **Apple** 클릭
2. **사용 설정** 토글
3. **네이티브 iOS 앱 전용**: Service ID, Team ID, Key ID, Private Key 필드를 **비워둘 수 있음**
   - Firebase가 Apple SDK의 identity token을 직접 사용
   - 이 필드들은 웹 기반 Apple Sign-In에서만 필요
4. **저장** 클릭

### B.4 설정 파일 다운로드 요약

| 플랫폼 | 파일 | 프로젝트 내 위치 | Firebase Console 경로 |
|---------|------|------------------|-----------------------|
| iOS | `GoogleService-Info.plist` | `mobile/GoogleService-Info.plist` | 프로젝트 설정 → 일반 → iOS 앱 → 다운로드 |
| Android | `google-services.json` | `mobile/google-services.json` | 프로젝트 설정 → 일반 → Android 앱 → 다운로드 |

> **중요**: 이 파일들은 gitignore 처리됨. 절대 커밋하지 말 것. 안전한 방법으로 공유 (1Password, 암호화 전송 등).

### B.5 Bundle ID / Package Name 일관성 확인

아래 모든 곳의 값이 동일해야 함:

| 위치 | iOS 값 | Android 값 |
|------|--------|------------|
| `app.config.ts` | `ios.bundleIdentifier: 'com.mamuri.app'` | `android.package: 'com.mamuri.app'` |
| Firebase Console | iOS 앱 Bundle ID | Android 앱 패키지 이름 |
| `GoogleService-Info.plist` | `BUNDLE_ID` 필드 | — |
| `google-services.json` | — | `client[0].client_info.android_client_info.package_name` |
| Apple Developer | App ID / Bundle ID | — |
| Kakao Developers | iOS Bundle ID | Android 패키지 이름 |
| Google Play Console | — | 패키지 이름 |

---

## C. Google 설정 (Google Cloud Console)

> **콘솔**: https://console.cloud.google.com/
>
> Firebase에서 Google Sign-In을 활성화하면, 연결된 Google Cloud 프로젝트에 OAuth 2.0 클라이언트 ID가 자동 생성됨.

### C.1 OAuth 동의 화면 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Firebase 프로젝트와 **동일한 프로젝트** 선택
3. 이동: **API 및 서비스** → **OAuth 동의 화면**
4. 미설정 시:
   - 사용자 유형: **외부**
   - 필수 필드: 앱 이름, 사용자 지원 이메일, 개발자 연락처 이메일
   - 범위 추가: `email`, `profile`, `openid`
   - 저장
5. 테스트 중: **테스트 사용자** 탭에서 테스트 이메일 추가
6. 프로덕션: 준비되면 **Google 인증** 제출

### C.2 OAuth 2.0 클라이언트 ID 확인

1. 이동: **API 및 서비스** → **사용자 인증 정보**
2. **OAuth 2.0 클라이언트 ID** 항목에서 자동 생성된 항목 확인:
   - **Web client** (Google Service가 자동 생성) — 이것이 `webClientId`
   - **Android client for com.mamuri.app** (SHA-1 추가 시 생성)
   - **iOS client for com.mamuri.app** (자동 생성)
3. **웹 클라이언트 ID** 기록 (`.apps.googleusercontent.com`으로 끝남)

#### `webClientId` 찾는 방법

| 방법 | 경로 |
|------|------|
| Firebase Console | Authentication → 로그인 방법 → Google → 웹 클라이언트 ID |
| Google Cloud Console | API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 → 웹 클라이언트 |
| `google-services.json` | `client[0].oauth_client[]` 중 `client_type: 3` → `client_id` |

`mobile/.env`에 복사:
```
GOOGLE_WEB_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
```

### C.3 SHA-1 / SHA-256 지문

Android에서 Google Sign-In이 동작하려면 Firebase에 SHA 지문이 등록되어야 함.

**필요한 지문**:
1. **로컬 디버그 키스토어** (개발)
2. **EAS Build 키스토어** (EAS 관리)
3. **Google Play 앱 서명 키** (프로덕션, Play 앱 서명 사용 시)

#### 로컬 디버그 키스토어

```bash
# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep -E "SHA1:|SHA256:"
```

#### EAS Build 키스토어

```bash
# EAS 관리 인증 정보 출력 (SHA 지문 포함)
eas credentials --platform android
```

#### Google Play 앱 서명 키 (프로덕션)

1. [Google Play Console](https://play.google.com/console/) 접속
2. 앱 선택
3. 이동: **설정** → **앱 서명**
4. "앱 서명 키 인증서"의 **SHA-1 인증서 지문** 복사
5. "업로드 키 인증서"의 SHA-1도 복사 (다른 경우)

#### Firebase에 지문 등록

1. Firebase Console → **프로젝트 설정** → **일반**
2. Android 앱에서 **지문 추가** 클릭
3. SHA-1 값 붙여넣기 (SHA-256도 선택적 추가)
4. 모든 지문 추가: 디버그, EAS, Play Store 서명 키
5. 지문 추가 후 **`google-services.json` 다시 다운로드** — 파일에 등록된 인증서 해시가 포함됨

### C.4 Google Sign-In 자주 발생하는 에러

| 에러 | 원인 | 해결 |
|------|------|------|
| `DEVELOPER_ERROR` / 상태 코드 `10` | SHA-1 지문이 Firebase에 미등록, 또는 `webClientId` 불일치 | Firebase에 올바른 SHA-1 등록 → `google-services.json` 재다운로드. `webClientId`가 Google Cloud Console의 웹 클라이언트와 일치하는지 확인. |
| `SIGN_IN_CANCELLED` / 코드 `12501` | 사용자가 로그인 흐름 취소 | 에러 아님. UI에서 부드럽게 처리. |
| `invalid_audience` | `webClientId`가 어떤 OAuth 클라이언트와도 불일치 | `.env`의 `GOOGLE_WEB_CLIENT_ID`가 Google Cloud Console의 웹 클라이언트 ID와 일치하는지 확인. |
| iOS에서는 되는데 Android에서 안 됨 | Android 빌드 유형에 대한 SHA-1 지문 누락 | 모든 SHA-1 지문 추가 (디버그 + EAS + Play Store). |
| `hasPlayServices`가 false 반환 | Google Play 서비스 미설치 (에뮬레이터) | Google Play 서비스가 포함된 에뮬레이터 사용 (Google APIs 이미지). |

---

## D. Apple 설정 (Apple Developer Portal)

> **포털**: https://developer.apple.com/account/

### D.1 App ID / Bundle ID

1. [Apple Developer](https://developer.apple.com/account/) 로그인
2. 이동: **Certificates, Identifiers & Profiles** → **Identifiers**
3. **+** 클릭하여 새 식별자 등록 (또는 기존 항목 찾기)
4. **App IDs** → **App** 선택
5. Description: `MamuriApp`
6. Bundle ID: **Explicit** → `com.mamuri.app`
7. **Capabilities**에서 **Sign In with Apple** 체크
8. **Continue** → **Register** 클릭

> App ID가 이미 존재하면 클릭 → Capabilities에서 **Sign In with Apple** 활성화 → **Save**.

### D.2 Service ID (네이티브 iOS에서는 불필요)

네이티브 iOS 앱에서는 Service ID를 생성할 필요가 없음. Service ID는 다음에만 필요:
- 웹 기반 Sign In with Apple (JavaScript SDK)
- Android에서의 Firebase Apple Sign-In (우리 앱에는 해당 없음)

**우리 앱은 iOS에서만 네이티브 `expo-apple-authentication`을 사용 → Service ID 불필요.**

### D.3 키 생성 (네이티브 iOS Firebase에서는 불필요)

네이티브 iOS 흐름에서는:
- **AuthKey (`.p8` 파일)가 불필요**
- Firebase Console의 Apple 프로바이더 설정 (Team ID, Key ID, Private Key)을 비워둘 수 있음

Firebase가 Apple 서버와 직접 통신해야 하는 웹 흐름에서만 필요.

### D.4 Provisioning Profile

1. 이동: **Certificates, Identifiers & Profiles** → **Profiles**
2. EAS 빌드 또는 로컬 Xcode 빌드 시 EAS 관리 인증 정보를 사용하면 자동 생성
3. 수동 관리: App ID `com.mamuri.app`에 대한 **Development** 프로파일 생성

### D.5 App Store Connect 요구사항

App Store 제출 시:
- 앱이 **서드파티 로그인** (Google, Kakao 등)을 제공하면, Apple은 **Sign In with Apple도 함께 제공할 것을 의무화**
- App Review에서 강제됨 (App Store Review Guideline 4.8)
- 우리 앱은 이미 Apple Sign-In을 포함 — 이 요구사항 충족

### D.6 Apple Sign-In 자주 발생하는 에러

| 에러 | 원인 | 해결 |
|------|------|------|
| `ERR_CANCELED` / 코드 `1001` | 사용자가 Apple Sign-In 시트 취소 | 에러 아님. 부드럽게 처리. |
| `invalid_client` | 앱과 Apple Developer Portal 간 Bundle ID 불일치 | Apple Developer → Identifiers에서 `com.mamuri.app`이 정확히 일치하는지 확인. |
| `nonce mismatch` | Apple에 전송한 nonce와 Firebase가 기대하는 값 불일치 | Apple의 `signInAsync()`에는 SHA256 해시된 nonce, `FirebaseAuth.AppleAuthProvider.credential()`에는 원본(해시 안 된) nonce를 전달해야 함. |
| Sign In with Apple capability 누락 | App ID에 entitlement 미활성화 또는 provisioning profile 미갱신 | Apple Developer → Identifiers → App ID에서 "Sign In with Apple" 활성화. provisioning profile 재생성. EAS: `eas credentials --platform ios`. |
| Identity token `aud`가 `host.exp.Exponent` | Expo Go에서 실행 중 (Dev Build가 아님) | 핵심 문제. 반드시 Expo Dev Build에서 실행해야 함. `aud`가 번들 ID (`com.mamuri.app`)여야 함. |
| Android에서 Apple Sign-In 안 보임 | 예상된 동작 — Apple Sign-In은 iOS 전용 | 코드에서 `signInWithApple()`이 비iOS 플랫폼에서 에러를 던짐. Android에서는 버튼 숨김 처리. |

---

## E. Kakao 설정 (Kakao Developers Console)

> **콘솔**: https://developers.kakao.com/

### E.1 애플리케이션 생성

1. [Kakao Developers](https://developers.kakao.com/) 로그인
2. 이동: **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름: `MamuriApp`
4. 사업자명: 이름 또는 회사명
5. **저장** 클릭
6. **네이티브 앱 키** 기록 — 이것이 `KAKAO_NATIVE_APP_KEY`

### E.2 플랫폼 등록

이동: **내 애플리케이션** → **앱 설정** → **플랫폼**

#### iOS 플랫폼

1. **플랫폼 추가** → **iOS** 클릭
2. **번들 ID**: `com.mamuri.app`
3. 저장

#### Android 플랫폼

1. **플랫폼 추가** → **Android** 클릭
2. **패키지명**: `com.mamuri.app`
3. **키 해시** (Key hash): 디버그 및 릴리스 키 해시 추가

```bash
# 디버그 키 해시 (macOS)
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android | openssl sha1 -binary | openssl base64

# EAS 관리 키 해시
# eas credentials 실행 → SHA-1 확인 → 키 해시로 변환:
echo "<SHA-1_HEX_콜론제거>" | xxd -r -p | openssl base64
```

4. 저장

### E.3 카카오 로그인 활성화

1. 이동: **제품 설정** → **카카오 로그인**
2. **카카오 로그인 활성화** → **ON** 토글
3. **동의항목**에서 활성화:
   - **이메일**: 필수동의 또는 선택동의 — 백엔드에서 이메일 필수
   - **프로필(닉네임)**: 선택동의
   - **프로필 사진**: 선택동의

### E.4 Redirect URI

네이티브 SDK (`@react-native-seoul/kakao-login`)는 커스텀 URL 스킴 `kakao{NATIVE_APP_KEY}://oauth`로 리다이렉트를 자동 처리.

네이티브 앱 흐름에서는 Kakao Console에서 수동 Redirect URI 설정이 불필요.

### E.5 환경변수

네이티브 앱 키를 `mobile/.env`에 복사:
```
KAKAO_NATIVE_APP_KEY=네이티브_앱_키_여기에
```

`app.config.ts`에 주입되어 `@react-native-seoul/kakao-login` config plugin에서 사용됨.

### E.6 Kakao 자주 발생하는 에러

| 에러 | 원인 | 해결 |
|------|------|------|
| `misconfigured: invalid android_key_hash or ios_bundle_id` | 플랫폼 설정이 실제 앱과 불일치 | Bundle ID / Package name이 `com.mamuri.app`과 정확히 일치하는지 확인. Android는 올바른 키 해시 등록 확인. |
| `KOE101` (invalid_client) | 앱 키가 틀렸거나 앱이 비활성화됨 | `.env`의 `KAKAO_NATIVE_APP_KEY`가 Kakao Console의 네이티브 앱 키와 일치하는지 확인. |
| `KOE006` | 사용자가 동의를 거부함 | 부드럽게 처리 — 사용자 취소. |
| `-401` / `this access token does not exist` | 토큰 만료 또는 유효하지 않음 | 새 로그인 요청. 백엔드에서 받으면 적절한 에러를 클라이언트에 반환. |
| 이메일이 반환 안 됨 (`email: null`) | 사용자가 이메일 공유에 미동의, 또는 이메일 스코프 미설정 | Kakao Console → 제품 설정 → 카카오 로그인 → 동의항목: 이메일을 필수동의로 설정. |
| Android 키 해시 불일치 | 디버그 vs 릴리스 키스토어 차이 | 디버그와 릴리스 키 해시를 모두 Kakao Console에 등록. EAS 빌드는 EAS 키스토어의 해시 사용. |

---

## F. Expo Dev Build + EAS 설정

### F.1 사전 요구사항

- [x] `expo-dev-client`가 `mobile/package.json`에 설치됨
- [x] Firebase config plugin이 포함된 `app.config.ts` 생성됨
- [x] 빌드 프로파일이 포함된 `eas.json` 생성됨

### F.2 설정 파일 배치

```
mobile/
├── app.config.ts              ← 동적 Expo 설정 (커밋 대상)
├── eas.json                   ← EAS Build 프로파일 (커밋 대상)
├── .env                       ← 시크릿 (gitignore)
├── .env.example               ← 템플릿 (커밋 대상)
├── google-services.json       ← Firebase Android 설정 (gitignore)
├── GoogleService-Info.plist   ← Firebase iOS 설정 (gitignore)
└── ...
```

### F.3 환경변수

| 변수 | 출처 | 사용처 |
|------|------|--------|
| `GOOGLE_WEB_CLIENT_ID` | Firebase Console 또는 `google-services.json` (`oauth_client` 중 `client_type: 3`) | `socialAuth.ts` → `GoogleSignin.configure()` |
| `KAKAO_NATIVE_APP_KEY` | Kakao Developers → 앱 설정 → 앱 키 → 네이티브 앱 키 | `app.config.ts` → `@react-native-seoul/kakao-login` 플러그인 |

**Expo가 `.env`를 로드하는 방식**:
- Expo SDK 54+는 Metro bundler를 통해 프로젝트 루트의 `.env` 파일을 자동으로 읽음
- 빌드 시점에 `process.env.VARIABLE_NAME`으로 사용 가능
- EAS 클라우드 빌드의 경우 `eas secret:create`로 시크릿 설정

```bash
# EAS 클라우드 빌드용 시크릿 설정
eas secret:create --scope project --name GOOGLE_WEB_CLIENT_ID --value "실제_값"
eas secret:create --scope project --name KAKAO_NATIVE_APP_KEY --value "실제_값"
```

### F.4 로컬 개발 빌드

```bash
cd mobile

# 1. .env와 Firebase 설정 파일 배치 확인
cp .env.example .env
# .env에 실제 값 입력

# 2. 네이티브 프로젝트 생성
npx expo prebuild --clean

# 3. iOS 시뮬레이터에서 빌드 및 실행
npx expo run:ios

# 4. Android 에뮬레이터에서 빌드 및 실행
npx expo run:android

# 5. 초기 빌드 후 Metro 개발 서버 시작
npm start  # → expo start --dev-client
```

### F.5 EAS 클라우드 빌드

```bash
# EAS CLI 전역 설치
npm install -g eas-cli

# Expo 계정 로그인
eas login

# iOS 시뮬레이터용 빌드 (개발)
eas build --profile development --platform ios

# Android 빌드 (개발)
eas build --profile development --platform android

# 실제 iOS 기기용 빌드
eas build --profile development:device --platform ios
```

### F.6 보안 체크리스트

- [ ] `google-services.json`이 `.gitignore`에 있음
- [ ] `GoogleService-Info.plist`가 `.gitignore`에 있음
- [ ] `.env`가 `.gitignore`에 있음
- [ ] `firebase-service-account.json` (백엔드)이 `.gitignore`에 있음
- [ ] 커밋된 파일에 API 키나 시크릿이 하드코딩되어 있지 않음
- [ ] EAS 시크릿이 클라우드 빌드에 설정됨 (`eas secret:list`로 확인)

---

## G. 백엔드 검증 체크리스트

### G.1 Firebase Admin SDK 설정

백엔드 (`FirebaseConfig.java`)는 시작 시 Firebase Admin SDK를 초기화.

**설정 단계**:

1. Firebase Console → **프로젝트 설정** → **서비스 계정**
2. **새 비공개 키 생성** 클릭 → JSON 파일 다운로드
3. `firebase-service-account.json`으로 이름 변경
4. `src/main/resources/firebase-service-account.json`에 배치
5. **이 파일을 절대 커밋하지 말 것** — `.gitignore`에 추가

**동작 방식** (`FirebaseConfig.java`):
```java
var resource = new ClassPathResource("firebase-service-account.json");
FirebaseOptions options = FirebaseOptions.builder()
    .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
    .build();
FirebaseApp.initializeApp(options);
```

### G.2 Google/Apple 토큰 검증

백엔드 (`SocialAuthService.java`)는 Firebase Admin SDK로 ID Token 검증:

```java
FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
// 추출: uid, email, name, picture
```

**Firebase Admin SDK가 확인하는 항목**:
- 토큰 서명 (RSA)
- 토큰 만료 (`exp` 클레임)
- 발급자 (`iss`가 `https://securetoken.google.com/<project-id>`여야 함)
- 대상 (`aud`가 Firebase 프로젝트 ID여야 함)

**체크리스트**:
- [ ] `firebase-service-account.json`이 `src/main/resources/`에 있음
- [ ] 서비스 계정 JSON의 Firebase 프로젝트 ID가 모바일 앱의 Firebase 프로젝트와 일치
- [ ] 백엔드 시작 시 `"Firebase Admin SDK initialized successfully."` 로그 확인
- [ ] 경고 없이 정상 초기화

### G.3 Kakao 토큰 검증

백엔드 (`KakaoTokenVerifier.java`)는 Kakao의 사용자 정보 API를 직접 호출:

```java
// GET https://kapi.kakao.com/v2/user/me
// Authorization: Bearer {kakao_access_token}
```

**검증 내용**:
- 액세스 토큰이 유효 (Kakao로부터 200 응답)
- 추출: id, email, nickname, profile image URL

**체크리스트**:
- [ ] 백엔드에서 `https://kapi.kakao.com` 접근 가능 (방화벽 미차단)
- [ ] Kakao Console에서 앱이 활성화 상태
- [ ] 이메일 동의항목이 필수동의로 설정

### G.4 백엔드 자주 발생하는 에러

| 에러 | 로그 메시지 | 원인 | 해결 |
|------|-----------|------|------|
| Firebase 미초기화 | `"firebase-service-account.json not found"` | 서비스 계정 파일 누락 | Firebase Console → 서비스 계정에서 다운로드 |
| `FirebaseAuthException` | `"Firebase token verification failed"` | 유효하지 않거나 만료된 토큰, 또는 프로젝트 불일치 | 모바일 앱과 백엔드가 같은 Firebase 프로젝트 사용하는지 확인 |
| 토큰 `aud` 불일치 | 검증이 조용히 실패 | 모바일 앱이 잘못된 Firebase 설정으로 빌드됨 | `google-services.json` / `GoogleService-Info.plist` 재다운로드 후 리빌드 |
| Kakao 401 | `"Kakao token verification failed"` | Kakao 액세스 토큰 만료 또는 유효하지 않음 | 클라이언트에서 재인증 필요. Kakao 액세스 토큰은 약 6시간 후 만료. |
| Kakao 이메일 null | `SOCIAL_AUTH_FAILED` | 사용자가 이메일 동의를 하지 않음 | Kakao Console에서 이메일을 필수동의로 활성화 |
| `SOCIAL_PROVIDER_MISMATCH` | — | 사용자가 이미 다른 프로바이더로 가입됨 | 예상된 동작. 적절한 에러 메시지를 사용자에게 표시. |

---

## H. 최종 E2E 테스트 계획

### H.1 테스트 전 체크리스트

- [ ] Dev Build가 테스트 기기에 설치됨
- [ ] `.env`에 유효한 `GOOGLE_WEB_CLIENT_ID`와 `KAKAO_NATIVE_APP_KEY`가 있음
- [ ] `google-services.json`과 `GoogleService-Info.plist`가 `mobile/`에 있음
- [ ] 백엔드가 `firebase-service-account.json`과 함께 실행 중
- [ ] 백엔드 로그에 `"Firebase Admin SDK initialized successfully."` 표시
- [ ] `npm start` 실행 시 `"Using development build"` 표시 (Expo Go 아님)

### H.2 iOS 기기 테스트

| # | 테스트 케이스 | 예상 결과 | 상태 |
|---|-------------|-----------|------|
| 1 | 앱이 크래시 없이 실행 | 홈/로그인 화면 표시 | ☐ |
| 2 | `isSocialAuthAvailable()`이 `true` 반환 | 소셜 로그인 버튼이 표시됨 | ☐ |
| 3 | Google 로그인 — 정상 | 계정 선택 → 앱으로 복귀 → 로그인 완료 | ☐ |
| 4 | Google 로그인 — 사용자 취소 | 로그인 화면으로 복귀, 에러 미표시 | ☐ |
| 5 | Apple 로그인 — 정상 | Apple 시트 → Face ID/비밀번호 → 로그인 완료 | ☐ |
| 6 | Apple 로그인 — 사용자 취소 | 로그인 화면으로 복귀, 에러 미표시 | ☐ |
| 7 | Apple 로그인 — "나의 이메일 가리기" | 로그인 성공, 이메일은 Apple 릴레이 주소 | ☐ |
| 8 | Kakao 로그인 — 정상 | 카카오 앱/웹뷰 → 동의 → 로그인 완료 | ☐ |
| 9 | Kakao 로그인 — 사용자 취소 | 로그인 화면으로 복귀, 에러 미표시 | ☐ |
| 10 | 신규 사용자 흐름 | `isNewUser: true` → 닉네임 입력 화면 → 가입 완료 | ☐ |
| 11 | 기존 사용자 흐름 | 바로 로그인, 닉네임 프롬프트 없음 | ☐ |
| 12 | 이메일 로그인 정상 동작 | 이메일/비밀번호 로그인 영향 없음 | ☐ |
| 13 | 로그아웃 | Firebase + 소셜 프로바이더 로그아웃 | ☐ |

### H.3 Android 기기 테스트

| # | 테스트 케이스 | 예상 결과 | 상태 |
|---|-------------|-----------|------|
| 1 | 앱이 크래시 없이 실행 | 홈/로그인 화면 표시 | ☐ |
| 2 | `isSocialAuthAvailable()`이 `true` 반환 | 소셜 로그인 버튼 표시 (Apple은 Android에서 숨김) | ☐ |
| 3 | Google 로그인 — 정상 | 계정 선택 → 로그인 완료 | ☐ |
| 4 | Google 로그인 — 사용자 취소 | 로그인 화면으로 부드럽게 복귀 | ☐ |
| 5 | Kakao 로그인 — 정상 | 카카오 앱/웹뷰 → 동의 → 로그인 완료 | ☐ |
| 6 | Kakao 로그인 — 사용자 취소 | 로그인 화면으로 부드럽게 복귀 | ☐ |
| 7 | Apple Sign-In 버튼 숨김 | Android에서 미표시 (iOS 전용) | ☐ |
| 8 | 신규 사용자 흐름 | 닉네임 입력 → 가입 완료 | ☐ |
| 9 | 기존 사용자 흐름 | 바로 로그인, 닉네임 프롬프트 없음 | ☐ |
| 10 | 이메일 로그인 정상 동작 | 이메일/비밀번호 로그인 영향 없음 | ☐ |

### H.4 백엔드 토큰 검증 로그

테스트 중 백엔드 로그에서 확인:

```bash
# Google/Apple 로그인 성공
INFO  - Firebase Admin SDK initialized successfully.
# (verifyIdToken 중 에러 로그 없음)

# Kakao 로그인 성공
# (KakaoTokenVerifier.verify 중 에러 로그 없음)

# 검증 실패 (유효하지 않은 토큰에서 예상됨)
ERROR - Firebase token verification failed: <reason>
ERROR - Kakao token verification failed: <reason>
```

### H.5 릴리스 리그레션 체크리스트

프로덕션 릴리스 전:

- [ ] **모든 SHA-1 지문 등록됨**: 디버그 + EAS + Play Store 서명 키
- [ ] **Google Cloud OAuth 동의 화면**: 게시됨 ("테스트" 모드 아님) 또는 테스트 사용자 추가
- [ ] **Kakao Console**: 모든 키 해시 등록 (디버그 + 릴리스)
- [ ] **Apple Developer**: App ID에 Sign In with Apple capability 활성화
- [ ] **Firebase**: Google 및 Apple 프로바이더 활성화
- [ ] **백엔드**: `firebase-service-account.json`이 프로덕션 서버에 배포됨
- [ ] **EAS 시크릿**: `GOOGLE_WEB_CLIENT_ID`와 `KAKAO_NATIVE_APP_KEY`가 프로덕션 빌드에 설정됨
- [ ] **git에 시크릿 없음**: `git log --all -p -- '*.json' '*.plist' '.env'`로 확인
- [ ] **프로바이더 불일치 처리**: 잘못된 프로바이더로 로그인 시 사용자에게 명확한 에러 표시
- [ ] **네트워크 에러 처리**: 오프라인 시 부드러운 UI
- [ ] **토큰 갱신**: JWT 액세스 토큰 만료가 처리됨 (예기치 않은 로그아웃 없음)

---

## References / 참고 자료

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [React Native Firebase — Social Auth](https://rnfirebase.io/auth/social-auth)
- [React Native Google Sign-In](https://react-native-google-signin.github.io/docs/setting-up/get-config-file)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo — Using Firebase](https://docs.expo.dev/guides/using-firebase/)
- [Apple — Sign In with Apple](https://developer.apple.com/documentation/signinwithapple)
- [Apple — Configuring Sign In with Apple](https://developer.apple.com/documentation/xcode/configuring-sign-in-with-apple)
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Firebase — Verify ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firebase — Add Admin SDK to Server](https://firebase.google.com/docs/admin/setup)
- [Kakao Login REST API](https://developers.kakao.com/docs/latest/en/kakaologin/rest-api)
- [Kakao — Getting Started (Android)](https://developers.kakao.com/docs/latest/en/android/getting-started)
- [Kakao — Application Setup](https://developers.kakao.com/docs/latest/en/getting-started/app)
- [@react-native-seoul/kakao-login](https://www.npmjs.com/package/@react-native-seoul/kakao-login)
- [EAS Build — App Credentials](https://docs.expo.dev/app-signing/app-credentials/)
- [Google Cloud — Client Authentication](https://developers.google.com/android/guides/client-auth)

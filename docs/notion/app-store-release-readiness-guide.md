# App Store Release Readiness Guide — MamuriApp

> **Last Updated:** 2026-03-15
> **App:** Mamuri — AI Diary Companion
> **Stack:** Expo (React Native) + Spring Boot + PostgreSQL
> **Target Stores:** Apple App Store + Google Play Store

---

## Table of Contents

1. [PART 1 — Current Readiness Assessment](#part-1--current-readiness-assessment)
2. [PART 2 — Store Requirements Summary](#part-2--store-requirements-summary)
3. [PART 3 — Release Checklist](#part-3--release-checklist)
4. [PART 4 — First-Pass Approval Strategy](#part-4--first-pass-approval-strategy)
5. [PART 5 — Action Plan](#part-5--action-plan)

---

## PART 1 — Current Readiness Assessment

### 1.1 Overall Score: 65% Ready

| Category | Score | Status |
|----------|-------|--------|
| App Configuration | 80% | ⚠️ App name is generic ("mobile") |
| Icons & Assets | 70% | ⚠️ Icon OK, screenshots too small |
| Account Deletion | 100% | ✅ 3-step flow fully implemented |
| Localization | 100% | ✅ 4 languages (ko, en, ja, zh) |
| Security | 40% | 🔴 API keys in repo history |
| Privacy/Legal | 20% | 🔴 No privacy policy, no ToS |
| Store Listing | 10% | 🔴 Almost nothing prepared |
| Subscription | 90% | ⚠️ Stripe configured, but App Store uses IAP |
| Build System | 85% | ✅ EAS configured |
| AI Compliance | 50% | ⚠️ Partial disclosure, missing moderation |

### 1.2 What Is Already Ready

| Item | Details | File |
|------|---------|------|
| ✅ Bundle ID / Package | `com.mamuri.app` (iOS & Android) | `app.config.ts` |
| ✅ App Icon | 1024x1024 PNG | `assets/icon.png` |
| ✅ Splash Screen | 1024x1024 PNG | `assets/splash-icon.png` |
| ✅ Adaptive Icon | 1024x1024 PNG (Android) | `assets/adaptive-icon.png` |
| ✅ Account Deletion | 3-step flow (warning → reason → password) | `DeleteAccountModalV2.tsx` |
| ✅ i18n | Korean, English, Japanese, Chinese | `src/i18n/locales/` |
| ✅ JWT Auth | Token rotation, secure storage | `AuthContext.tsx` |
| ✅ Social Login | Google + Apple Sign-In via Firebase | `socialAuth.ts` |
| ✅ EAS Build Profiles | dev, preview, production | `eas.json` |
| ✅ Production API URL | `https://api.mamuri.app/api` | `client.ts` |
| ✅ `__DEV__` Guard | API URL switches per environment | `client.ts` |
| ✅ Subscription System | Stripe integration with tiers | `SubscriptionService.java` |
| ✅ AI Disclaimer | "AI comments generated via external LLM" | i18n strings |
| ✅ Signing Config | `.gitignore` covers keys/certs | `.gitignore` |
| ✅ No `console.log` | Zero console.log/warn/debug in src/ | Verified |

### 1.3 What Is Missing (Blocking)

| # | Item | Why It Blocks | Priority |
|---|------|--------------|----------|
| 1 | **Privacy Policy URL** | Required by both stores; Apple will reject without it | 🔴 CRITICAL |
| 2 | **Terms of Service URL** | Required by Apple for apps with accounts | 🔴 CRITICAL |
| 3 | **Store Screenshots** | Current screenshots are 500x924px — need 1290x2796 (iOS) / 1080x1920+ (Android) | 🔴 CRITICAL |
| 4 | **App Name in Config** | Currently "mobile" — must be "Mamuri" or display name | 🔴 CRITICAL |
| 5 | **Store Listing Copy** | No description, keywords, category set | 🔴 CRITICAL |
| 6 | **Apple Developer Account** | $99/year membership required | 🔴 CRITICAL |
| 7 | **Google Play Developer Account** | $25 one-time fee required | 🔴 CRITICAL |
| 8 | **Reviewer Demo Account** | Apple requires test credentials for review | 🔴 CRITICAL |
| 9 | **Content Rating Questionnaire** | Must complete in both stores | 🟠 HIGH |
| 10 | **App Privacy Labels** (Apple) | Data collection disclosure | 🟠 HIGH |
| 11 | **Data Safety Section** (Google) | Data collection disclosure | 🟠 HIGH |
| 12 | **Feature Graphic** (Google) | 1024x500px required | 🟠 HIGH |
| 13 | **In-App Purchase Migration** | Apple requires IAP, not Stripe, for digital goods | 🔴 CRITICAL |

### 1.4 What Is Risky / Likely to Cause Rejection

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Stripe for subscriptions** | Apple rejects apps using external payment for digital goods | 🔴 Very High | Must use Apple IAP + Google Play Billing |
| **AI content without moderation** | Apple 4.7.1 requires content filtering + report mechanism | 🟠 High | Add report/block for AI responses |
| **Missing privacy policy** | Immediate rejection on both stores | 🔴 Very High | Host and link privacy policy page |
| **No age gate for AI content** | Apple 4.7.5 requires age restriction | 🟡 Medium | Add age rating in store, consider in-app gate |
| **Third-party AI data disclosure** | Apple 5.1.2(i) requires explicit disclosure | 🟠 High | Add consent dialog for AI data sharing |
| **"Sign in with Apple" missing flow** | Required when offering Google social login | 🟠 High | Already implemented ✅ |
| **API key in git history** | Security risk, not direct rejection cause | 🟡 Medium | Rotate keys, use EAS Secrets |

---

## PART 2 — Store Requirements Summary

### 2.1 Apple App Store Requirements

#### Technical Requirements
| Requirement | Spec | Our Status |
|-------------|------|-----------|
| Minimum iOS | iOS 15+ recommended | ✅ iOS 15.1 |
| Architecture | arm64 | ✅ (Expo handles) |
| App Icon | 1024x1024 PNG, no alpha, no rounded corners | ✅ |
| Privacy Manifest | Required for specific APIs (2024+) | ⚠️ Need to verify |
| App Transport Security | HTTPS required | ✅ Production URL is HTTPS |

#### Screenshots (Simplified 2025+)
| Device | Required Size | Min Count | Max Count |
|--------|--------------|-----------|-----------|
| 6.9" iPhone (primary) | 1290 x 2796 px | 1 | 10 |
| 6.7" iPhone | Auto-scaled from 6.9" | — | — |
| 13" iPad (if universal) | 2064 x 2752 px | 1 | 10 |

> Apple now auto-scales from the primary 6.9" size to smaller devices.

#### Metadata
| Field | Max Length | Required |
|-------|-----------|----------|
| App Name | 30 chars | ✅ |
| Subtitle | 30 chars | ✅ |
| Keywords | 100 chars | ✅ |
| Description | 4000 chars | ✅ |
| Promotional Text | 170 chars | Optional |
| Privacy Policy URL | — | ✅ Required |
| Support URL | — | ✅ Required |
| Category | — | ✅ Required |

#### AI-Specific Guidelines (Apple 4.7 + 5.1.2)
- **4.7.1**: Must include content moderation, objectionable material filtering, report mechanism, ability to block abusive content
- **4.7.5**: Age restriction for AI content exceeding app's rating
- **5.1.2(i)**: Must disclose data sharing with third-party AI, obtain explicit permission
- **2.3.1(a)**: Must not misrepresent AI capabilities

### 2.2 Google Play Store Requirements

#### Store Listing Assets
| Asset | Spec | Required |
|-------|------|----------|
| App Icon | 512x512 PNG, 32-bit, no alpha | ✅ Auto-generated |
| Feature Graphic | 1024x500 JPG/PNG, no alpha | ✅ Required |
| Screenshots (phone) | Min 320px, max 3840px per side; recommended 1080x1920 | ✅ Min 2, max 8 |
| Screenshots (tablet) | Same specs | Optional |

#### Metadata
| Field | Max Length | Required |
|-------|-----------|----------|
| App Title | 30 chars | ✅ |
| Short Description | 80 chars | ✅ |
| Full Description | 4000 chars | ✅ |
| Privacy Policy URL | — | ✅ Required |
| Category | — | ✅ Required |

#### Policy Requirements
- **Data Safety Section**: Must declare all data collected/shared
- **Account Deletion**: Must provide in-app and web-based deletion
- **Content Rating**: IARC questionnaire required
- **Target Audience**: Must declare (not for children if AI chat)
- **AI-Generated Content**: Must follow Google's generative AI policy

### 2.3 Expo EAS Requirements

| Requirement | Details |
|-------------|---------|
| EAS CLI | `eas-cli` installed globally |
| Expo Account | Required for EAS Build/Submit |
| Apple credentials | App Store Connect API key or Apple ID |
| Google credentials | Google Service Account Key (JSON) for Play Console |
| First Android upload | Must be manual (Play Store API limitation) |
| Production build | `eas build --platform all --profile production` |
| Submit command | `eas submit --platform ios` / `eas submit --platform android` |

---

## PART 3 — Release Checklist

### A. App Configuration

- [ ] **App Name**: Change `name` in `app.config.ts` from `"mobile"` to `"Mamuri"` (or `"마무리"`)
- [ ] **Slug**: Change `slug` from `"mobile"` to `"mamuri"`
- [ ] **Version**: Set `version: "1.0.0"` ✅ Already set
- [ ] **iOS Build Number**: Auto-incremented by EAS ✅
- [ ] **Android Version Code**: Auto-incremented by EAS ✅
- [ ] **Bundle Identifier**: `com.mamuri.app` ✅
- [ ] **Package Name**: `com.mamuri.app` ✅
- [ ] **App Icon**: 1024x1024 PNG ✅ Present
- [ ] **Splash Screen**: Configure `splash.backgroundColor` for brand color
- [ ] **Orientation**: Portrait ✅
- [ ] **Permissions**: Review and add usage descriptions for iOS
  - [ ] `NSPhotoLibraryUsageDescription` (if image picker used)
  - [ ] No camera/microphone/location needed ✅
- [ ] **Privacy Manifest** (iOS): Verify required reason APIs

### B. Build & Deployment

#### Signing & Certificates
- [ ] **Apple Developer Program** ($99/year): Enroll/verify membership
- [ ] **Google Play Developer** ($25): Enroll/verify membership
- [ ] **iOS Distribution Certificate**: EAS manages automatically
- [ ] **iOS Provisioning Profile**: EAS manages automatically
- [ ] **Android Upload Key**: EAS generates, Google manages signing
- [ ] **Google Service Account Key**: Create for EAS Submit

#### EAS Configuration
- [ ] **`eas.json` production profile**: ✅ Configured
- [ ] **EAS Secrets**: Move sensitive env vars to EAS Secrets
  - [ ] `GOOGLE_WEB_CLIENT_ID`
  - [ ] (Any other build-time secrets)
- [ ] **`eas submit` configuration**: Add to `eas.json`
  ```json
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "D4X7QXD8Y5"
      },
      "android": {
        "serviceAccountKeyPath": "./play-store-service-account.json",
        "track": "internal"
      }
    }
  }
  ```

#### Pre-Upload Testing
- [ ] Production build on physical iPhone
- [ ] Production build on physical Android device
- [ ] Email login/signup flow
- [ ] Google social login flow
- [ ] Apple social login flow (iOS only)
- [ ] Diary CRUD operations
- [ ] AI comment generation
- [ ] AI chat conversation
- [ ] Account deletion flow
- [ ] Settings changes persist
- [ ] Language switching works
- [ ] Deep links (if any)
- [ ] No crash on app launch
- [ ] No crash on background/foreground cycle
- [ ] Network error handling (airplane mode)

### C. Store Listing

#### Apple App Store Connect

| Field | Value | Status |
|-------|-------|--------|
| App Name | `Mamuri` (or `마무리 - AI 다이어리`) | ❌ Need to decide |
| Subtitle | `Your Daily AI Diary Companion` / `매일 함께하는 AI 일기 친구` | ❌ Need to write |
| Keywords | `diary,journal,AI,companion,mental health,wellness,daily` | ❌ Need to research |
| Category (Primary) | Lifestyle | ❌ Need to select |
| Category (Secondary) | Health & Fitness | ❌ Need to select |
| Age Rating | 12+ (AI-generated content, infrequent mature themes) | ❌ Need to set |
| Privacy Policy URL | `https://mamuri.app/privacy` | ❌ Need to create & host |
| Support URL | `https://mamuri.app/support` or email | ❌ Need to create |
| Marketing URL | `https://mamuri.app` | ❌ Optional |
| Copyright | `© 2026 Mamuri` | ❌ Need to set |
| Description | See Section C.1 below | ❌ Need to write |
| Screenshots | 1290x2796 px, 3-10 images | ❌ Need to create |
| App Preview Video | Optional, up to 30 seconds | ❌ Optional |
| Review Notes | Test account credentials + AI explanation | ❌ Need to prepare |

#### Google Play Console

| Field | Value | Status |
|-------|-------|--------|
| App Title | `Mamuri - AI Diary Companion` | ❌ Need to decide |
| Short Description | Max 80 chars | ❌ Need to write |
| Full Description | Max 4000 chars | ❌ Need to write |
| Category | Health & Fitness or Lifestyle | ❌ Need to select |
| Content Rating | Complete IARC questionnaire | ❌ Need to complete |
| Privacy Policy URL | `https://mamuri.app/privacy` | ❌ Need to create |
| Feature Graphic | 1024x500 px | ❌ Need to create |
| Screenshots | 1080x1920+ px, 2-8 images | ❌ Need to create |
| Data Safety Section | Declare all data types | ❌ Need to complete |
| Target Audience | 13+ (not for children) | ❌ Need to set |
| Contact Email | Required | ❌ Need to set |

#### C.1 — Suggested App Description (English)

```
Mamuri is your personal AI diary companion — a warm, supportive
friend who reads your daily journal and responds with empathetic,
thoughtful comments.

Write about your day, your feelings, your thoughts. Your AI
companion listens without judgment and responds with genuine warmth.

FEATURES:
• Daily diary with AI companion responses
• AI-powered conversations about your entries
• Multiple AI personality tones (warm, calm, cheerful, realistic)
• Beautiful light & dark themes
• Writing streaks to build your journaling habit
• Full localization (한국어, English, 日本語, 中文)
• Secure & private — your entries stay yours

Mamuri is not a therapist or medical professional. AI responses
are generated through an external LLM API and are designed for
emotional support, not clinical advice. If you need professional
help, please reach out to a qualified specialist.
```

#### C.2 — Suggested App Description (Korean)

```
마무리는 당신만의 AI 일기 친구입니다 — 매일 일기를 읽고 따뜻하고
공감 어린 답변을 보내주는 든든한 동반자.

오늘 있었던 일, 느꼈던 감정, 마음속 이야기를 자유롭게 적어보세요.
AI 친구가 판단 없이 귀 기울이고, 진심 어린 따뜻함으로 답해줍니다.

주요 기능:
• AI 친구가 읽어주는 매일 일기
• 일기에 대해 AI와 대화하기
• 다양한 AI 성격 톤 (따뜻한, 차분한, 밝은, 현실적인)
• 아름다운 라이트 & 다크 테마
• 연속 작성 기록으로 일기 습관 만들기
• 다국어 지원 (한국어, English, 日本語, 中文)
• 안전하고 비공개 — 나의 일기는 나만의 것

마무리는 치료사나 의료 전문가가 아닙니다. AI 응답은 외부 LLM API를
통해 생성되며, 전문 상담이 아닌 정서적 지지를 위해 설계되었습니다.
전문적인 도움이 필요하시면 자격을 갖춘 전문가에게 연락해 주세요.
```

### D. Review & Compliance

#### D.1 — Privacy Disclosures

**Apple Privacy Labels (App Privacy Details)**

| Data Type | Collected | Linked to User | Used for Tracking |
|-----------|-----------|---------------|-------------------|
| Email Address | Yes | Yes | No |
| Name (Nickname) | Yes | Yes | No |
| User Content (Diary) | Yes | Yes | No |
| Identifiers (User ID) | Yes | Yes | No |
| Authentication Data | Yes | Yes | No |
| Usage Data | No | No | No |
| Diagnostics | No | No | No |

**Google Play Data Safety Section**

| Category | Data Type | Collected | Shared | Purpose |
|----------|-----------|-----------|--------|---------|
| Personal info | Email, Name | Yes | No* | Account management |
| App activity | Diary content | Yes | Yes** | Core functionality |
| App info | Auth tokens | Yes | No | Authentication |

\* Not shared with third parties for advertising
\** Diary content is sent to OpenAI API for AI response generation — **must disclose**

#### D.2 — Account Deletion ✅

- [x] In-app deletion flow (3-step: warning → reason → password)
- [x] Backend cascade deletion of all user data
- [x] Stripe subscription cancellation on deletion
- [ ] **Web-based deletion option** (Google Play may require this)
  - Provide email-based deletion request as fallback

#### D.3 — AI / UGC Compliance

| Requirement | Apple Guideline | Status | Action Needed |
|-------------|----------------|--------|---------------|
| Content moderation | 4.7.1 | ❌ Missing | Add report/flag for AI responses |
| Objectionable content filter | 4.7.1 | ⚠️ Partial | Backend has crisis detection, need broader filter |
| Report mechanism | 4.7.1 | ❌ Missing | Add "Report this response" button |
| Block abusive content | 4.7.1 | ❌ Missing | Add ability to flag/hide AI responses |
| AI data disclosure | 5.1.2(i) | ⚠️ Partial | Add explicit consent dialog before first AI use |
| Age restriction | 4.7.5 | ❌ Missing | Set 12+ rating, consider in-app age gate |
| Accurate AI description | 2.3.1(a) | ✅ Done | AI disclaimer in settings |

#### D.4 — Reviewer Requirements

- [ ] **Test Account**: Create demo account with pre-populated data
  - Email: `reviewer@mamuri.app`
  - Password: (set during submission)
  - Pre-populate with 5-10 diary entries and AI responses
- [ ] **Review Notes**: Explain AI functionality
  ```
  This app uses OpenAI's GPT-4o-mini API to generate empathetic
  diary responses. The AI acts as a supportive companion, not a
  medical professional. Content moderation is implemented to
  filter harmful content. Users are directed to professional
  help for crisis situations.

  Test Account:
  Email: reviewer@mamuri.app
  Password: [provided separately]

  To test AI features:
  1. Create a diary entry
  2. AI companion will automatically respond
  3. Tap the AI comment to start a conversation
  ```
- [ ] **Copyright**: Confirm all assets are original or licensed

#### D.5 — Third-Party Compliance

| Item | Status | Notes |
|------|--------|-------|
| Google Sign-In | ✅ Properly configured | OAuth consent screen needed |
| Apple Sign-In | ✅ Properly configured | Required when offering Google |
| Firebase Auth | ✅ | Service account key NOT in repo |
| OpenAI API | ⚠️ | Must disclose in privacy policy |
| Stripe | 🔴 | Cannot use for iOS in-app purchases |
| Fonts | ✅ | System fonts only |
| Images | ⚠️ | Verify all assets are original |

### E. Final Pre-Submission QA

#### E.1 — Critical Path Testing

- [ ] Fresh install → signup → first diary → AI response
- [ ] Login with existing account
- [ ] Google social login → new user → nickname setup
- [ ] Apple social login → new user → nickname setup
- [ ] Write diary → receive AI comment
- [ ] Edit diary → AI comment preserved
- [ ] Delete diary → confirmation → deleted
- [ ] AI chat conversation (multiple turns)
- [ ] Change AI tone → verify response style changes
- [ ] Account deletion → all data removed → redirected to login
- [ ] App kill → reopen → still logged in (token persistence)
- [ ] Token expiry → auto-refresh → seamless experience

#### E.2 — Edge Case Testing

- [ ] No network → appropriate error messages
- [ ] Very long diary entry (5000+ chars)
- [ ] Empty diary title/content → validation
- [ ] Rapid button tapping → no double submission
- [ ] Background → foreground → state preserved
- [ ] Low memory warning → no crash
- [ ] Keyboard dismissal on all screens
- [ ] Dark mode toggle → all screens render correctly
- [ ] Language switch → all strings update

#### E.3 — Production Readiness

- [ ] Production API URL active (`https://api.mamuri.app`)
- [ ] Production database configured (not localhost)
- [ ] JWT secret is production-grade (not dev-only)
- [ ] OpenAI API key is production key
- [ ] Firebase project is production (not dev)
- [ ] No test/debug data visible to users
- [ ] No placeholder text ("Lorem ipsum", "TODO", etc.)
- [ ] No broken links in privacy policy / terms references
- [ ] Error messages are user-friendly (no stack traces)

---

## PART 4 — First-Pass Approval Strategy

### 4.1 — Top Apple Rejection Risks

| # | Risk | Likelihood | Prevention |
|---|------|-----------|------------|
| 1 | **Stripe for digital subscriptions** | 🔴 99% reject | Must migrate to Apple IAP (RevenueCat or expo-iap) |
| 2 | **Missing privacy policy** | 🔴 99% reject | Host at `mamuri.app/privacy` before submission |
| 3 | **No content moderation for AI** | 🟠 70% reject | Add report button + content filter disclosure |
| 4 | **Missing AI data disclosure** | 🟠 60% reject | Add explicit consent for OpenAI data sharing |
| 5 | **Incomplete privacy labels** | 🟠 50% reject | Fill out accurately, especially AI data sharing |
| 6 | **No reviewer test account** | 🟠 60% reject | Create pre-populated demo account |
| 7 | **Screenshots don't match app** | 🟡 30% reject | Take fresh screenshots from production build |
| 8 | **Generic app metadata** | 🟡 20% reject | Write compelling, accurate description |

#### The #1 Blocker: In-App Purchase

**Apple does not allow external payment systems (Stripe) for digital goods/services within iOS apps.** Since Mamuri's subscriptions unlock AI features (digital content), they MUST use Apple's In-App Purchase system.

**Options:**
1. **RevenueCat** (recommended): Cross-platform subscription management that wraps Apple IAP + Google Play Billing + existing Stripe
2. **expo-in-app-purchases**: Expo's built-in IAP module
3. **react-native-iap**: Community library

**Recommended approach:** Use RevenueCat — it handles both stores, receipt validation, and can sync with your existing backend subscription state.

### 4.2 — Top Google Play Rejection Risks

| # | Risk | Likelihood | Prevention |
|---|------|-----------|------------|
| 1 | **Incomplete Data Safety** | 🟠 High | Must disclose OpenAI data sharing |
| 2 | **Missing privacy policy** | 🔴 Very High | Same URL as iOS |
| 3 | **AI content policy** | 🟡 Medium | Add disclosures, follow Google's generative AI policy |
| 4 | **Content rating mismatch** | 🟡 Medium | Answer IARC questionnaire accurately |
| 5 | **Target audience** | 🟡 Medium | Set as 13+, not "for children" |

### 4.3 — Pre-Submission Preparations

**Must prepare before ANY submission:**

1. **Host privacy policy** — Create a simple webpage at `mamuri.app/privacy`
   - Cover: data collected, how used, third-party sharing (OpenAI), retention, deletion
   - Must mention AI/LLM data processing
   - Multilingual (at least Korean + English)

2. **Host terms of service** — Create at `mamuri.app/terms`

3. **Implement IAP** — Replace Stripe with Apple IAP / Google Play Billing
   - Or use RevenueCat to manage both + Stripe (web fallback)

4. **Add content moderation UI** — Even minimal:
   - "Report this response" button on AI messages
   - Backend endpoint to log reports
   - Doesn't need to be automated — manual review is acceptable for v1

5. **Add AI consent dialog** — First time user writes diary:
   - "Your diary will be processed by an AI service (OpenAI) to generate responses. Do you consent?"
   - Store consent flag in user profile

6. **Create reviewer demo account** — Pre-populated with diverse diary entries

---

## PART 5 — Action Plan

### 5.1 — "Do This First" (Top Priority, This Week)

| # | Task | Time Est. | Why First |
|---|------|-----------|-----------|
| 1 | **Create & host Privacy Policy** | 2-3 hours | Required by both stores, blocks submission |
| 2 | **Create & host Terms of Service** | 1-2 hours | Required by Apple for account-based apps |
| 3 | **Change app name** in `app.config.ts` | 5 min | Must be correct before production build |
| 4 | **Register Apple Developer Program** | 1-2 days (approval) | Takes time to approve, start ASAP |
| 5 | **Register Google Play Developer** | 1-2 days (approval) | Takes time to verify identity |
| 6 | **Rotate exposed API keys** | 1 hour | Security — OpenAI key, JWT secret |
| 7 | **Set up EAS Secrets** | 30 min | Replace hardcoded env vars |

### 5.2 — "This Week" Release Plan

**Day 1-2: Legal & Accounts**
- [ ] Write and host privacy policy (mamuri.app/privacy)
- [ ] Write and host terms of service (mamuri.app/terms)
- [ ] Link privacy policy & ToS in app (make text tappable → WebView/browser)
- [ ] Register Apple Developer Program ($99)
- [ ] Register Google Play Console ($25)
- [ ] Rotate OpenAI API key
- [ ] Generate production JWT secret

**Day 3-4: Store Compliance**
- [ ] Add AI content moderation UI (report button on AI messages)
- [ ] Add AI data consent dialog (first diary write)
- [ ] Create reviewer demo account with pre-populated data
- [ ] Update app name/slug in `app.config.ts`
- [ ] Research & decide on IAP solution (RevenueCat recommended)

**Day 5-6: Assets & Listings**
- [ ] Take proper screenshots (1290x2796 for iOS, 1080x1920 for Android)
- [ ] Create Google Play feature graphic (1024x500)
- [ ] Write store descriptions (Korean + English)
- [ ] Research keywords
- [ ] Prepare app preview video (optional but recommended)

**Day 7: Build & Submit**
- [ ] `eas build --platform all --profile production`
- [ ] Test production builds on physical devices
- [ ] Configure App Store Connect listing
- [ ] Configure Google Play Console listing
- [ ] Complete privacy labels (Apple) / data safety (Google)
- [ ] Complete content rating questionnaire
- [ ] Submit for review

### 5.3 — "Blockers Before Submission" Checklist

These MUST be resolved before submission:

| # | Blocker | Resolution | Est. Time |
|---|---------|-----------|-----------|
| 1 | 🔴 **No Privacy Policy** | Write & host at mamuri.app/privacy | 3 hours |
| 2 | 🔴 **No Terms of Service** | Write & host at mamuri.app/terms | 2 hours |
| 3 | 🔴 **Stripe on iOS** | Implement IAP (RevenueCat) or remove subscription on iOS v1 | 2-5 days |
| 4 | 🔴 **Store Screenshots** | Take new at correct dimensions | 2-3 hours |
| 5 | 🔴 **App Name = "mobile"** | Change to "Mamuri" in app.config.ts | 5 minutes |
| 6 | 🔴 **No Store Listing** | Write descriptions, set category, keywords | 2-3 hours |
| 7 | 🔴 **Developer Accounts** | Register Apple + Google accounts | 1-3 days (wait) |
| 8 | 🔴 **Reviewer Demo Account** | Create and pre-populate | 1 hour |
| 9 | 🟠 **AI Content Moderation** | Add report button on AI messages | 3-4 hours |
| 10 | 🟠 **AI Data Consent** | Add consent dialog | 2-3 hours |
| 11 | 🟠 **Privacy Labels** | Complete in App Store Connect | 1 hour |
| 12 | 🟠 **Data Safety** | Complete in Google Play Console | 1 hour |
| 13 | 🟠 **Production Backend** | Deploy to production server | 1-2 days |
| 14 | 🟡 **API Key Rotation** | Rotate OpenAI key, set prod JWT secret | 1 hour |

### 5.4 — Fastest Path to Submission

**Option A: Full Launch (Both Stores, Subscriptions)**
- Timeline: ~2-3 weeks
- Requires IAP implementation (biggest time investment)
- Recommended for revenue from day 1

**Option B: Free Launch First, Add Subscriptions Later (RECOMMENDED)**
- Timeline: ~1 week
- Launch with FREE tier only (1 AI reply/day)
- Skip IAP complexity for v1.0
- Add subscriptions in v1.1 after approval
- Fastest path to get approved and listed

**Option C: Android First**
- Timeline: ~3-5 days
- Google Play is typically faster review (hours vs days)
- No IAP requirement if using Stripe on Android (allowed)
- Launch iOS separately after IAP implementation

---

## Appendix A — Key Deadline Timeline (2025-2026)

| Date | Change | Impact |
|------|--------|--------|
| 2025-04-24 | Apple: Xcode 16 + iOS 18 SDK required | **Currently enforced** |
| 2025-08-31 | Google: Target SDK API 35 required | **Must verify** |
| 2026-01-31 | Apple: New age rating system response deadline | **Important** |
| 2026-04-28 | Apple: Xcode 26 + iOS 26 SDK required | Long-term planning |

## Appendix B — Additional Technical Notes

### Privacy Manifest (iOS)
- Required since May 2024
- Expo SDK 50+ auto-generates `PrivacyInfo.xcprivacy`
- Firebase, Google Sign-In SDKs are on Apple's required list — handled by Expo
- Consider adding `ios.config.usesNonExemptEncryption: false` to skip export compliance questions (standard encryption only)

### expo-updates (OTA Updates)
- Not currently installed — **recommended for post-launch hotfixes**
- Install: `npx expo install expo-updates`
- Only updates JavaScript bundle — native changes require new store submission
- Apple/Google prohibit OTA updates that change app's primary purpose

### Google Play App Signing
- Required for all new apps since August 2021
- Two keys: App Signing Key (Google manages) + Upload Key (developer manages)
- EAS Build integrates automatically with Play App Signing
- Upload key can be reset if lost

## Appendix C — Reference Links

### Apple
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)

### Google Play
- [Google Play Console](https://play.google.com/console/)
- [Play Store Listing Requirements](https://support.google.com/googleplay/android-developer/answer/9859152)
- [Data Safety Section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Content Rating](https://support.google.com/googleplay/android-developer/answer/188189)

### Expo/EAS
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Build for App Stores](https://docs.expo.dev/deploy/build-project/)
- [Submit to App Stores](https://docs.expo.dev/deploy/submit-to-app-stores/)

---

# 앱 스토어 출시 준비 가이드 — 마무리(MamuriApp)

> **최종 업데이트:** 2026-03-15
> **앱:** 마무리 — AI 일기 동반자
> **기술 스택:** Expo (React Native) + Spring Boot + PostgreSQL
> **대상 스토어:** Apple App Store + Google Play Store

---

## 파트 1 — 현재 준비 상태 평가

### 1.1 전체 점수: 65% 준비 완료

| 카테고리 | 점수 | 상태 |
|---------|------|------|
| 앱 설정 | 80% | ⚠️ 앱 이름이 "mobile"로 설정됨 |
| 아이콘 & 에셋 | 70% | ⚠️ 아이콘 OK, 스크린샷 너무 작음 |
| 계정 삭제 | 100% | ✅ 3단계 플로우 완전 구현 |
| 다국어 지원 | 100% | ✅ 4개 언어 (ko, en, ja, zh) |
| 보안 | 40% | 🔴 API 키가 저장소에 노출됨 |
| 개인정보/법률 | 20% | 🔴 개인정보 처리방침, 이용약관 없음 |
| 스토어 리스팅 | 10% | 🔴 거의 준비 안됨 |
| 구독 | 90% | ⚠️ Stripe 구성됨, 하지만 App Store는 IAP 필요 |
| 빌드 시스템 | 85% | ✅ EAS 구성됨 |
| AI 규정 준수 | 50% | ⚠️ 부분 공개, 콘텐츠 관리 미비 |

### 1.2 이미 준비된 항목

| 항목 | 세부 사항 | 상태 |
|------|----------|------|
| 번들 ID / 패키지 | `com.mamuri.app` (iOS & Android) | ✅ |
| 앱 아이콘 | 1024x1024 PNG | ✅ |
| 스플래시 화면 | 1024x1024 PNG | ✅ |
| 적응형 아이콘 (Android) | 1024x1024 PNG | ✅ |
| 계정 삭제 | 3단계 (경고 → 사유 → 비밀번호) | ✅ |
| 다국어 | 한국어, 영어, 일본어, 중국어 | ✅ |
| JWT 인증 | 토큰 로테이션, 보안 저장소 | ✅ |
| 소셜 로그인 | Google + Apple (Firebase) | ✅ |
| EAS 빌드 프로필 | dev, preview, production | ✅ |
| 프로덕션 API URL | `https://api.mamuri.app/api` | ✅ |
| 구독 시스템 | Stripe 연동, 다중 티어 | ✅ |
| AI 고지 | "AI 응답은 외부 LLM API로 생성됨" | ✅ |
| console.log 없음 | src/ 내 디버그 로그 0건 확인 | ✅ |

### 1.3 누락된 항목 (제출 차단 요소)

| # | 항목 | 차단 이유 | 우선순위 |
|---|------|----------|---------|
| 1 | **개인정보 처리방침 URL** | 양쪽 스토어 필수, 없으면 즉시 거부 | 🔴 긴급 |
| 2 | **서비스 이용약관 URL** | 계정 기반 앱에서 Apple 필수 | 🔴 긴급 |
| 3 | **스토어 스크린샷** | 현재 500x924px — iOS 1290x2796 / Android 1080x1920 필요 | 🔴 긴급 |
| 4 | **앱 이름 변경** | 현재 "mobile" — "Mamuri" 또는 표시 이름 필요 | 🔴 긴급 |
| 5 | **스토어 리스팅 문구** | 설명, 키워드, 카테고리 미설정 | 🔴 긴급 |
| 6 | **Apple 개발자 계정** | $99/년 멤버십 필요 | 🔴 긴급 |
| 7 | **Google Play 개발자 계정** | $25 일회성 등록비 | 🔴 긴급 |
| 8 | **심사용 데모 계정** | Apple이 테스트 계정 요구 | 🔴 긴급 |
| 9 | **인앱 결제 전환** | Apple은 디지털 상품에 Stripe 불허, IAP 필수 | 🔴 긴급 |
| 10 | **AI 콘텐츠 관리** | Apple 4.7.1 — 신고/차단 메커니즘 필요 | 🟠 높음 |

### 1.4 거부/지연 위험 요소

| 위험 | 영향 | 가능성 | 대응 |
|------|------|--------|------|
| **iOS에서 Stripe 사용** | 디지털 상품 외부 결제 시 즉시 거부 | 🔴 매우 높음 | Apple IAP로 전환 (RevenueCat 권장) |
| **AI 콘텐츠 관리 부재** | Apple 4.7.1 위반 | 🟠 높음 | 신고 버튼 + 콘텐츠 필터 추가 |
| **개인정보 처리방침 없음** | 양쪽 스토어 즉시 거부 | 🔴 매우 높음 | mamuri.app/privacy에 호스팅 |
| **AI 데이터 공유 미공개** | Apple 5.1.2(i) 위반 | 🟠 높음 | 명시적 동의 다이얼로그 추가 |

---

## 파트 2 — 스토어 요구사항 요약

### 2.1 Apple App Store 스크린샷 요구사항

| 기기 | 필수 크기 | 최소 | 최대 |
|------|----------|------|------|
| 6.9인치 iPhone (기본) | 1290 x 2796 px | 1장 | 10장 |
| 13인치 iPad (유니버설일 경우) | 2064 x 2752 px | 1장 | 10장 |

> 2025년부터 6.9인치 기본 크기만 제출하면 다른 기기에 자동 축소됩니다.

### 2.2 Google Play 스크린샷 요구사항

| 에셋 | 사양 | 필수 여부 |
|------|------|----------|
| 앱 아이콘 | 512x512 PNG | ✅ (자동 생성) |
| 피처 그래픽 | 1024x500 JPG/PNG, 알파 없음 | ✅ |
| 스크린샷 (폰) | 1080x1920+ 권장, 최소 2장 | ✅ |

### 2.3 AI 관련 가이드라인 (Apple 4.7 + 5.1.2)

- **4.7.1**: 콘텐츠 관리, 불쾌한 콘텐츠 필터링, 신고 메커니즘, 차단 기능 필수
- **4.7.5**: AI 콘텐츠가 앱 연령 등급 초과 시 연령 제한 필요
- **5.1.2(i)**: 제3자 AI에 데이터 공유 시 명시적 동의 필수
- **2.3.1(a)**: AI 기능을 오도하는 마케팅 금지

---

## 파트 3 — 첫 심사 통과 전략

### Apple 거부 가능성 TOP 3

1. **iOS에서 Stripe 사용 (99% 거부)** → Apple IAP 전환 필수 (또는 v1에서 구독 제외)
2. **개인정보 처리방침 없음 (99% 거부)** → 웹페이지 호스팅
3. **AI 콘텐츠 관리 부재 (70% 거부)** → 신고 버튼 + 필터 공개

### 가장 빠른 출시 경로 (권장)

**옵션 B: 무료 버전 먼저 출시 → 구독은 나중에 추가**
- 소요 시간: ~1주
- FREE 티어만으로 출시 (일 1회 AI 응답)
- IAP 복잡성을 v1.0에서 건너뜀
- v1.1에서 구독 추가
- 승인 → 출시까지 가장 빠른 경로

---

## 파트 4 — 액션 플랜

### 지금 당장 해야 할 일 (최우선)

| # | 작업 | 예상 시간 |
|---|------|----------|
| 1 | 개인정보 처리방침 작성 & 호스팅 | 2-3시간 |
| 2 | 서비스 이용약관 작성 & 호스팅 | 1-2시간 |
| 3 | `app.config.ts`에서 앱 이름 변경 | 5분 |
| 4 | Apple 개발자 프로그램 등록 | 1-2일 (승인 대기) |
| 5 | Google Play 개발자 등록 | 1-2일 (인증 대기) |
| 6 | 노출된 API 키 교체 | 1시간 |
| 7 | EAS Secrets 설정 | 30분 |

### 제출 전 반드시 해결해야 할 차단 요소

| # | 차단 요소 | 해결 방법 | 예상 시간 |
|---|----------|----------|----------|
| 1 | 개인정보 처리방침 없음 | mamuri.app/privacy에 호스팅 | 3시간 |
| 2 | 이용약관 없음 | mamuri.app/terms에 호스팅 | 2시간 |
| 3 | iOS Stripe 결제 | IAP 전환 또는 v1 무료 출시 | 5일 또는 0일 |
| 4 | 스크린샷 크기 부적합 | 정확한 크기로 새로 촬영 | 3시간 |
| 5 | 앱 이름 "mobile" | app.config.ts 수정 | 5분 |
| 6 | 스토어 리스팅 미작성 | 설명, 카테고리, 키워드 작성 | 3시간 |
| 7 | 개발자 계정 미등록 | Apple + Google 등록 | 1-3일 |
| 8 | 심사용 데모 계정 | 생성 및 데이터 사전 입력 | 1시간 |
| 9 | AI 콘텐츠 관리 | AI 메시지에 신고 버튼 추가 | 3-4시간 |
| 10 | AI 데이터 동의 | 동의 다이얼로그 추가 | 2-3시간 |
| 11 | 프로덕션 백엔드 배포 | 서버에 배포 | 1-2일 |

---

## 부록 — 참고 링크

- [App Store 심사 가이드라인](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect](https://developer.apple.com/help/app-store-connect/)
- [Google Play Console](https://play.google.com/console/)
- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [EAS Submit 문서](https://docs.expo.dev/submit/introduction/)

# Privacy Policy — Mamuri

**Effective Date:** April 1, 2026
**Last Updated:** April 1, 2026

---

## 1. Introduction

Mamuri ("we," "us," or "our") operates the Mamuri mobile application (the "App"). This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use our App.

By using Mamuri, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use the App.

**Contact:**
- Email: sunjunapps@gmail.com
- Developer: SUNJUN KIM
- Address: 24, Suseong-ro 276beon-gil, Jangan-gu, Suwon-si, Gyeonggi-do, Republic of Korea

---

## 2. Information We Collect

### 2.1 Account Information

When you create an account, we collect:

| Data | Purpose | Required |
|------|---------|----------|
| Email address | Account authentication, communication | Yes |
| Password | Account security (stored as bcrypt hash, never in plain text) | Yes (email signup) |
| Nickname | Personalization, displayed in-app | Yes |
| AI companion name | Personalize AI responses | Optional (default: "마음이") |

### 2.2 Social Login Information

If you sign in with Google or Apple, we receive:

| Data | Source | Purpose |
|------|--------|---------|
| OAuth provider identifier | Google / Apple | Link your social account |
| Profile image URL | Google / Apple | Display your avatar (optional) |
| Email address | Google / Apple | Account identification |

We do **not** receive or store your social media passwords. Authentication is handled securely through Firebase Authentication by Google.

### 2.3 User-Generated Content

| Data | Purpose |
|------|---------|
| Diary entries (title, content, date) | Core app functionality |
| Conversation messages with AI | AI companion interaction |

### 2.4 Automatically Collected Data

| Data | Purpose |
|------|---------|
| AI usage metrics (token count, model used) | Service quality and cost management |
| Device language preference | Localization |
| Authentication tokens | Secure session management |

### 2.5 Information We Do NOT Collect

- Location data
- Phone number
- Physical address
- Government-issued ID
- Biometric data
- Contacts or address book
- Photos (unless you upload a companion avatar)
- Browsing history
- Advertising identifiers
- Analytics or tracking data

---

## 3. How We Use Your Information

| Purpose | Data Used | Legal Basis |
|---------|-----------|-------------|
| Provide the diary service | Diary content, account info | Contract performance |
| Generate AI companion responses | Diary content, nickname, AI name | Contract performance |
| Manage your account | Email, password, auth tokens | Contract performance |
| Process subscriptions | Email, Stripe customer ID | Contract performance |
| Detect crisis content | Diary content (keyword matching) | Legitimate interest (user safety) |
| Improve service quality | Anonymized usage metrics | Legitimate interest |
| Communicate important updates | Email address | Legitimate interest |

---

## 4. AI Processing and Third-Party Data Sharing

### 4.1 OpenAI API

**This is important:** Your diary content is processed by OpenAI's API to generate AI companion responses.

**What is sent to OpenAI:**
- Your diary entry (title and content, up to 3,000 characters)
- Your nickname (for personalized responses)
- Your AI companion's name
- Recent conversation history (up to 10 messages, for conversation context)

**What is NOT sent to OpenAI:**
- Your email address
- Your password
- Your user ID
- Payment information
- Your social login credentials

**OpenAI's data handling:** OpenAI processes data according to their [API data usage policy](https://openai.com/policies/api-data-usage-policies). As of the effective date of this policy, OpenAI states that API data is not used to train their models. We recommend reviewing OpenAI's policies directly for the latest information.

**AI Model:** We currently use GPT-4o-mini. The model may change as we improve our service.

### 4.2 Firebase Authentication (Google)

We use Firebase Authentication to manage social login (Google and Apple Sign-In). Firebase processes:
- Authentication tokens
- OAuth provider identifiers
- Basic profile information from your social account

Firebase is operated by Google LLC. See [Google's Privacy Policy](https://policies.google.com/privacy).

### 4.3 Stripe (Payment Processing)

If you subscribe to a paid plan, payment is processed by Stripe, Inc. We share:
- Your email address (to create a Stripe customer record)
- Subscription plan selection

We do **not** store your credit card number, expiration date, or CVV. Stripe handles all payment card data directly. See [Stripe's Privacy Policy](https://stripe.com/privacy).

### 4.4 No Other Third-Party Sharing

We do **not**:
- Sell your personal data to anyone
- Share data with advertising networks
- Use analytics or tracking SDKs
- Share data with data brokers

---

## 5. Data Storage and Security

### 5.1 Storage

- **Server-side data** is stored in PostgreSQL databases hosted on Self-hosted, Republic of Korea.
- **Authentication tokens** on your device are stored using the platform's native secure storage (iOS Keychain / Android Keystore via expo-secure-store).
- **Passwords** are hashed using bcrypt and never stored in plain text.

### 5.2 Security Measures

- All network communication uses HTTPS/TLS encryption
- JWT access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Token reuse detection: if a refresh token is used more than once (potential theft), all sessions are immediately invalidated
- Passwords require minimum 8 characters with letters and numbers

### 5.3 Data Retention

| Data | Retention Period |
|------|-----------------|
| Active account data | Until you delete your account |
| Diary entries | Until you delete them or your account |
| AI comments and conversations | Until the associated diary is deleted or your account is deleted |
| Account deletion records | Retained indefinitely for legal compliance (email, reason, timestamp only) |
| AI usage logs | Retained indefinitely with user ID removed (anonymized) |
| Safety event records | Retained indefinitely for safety monitoring (anonymized after account deletion) |

---

## 6. Crisis Detection and Safety

Mamuri includes an automated safety system that scans diary content for keywords indicating potential crisis situations (e.g., self-harm, suicidal ideation).

**When crisis content is detected:**
- The AI companion responds with a safety message including professional help resources (Suicide Prevention Hotline: 1393, Mental Health Crisis Line: 1577-0199)
- A safety event is logged internally for monitoring
- Your subscription tier is temporarily elevated to ensure continued access to the AI companion

This feature exists to protect user safety. Crisis detection is performed locally on our servers and is **not** shared with any third party.

**Mamuri is not a substitute for professional mental health care.** If you are in crisis, please contact emergency services or a qualified mental health professional.

---

## 7. Your Rights

### 7.1 Access and Portability
You can view all your diary entries, AI comments, and conversation history within the App at any time.

### 7.2 Correction
You can edit your diary entries and update your profile information (nickname, AI companion name) at any time through the App.

### 7.3 Deletion

**Account Deletion:** You can permanently delete your account through Settings > Account > Delete Account. This is a 3-step process:
1. Review what will be deleted
2. Provide your reason (optional detail)
3. Confirm with your password

**What gets deleted:**
- Your user account and all profile information
- All diary entries and AI comments
- All conversation messages
- Your subscription (automatically cancelled if active)

**What is retained after deletion:**
- A deletion log (email, reason, timestamp) for legal compliance
- Anonymized AI usage statistics (user ID removed)
- Safety event records (for ongoing safety monitoring)

**Individual diary deletion:** You can delete individual diary entries at any time through the App. Deleting a diary also removes its associated AI comments and conversation messages.

### 7.4 Withdraw Consent
You can stop using the App at any time. Deleting your account removes your data as described above.

### 7.5 Additional Rights (EU/EEA Users)
If you are located in the EU/EEA, you may also have the right to:
- Object to processing based on legitimate interest
- Restrict processing of your data
- Lodge a complaint with your local data protection authority

To exercise these rights, contact us at sunjunapps@gmail.com.

---

## 8. International Data Transfers

Your data may be transferred to and processed in countries outside your country of residence, including:

| Service | Location | Purpose |
|---------|----------|---------|
| OpenAI | United States | AI response generation |
| Stripe | United States | Payment processing |
| Firebase | United States (Google Cloud) | Authentication |
| Mamuri Server | Republic of Korea | Primary data storage |

These transfers are necessary to provide the App's core functionality. We ensure appropriate safeguards are in place in accordance with applicable data protection laws.

---

## 9. Children's Privacy

Mamuri does not knowingly collect personal information from children under the age of 13 (or under the minimum age required by applicable law in your jurisdiction).

If you are a parent or guardian and believe your child has provided us with personal information, please contact us at sunjunapps@gmail.com and we will promptly delete such information.

---

## 10. Subscriptions

Mamuri offers the following subscription tiers:

| Tier | AI Replies Per Day | Price |
|------|-------------------|-------|
| Free | 1 | Free |
| Deluxe | 3 | ₩4,900/month |
| Premium | Unlimited | ₩9,900/month |

- New users may receive a 7-day free trial of the Deluxe tier
- Subscriptions are managed through Apple App Store / Google Play
- You can cancel your subscription at any time
- If you delete your account, your active subscription is automatically cancelled

---

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes by:
- Posting the updated policy in the App
- Updating the "Last Updated" date at the top of this document

Your continued use of the App after changes constitutes acceptance of the updated policy.

---

## 12. Contact Us

If you have questions about this Privacy Policy or wish to exercise your rights:

- **Email:** sunjunapps@gmail.com
- **Developer:** SUNJUN KIM
- **Address:** 24, Suseong-ro 276beon-gil, Jangan-gu, Suwon-si, Gyeonggi-do, Republic of Korea

---

---

# 개인정보 처리방침 — 마무리 (Mamuri)

**시행일:** 2026년 4월 1일
**최종 수정일:** 2026년 4월 1일

---

## 1. 소개

마무리("당사")는 마무리 모바일 애플리케이션("앱")을 운영합니다. 본 개인정보 처리방침은 귀하가 앱을 사용할 때 당사가 개인정보를 수집, 이용, 저장, 공유 및 보호하는 방법을 설명합니다.

마무리를 사용함으로써 본 방침에 따른 정보 수집 및 이용에 동의하게 됩니다. 동의하지 않으시면 앱을 사용하지 마시기 바랍니다.

**연락처:**
- 이메일: sunjunapps@gmail.com
- 개발자: SUNJUN KIM
- 주소: 경기도 수원시 장안구 수성로276번길 24

---

## 2. 수집하는 정보

### 2.1 계정 정보

계정 생성 시 수집하는 정보:

| 데이터 | 목적 | 필수 여부 |
|--------|------|----------|
| 이메일 주소 | 계정 인증, 커뮤니케이션 | 필수 |
| 비밀번호 | 계정 보안 (bcrypt 해시로 저장, 평문 저장 안 함) | 필수 (이메일 가입) |
| 닉네임 | 개인화, 앱 내 표시 | 필수 |
| AI 친구 이름 | AI 응답 개인화 | 선택 (기본값: "마음이") |

### 2.2 소셜 로그인 정보

Google 또는 Apple로 로그인 시 수신하는 정보:

| 데이터 | 출처 | 목적 |
|--------|------|------|
| OAuth 제공자 식별자 | Google / Apple | 소셜 계정 연결 |
| 프로필 이미지 URL | Google / Apple | 아바타 표시 (선택) |
| 이메일 주소 | Google / Apple | 계정 식별 |

소셜 미디어 비밀번호는 수신하거나 저장하지 않습니다. 인증은 Google의 Firebase Authentication을 통해 안전하게 처리됩니다.

### 2.3 사용자 생성 콘텐츠

| 데이터 | 목적 |
|--------|------|
| 일기 항목 (제목, 내용, 날짜) | 핵심 앱 기능 |
| AI와의 대화 메시지 | AI 친구 상호작용 |

### 2.4 자동 수집 데이터

| 데이터 | 목적 |
|--------|------|
| AI 사용 지표 (토큰 수, 사용 모델) | 서비스 품질 및 비용 관리 |
| 기기 언어 설정 | 다국어 지원 |
| 인증 토큰 | 안전한 세션 관리 |

### 2.5 수집하지 않는 정보

- 위치 데이터
- 전화번호
- 물리적 주소
- 정부 발급 신분증
- 생체 인식 데이터
- 연락처 또는 주소록
- 사진 (AI 친구 아바타 업로드 제외)
- 브라우징 기록
- 광고 식별자
- 분석 또는 추적 데이터

---

## 3. 정보 이용 방법

| 목적 | 사용 데이터 | 법적 근거 |
|------|-----------|----------|
| 일기 서비스 제공 | 일기 내용, 계정 정보 | 계약 이행 |
| AI 친구 응답 생성 | 일기 내용, 닉네임, AI 이름 | 계약 이행 |
| 계정 관리 | 이메일, 비밀번호, 인증 토큰 | 계약 이행 |
| 구독 처리 | 이메일, Stripe 고객 ID | 계약 이행 |
| 위기 콘텐츠 감지 | 일기 내용 (키워드 매칭) | 정당한 이익 (사용자 안전) |
| 서비스 품질 개선 | 익명화된 사용 지표 | 정당한 이익 |
| 중요 업데이트 전달 | 이메일 주소 | 정당한 이익 |

---

## 4. AI 처리 및 제3자 데이터 공유

### 4.1 OpenAI API

**중요:** 귀하의 일기 내용은 AI 친구 응답을 생성하기 위해 OpenAI의 API로 처리됩니다.

**OpenAI에 전송되는 데이터:**
- 일기 항목 (제목 및 내용, 최대 3,000자)
- 닉네임 (개인화된 응답을 위해)
- AI 친구 이름
- 최근 대화 기록 (대화 맥락을 위해 최대 10개 메시지)

**OpenAI에 전송되지 않는 데이터:**
- 이메일 주소
- 비밀번호
- 사용자 ID
- 결제 정보
- 소셜 로그인 자격 증명

**OpenAI의 데이터 처리:** OpenAI는 [API 데이터 사용 정책](https://openai.com/policies/api-data-usage-policies)에 따라 데이터를 처리합니다. 본 방침 시행일 기준으로, OpenAI는 API 데이터를 모델 학습에 사용하지 않는다고 명시하고 있습니다. 최신 정보는 OpenAI의 정책을 직접 확인하시기 바랍니다.

**AI 모델:** 현재 GPT-4o-mini를 사용하고 있습니다. 서비스 개선에 따라 모델이 변경될 수 있습니다.

### 4.2 Firebase Authentication (Google)

소셜 로그인(Google 및 Apple 로그인) 관리를 위해 Firebase Authentication을 사용합니다. Firebase가 처리하는 데이터:
- 인증 토큰
- OAuth 제공자 식별자
- 소셜 계정의 기본 프로필 정보

Firebase는 Google LLC가 운영합니다. [Google 개인정보처리방침](https://policies.google.com/privacy)을 참조하세요.

### 4.3 Stripe (결제 처리)

유료 요금제에 가입하시면 Stripe, Inc.를 통해 결제가 처리됩니다. 공유하는 데이터:
- 이메일 주소 (Stripe 고객 기록 생성용)
- 구독 요금제 선택

신용카드 번호, 만료일 또는 CVV를 저장하지 않습니다. 모든 결제 카드 데이터는 Stripe가 직접 처리합니다. [Stripe 개인정보처리방침](https://stripe.com/privacy)을 참조하세요.

### 4.4 기타 제3자 공유 없음

당사는:
- 개인 데이터를 누구에게도 판매하지 않습니다
- 광고 네트워크와 데이터를 공유하지 않습니다
- 분석 또는 추적 SDK를 사용하지 않습니다
- 데이터 브로커와 데이터를 공유하지 않습니다

---

## 5. 데이터 저장 및 보안

### 5.1 저장

- **서버 측 데이터**는 자체 호스팅, 대한민국에 호스팅된 PostgreSQL 데이터베이스에 저장됩니다.
- **인증 토큰**은 기기의 네이티브 보안 저장소(iOS Keychain / Android Keystore, expo-secure-store 사용)에 저장됩니다.
- **비밀번호**는 bcrypt로 해시되어 저장되며 평문으로 저장되지 않습니다.

### 5.2 보안 조치

- 모든 네트워크 통신에 HTTPS/TLS 암호화 사용
- JWT 액세스 토큰 1시간 후 만료
- 리프레시 토큰 7일 후 만료
- 토큰 재사용 감지: 리프레시 토큰이 두 번 이상 사용되면(잠재적 도용) 모든 세션이 즉시 무효화됨
- 비밀번호는 최소 8자, 영문자와 숫자 포함 필수

### 5.3 데이터 보존

| 데이터 | 보존 기간 |
|--------|----------|
| 활성 계정 데이터 | 계정 삭제 시까지 |
| 일기 항목 | 개별 삭제 또는 계정 삭제 시까지 |
| AI 댓글 및 대화 | 관련 일기 삭제 또는 계정 삭제 시까지 |
| 계정 삭제 기록 | 법적 준수를 위해 무기한 보존 (이메일, 사유, 타임스탬프만) |
| AI 사용 로그 | 사용자 ID 제거 후 무기한 보존 (익명화) |
| 안전 이벤트 기록 | 안전 모니터링을 위해 무기한 보존 (계정 삭제 후 익명화) |

---

## 6. 위기 감지 및 안전

마무리에는 자해, 자살 충동 등 잠재적 위기 상황을 나타내는 키워드에 대해 일기 내용을 자동으로 검사하는 안전 시스템이 포함되어 있습니다.

**위기 콘텐츠가 감지되면:**
- AI 친구가 전문적인 도움 자원을 포함한 안전 메시지로 응답합니다 (자살예방상담전화: 1393, 정신건강위기상담전화: 1577-0199)
- 안전 이벤트가 내부적으로 모니터링을 위해 기록됩니다
- AI 친구에 대한 지속적인 접근을 보장하기 위해 구독 등급이 일시적으로 상향됩니다

이 기능은 사용자 안전을 보호하기 위해 존재합니다. 위기 감지는 당사 서버에서 로컬로 수행되며 **제3자와 공유되지 않습니다.**

**마무리는 전문적인 정신건강 관리를 대체할 수 없습니다.** 위기 상황에 처해 계시면 긴급 서비스 또는 자격을 갖춘 정신건강 전문가에게 연락해 주세요.

---

## 7. 귀하의 권리

### 7.1 접근 및 이동성
앱 내에서 언제든지 모든 일기 항목, AI 댓글 및 대화 기록을 확인할 수 있습니다.

### 7.2 수정
앱을 통해 언제든지 일기 항목을 수정하고 프로필 정보(닉네임, AI 친구 이름)를 업데이트할 수 있습니다.

### 7.3 삭제

**계정 삭제:** 설정 > 계정 > 계정 삭제를 통해 계정을 영구적으로 삭제할 수 있습니다. 3단계 프로세스:
1. 삭제될 내용 확인
2. 사유 제공 (상세 내용 선택)
3. 비밀번호로 확인

**삭제되는 데이터:**
- 사용자 계정 및 모든 프로필 정보
- 모든 일기 항목 및 AI 댓글
- 모든 대화 메시지
- 구독 (활성 시 자동 취소)

**삭제 후 보존되는 데이터:**
- 삭제 로그 (이메일, 사유, 타임스탬프) — 법적 준수 목적
- 익명화된 AI 사용 통계 (사용자 ID 제거)
- 안전 이벤트 기록 (지속적인 안전 모니터링 목적)

### 7.4 동의 철회
언제든지 앱 사용을 중단할 수 있습니다. 계정 삭제 시 위에 설명된 대로 데이터가 제거됩니다.

### 7.5 추가 권리 (EU/EEA 사용자)
EU/EEA에 거주하는 경우 다음과 같은 추가 권리가 있을 수 있습니다:
- 정당한 이익에 기반한 처리에 대한 이의 제기
- 데이터 처리 제한
- 관할 데이터 보호 기관에 불만 제기

이러한 권리를 행사하려면 sunjunapps@gmail.com으로 연락해 주세요.

---

## 8. 국제 데이터 이전

귀하의 데이터는 다음을 포함하여 거주 국가 외의 국가로 이전 및 처리될 수 있습니다:

| 서비스 | 위치 | 목적 |
|--------|------|------|
| OpenAI | 미국 | AI 응답 생성 |
| Stripe | 미국 | 결제 처리 |
| Firebase | 미국 (Google Cloud) | 인증 |
| Mamuri Server | 대한민국 | 주 데이터 저장 |

이러한 이전은 앱의 핵심 기능을 제공하기 위해 필요합니다. 관련 데이터 보호법에 따라 적절한 보호 조치를 마련하고 있습니다.

---

## 9. 아동 개인정보 보호

마무리는 13세 미만의 아동(또는 해당 관할 지역의 법률에서 요구하는 최소 연령 미만)으로부터 의도적으로 개인정보를 수집하지 않습니다.

부모 또는 보호자로서 자녀가 당사에 개인정보를 제공했다고 판단되시면 sunjunapps@gmail.com으로 연락해 주시면 즉시 해당 정보를 삭제하겠습니다.

---

## 10. 구독

마무리는 다음과 같은 구독 등급을 제공합니다:

| 등급 | 일일 AI 응답 수 | 가격 |
|------|---------------|------|
| Free | 1회 | 무료 |
| Deluxe | 3회 | 월 4,900원 |
| Premium | 무제한 | 월 9,900원 |

- 신규 사용자는 Deluxe 등급의 7일 무료 체험을 받을 수 있습니다
- 구독은 Apple App Store / Google Play을 통해 관리됩니다
- 언제든지 구독을 취소할 수 있습니다
- 계정 삭제 시 활성 구독은 자동으로 취소됩니다

---

## 11. 방침 변경

본 개인정보 처리방침은 수시로 업데이트될 수 있습니다. 중요한 변경 사항은 다음을 통해 알려드립니다:
- 앱 내에 업데이트된 방침 게시
- 본 문서 상단의 "최종 수정일" 업데이트

변경 후 앱을 계속 사용하시면 업데이트된 방침에 동의하는 것으로 간주됩니다.

---

## 12. 문의

본 개인정보 처리방침에 대한 질문이 있거나 권리를 행사하고자 하는 경우:

- **이메일:** sunjunapps@gmail.com
- **개발자:** SUNJUN KIM
- **주소:** 경기도 수원시 장안구 수성로276번길 24

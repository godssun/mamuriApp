# Pre-Production Security Audit Report

**Date:** 2026-03-19
**Scope:** Backend, Deployment Infrastructure, Mobile App
**Status:** PRODUCTION BLOCKED — 7 Critical, 8 High, 9 Medium, 5 Low issues found

---

## Summary

| Severity | Count | Blocks Production |
|----------|-------|-------------------|
| CRITICAL | 7 | YES (all) |
| HIGH | 8 | 4 YES, 4 NO |
| MEDIUM | 9 | 1 YES, 8 NO |
| LOW | 5 | 0 |
| **Total** | **29** | **12 blockers** |

---

## CRITICAL Issues

### C-1. Firebase Service Account Private Key Committed to Git

**Area:** Backend
**Files:**
- `src/main/resources/firebase-service-account.json`
- `src/main/resources/mamuri-app-firebase-adminsdk-fbsvc-c6162b1ebe.json`

**Risk:** Full Firebase Admin SDK private key is in the repository. Anyone with repo access can:
- Authenticate as the service account
- Forge social login tokens
- Access Firebase Realtime Database, Firestore, Cloud Storage
- Compromise the entire social authentication system

**Fix:**
1. Immediately rotate the Firebase service account key in Firebase Console
2. Remove files from git history (`git filter-repo`)
3. Load credentials from environment variable or mounted secret at runtime

**Blocks Production:** YES

---

### C-2. Firebase Client Config Files Committed to Git (Mobile)

**Area:** Mobile
**Files:**
- `mobile/google-services.json` (Android — API key, OAuth client ID exposed)
- `mobile/GoogleService-Info.plist` (iOS — API key, client ID exposed)
- `mobile/.env` (Google Web Client ID)

**Risk:** Firebase API keys and Google OAuth client IDs are publicly visible:
- `AIzaSyAN8HIs8g0qZTg56IMNqRrIjRdJNKJA_xI` (Android)
- `AIzaSyCOUpBDenEbnvS4MSXUHkW38oA4RdkNJ3o` (iOS)
- Google OAuth client IDs for both platforms
- Project ID: `mamuri-app`

Attackers can make unauthorized Firebase calls, create fake users, or abuse Google APIs.

**Fix:**
1. `git rm --cached` all three files
2. Revoke and regenerate all exposed API keys in Google Cloud Console
3. Use EAS Build secrets for production config
4. Ensure `.gitignore` prevents re-commit

**Blocks Production:** YES

---

### C-3. Hardcoded localhost URLs in Mobile API Client

**Area:** Mobile
**Files:**
- `mobile/src/api/client.ts:29-34`
- `mobile/src/utils/avatar.ts:11-12`
- `mobile/src/screens/SettingsScreen.tsx:30-31`
- `mobile/src/screens/CompanionScreen.tsx:45-46`

**Risk:** API client uses `__DEV__` flag to route traffic:
```typescript
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = __DEV__
  ? `http://${DEV_HOST}:8080/api`
  : 'https://api.mamuri.app/api';
```
If `__DEV__` is incorrectly evaluated in a production build, all API calls go to localhost and fail silently. Avatar URLs also use hardcoded `http://localhost:8080`.

**Fix:**
- Verify `__DEV__` is correctly false in EAS production builds
- Use EAS environment variables for `API_BASE_URL`
- Remove hardcoded localhost from `avatar.ts` (use relative paths or env config)

**Blocks Production:** YES

---

### C-4. HTTPS Not Configured

**Area:** Deployment
**Files:**
- `deploy/nginx/nginx.conf:89-101` (HTTPS block commented out)

**Risk:** All traffic is HTTP only. JWT tokens, passwords, diary content, and AI responses transmit in cleartext. Man-in-the-middle attacks are trivial.

iOS and Android both block HTTP API calls by default in production builds.

**Fix:**
1. Obtain SSL certificate (Let's Encrypt)
2. Enable HTTPS server block in nginx.conf
3. Add HTTP → HTTPS redirect
4. Must be completed before mobile app connects to production

**Blocks Production:** YES

---

### C-5. No Rate Limiting on Authentication Endpoints

**Area:** Backend + Deployment
**Files:**
- `src/main/java/.../global/config/SecurityConfig.java:49` (permitAll without rate limit)
- `deploy/nginx/nginx.conf:31` (30r/s rate — too high for auth)

**Risk:** Auth endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/refresh`, `/api/auth/social`) have no effective rate limiting. Brute force credential attacks are feasible at 30 req/sec.

Backend has a rate limiter only for conversation endpoints, not auth.

**Fix:**
- Add nginx rate limit zone for auth: `limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;`
- Add backend-level rate limiting for login/signup
- Consider account lockout after 5 failed attempts

**Blocks Production:** YES

---

### C-6. Hardcoded JWT Dev Secret Fallback

**Area:** Backend
**File:** `src/main/resources/application-dev.yml:17`

**Risk:**
```yaml
jwt:
  secret: ${JWT_SECRET:dev-only-secret-key-do-not-use-in-production-minimum-32-chars}
```
If `JWT_SECRET` environment variable is not set, this fallback is used. If production accidentally uses dev profile or missing env var, any attacker with repo access can forge valid JWTs.

**Fix:**
- Remove the default value: `secret: ${JWT_SECRET}` (fail loudly if not set)
- Add startup validation that rejects secrets shorter than 32 characters
- Production `application-prod.yml` already requires env var (good), but dev fallback is dangerous

**Blocks Production:** YES (if `JWT_SECRET` is accidentally missing)

---

### C-7. TLS Configuration Allows Weak Protocols

**Area:** Deployment
**File:** `deploy/nginx/nginx.conf:96-98` (commented but will be used)

**Risk:** When HTTPS is enabled, the prepared config allows TLSv1.2 and uses `HIGH:!aNULL:!MD5` ciphers, which include weak ciphers.

**Fix:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```
Note: TLSv1.2 is still widely needed for older Android devices. Removing it entirely is premature. But ciphers must be restricted to AEAD suites only.

**Blocks Production:** YES (when HTTPS is enabled)

---

## HIGH Issues

### H-1. Missing Security Headers

**Area:** Backend + Deployment
**Files:**
- `deploy/nginx/nginx.conf:40-44` (partial headers only)
- No Spring Security headers configured

**Risk:** Missing: `Strict-Transport-Security` (HSTS), `Content-Security-Policy`, `Permissions-Policy`. Present but incomplete: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`.

Without HSTS, HTTPS can be downgraded. Without CSP, XSS attacks are easier.

**Fix:** Add in nginx:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'none'; connect-src 'self'" always;
add_header Permissions-Policy "accelerometer=(), camera=(), microphone=()" always;
```

**Blocks Production:** YES (HSTS required for HTTPS)

---

### H-2. Actuator Health Endpoint Publicly Accessible

**Area:** Backend + Deployment
**Files:**
- `src/main/java/.../config/SecurityConfig.java:50` (`.permitAll()`)
- `deploy/nginx/nginx.conf:72-76` (proxied to public)
- `src/main/resources/application-prod.yml:42` (exposure: health)

**Risk:** `/actuator/health` is accessible without authentication. Reveals system status (UP/DOWN), enables reconnaissance and DoS timing attacks.

Current mitigation: `show-details: never` is set, which is good. But the endpoint is still publicly probed.

**Fix:**
- For Blue-Green deployment, health checks happen Docker-internally (container healthcheck). Nginx-level public exposure is not needed.
- Option A: Remove from nginx public routes, keep only Docker healthcheck
- Option B: Restrict to internal IPs only in nginx

**Blocks Production:** NO (mitigated by `show-details: never`, but should fix)

---

### H-3. Incomplete AI Consent Flow (Mobile)

**Area:** Mobile
**Files:**
- `mobile/src/screens_v2/components/AiConsentModal.tsx:64` (`// TODO: 개인정보 처리방침 링크 열기`)
- `mobile/src/i18n/locales/ko.json:48` (unverified encryption claim)

**Risk:** AI consent modal has an unimplemented privacy policy link (`TODO`). Users cannot read the privacy policy before consenting. The app claims diary content is "encrypted before transmission" but this is not verified client-side.

GDPR/CCPA require informed consent with accessible privacy terms.

**Fix:**
- Implement the privacy policy link: `Linking.openURL('https://mamuri.app/privacy')`
- Verify encryption claim is accurate or rephrase to match reality

**Blocks Production:** YES (regulatory compliance)

---

### H-4. CORS Configuration Fragile

**Area:** Backend
**File:** `src/main/java/.../global/config/WebConfig.java:27-37`

**Risk:**
```java
.allowedOrigins(allowedOrigins.split(","))
.allowCredentials(true)
```
Origins are split by comma without trimming whitespace. `"origin1.com, origin2.com"` would include `" origin2.com"` (with space), which silently fails. Combined with `allowCredentials(true)`, misconfigured origins could allow unauthorized cross-site requests.

**Fix:** Use `allowedOrigins.split("\\s*,\\s*")` and validate all origins start with `https://`.

**Blocks Production:** NO (default single origin is correct, but fragile)

---

### H-5. CSRF Protection Disabled

**Area:** Backend
**File:** `src/main/java/.../config/SecurityConfig.java:43`

**Risk:** `csrf(AbstractHttpConfigurer::disable)` — CSRF is disabled globally. For a JWT-only API consumed by mobile apps, this is acceptable because:
- JWT tokens must be explicitly sent in headers
- No cookie-based auth is used
- Mobile apps don't use browser cookie jar

However, there's no code comment explaining this decision.

**Fix:** Add explicit comment explaining why CSRF is disabled, or enable it for specific endpoints.

**Blocks Production:** NO (acceptable for mobile-only JWT API)

---

### H-6. Console Error Logging in Production (Mobile)

**Area:** Mobile
**Files:** Multiple screens (8+ files with `console.error()`)
- `mobile/src/screens_v2/SettingsScreenV2.tsx:80`
- `mobile/src/screens_v2/CompanionScreenV2.tsx:83`
- `mobile/src/screens_v2/DiaryArchiveScreenV2.tsx:60`
- `mobile/src/components/ErrorBoundary.tsx:23`
- and more

**Risk:** `console.error()` calls remain in production code paths. Can leak error details, user IDs, or API response details to debugger bridge or crash reporting.

**Fix:** Create a production-safe logger that only logs in `__DEV__` mode, or use a crash reporting service (Sentry) with data masking.

**Blocks Production:** NO (but should fix)

---

### H-7. No Certificate Pinning (Mobile)

**Area:** Mobile
**File:** `mobile/src/api/client.ts` (standard fetch, no pinning)

**Risk:** Production API uses HTTPS but relies on OS-level certificate validation only. MITM attacks are possible on compromised networks with rogue CA certificates.

**Fix:** Consider `expo-certificate-transparency` or accept the risk for MVP. Certificate pinning adds maintenance burden (certificate rotation requires app update).

**Blocks Production:** NO (acceptable risk for MVP)

---

### H-8. JWT Algorithm Not Explicitly Specified

**Area:** Backend
**File:** `src/main/java/.../global/security/JwtTokenProvider.java:98,104`

**Risk:** `.signWith(secretKey)` and `.verifyWith(secretKey)` don't specify algorithm explicitly. Current jjwt v0.12.6 defaults to HS256 and rejects "none" algorithm, so this is safe today. But a library downgrade could reintroduce "none" algorithm attacks.

**Fix:** Use `.signWith(secretKey, Jwts.SIG.HS256)` for explicit algorithm specification.

**Blocks Production:** NO (safe with current library version)

---

## MEDIUM Issues

### M-1. No Database Backup Strategy

**Area:** Deployment
**File:** `deploy/docker-compose.prod.yml:32` (Docker volume only)

**Risk:** PostgreSQL data is stored in a Docker named volume (`pgdata`). No off-site backup, no backup script, no restore procedure. If the Lightsail instance fails, all user data (diaries, accounts) is lost permanently.

**Fix:**
- Create `deploy/scripts/backup-postgres.sh` with `pg_dump` to local file
- Schedule daily backup via cron
- Upload backups to S3 or off-site storage
- Document restore procedure

**Blocks Production:** YES (user data at risk)

---

### M-2. Refresh Tokens Stored Unencrypted in Database

**Area:** Backend
**Files:**
- `src/main/java/.../user/entity/User.java` (refresh_token column)
- `src/main/java/.../user/service/AuthService.java:124`

**Risk:** Refresh tokens (JWT strings) are stored in plaintext in the `refresh_token` column. A database breach exposes all valid refresh tokens with 7-day expiry window. Attacker could impersonate any user.

Current mitigation: Token rotation detects reuse (line 100-102 of AuthService), which is good.

**Fix:** Hash refresh tokens before storage using bcrypt (same as passwords).

**Blocks Production:** NO (mitigated by token rotation, but should fix)

---

### M-3. File Upload Validation Incomplete

**Area:** Backend
**File:** `src/main/java/.../global/service/FileStorageService.java:121-126`

**Risk:** File extension validation uses `filename.lastIndexOf(".")` but doesn't validate magic bytes. Double extensions (`shell.php.jpg`) aren't blocked. Default extension is `.jpg` if none provided.

Current mitigation: Content-Type is checked, and upload directory is not an executable context.

**Fix:** Add magic byte validation for image files (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`).

**Blocks Production:** NO

---

### M-4. Dev PostgreSQL Port Exposed to All Interfaces

**Area:** Deployment (dev)
**File:** `docker-compose.yml:10`

**Risk:** `ports: "5433:5432"` binds to `0.0.0.0` by default. On a developer machine, this is low risk. But if this pattern is copied to production, PostgreSQL would be directly accessible.

**Fix:** Change to `"127.0.0.1:5433:5432"`.

**Blocks Production:** NO (dev-only file, prod compose is correct)

---

### M-5. Error Responses Leak Info in Dev Mode

**Area:** Backend
**File:** `src/main/java/.../global/exception/GlobalExceptionHandler.java:87-96`

**Risk:** Dev mode returns `e.getClass().getSimpleName() + ": " + e.getMessage()` to the client. Prod mode returns generic message. The profile check uses string comparison `"dev".equals(activeProfile)` which is correct, but fragile if new profiles are added.

**Fix:** Default to hiding exception details; only show in explicitly-enabled debug mode.

**Blocks Production:** NO (prod mode already hides details)

---

### M-6. In-Memory Rate Limiter Resets on Restart

**Area:** Backend
**File:** `src/main/java/.../global/ratelimit/ConversationRateLimiter.java:28`

**Risk:** Rate limit history is stored in `ConcurrentHashMap`. On Blue-Green deployment, new container starts with empty rate limits. Users can abuse the window immediately after deployment. Also, no cleanup of stale entries (memory leak risk).

**Fix:** Acceptable for single-instance MVP. Add scheduled cleanup. Consider Redis for multi-instance.

**Blocks Production:** NO

---

### M-7. No Deploy Operation Logging

**Area:** Deployment
**Files:** `deploy/scripts/deploy.sh`, `deploy/scripts/rollback.sh`

**Risk:** No persistent log file of deployment operations. Difficult to investigate incidents or maintain audit trail.

**Fix:** Add `exec > >(tee -a /var/log/mamuri/deploy.log) 2>&1` to scripts.

**Blocks Production:** NO

---

### M-8. Mobile Logout Silently Ignores Server Errors

**Area:** Mobile
**File:** `mobile/src/api/client.ts:332-340`

**Risk:** Server-side logout (`POST /api/auth/logout`) failure is caught and silently ignored. Local tokens are cleared regardless. If network is down, server still considers the session valid.

**Fix:** Log the failure warning; consider marking the session for server-side cleanup on next opportunity.

**Blocks Production:** NO

---

### M-9. Nginx Global Request Size Too Generous

**Area:** Deployment
**File:** `deploy/nginx/nginx.conf:68`

**Risk:** `client_max_body_size 5m` applies to all endpoints including auth. Auth endpoints need at most ~1KB. Large payloads waste server resources.

**Fix:** Set per-location limits: 100K for auth, 5M for file uploads only.

**Blocks Production:** NO

---

## LOW Issues

### L-1. Stripe Webhook Missing Idempotency

**Area:** Backend
**File:** `src/main/java/.../user/controller/StripeWebhookController.java:30-52`

**Risk:** Duplicate webhook events processed twice. Could cause duplicate subscription state changes.

**Blocks Production:** NO (Stripe is currently disabled)

---

### L-2. No Account Lockout After Failed Login

**Area:** Backend
**File:** `src/main/java/.../user/service/AuthService.java:68-78`

**Risk:** Unlimited login attempts per account. Mitigated if nginx auth rate limiting (C-5) is implemented.

**Blocks Production:** NO

---

### L-3. No Nginx Log Rotation

**Area:** Deployment
**Risk:** Access logs could fill disk over time.

**Blocks Production:** NO

---

### L-4. Container Memory Limits May Be Tight

**Area:** Deployment
**File:** `deploy/docker-compose.prod.yml:57,85` (512M each)

**Risk:** Spring Boot + JPA + connection pool in 512M might OOM under load. Monitor in production.

**Blocks Production:** NO (adequate for initial traffic)

---

### L-5. `__DEV__` Flag Usage in Tests

**Area:** Mobile
**File:** `mobile/src/api/__tests__/client.test.ts:24-25`

**Risk:** Tests set `(global as any).__DEV__ = true` which is a Babel compile-time constant, not a runtime variable. Test behavior may not match production.

**Blocks Production:** NO

---

## Production Blockers Summary

The following 12 issues MUST be resolved before deployment:

| # | Issue | Area | Fix Complexity |
|---|-------|------|----------------|
| C-1 | Firebase server credentials in git | Backend | High (git history rewrite) |
| C-2 | Firebase client config in git | Mobile | High (git history rewrite) |
| C-3 | Hardcoded localhost URLs | Mobile | Low (config change) |
| C-4 | HTTPS not configured | Deployment | Medium (SSL setup) |
| C-5 | No auth rate limiting | Backend+Deploy | Medium (nginx + backend) |
| C-6 | JWT secret dev fallback | Backend | Low (remove default) |
| C-7 | Weak TLS ciphers | Deployment | Low (config change) |
| H-1 | Missing HSTS header | Deployment | Low (nginx config) |
| H-3 | AI consent TODO | Mobile | Low (implement link) |
| M-1 | No database backup | Deployment | Medium (script + cron) |

---

## Recommended Fix Order

### Phase 1: Immediate (credential rotation)
1. Rotate Firebase service account key
2. Rotate Firebase client API keys
3. `git rm --cached` all credential files
4. Clean git history with `git filter-repo`

### Phase 2: Before deployment
5. Remove JWT secret default value in dev profile
6. Implement auth rate limiting (nginx zone + backend)
7. Configure HTTPS with proper TLS ciphers
8. Add HSTS and other security headers
9. Create database backup script and cron
10. Fix localhost hardcoding in mobile API client

### Phase 3: Before app store submission
11. Implement AI consent modal privacy link
12. Remove or gate `console.error()` in production builds
13. Verify production build does not use `__DEV__` localhost paths

### Phase 4: Post-launch improvements
14. Hash refresh tokens in database
15. Add file upload magic byte validation
16. Implement account lockout
17. Add deployment logging
18. Consider certificate pinning

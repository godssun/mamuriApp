# Mamuri 앱 배포 가이드

## 날짜: 2026-03-30
## 버전: v2.0.0 (감정 일기 + 구독 + 커스텀 스티커)

---

## 배포 순서 요약

```
1. Git 정리 (커밋 → PR → main 병합)
2. 백엔드 배포 (DB migration → Docker → 운영 서버)
3. 운영 QA (실서버 기준 핵심 흐름 검증)
4. iOS 빌드 (Archive → TestFlight)
5. 실기기 검증 (TestFlight + Sandbox IAP)
6. App Store Connect 메타데이터 업데이트
7. 심사 제출
```

---

## 1. Git 정리 절차

### 현재 상태
- 현재 브랜치: `redesign/shared-components-v3`
- main 대비: **111 커밋 + 미커밋 변경 37파일**
- 원격: `origin/main`

### 안전한 정리 절차

```bash
# Step 1: 현재 변경사항 커밋
cd /Users/juns/Documents/Coding/mamuriApp
git add mobile/src/ mobile/assets/ docs/
git add src/main/  # 백엔드 변경분
git commit -m "feat: subscription MVP + custom sticker + QA fixes

- Premium subscription (RevenueCat)
- Custom sticker MVP with editor integration
- CrisisBanner i18n + V3 screen integration
- AI quota gate + diary edit fix
- Theme system redesign (5 free + 3 PRO)
- Full i18n coverage (ko/en/ja/zh)
- Diary tab navigation fix"

# Step 2: 원격 최신 가져오기
git fetch origin

# Step 3: main 브랜치 상태 확인
git log --oneline origin/main..HEAD | wc -l

# Step 4: main에서 PR 생성 (충돌 확인용)
git push origin redesign/shared-components-v3

# GitHub에서 PR 생성:
# redesign/shared-components-v3 → main
# 충돌 없으면 Squash merge

# Step 5: main 업데이트
git checkout main
git pull origin main

# Step 6: 배포 브랜치 태그
git tag v2.0.0
git push origin v2.0.0
```

### 충돌 발생 시
```bash
# main을 현재 브랜치에 먼저 merge
git fetch origin
git merge origin/main
# 충돌 해결 후
git add .
git commit -m "merge: resolve conflicts with main"
git push
```

---

## 2. 백엔드 배포

### 재배포가 필요한 이유
| 변경사항 | 파일 | 영향 |
|---------|------|------|
| 사진 rotation 필드 | `V28__photo_rotation.sql` | DB migration 필요 |
| DiaryPhoto position 필드 | `DiaryPhotoService.java` | API 응답 변경 |
| CompanionMessage 로직 | `CompanionMessageService.java` | 새 메시지 타입 |
| AI 프롬프트 업데이트 | `ai_comment_v6.txt` | 댓글 품질 변경 |

**결론: 백엔드를 먼저 배포해야 합니다.**

### 배포 전 체크리스트

```bash
# 1. 운영 서버 SSH 접속
ssh mamuri-server

# 2. 환경변수 확인
cat .env.production  # 아래 항목 확인:
# - DATABASE_URL
# - JWT_SECRET
# - AI_API_KEY (OpenAI/Claude)
# - FIREBASE_SERVICE_ACCOUNT (push 알림)
# - SPRING_PROFILES_ACTIVE=prod

# 3. DB 백업 (migration 전 필수!)
docker exec mamuri-postgres pg_dump -U mamuri mamuri > backup_$(date +%Y%m%d).sql

# 4. 코드 가져오기
cd /path/to/mamuriApp
git pull origin main

# 5. Blue-Green 배포 실행
cd deploy/scripts
./deploy.sh

# 6. 배포 후 헬스 체크
curl https://api.mamuri.app/actuator/health
# → {"status":"UP"} 확인

# 7. DB migration 확인
docker exec mamuri-active psql -U mamuri -d mamuri -c "SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 3;"
# → V28 확인
```

### 배포 후 API 검증
```bash
# 인증
curl -X POST https://api.mamuri.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'

# 일기 목록
curl https://api.mamuri.app/api/diaries \
  -H "Authorization: Bearer {token}"

# 구독 상태
curl https://api.mamuri.app/api/subscription/status \
  -H "Authorization: Bearer {token}"

# 컴패니언 프로필
curl https://api.mamuri.app/api/companion/profile \
  -H "Authorization: Bearer {token}"
```

---

## 3. 운영 QA 체크리스트

### 필수 테스트 (배포 전 반드시)

| # | 시나리오 | 확인 사항 |
|---|---------|----------|
| 1 | 회원가입 → 로그인 | 토큰 발급 정상 |
| 2 | 감정 선택 → 일기 작성 → 저장 | 일기 생성 + AI 댓글 |
| 3 | 일기 편집 → 저장 | 중복 생성 안 됨 (update) |
| 4 | 일기 상세 → AI 대화 | 대화 생성 + 한도 확인 |
| 5 | 무료 한도 초과 → 전송 차단 | 배너 + Paywall 유도 |
| 6 | Paywall 진입 | 가격 표시 + 구매 버튼 |
| 7 | 구독 후 PRO 기능 접근 | 테마/스티커/리포트 열림 |
| 8 | Restore Purchases | 기존 구매 복원 |
| 9 | 스티커 붙이기 → 저장 → 상세 | 감정+무드 스티커 표시 |
| 10 | 언어 변경 (en) | 전체 UI 영어 전환 |

### 있으면 좋은 테스트

| # | 시나리오 | 확인 사항 |
|---|---------|----------|
| 11 | 커스텀 스티커 만들기 | 사진 선택 → 저장 → 목록 |
| 12 | 커스텀 스티커 서랍 반영 | 에디터에서 사용 가능 |
| 13 | 리포트/Reflect | 데이터 표시 + PRO gate |
| 14 | CrisisBanner | 위기 플래그 시 배너 표시 |
| 15 | 소셜 로그인 (Google/Apple) | 정상 인증 |
| 16 | 로그아웃 → 재로그인 | 데이터 유지 |
| 17 | 밤하늘 테마 | 다크 모드 정상 |
| 18 | 구겨진 노트 테마 | 텍스처 화면 전체 |

---

## 4. iOS 빌드 절차

### 빌드 전 점검

```bash
cd mobile

# 1. 환경변수 확인
cat .env
# API_BASE_URL=https://api.mamuri.app/api   ← 운영 서버
# EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_iUll...  ← 프로덕션 키

# 2. 버전 확인
grep '"version"' app.config.ts
# → 1.0.0 → 2.0.0으로 업데이트

# 3. 빌드 번호 확인 (이전 제출보다 높아야 함)
grep 'buildNumber' app.config.ts

# 4. 번들 ID 확인
grep 'bundleIdentifier' app.config.ts
# → com.mamuri.app

# 5. TypeScript 빌드 확인
npx tsc --noEmit

# 6. 의존성 정리
rm -rf node_modules && npm install
```

### app.config.ts 업데이트 필요 항목

```typescript
version: '2.0.0',  // ← 업데이트
ios: {
  buildNumber: '2',  // ← 이전보다 높게
  bundleIdentifier: 'com.mamuri.app',
  // ...
}
```

### Xcode Archive → Upload

```bash
# 1. Prebuild (네이티브 프로젝트 생성/업데이트)
npx expo prebuild --platform ios --clean

# 2. Xcode에서 열기
open ios/mamuriApp.xcworkspace

# 3. Xcode 설정
# - Scheme: mamuriApp (Release)
# - Device: Any iOS Device (arm64)
# - Signing: Automatic → Team 선택
# - Build Number: 이전보다 높게

# 4. Archive
# Product → Archive (⌘⇧B 아님, Product 메뉴)

# 5. Validate App
# Organizer → 해당 Archive → Validate App → 문제 없으면 진행

# 6. Distribute App
# Organizer → Distribute App → App Store Connect → Upload
# → 자동으로 TestFlight에 올라감
```

### 또는 EAS Build 사용

```bash
# EAS로 빌드 (클라우드)
npx eas build --platform ios --profile production

# EAS로 제출
npx eas submit --platform ios
```

### TestFlight 검증

1. App Store Connect → TestFlight → 빌드 처리 완료 대기 (5~30분)
2. 내부 테스터 그룹에 추가
3. iPhone에서 TestFlight 앱 → 설치 → 테스트
4. **Sandbox 계정으로 구독 테스트** (실제 결제 안 됨)

---

## 5. App Store Connect 메타데이터

### 앱 이름
**마무리 - 감정 일기**

### 부제목
**AI와 함께 매일 기록하는 나만의 감정**

### 프로모션 텍스트 (170자)
```
감정을 스티커로 기록하고, AI 친구와 이야기를 나눠보세요.
스크랩북처럼 꾸미는 나만의 감정 일기장.
```

### 앱 설명 (4000자)

```
매일의 감정을 조용히 기록하는 공간, 마무리.

오늘 기분이 어떤가요?
좋아요, 괜찮아요, 별로예요, 힘들어요, 복잡해요 —
다섯 가지 감정 스티커로 하루를 시작해보세요.

▶ 감정을 기록하세요
귀여운 감정 스티커로 오늘의 기분을 표현하고,
세부 감정(설렘, 감사, 불안, 그리움...)까지 세밀하게 기록할 수 있어요.

▶ 스크랩북처럼 꾸며보세요
사진을 붙이고, 스티커를 올리고, 종이 테마를 골라
나만의 감성 일기장을 완성하세요.

▶ AI 친구가 곁에 있어요
일기를 쓰면 AI 친구 '마무리'가 따뜻하게 답해줘요.
판단 없이, 조언 없이, 당신의 이야기를 들어줍니다.

▶ 감정의 흐름을 돌아보세요
감정 캘린더와 주간/월간 리포트로
나의 감정 변화를 조용히 돌아볼 수 있어요.

▶ 프리미엄으로 더 특별하게
· 나만의 커스텀 스티커 만들기
· AI 대화 확장
· 구겨진 노트 등 특별한 종이 테마
· 고급 감정 리포트

마무리는 치료나 상담을 대체하지 않습니다.
힘든 순간에는 전문 상담사에게 도움을 요청하세요.

마무리와 함께, 오늘 하루도 수고했어요.
```

### 키워드 (100자)
```
감정일기,일기장,AI일기,감정기록,스크랩북,마음일기,감정캘린더,일기꾸미기,마음챙김,스티커
```

### What's New (이번 업데이트)
```
마무리가 크게 달라졌어요!

· 감정 스티커 시스템 — 매일 기분을 스티커로 기록
· 스크랩북 에디터 — 사진과 스티커로 일기 꾸미기
· AI 친구 강화 — 더 따뜻하고 세심한 대화
· 감정 캘린더 — 한 달의 감정 흐름을 한눈에
· 프리미엄 구독 — 커스텀 스티커, 특별 테마, AI 확장
· 다국어 지원 — 한국어, English, 日本語, 中文
```

### 심사용 노트 (Review Notes)

```
데모 계정:
Email: review@mamuri.app
Password: ReviewTest2026!

구독 테스트:
- StoreKit Configuration이 포함되어 있어 Sandbox에서 구독 테스트 가능
- 월간(₩6,600) / 연간(₩55,000) 두 가지 상품
- RevenueCat을 통한 IAP 관리

AI 기능:
- AI 댓글과 대화는 외부 LLM API를 사용합니다
- 사용자에게 AI 사용 사실을 명시적으로 안내합니다
- AI 데이터 처리 동의를 별도로 받습니다

위기 감지:
- 위기 관련 키워드 감지 시 전문 상담 연락처를 안내합니다
- AI가 치료/상담을 대체하지 않음을 명시합니다

개인정보:
- 이메일/비밀번호 인증 (JWT)
- Google/Apple 소셜 로그인 지원
- 계정 삭제 기능 제공 (설정 → 계정 삭제)
```

### 연령 등급
**17+** (정신건강 관련 콘텐츠, AI 생성 콘텐츠)

### 콘텐츠 권한
- 카메라: 프로필 사진, 커스텀 스티커
- 사진 라이브러리: 일기 사진, 커스텀 스티커
- 푸시 알림: 일기 작성 리마인더

---

## 6. 스크린샷 전략

### 권장 구성 (6.9인치 / 6.5인치, 5~8장)

| # | 화면 | 카피 방향 |
|---|------|----------|
| 1 | Home — 감정 스티커 그리드 | "오늘 기분이 어때요?" |
| 2 | 감정 선택 → 세부 감정 | "설렘, 감사, 그리움... 세밀하게 기록" |
| 3 | 일기 에디터 — 사진+스티커 | "스크랩북처럼 꾸미는 감정 일기" |
| 4 | AI 대화 화면 | "따뜻한 AI 친구와 이야기" |
| 5 | 감정 캘린더 | "한 달의 감정을 한눈에" |
| 6 | 프리미엄 테마 (구겨진 노트) | "특별한 종이 위에 기록하세요" |
| 7 | 커스텀 스티커 | "나만의 스티커를 만들어보세요" |
| 8 | 리포트/회고 | "감정의 흐름을 돌아보세요" |

### 스크린샷 촬영 팁
- 시뮬레이터: iPhone 16 Pro Max (6.9") + iPhone 16 Plus (6.7")
- 한국어 기본, 영어 버전도 별도 준비
- 상태바에 10:41, 배터리 풀, Wi-Fi 표시
- 실제 데이터가 들어간 상태에서 촬영 (빈 화면 X)

---

## 7. 구독 심사 관련

### App Store Connect 구독 설정 확인
1. **구독 그룹**: mamuri_premium
2. **상품**: mamuri_premium_monthly (₩6,600), mamuri_premium_yearly (₩55,000)
3. **무료 체험**: 7일 (두 상품 모두)
4. **자동 갱신**: 예

### 구독 관련 심사 요구사항
- [x] 구독 혜택 명확히 표시 (Paywall 화면)
- [x] 가격 표시 (RevenueCat → 실제 스토어 가격)
- [x] 자동 갱신 안내 (법적 고지 텍스트)
- [x] 복원 버튼 (Paywall 하단)
- [x] 구독 관리 링크 (Settings → 구독 관리)
- [ ] **구독 이용약관 페이지** (웹) → 확인 필요
- [ ] **개인정보처리방침 페이지** (웹) → 확인 필요

---

## 8. 제출 직전 최종 체크리스트

### Git
- [ ] 모든 변경사항 커밋 완료
- [ ] PR → main 병합 완료
- [ ] v2.0.0 태그 생성
- [ ] .env / secrets 미포함 확인

### 백엔드
- [ ] DB 백업 완료
- [ ] deploy.sh 실행 → 헬스 체크 UP
- [ ] V28 migration 적용 확인
- [ ] 운영 API 로그인/일기/구독 테스트 통과

### iOS
- [ ] version: '2.0.0', buildNumber 업데이트
- [ ] API_BASE_URL = 운영 서버
- [ ] RevenueCat 프로덕션 키 확인
- [ ] `npx tsc --noEmit` 통과
- [ ] Archive → Validate → Upload 완료
- [ ] TestFlight 빌드 처리 완료

### App Store Connect
- [ ] 앱 설명 업데이트
- [ ] What's New 작성
- [ ] 스크린샷 교체 (최소 5장)
- [ ] 키워드 업데이트
- [ ] 심사 노트 + 데모 계정 작성
- [ ] 연령 등급 확인 (17+)
- [ ] 개인정보처리방침 URL 유효
- [ ] 이용약관 URL 유효
- [ ] 구독 상품 App Store Connect에 등록 확인

### 제출
- [ ] 위 항목 전부 체크 완료
- [ ] "심사를 위해 제출" 클릭
- [ ] 심사 예상 소요: 24~48시간

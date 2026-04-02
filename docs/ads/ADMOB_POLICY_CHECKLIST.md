# AdMob 실광고 전환 전 정책/메타데이터 체크리스트

> 최종 업데이트: 2026-04-02

## 현재 광고 운영 구조

| 항목 | 상태 |
|------|------|
| 광고 SDK | Google AdMob (`react-native-google-mobile-ads@16.3.1`) |
| 광고 형식 | 배너 (Adaptive Banner) |
| 노출 대상 | 무료 사용자만 |
| 노출 화면 | 돌아보기 탭, 마음이 탭 (하단 탭 바 위) |
| 프리미엄 | 광고 숨김 (`isPremium` 체크) |
| 일기 탭 | 광고 없음 |

---

## Google Play Console

### Contains Ads 설정
1. Play Console → 앱 → **앱 콘텐츠** → **광고**
2. **"예, 앱에 광고가 포함되어 있습니다"** 선택
3. 저장

### Data Safety
1. Play Console → **앱 콘텐츠** → **데이터 보안**
2. 아래 항목 추가/업데이트:

| 데이터 유형 | 수집 | 공유 | 목적 |
|------------|------|------|------|
| 광고 ID (Advertising ID) | 예 | 예 (Google) | 광고 |
| 기기 정보 | 예 | 예 (Google) | 광고, 분석 |
| IP 주소 | 예 | 예 (Google) | 광고 |

3. "광고 또는 마케팅" 목적 체크
4. 프리미엄 구독 시 광고 데이터 수집 중단됨을 명시 가능

### 스토어 등록정보
- **"이 앱에는 광고가 포함되어 있습니다"** 라벨이 자동 표시됨
- 추가 설명에 "프리미엄 구독 시 광고 제거" 문구 권장

---

## App Store Connect

### App Privacy (앱 개인정보 보호)
1. App Store Connect → 앱 → **앱 개인정보 보호**
2. 아래 항목 추가/점검:

| 데이터 유형 | 수집 여부 | 용도 | 사용자 연결 |
|------------|----------|------|-----------|
| 광고 데이터 | 예 | 제3자 광고 | 아니오 (AdMob이 자체 처리) |
| 기기 ID (IDFA) | 예 | 제3자 광고 | 아니오 |

3. "제3자 광고" 용도 체크

### ATT (App Tracking Transparency) 판단

**현재 구조 기준**:
- AdMob SDK가 IDFA를 사용할 수 있지만, 앱에서 `requestTrackingAuthorization()`을 호출하지 않으면 ATT 팝업이 뜨지 않음
- ATT 동의 없이도 AdMob은 contextual ads (비맞춤 광고)를 제공할 수 있음
- **권장**: ATT 구현 없이 시작 → 광고 수익이 낮으면 나중에 ATT 추가 고려

### IDFA 사용 선언
- App Store Connect → **앱 개인정보 보호** → "광고 데이터" 선택 시 자동 반영
- `Info.plist`에 `NSUserTrackingUsageDescription`은 ATT 팝업을 구현할 때만 필요

---

## 개인정보처리방침

### 업데이트 위치
- `web/privacy.html` (Vercel 배포 → `https://mamuri.app/privacy`)

### 추가된 내용
- **4.4 Google AdMob (광고)** 섹션 신설 (영문 + 한국어)
- 광고 식별자/IP/기기 정보 수집 설명
- 프리미엄 구독 시 광고 미표시 명시
- Google 개인정보처리방침 링크
- 국제 데이터 이전 테이블에 Google AdMob 추가

---

## app-ads.txt

### 파일 위치
- `web/app-ads.txt` (리포지토리)
- 배포 URL: `https://mamuri.app/app-ads.txt`

### 내용
```
google.com, pub-1553144894464526, DIRECT, f08c47fec0942fa0
```

### 배포 방법
- `web/` 디렉토리가 Vercel로 배포됨
- Vercel 배포 시 자동으로 `https://mamuri.app/app-ads.txt`에 접근 가능
- Play Console/App Store Connect의 개발자 웹사이트 URL이 `https://mamuri.app`이므로 자동 연결

### 스토어 웹사이트 URL과의 관계
- Google/Apple은 스토어에 등록된 개발자 웹사이트 도메인의 `/app-ads.txt`를 확인
- 현재 개발자 웹사이트: `https://mamuri.app`
- 따라서 `https://mamuri.app/app-ads.txt`에 파일이 있어야 함

---

## 제출 전 최종 체크리스트

### 코드/앱
- [x] 무료 사용자 → 돌아보기/마음이 탭에서 배너 광고 노출
- [x] 프리미엄 사용자 → 모든 화면에서 광고 숨김
- [x] 일기 탭 → 광고 없음
- [x] `__DEV__`에서 테스트 배너 ID 사용

### 스토어 메타데이터
- [ ] Play Console → Contains Ads → "예" 설정
- [ ] Play Console → Data Safety → 광고 ID/기기 정보 추가
- [ ] App Store Connect → App Privacy → 광고 데이터 추가

### 정책/문서
- [x] 개인정보처리방침 → AdMob 관련 문구 추가
- [x] `app-ads.txt` 생성
- [ ] `web/` Vercel 재배포 (privacy.html + app-ads.txt)

### 빌드/제출
- [ ] iOS EAS 빌드 + App Store 제출
- [ ] Android EAS 빌드 + Play Console 업로드

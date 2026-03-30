# admin.mamuri.app 배포 가이드

## DNS 설정
`admin.mamuri.app`에 대해 A 레코드를 서버 IP로 설정합니다.
(api.mamuri.app과 동일한 서버를 가리킵니다)

## SSL 인증서
기존 인증서에 admin.mamuri.app을 SAN으로 추가하거나, 와일드카드 인증서를 사용합니다.

```bash
# Let's Encrypt 예시 (certbot)
sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.mamuri.app \
  -d admin.mamuri.app
```

## Admin 초기 계정 설정
서버의 `.env` 또는 환경변수에 다음을 설정합니다:

```bash
ADMIN_DEFAULT_EMAIL=admin@mamuri.app
ADMIN_DEFAULT_PASSWORD=초기비밀번호-첫-로그인-후-변경
```

서버 시작 시 해당 계정이 admin_users 테이블에 자동 생성됩니다.

## 배포
기존 `deploy.sh`를 그대로 사용합니다. nginx.conf가 이미 admin.mamuri.app 서버 블록을 포함합니다.

```bash
./deploy/scripts/deploy.sh
```

## 접속
- Admin 대시보드: https://admin.mamuri.app
- Admin API: https://admin.mamuri.app/api/admin/

## 보안
- Admin 로그인은 5회/분 rate limit 적용
- Admin API는 10회/초 rate limit 적용
- 모든 admin API 호출은 audit_logs 테이블에 기록됨
- JWT 토큰 만료: 30분

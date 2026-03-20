# Mamuri 첫 배포 런북

서버 접속부터 HTTPS 활성화까지, 처음 배포하는 사람을 위한 단계별 가이드.

> 상세 설명은 [DEPLOY.md](../DEPLOY.md) 참고.

---

## 사전 요구사항

- [ ] AWS Lightsail 인스턴스 (Ubuntu, 2GB RAM)
- [ ] Static IP 연결 완료
- [ ] 방화벽: 22, 80, 443 포트만 오픈
- [ ] DNS: `api.mamuri.app` → Static IP (A 레코드)
- [ ] Docker + docker-compose 설치 완료
- [ ] OpenAI API 키 발급 완료
- [ ] Firebase 서비스 계정 JSON 파일 준비 (소셜 로그인 사용 시)

---

## Step 1: 저장소 clone 및 설정

```bash
ssh juns@YOUR_STATIC_IP

# 저장소 clone
cd /opt
sudo git clone https://github.com/godssun/mamuriApp.git mamuri
sudo chown -R juns:juns /opt/mamuri
cd /opt/mamuri
```

### 환경변수 설정

```bash
cp .env.production.example .env.production
nano .env.production
```

**반드시 변경할 값:**

```bash
# 안전한 비밀번호 생성
openssl rand -base64 24    # → DB_PASSWORD에 입력
openssl rand -base64 48    # → JWT_SECRET에 입력
```

| 변수 | 설명 |
|------|------|
| `DB_PASSWORD` | PostgreSQL 비밀번호 (위에서 생성) |
| `JWT_SECRET` | JWT 서명 키 (위에서 생성, 32자 이상) |
| `AI_API_KEY` | OpenAI API 키 (`sk-proj-...`) |

**검증:**
```bash
# CHANGE_ME가 남아있으면 안 됨
grep "CHANGE_ME" .env.production
# 출력 없으면 정상
```

### Firebase 설정 (소셜 로그인)

```bash
mkdir -p /opt/mamuri/secrets

# 로컬에서 서버로 파일 전송 (로컬 PC에서 실행)
scp firebase-service-account.json juns@YOUR_STATIC_IP:/opt/mamuri/secrets/
```

### SSL 디렉토리 준비

```bash
mkdir -p /opt/mamuri/deploy/nginx/ssl
```

---

## Step 2: Docker 이미지 빌드

```bash
cd /opt/mamuri
docker build -t mamuri-backend:latest .
```

- 첫 빌드: 3-5분 (의존성 다운로드)
- 이후 빌드: 1-2분 (레이어 캐시)

**검증:**
```bash
docker images | grep mamuri-backend
# mamuri-backend   latest   ...   SIZE
```

---

## Step 3: 서비스 시작 (순서 중요!)

```bash
cd /opt/mamuri/deploy
```

### 3-1. PostgreSQL

```bash
docker-compose -f docker-compose.prod.yml up -d postgres
```

**대기 (10-15초):**
```bash
# "healthy"가 나올 때까지 반복
docker inspect --format='{{.State.Health.Status}}' mamuri-postgres
```

### 3-2. Backend Blue (첫 활성 컨테이너)

```bash
docker-compose -f docker-compose.prod.yml up -d backend-blue
```

**대기 (40-60초, Flyway 마이그레이션 포함):**
```bash
docker inspect --format='{{.State.Health.Status}}' mamuri-blue
```

> "healthy"가 아니면: `docker logs mamuri-blue`로 원인 확인

### 3-3. Nginx

```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

---

## Step 4: HTTP 검증

```bash
# 모든 컨테이너 실행 확인
docker ps
# mamuri-nginx, mamuri-blue, mamuri-postgres 3개가 보여야 함

# Nginx 헬스체크
curl http://localhost/nginx-health
# 기대: ok

# Spring Boot 헬스체크
curl http://localhost/actuator/health
# 기대: {"status":"UP"}

# API 연결 테스트
curl -s -o /dev/null -w "%{http_code}" http://localhost/api/auth/refresh
# 기대: 401 (인증 실패 = API 정상 응답)
```

**외부에서 확인 (로컬 PC에서):**
```bash
curl http://YOUR_STATIC_IP/actuator/health
# 기대: {"status":"UP"}
```

---

## Step 5: HTTPS 설정

> iOS/Android 모바일 앱은 HTTPS 없이 API 호출 불가. **반드시 필요.**

### 5-1. certbot 설치

```bash
sudo apt update && sudo apt install -y certbot
```

### 5-2. Nginx 중지 + 인증서 발급

```bash
cd /opt/mamuri/deploy
docker-compose -f docker-compose.prod.yml stop nginx

sudo certbot certonly --standalone -d api.mamuri.app
```

### 5-3. 인증서 복사

```bash
sudo cp /etc/letsencrypt/live/api.mamuri.app/fullchain.pem /opt/mamuri/deploy/nginx/ssl/
sudo cp /etc/letsencrypt/live/api.mamuri.app/privkey.pem /opt/mamuri/deploy/nginx/ssl/
sudo chown juns:juns /opt/mamuri/deploy/nginx/ssl/*.pem
```

### 5-4. nginx.conf HTTPS 활성화

`deploy/nginx/nginx.conf`에서:
1. HTTPS server 블록 (port 443) 주석 해제
2. HTTP server 블록을 HTTPS 리다이렉트로 교체

> 서버에서 직접 편집하거나, 로컬에서 수정 후 `git push → git pull`

### 5-5. Nginx 재시작

```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

### 5-6. HTTPS 검증

```bash
curl https://api.mamuri.app/actuator/health
# 기대: {"status":"UP"}
```

### 5-7. 인증서 자동 갱신 (crontab)

```bash
sudo crontab -e
```

추가:
```
0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/api.mamuri.app/fullchain.pem /opt/mamuri/deploy/nginx/ssl/ && cp /etc/letsencrypt/live/api.mamuri.app/privkey.pem /opt/mamuri/deploy/nginx/ssl/ && docker exec mamuri-nginx nginx -s reload
```

---

## Step 6: 백업 설정

```bash
# 수동 백업 테스트
cd /opt/mamuri
./deploy/scripts/backup.sh

# 자동 백업 (매일 새벽 3시)
crontab -e
```

추가:
```
0 3 * * * /opt/mamuri/deploy/scripts/backup.sh >> /opt/mamuri/backups/cron.log 2>&1
```

---

## Step 7: 모바일 앱 연결

1. 모바일 앱의 `API_BASE_URL`을 `https://api.mamuri.app`으로 설정
2. 회원가입/로그인 테스트
3. 일기 작성 및 AI 응답 테스트

---

## 이후 배포 (2회차부터)

```bash
ssh juns@YOUR_STATIC_IP
cd /opt/mamuri
git pull origin main

./deploy/scripts/deploy.sh
```

문제 발생 시 롤백:
```bash
./deploy/scripts/rollback.sh
```

---

## 절대 하지 말아야 할 것

| 금지 사항 | 이유 |
|-----------|------|
| 방화벽에서 5432 포트 열기 | PostgreSQL 외부 노출 |
| 방화벽에서 8080 포트 열기 | Spring Boot 직접 노출 |
| `.env.production`을 git에 커밋 | 시크릿 유출 |
| `docker system prune` 배포 직후 실행 | 이전 이미지 삭제 → 롤백 불가 |
| HTTPS 없이 모바일 앱 프로덕션 연결 | iOS/Android API 호출 차단됨 |

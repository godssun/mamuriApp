# Mamuri Production Deployment Guide

AWS Lightsail 단일 서버에서 Blue-Green 무중단 배포를 운영하는 가이드.

---

## 배포 범위

이 서버에 배포되는 것:

| 서비스 | 설명 |
|--------|------|
| Nginx | 리버스 프록시 (외부에 유일하게 노출) |
| Spring Boot Backend (Blue/Green) | REST API 서버 |
| PostgreSQL | 데이터베이스 (내부 전용) |

이 서버에 배포되지 **않는** 것:

| 항목 | 이유 |
|------|------|
| 모바일 앱 (React Native / Expo) | App Store / Google Play를 통해 배포됨. Lightsail과 무관 |
| 웹/법률 페이지 (개인정보처리방침, 이용약관) | Vercel 등 별도 호스팅에서 제공 |
| 프론트엔드 웹 앱 | 현재 없음. 모바일 전용 서비스 |

모바일 앱은 `.env`에 설정된 `API_BASE_URL`을 통해 이 서버의 API를 호출한다.
따라서 이 서버는 **API 백엔드 전용 서버**이다.

---

## 아키텍처

```
모바일 앱 (App Store / Google Play)
   |
   | HTTPS 요청
   v
Lightsail Static IP → Nginx (:80/:443)
                          |
                    upstream.conf
                          |
                    ┌─────┴─────┐
                    v           v
              mamuri-blue   mamuri-green    ← 둘 중 하나만 활성
              (:8080)       (:8080)
                    └─────┬─────┘
                          v
                    PostgreSQL (:5432)
                    (내부 전용, 공유)
```

- **Nginx**: 외부에 유일하게 노출되는 서비스 (포트 80/443)
- **Backend Blue/Green**: 내부 네트워크에서만 접근 가능. 외부 포트 없음
- **PostgreSQL**: 내부 네트워크에서만 접근 가능. Blue/Green 사이에서 공유됨
- 트래픽 전환: `upstream.conf` 파일 수정 후 `nginx -s reload`

---

## 사전 준비 (서버 작업 전)

### 1. Lightsail Static IP 연결

Lightsail 콘솔에서:
1. Networking 탭 → Create static IP
2. 인스턴스에 연결 (attach)
3. 이 IP를 기록해 둔다 (이하 `YOUR_STATIC_IP`)

### 2. Lightsail 방화벽 설정

Lightsail 콘솔 → Networking 탭 → IPv4 Firewall:

| 포트 | 프로토콜 | 용도 |
|------|----------|------|
| 22 | TCP | SSH 접속 |
| 80 | TCP | HTTP (→ HTTPS 리다이렉트) |
| 443 | TCP | HTTPS |

**다른 모든 포트는 닫혀 있어야 한다.**
특히 5432(PostgreSQL), 8080/8081/8082(Spring Boot)는 절대 열지 않는다.

### 3. DNS 설정

도메인 DNS 관리에서:
```
api.mamuri.app  →  A 레코드  →  YOUR_STATIC_IP
```

### 4. docker-compose 버전 확인

```bash
ssh juns@YOUR_STATIC_IP

# v1 확인
docker-compose --version

# v2 확인
docker compose version
```

이 가이드의 모든 명령어는 `docker-compose` (v1)을 기준으로 작성되었다.
서버에 `docker compose` (v2)만 있다면 명령어의 `docker-compose`를 `docker compose`로 바꿔 실행한다.
배포 스크립트(`deploy.sh`, `rollback.sh`)는 v1/v2를 자동 감지한다.

---

## Git Clone 전략

### 저장소 전체를 clone 한다

이 프로젝트는 모노레포(`/mobile` + `/src`)이지만, **전체 clone이 올바른 선택**이다.

이유:
1. `Dockerfile`이 프로젝트 루트에 있고, `src/` 디렉토리를 참조한다
2. `build.gradle.kts`, `settings.gradle.kts`, `gradle/` 등 빌드에 필요한 파일이 루트에 있다
3. `.dockerignore`가 `mobile/`, `docs/`, `.claude/` 등을 제외하므로 Docker 빌드 컨텍스트에는 포함되지 않는다
4. sparse checkout이나 부분 clone은 복잡성만 추가하고 실질적 이점이 없다

### 서버 디렉토리 구조

```
/opt/
└── mamuri/                     ← git clone 결과
    ├── Dockerfile
    ├── build.gradle.kts
    ├── src/                    ← Spring Boot 소스 (Docker 빌드에 사용)
    ├── mobile/                 ← 서버에서 사용하지 않음 (.dockerignore에서 제외)
    ├── .env.production         ← 서버에서만 존재. git에 커밋하지 않음
    ├── secrets/                ← 서버에서만 존재. git에 커밋하지 않음
    │   └── firebase-service-account.json
    ├── backups/                ← pg_dump 백업 파일 (자동 생성)
    ├── deploy/
    │   ├── docker-compose.prod.yml
    │   ├── nginx/
    │   │   ├── nginx.conf
    │   │   ├── upstream.conf   ← deploy.sh가 자동 수정 (git에서 관리하지 않아도 됨)
    │   │   └── ssl/            ← 서버에서만 존재. git에 커밋하지 않음
    │   │       ├── fullchain.pem
    │   │       └── privkey.pem
    │   └── scripts/
    │       ├── deploy.sh
    │       ├── rollback.sh
    │       ├── health-check.sh
    │       ├── backup.sh
    │       └── restore.sh
    └── ...
```

### 서버에서만 존재하고, 절대 커밋하지 않는 파일

| 파일 | 용도 | 이유 |
|------|------|------|
| `.env.production` | 프로덕션 환경변수 (DB 비밀번호, JWT 시크릿, API 키) | 시크릿 포함 |
| `secrets/firebase-service-account.json` | Firebase Admin SDK 서비스 계정 | 시크릿 |
| `deploy/nginx/ssl/fullchain.pem` | SSL 인증서 | 서버별 고유 |
| `deploy/nginx/ssl/privkey.pem` | SSL 개인 키 | 시크릿 |

이 파일들은 `.gitignore`에서 이미 제외되어 있다.

---

## 초기 배포 (최초 1회)

### Step 1: 서버 접속 및 저장소 clone

```bash
ssh juns@YOUR_STATIC_IP

cd /opt
sudo git clone https://github.com/godssun/mamuriApp.git mamuri
sudo chown -R juns:juns /opt/mamuri
cd /opt/mamuri
```

### Step 2: 프로덕션 환경변수 설정

```bash
cp .env.production.example .env.production
nano .env.production
```

반드시 변경해야 하는 값:

| 변수 | 설명 | 생성 방법 |
|------|------|-----------|
| `DB_PASSWORD` | PostgreSQL 비밀번호 | `openssl rand -base64 24` |
| `JWT_SECRET` | JWT 서명 키 (32자 이상) | `openssl rand -base64 48` |
| `AI_API_KEY` | OpenAI API 키 | OpenAI 대시보드에서 발급 |

### Step 2.5: Firebase 서비스 계정 설정 (소셜 로그인 사용 시)

```bash
mkdir -p /opt/mamuri/secrets

# Firebase 콘솔에서 다운로드한 서비스 계정 JSON 파일을 서버에 복사
# (로컬에서 scp로 전송)
scp firebase-service-account.json juns@YOUR_STATIC_IP:/opt/mamuri/secrets/
```

`.env.production`에 경로가 설정되어 있는지 확인:
```
FIREBASE_CREDENTIALS_PATH=/app/secrets/firebase-service-account.json
```

### Step 3: Docker 이미지 빌드

```bash
cd /opt/mamuri
docker build -t mamuri-backend:latest .
```

빌드 시간: 첫 빌드 약 3-5분 (의존성 다운로드 포함)

### Step 4: PostgreSQL 먼저 시작

```bash
cd /opt/mamuri/deploy
docker-compose -f docker-compose.prod.yml up -d postgres
```

PostgreSQL이 healthy 상태가 될 때까지 대기:

```bash
docker inspect --format='{{.State.Health.Status}}' mamuri-postgres
# "healthy"가 나올 때까지 반복 (보통 10-15초)
```

### Step 5: 초기 활성 컨테이너 = Blue

초기 배포에서는 **Blue가 첫 번째 활성 컨테이너**이다.
`upstream.conf`는 기본적으로 `mamuri-blue`를 가리키고 있다.

```bash
docker-compose -f docker-compose.prod.yml up -d backend-blue
```

Blue 컨테이너가 healthy 상태인지 확인:

```bash
# 첫 시작은 Spring Boot 초기화 + Flyway 마이그레이션 때문에 40-60초 걸릴 수 있음
docker inspect --format='{{.State.Health.Status}}' mamuri-blue
# "healthy"가 나올 때까지 대기
```

### Step 6: Nginx 시작

```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

### Step 7: 검증 (HTTP)

```bash
# 컨테이너 상태 확인
docker ps

# Nginx 자체 헬스체크
curl http://localhost/nginx-health
# 기대 응답: ok

# Spring Boot 헬스체크 (Nginx를 통해)
curl http://localhost/actuator/health
# 기대 응답: {"status":"UP"}

# API 연결 테스트 (인증 없이 호출하면 401)
curl -s -o /dev/null -w "%{http_code}" http://localhost/api/auth/refresh
# 기대 응답: 401 (인증이 필요하다는 것 = API가 정상 작동 중)
```

외부에서 확인:
```bash
curl http://YOUR_STATIC_IP/actuator/health
# 기대 응답: {"status":"UP"}
```

---

## HTTPS 설정 (모바일 앱 연결 전 필수)

모바일 앱이 프로덕션 API를 호출하려면 HTTPS가 반드시 필요하다.
HTTP 상태에서는 iOS/Android 모두 API 호출이 차단된다.

### Step 1: Certbot 설치 (서버에서)

```bash
sudo apt update
sudo apt install -y certbot
```

### Step 2: 인증서 발급

Nginx를 잠시 중지하고 standalone 모드로 발급:

```bash
cd /opt/mamuri/deploy
docker-compose -f docker-compose.prod.yml stop nginx

sudo certbot certonly --standalone -d api.mamuri.app
```

또는 Nginx를 중지하지 않고 webroot 방식을 사용할 수도 있다.

### Step 3: 인증서 복사

```bash
mkdir -p /opt/mamuri/deploy/nginx/ssl
sudo cp /etc/letsencrypt/live/api.mamuri.app/fullchain.pem /opt/mamuri/deploy/nginx/ssl/
sudo cp /etc/letsencrypt/live/api.mamuri.app/privkey.pem /opt/mamuri/deploy/nginx/ssl/
sudo chown juns:juns /opt/mamuri/deploy/nginx/ssl/*.pem
```

### Step 4: Nginx 설정에서 HTTPS 블록 활성화

`deploy/nginx/nginx.conf`에서 HTTPS server 블록의 주석을 해제한다.
HTTP server 블록에 HTTPS 리다이렉트를 추가한다.

### Step 5: Nginx 재시작

```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

### Step 6: HTTPS 검증

```bash
curl https://api.mamuri.app/actuator/health
# 기대 응답: {"status":"UP"}
```

이 단계가 완료되어야 모바일 앱의 `API_BASE_URL`을 `https://api.mamuri.app`으로 설정할 수 있다.

### 인증서 자동 갱신

Let's Encrypt 인증서는 90일마다 갱신이 필요하다:

```bash
# crontab에 추가
sudo crontab -e

# 매월 1일 새벽 3시에 갱신 시도
0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/api.mamuri.app/fullchain.pem /opt/mamuri/deploy/nginx/ssl/ && cp /etc/letsencrypt/live/api.mamuri.app/privkey.pem /opt/mamuri/deploy/nginx/ssl/ && docker exec mamuri-nginx nginx -s reload
```

---

## 업데이트 배포 (2회차부터)

### 표준 배포

```bash
ssh juns@YOUR_STATIC_IP
cd /opt/mamuri
git pull origin main

./deploy/scripts/deploy.sh
```

스크립트가 수행하는 작업:
1. 현재 활성 컬러 감지 (upstream.conf에서)
2. Docker 이미지 새로 빌드
3. 비활성 컨테이너를 새 이미지로 시작
4. 비활성 컨테이너 헬스체크 (최대 90초)
5. Nginx upstream을 비활성 컨테이너로 전환 (무중단)
6. 이전 컨테이너 중지

### 빌드 없이 배포

이미지가 이미 빌드되어 있는 경우:

```bash
./deploy/scripts/deploy.sh --no-build
```

### 이전 컨테이너 유지

추가 안전을 위해 전환 후에도 이전 컨테이너를 유지:

```bash
./deploy/scripts/deploy.sh --keep-old
```

---

## 롤백

배포 후 문제가 발견되면:

```bash
./deploy/scripts/rollback.sh
```

수행 작업:
1. 이전 컨테이너 시작 (이전 이미지로)
2. 헬스체크
3. Nginx upstream을 이전 컨테이너로 전환
4. 문제 있는 컨테이너 중지

**주의**: 롤백은 Docker가 이전 컨테이너와 이미지를 보관하고 있기 때문에 동작한다.
`docker image prune`이나 `docker system prune`을 실행하면 이전 이미지가 삭제되어 롤백이 불가능해진다.

---

## 파일 구조

```
deploy/
├── docker-compose.prod.yml    # 전체 서비스 정의
├── nginx/
│   ├── nginx.conf             # Nginx 메인 설정
│   ├── upstream.conf          # 활성 백엔드 (blue 또는 green)
│   └── ssl/                   # SSL 인증서 (커밋하지 않음)
└── scripts/
    ├── deploy.sh              # Blue-Green 배포 스크립트
    ├── rollback.sh            # 롤백 스크립트
    ├── health-check.sh        # 컨테이너 헬스체크 유틸리티
    ├── backup.sh              # PostgreSQL 백업 (pg_dump + gzip)
    └── restore.sh             # PostgreSQL 복원
```

---

## 모니터링

### 현재 활성 컬러 확인

```bash
cat /opt/mamuri/deploy/nginx/upstream.conf
```

### 로그 확인

```bash
cd /opt/mamuri/deploy

# 전체 서비스
docker-compose -f docker-compose.prod.yml logs -f

# 개별 서비스
docker logs -f mamuri-blue
docker logs -f mamuri-green
docker logs -f mamuri-nginx
docker logs -f mamuri-postgres
```

### 컨테이너 헬스 상태

```bash
docker inspect --format='{{.State.Health.Status}}' mamuri-blue
docker inspect --format='{{.State.Health.Status}}' mamuri-green
```

### 리소스 사용량

```bash
docker stats --no-stream
free -h
```

---

## 메모리 예산 (2GB Lightsail)

| 컴포넌트 | 메모리 한도 | 비고 |
|----------|------------|------|
| PostgreSQL | ~256MB | 공유 인스턴스 |
| Backend (활성) | 768MB | JVM 힙 ~499MB (MaxRAMPercentage=65%) |
| Backend (배포 중) | 768MB | 배포 중에만 동시 실행 |
| Nginx | ~10MB | 경량 |
| OS + 기타 | ~200MB | Ubuntu 기본 |
| **합계 (평상시)** | **~1.2GB** | 백엔드 1개만 실행 |
| **합계 (배포 중)** | **~1.8GB** | 두 백엔드가 잠시 동시 실행 |

---

## 데이터베이스 마이그레이션

Flyway 마이그레이션은 Spring Boot 시작 시 자동으로 실행된다.
새 컨테이너가 시작되면 pending 마이그레이션을 적용한 후 healthy 상태가 된다.

**중요**: 마이그레이션은 반드시 하위 호환(backward-compatible)이어야 한다.
배포 중에는 이전 컨테이너가 아직 실행 중일 수 있으므로, 새 마이그레이션이 이전 코드와
호환되지 않으면 서비스 장애가 발생할 수 있다.

안전한 마이그레이션 예시:
- 새 컬럼 추가 (nullable 또는 default 값 포함) — 안전
- 기존 컬럼 삭제 — 위험 (이전 코드가 해당 컬럼을 참조할 수 있음)
- 컬럼명 변경 — 위험 (이전 코드가 이전 이름을 사용할 수 있음)

위험한 마이그레이션이 필요한 경우:
1. 먼저 새 코드가 이전/새 스키마 모두를 지원하도록 배포한다
2. 그 다음 마이그레이션을 포함한 배포를 한다
3. 마지막으로 이전 스키마 지원 코드를 제거하는 배포를 한다

---

## 데이터베이스 백업/복원

### 수동 백업

```bash
cd /opt/mamuri
./deploy/scripts/backup.sh
```

백업 파일은 `/opt/mamuri/backups/` 디렉토리에 `mamuri_YYYYMMDD_HHMMSS.sql.gz` 형식으로 저장된다.
기본 7일 보관, `--keep-days 14`로 변경 가능.

### 자동 백업 (cron)

```bash
# 매일 새벽 3시 백업
crontab -e

0 3 * * * /opt/mamuri/deploy/scripts/backup.sh >> /opt/mamuri/backups/cron.log 2>&1
```

### 복원

```bash
# 백업 목록 확인
./deploy/scripts/restore.sh

# 특정 백업 복원
./deploy/scripts/restore.sh backups/mamuri_20260319_030000.sql.gz
```

**주의**: 복원 전 백엔드 컨테이너를 중지하는 것을 권장한다.
스크립트가 복원 전 현재 상태를 자동으로 백업한다.

---

## 트러블슈팅

### 컨테이너가 시작되지 않을 때

```bash
docker logs mamuri-blue   # 또는 mamuri-green
```

일반적인 원인:
- `.env.production`에 필요한 환경변수가 누락됨
- PostgreSQL이 아직 준비되지 않음 (postgres 헬스 먼저 확인)
- Docker 이미지 빌드 실패 (재빌드 필요)

### 배포 중 헬스체크 실패

배포 스크립트가 자동으로 중단하고 이전 컨테이너를 유지한다.
실패한 컨테이너의 로그를 확인:

```bash
docker logs mamuri-green   # 배포 중이었던 컨테이너
```

### 메모리 부족

```bash
docker stats --no-stream
free -h
```

메모리가 부족하면, 배포 중이 아닌 비활성 컨테이너가 실행 중인지 확인하고 중지한다.

### 데이터베이스 연결 문제

```bash
# PostgreSQL 실행 상태 확인
docker exec mamuri-postgres pg_isready -U mamuri

# Backend에서 DB 연결 확인 (로그에서)
docker logs mamuri-blue 2>&1 | grep -i "datasource\|connection\|postgres"
```

---

## Blue-Green 배포란? (한국어 설명)

### 개념

Blue-Green 배포는 **두 개의 동일한 환경을 번갈아 사용**하는 배포 전략이다.

- **Blue**: 첫 번째 백엔드 컨테이너 (`mamuri-blue`)
- **Green**: 두 번째 백엔드 컨테이너 (`mamuri-green`)

이 두 컨테이너는 완전히 동일한 설정으로 실행되며, 차이점은 **어느 쪽이 실제 트래픽을 받고 있느냐**뿐이다.

### 트래픽 전환 원리

```
[배포 전]
사용자 → Nginx → Blue (활성) ← 트래픽을 받고 있음
                  Green (중지됨)

[배포 중 - 새 버전 준비]
사용자 → Nginx → Blue (활성) ← 여전히 트래픽을 받고 있음
                  Green (시작 중) ← 새 버전이 올라가고 있음

[전환 순간 - nginx reload]
사용자 → Nginx → Green (활성) ← 이제 트래픽을 받음
                  Blue (이전) ← 곧 중지될 예정

[배포 완료]
사용자 → Nginx → Green (활성) ← 트래픽을 받고 있음
                  Blue (중지됨)
```

핵심은 **Nginx가 `upstream.conf` 파일을 다시 읽는 순간**(reload)에 트래픽이 전환된다는 것이다.
Nginx reload는 기존 연결을 끊지 않고 새 연결만 새로운 컨테이너로 보내므로, **사용자가 느끼는 중단 시간은 0초**이다.

### 롤백이 빠른 이유

기존 배포 방식에서는 문제가 생기면:
1. 코드를 되돌리고 → 2. 다시 빌드하고 → 3. 다시 배포한다

Blue-Green에서는:
1. `upstream.conf`를 이전 컨테이너로 바꾸고 → 2. Nginx를 reload한다

이전 컨테이너가 아직 존재하므로, **빌드 없이 10초 이내에 롤백**이 가능하다.

### 위험 요소: DB 마이그레이션 호환성

Blue-Green 배포에서 유일하게 까다로운 부분은 **데이터베이스 마이그레이션**이다.

예를 들어:
- Green(새 버전)이 DB 컬럼을 삭제하는 마이그레이션을 실행했다
- 문제가 발생해서 Blue(이전 버전)로 롤백했다
- Blue는 삭제된 컬럼을 참조하므로 → 에러 발생

해결책: **마이그레이션은 항상 이전 버전과 호환되도록 작성**한다.
(위의 "데이터베이스 마이그레이션" 섹션 참고)

### 왜 단일 Lightsail VM에서도 가능한가?

Blue-Green은 보통 서버 2대에서 운영하지만, 우리는 **컨테이너 레벨**에서 구현했다.
같은 서버 안에서 Docker 컨테이너 2개를 번갈아 사용하는 것이다.

- 평상시: Blue 또는 Green **하나만** 실행 → 메모리 ~1.2GB
- 배포 중: 둘 다 실행 → 메모리 ~1.8GB (2GB VM에서 가능)
- 배포 완료: 이전 컨테이너 중지 → 다시 ~1.2GB

2GB Lightsail에서 충분히 운영 가능하다.
단, 3GB 이상의 VM을 사용하면 배포 중 메모리 여유가 더 생긴다.

---

## 실행 순서 (처음 배포하는 사람을 위한 체크리스트)

아래 순서를 **위에서 아래로 하나씩** 따라가면 된다.
각 단계에서 검증을 통과해야 다음 단계로 넘어간다.

### Phase 1: Lightsail 인프라 준비

```
[ ] 1-1. Lightsail 인스턴스 생성 (Ubuntu, 2GB 이상)
         └ 확인: SSH 접속 가능 (ssh juns@IP)

[ ] 1-2. Static IP 생성 및 인스턴스에 연결
         └ 확인: Static IP로 SSH 접속 가능

[ ] 1-3. 방화벽 설정 (22, 80, 443만 열기)
         └ 확인: Lightsail 콘솔에서 3개 포트만 보임

[ ] 1-4. DNS 설정 (api.mamuri.app → Static IP)
         └ 확인: nslookup api.mamuri.app 또는 dig api.mamuri.app
         └ 주의: DNS 전파에 최대 48시간 걸릴 수 있음 (보통 5-30분)

[ ] 1-5. Docker, docker-compose 설치 확인
         └ 확인: docker --version && docker-compose --version
```

### Phase 2: 코드 준비 및 설정

```
[ ] 2-1. 저장소 clone
         └ 명령: cd /opt && sudo git clone https://github.com/godssun/mamuriApp.git mamuri && sudo chown -R juns:juns /opt/mamuri
         └ 확인: ls /opt/mamuri/Dockerfile 이 존재함

[ ] 2-2. .env.production 생성
         └ 명령: cd /opt/mamuri && cp .env.production.example .env.production
         └ 편집: nano .env.production
         └ 주의: DB_PASSWORD, JWT_SECRET은 반드시 openssl rand로 생성
         └ 주의: AI_API_KEY는 실제 키를 입력
         └ 확인: cat .env.production | grep -v "^#" | grep "CHANGE_ME" (결과 없어야 함)

[ ] 2-3. Firebase 서비스 계정 설정 (소셜 로그인 사용 시)
         └ 명령: mkdir -p /opt/mamuri/secrets
         └ 명령 (로컬에서): scp firebase-service-account.json juns@IP:/opt/mamuri/secrets/
         └ 확인: ls /opt/mamuri/secrets/firebase-service-account.json

[ ] 2-4. SSL 디렉토리 생성
         └ 명령: mkdir -p /opt/mamuri/deploy/nginx/ssl
```

### Phase 3: Docker 이미지 빌드

```
[ ] 3-1. Docker 이미지 빌드
         └ 명령: cd /opt/mamuri && docker build -t mamuri-backend:latest .
         └ 확인: docker images | grep mamuri-backend
         └ 주의: 첫 빌드는 3-5분 소요 (의존성 다운로드)
```

### Phase 4: 서비스 시작 (순서 중요!)

```
[ ] 4-1. PostgreSQL 시작
         └ 명령: cd /opt/mamuri/deploy && docker-compose -f docker-compose.prod.yml up -d postgres
         └ 확인: docker inspect --format='{{.State.Health.Status}}' mamuri-postgres
         └ 기대: "healthy" (10-15초 대기)
         └ 주의: "healthy"가 아니면 다음 단계로 넘어가지 않는다

[ ] 4-2. Backend Blue 시작 (초기 활성 컨테이너)
         └ 명령: docker-compose -f docker-compose.prod.yml up -d backend-blue
         └ 확인: docker inspect --format='{{.State.Health.Status}}' mamuri-blue
         └ 기대: "healthy" (40-60초 대기 — Flyway 마이그레이션 포함)
         └ 주의: "healthy"가 아니면 docker logs mamuri-blue 로 원인 확인

[ ] 4-3. Nginx 시작
         └ 명령: docker-compose -f docker-compose.prod.yml up -d nginx
         └ 확인: docker ps | grep mamuri-nginx
```

### Phase 5: HTTP 검증

```
[ ] 5-1. Nginx 헬스체크
         └ 명령: curl http://localhost/nginx-health
         └ 기대: ok

[ ] 5-2. Spring Boot 헬스체크
         └ 명령: curl http://localhost/actuator/health
         └ 기대: {"status":"UP"}

[ ] 5-3. API 엔드포인트 연결 테스트
         └ 명령: curl -s -o /dev/null -w "%{http_code}" http://localhost/api/auth/refresh
         └ 기대: 401 (인증 실패 = API가 정상 응답 중)

[ ] 5-4. 외부에서 접속 테스트
         └ 명령 (로컬 PC에서): curl http://YOUR_STATIC_IP/actuator/health
         └ 기대: {"status":"UP"}
```

### Phase 6: HTTPS 설정 (모바일 앱 연결 전 필수)

```
[ ] 6-1. certbot 설치
         └ 명령: sudo apt update && sudo apt install -y certbot

[ ] 6-2. Nginx 중지 (certbot standalone용)
         └ 명령: cd /opt/mamuri/deploy && docker-compose -f docker-compose.prod.yml stop nginx

[ ] 6-3. SSL 인증서 발급
         └ 명령: sudo certbot certonly --standalone -d api.mamuri.app
         └ 주의: DNS가 올바르게 설정되어 있어야 성공함

[ ] 6-4. 인증서 복사
         └ 명령:
           sudo cp /etc/letsencrypt/live/api.mamuri.app/fullchain.pem /opt/mamuri/deploy/nginx/ssl/
           sudo cp /etc/letsencrypt/live/api.mamuri.app/privkey.pem /opt/mamuri/deploy/nginx/ssl/
           sudo chown juns:juns /opt/mamuri/deploy/nginx/ssl/*.pem

[ ] 6-5. nginx.conf에서 HTTPS 블록 주석 해제
         └ 서버에서 직접 편집하거나, 로컬에서 수정 후 git push → git pull

[ ] 6-6. Nginx 재시작
         └ 명령: docker-compose -f docker-compose.prod.yml up -d nginx

[ ] 6-7. HTTPS 검증
         └ 명령: curl https://api.mamuri.app/actuator/health
         └ 기대: {"status":"UP"}

[ ] 6-8. 인증서 자동갱신 crontab 등록
```

### Phase 7: 모바일 앱 연결

```
[ ] 7-1. 모바일 앱의 API_BASE_URL을 https://api.mamuri.app 으로 설정
[ ] 7-2. 모바일 앱에서 회원가입/로그인 테스트
[ ] 7-3. 일기 작성 및 AI 응답 테스트
```

### 절대 하지 말아야 할 것

```
[!] Lightsail 방화벽에서 5432 포트를 열지 않는다 (PostgreSQL 외부 노출)
[!] Lightsail 방화벽에서 8080 포트를 열지 않는다 (Spring Boot 직접 노출)
[!] .env.production 파일을 git에 커밋하지 않는다
[!] docker system prune을 배포 직후에 실행하지 않는다 (롤백 불가)
[!] HTTPS 설정 전에 모바일 앱을 프로덕션 API에 연결하지 않는다
[!] DB 마이그레이션에서 컬럼 삭제/이름 변경을 하면서 동시에 코드를 변경하지 않는다
```

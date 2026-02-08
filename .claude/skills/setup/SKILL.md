# Project Setup Checklist

Mamuri 다이어리 앱의 개발 환경을 검증하고 준비하는 스킬입니다.
아래 항목을 순서대로 실행하고 각 단계의 상태를 보고하세요.

## 1. 런타임 버전 확인

- `node -v` 로 Node.js 버전 확인 — **20 이상** 필요
  - 20 미만이면 `nvm install 20 && nvm use 20` 안내
- `java -version` 으로 Java 버전 확인 — **17** 필요
  - 17이 아니면 sdkman 또는 homebrew를 통한 전환 안내

## 2. 포트 충돌 확인

- `lsof -i :5432` — PostgreSQL 포트
- `lsof -i :8080` — Spring Boot 백엔드 포트
- `lsof -i :8081` — Expo/Metro 포트

충돌이 있으면 어떤 프로세스가 사용 중인지 보고하되, 프로세스를 종료하지는 말 것.
사용자에게 확인 후 결정하도록 안내.

## 3. Docker 확인

- `docker ps` 로 Docker 실행 상태 확인
- `docker-compose.yml`이 존재하면 `docker compose up -d` 실행
- PostgreSQL 컨테이너가 정상 구동되는지 확인
- 오래된 볼륨이 있으면 `docker volume rm` 안내 (자동 삭제 금지)

## 4. 데이터베이스 연결 확인

- PostgreSQL에 간단한 쿼리로 연결 테스트
- 연결 실패 시 docker-compose 설정과 포트를 확인하도록 안내

## 5. Git 저장소 확인

- git remote 설정 확인
- 저장소가 **public**인지 확인 (가능한 경우)
- 현재 브랜치와 상태 보고

## 6. 빌드 검증

- `./gradlew build` 로 백엔드 빌드 확인
- `cd mobile && npm install && npx expo doctor` 로 프론트엔드 확인

## 7. 결과 보고

모든 점검 결과를 아래 형식의 상태 테이블로 출력:

| 항목 | 상태 | 비고 |
|------|------|------|
| Node.js 20+ | ✅ / ❌ | 현재 버전 |
| Java 17 | ✅ / ❌ | 현재 버전 |
| Port 5432 | ✅ / ❌ | 사용 중인 프로세스 |
| Port 8080 | ✅ / ❌ | 사용 중인 프로세스 |
| Port 8081 | ✅ / ❌ | 사용 중인 프로세스 |
| Docker | ✅ / ❌ | 컨테이너 상태 |
| DB 연결 | ✅ / ❌ | 연결 결과 |
| Git remote | ✅ / ❌ | remote URL |
| Backend build | ✅ / ❌ | 빌드 결과 |
| Frontend | ✅ / ❌ | expo doctor 결과 |

**모든 항목이 ✅일 때만 기능 개발을 시작하세요.**

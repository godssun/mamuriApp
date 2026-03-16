---
name: setup
description: Verify and prepare the Mamuri diary app development environment before starting any feature work.
---

# Project Setup Checklist

Mamuri 다이어리 앱의 개발 환경을 검증하고 준비하는 스킬입니다.  
아래 항목을 **순서대로 실행**하고 각 단계의 **상태를 반드시 보고**하세요.

---

## 1. 런타임 버전 확인

- `node -v` 로 Node.js 버전 확인 — **20 이상 필요**
  - 20 미만이면 다음을 안내:
    - `nvm install 20`
    - `nvm use 20`
- `java -version` 으로 Java 버전 확인 — **17 필요**
  - 17이 아니면 다음 중 하나로 전환 방법 안내:
    - sdkman
    - homebrew

❗ 자동 변경 금지 — 안내만 할 것.

---

## 2. 포트 충돌 확인

다음 명령으로 포트 사용 여부 확인:

- `lsof -i :5433` — PostgreSQL (Docker host)
- `lsof -i :8080` — Spring Boot 백엔드
- `lsof -i :8081` — Expo / Metro

충돌이 있으면:
- 어떤 프로세스가 사용 중인지 **이름과 PID를 보고**
- **프로세스를 종료하지 말 것**
- 사용자에게 확인 후 결정하도록 안내

---

## 3. Docker 확인

- `docker ps` 로 Docker 실행 상태 확인
- `docker-compose.yml` 파일 존재 여부 확인
- 존재하면:
  - `docker compose up -d` 실행
  - PostgreSQL 컨테이너가 정상 구동 중인지 확인
- 오래된 볼륨이 의심되면:
  - `docker volume rm` **명령을 제안만 하고 자동 삭제는 금지**

---

## 4. 데이터베이스 연결 확인

- PostgreSQL에 간단한 쿼리로 연결 테스트 수행
- 연결 실패 시:
  - `docker-compose.yml` 설정 확인 안내
  - 포트 매핑(5433 → 5432) 재확인 안내

---

## 5. Git 저장소 확인

- `git remote -v` 로 remote 설정 확인
- 가능한 경우 저장소가 **public** 인지 여부 확인
- 다음 정보 보고:
  - 현재 브랜치
  - 변경 사항 존재 여부 (`git status`)

---

## 6. 빌드 검증

### Backend
- `./gradlew build` 실행
- 빌드 성공/실패 결과 보고

### Frontend
- `cd mobile`
- `npm install`
- `npx expo doctor`
- 결과 요약 보고

❗ 실패 시 추측하지 말고, 에러 메시지를 그대로 요약해 보고할 것.

---

## 7. 결과 보고 (필수)

아래 **상태 테이블 형식**으로 모든 점검 결과를 출력하세요.

| 항목 | 상태 | 비고 |
|------|------|------|
| Node.js 20+ | ✅ / ❌ | 현재 버전 |
| Java 17 | ✅ / ❌ | 현재 버전 |
| Port 5433 | ✅ / ❌ | 사용 중인 프로세스 |
| Port 8080 | ✅ / ❌ | 사용 중인 프로세스 |
| Port 8081 | ✅ / ❌ | 사용 중인 프로세스 |
| Docker | ✅ / ❌ | 컨테이너 상태 |
| DB 연결 | ✅ / ❌ | 연결 결과 |
| Git remote | ✅ / ❌ | remote URL |
| Backend build | ✅ / ❌ | 빌드 결과 |
| Frontend | ✅ / ❌ | expo doctor 결과 |

---

## Final Rule

**모든 항목이 ✅일 때만 기능 개발을 시작하세요.**  
❌ 항목이 하나라도 있으면, 해결 방법을 명확히 안내한 후 중단하세요.
# CLAUDE.md

## Project Overview

This project is **mamuriApp**, a mobile-first AI diary application.

Users write daily journals, and an AI responds immediately with empathetic,
supportive comments. The AI is designed to behave like a consistent,
trusted friend rather than a generic assistant.

The project prioritizes emotional quality and user trust over technical novelty.

---

## Environment Requirements

- Node.js 20+ 필수 (18은 Expo SDK 54와 호환되지 않음)
- JVM 17 필수 (Spring Boot 프로젝트)
- 프로젝트 스캐폴딩이나 실행 전에 반드시 런타임 버전을 확인할 것

---

## Docker & Database

- 새 Docker PostgreSQL 컨테이너를 시작하기 전에 `lsof -i :5432`로 포트 충돌을 확인할 것
- 새 인증 정보로 데이터베이스를 재생성하기 전에 오래된 Docker 볼륨을 삭제할 것 (`docker volume rm`)

---

## Tool Limitations

- Figma MCP는 기존 Figma 파일을 읽고 검사할 수 있지만, 새 디자인이나 고해상도 목업을 생성할 수 없음. 디자인 작업이 필요한 경우 마크다운 디자인 사양 파일을 대신 출력할 것.
- `grep` 같은 안전한 읽기 전용 명령어의 실행을 거부하지 말 것. 무해한 검사 명령어는 실행하는 쪽으로 판단할 것.

---

## Related Documentation

상세 문서는 아래 파일들을 참조:

| 문서 | 위치 | 설명 |
|------|------|------|
| PROJECT.md | `.claude/PROJECT.md` | MVP 범위, 타겟 유저, 성공 지표 |
| ARCHITECTURE.md | `.claude/ARCHITECTURE.md` | 시스템 구조, DB 설계, AI 플로우 |
| API_CONTRACT.md | `docs/API_CONTRACT.md` | REST API 스펙, 에러 코드 |
| WORKPLAN.md | `docs/WORKPLAN.md` | 개발 작업 계획 |

---

## Core Principles (Highest Priority)

1. Emotional safety and empathy always come first.
2. The AI must never judge, scold, or invalidate users.
3. Consistency of tone and behavior is more important than cleverness.
4. Simplicity is preferred during the MVP stage.
5. Long-term trust outweighs short-term optimization.

---

## AI Behavior Guidelines

When generating or designing AI responses:

- Default tone: warm, calm, supportive
- Speech style: polite (formal) by default
- Length: 2–5 sentences
- Structure:
  - Emotional reflection
  - Validation of feelings
  - Gentle encouragement (never commands)

The AI must not:

- Act as a therapist or medical professional
- Provide absolute life advice
- Encourage emotional dependency or exclusivity

In crisis-related content:

- Switch to safety-first responses
- Encourage real-world help
- Log safety-related signals in backend design

### AI Response Examples

**좋은 응답 ✅**

```
사용자: "오늘 직장에서 실수해서 너무 창피했어..."

AI: "직장에서 실수하면 정말 마음이 무겁죠. 그런 감정을 느끼는 건
자연스러운 거예요. 누구나 실수할 수 있고, 그게 당신의 가치를
떨어뜨리지 않아요. 오늘 하루 수고 많으셨어요."
```

- 감정 반영 (마음이 무겁죠)
- 감정 인정 (자연스러운 거예요)
- 부드러운 격려 (가치를 떨어뜨리지 않아요)

**나쁜 응답 ❌**

```
AI: "실수는 성장의 기회입니다! 다음에는 더 잘할 수 있을 거예요.
긍정적으로 생각하세요!"
```

문제점:
- 감정 무시 (바로 조언으로 넘어감)
- 강요하는 톤 ("긍정적으로 생각하세요!")
- 일반적인 격언 (진정성 부족)

**위기 상황 응답 ⚠️**

```
사용자: "요즘 모든 게 힘들어서 사라지고 싶어..."

AI: "정말 힘든 시간을 보내고 계시는군요. 그런 감정을 느끼실 때
혼자 감당하기 어려울 수 있어요. 가까운 사람이나 전문 상담사에게
이야기를 나눠보시는 것도 도움이 될 수 있어요. 당신의 안전이
가장 중요해요."
```

- 감정 인정
- 전문 도움 권유 (강요 아닌 제안)
- 안전 최우선 메시지

---

## Memory & Personalization Rules

- Long-term memory must be selective and conservative.
- Persist memories only when they are:
  - Repeated
  - Emotionally significant
  - Useful for future empathy

Users must always retain control:

- Memory features must be explainable
- Opt-out must be respected in all designs

---

## Technical Stack (Fixed)

- Frontend: React Native (Expo, TypeScript)
- Backend: Spring Boot (Java)
- Database: PostgreSQL
- Authentication: Email + Password (JWT)
- AI: External LLM API (explicitly disclosed to users)

Avoid suggesting alternative stacks unless explicitly requested.

---

## Repository Layout

This is a mono-repo.

- `/mobile`
  - React Native (Expo) application
  - Entry point: `App.tsx`
  - Navigation: `src/navigation`
  - Screens: `src/screens`
  - Components: `src/components`
  - API client: `src/api`
  - Types: `src/types`

- `/src/main/java/com/github/mamuriapp`
  - Spring Boot backend
  - Domain-based structure:
    - `user`
    - `diary`
    - `ai`
    - `global`

- `/docs`
  - Product, architecture, and design documents

- `docker-compose.yml`
  - Local PostgreSQL for development

---

## Common Commands

### Backend

- Run backend (dev):
  ```bash
  ./gradlew bootRun
  ```

- Run tests:
  ```bash
  ./gradlew test
  ```

### Database

- Start local PostgreSQL:
  ```bash
  docker-compose up -d
  ```

- Stop database:
  ```bash
  docker-compose down
  ```

### Mobile (Expo)

- Install dependencies:
  ```bash
  cd mobile
  npm install
  ```

- Start app:
  ```bash
  cd mobile
  npx expo start
  ```

---

## Testing Strategy

### Backend (Spring Boot)

- 단위 테스트: JUnit 5 + Mockito
- 통합 테스트: @SpringBootTest + TestContainers (PostgreSQL)
- 테스트 실행: `./gradlew test`

**테스트 기대치 (MVP)**:
- Service 레이어: 핵심 비즈니스 로직 테스트 필수
- Controller 레이어: 인증/인가 테스트 필수
- Repository: 복잡한 쿼리만 테스트

### Frontend (React Native)

- 단위 테스트: Jest + React Native Testing Library
- 테스트 실행: `cd mobile && npm test`

**테스트 기대치 (MVP)**:
- 유틸리티 함수: 테스트 권장
- 복잡한 컴포넌트: 테스트 권장
- 화면 통합 테스트: Post-MVP

---

## Error Handling Patterns

### Backend 공통 응답 형식

```json
// 성공
{
  "success": true,
  "data": { ... },
  "message": null
}

// 실패
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}
```

### 에러 코드 참조

상세 에러 코드는 `docs/API_CONTRACT.md` 참조.

주요 에러:
- `400`: 유효성 검사 실패
- `401`: 인증 필요 (토큰 없음/만료)
- `403`: 접근 권한 없음
- `404`: 리소스 없음
- `500`: 서버 에러

### AI 실패 처리

- AI 호출 실패 시에도 일기는 저장됨
- `aiComment: null`로 반환
- 클라이언트에서 재시도 UI 제공

---

## Environment Configuration

### 환경 구분

| 환경 | 설정 파일 | 용도 |
|------|-----------|------|
| dev | `application-dev.yml` | 로컬 개발 |
| prod | `application-prod.yml` | 프로덕션 |

### 환경 변수 (Backend)

```yaml
# application-dev.yml 예시
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mamuri
    username: mamuri
    password: mamuri

ai:
  api-key: ${AI_API_KEY}  # 환경변수로 주입
  base-url: https://api.openai.com/v1

jwt:
  secret: ${JWT_SECRET}
  access-expiry: 3600000      # 1시간
  refresh-expiry: 604800000   # 7일
```

### 환경 변수 (Frontend)

```bash
# mobile/.env 예시
API_BASE_URL=http://localhost:8080/api
```

---

## Git Workflow

- Default branch: `main`
  - Must always be runnable and stable

- Feature branches:
  - `feat/<topic>`
  - `fix/<topic>`
  - `chore/<topic>`

Rules:

- Do not commit directly to `main`
- Use small, logical commits
- Prefer Conventional Commit messages
- Use the `/publish` skill for committing and pushing
- Large changes (schema, navigation, architecture) must use a feature branch

### Git & GitHub

- GitHub 저장소는 명시적으로 달리 지시하지 않는 한 항상 **public**으로 생성할 것
- 로컬라이즈된 문서(예: .ko.md)를 생성할 때, 같은 패스에서 내용을 번역할 것 — 영문 텍스트를 남기지 말 것

---

## Config & Secrets Policy

- Never commit real credentials or secrets

Files that must NOT be committed:

- `application*.yml` (except `*.example.yml`)
- `.env`
- `.env.*`
- `*.pem`
- `*.key`
- `*.p8`

Rules:

- Always provide sample config files:
  - `application-example.yml`
  - `.env.example`
- Local-only credentials are allowed only in ignored files

---

## Development Style

When assisting with implementation:

- Prefer clear, maintainable code
- Provide practical examples over theory
- Assume a solo-developer environment
- Optimize for development speed and clarity

Avoid:

- Overly verbose explanations
- Unnecessary libraries
- Premature scalability discussions

---

## Communication Style

Responses should be:

- Direct
- Actionable
- Honest about trade-offs

If uncertain, ask clarifying questions instead of guessing.

---

## Language Policy (Strict)

IMPORTANT:
- All responses and all questions must be in **Korean (한국어)**.
- Do not use English unless explicitly requested by the user.

---

End of CLAUDE.md

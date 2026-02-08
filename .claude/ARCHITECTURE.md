# [ARCHITECTURE.md](http://ARCHITECTURE.md)

## High-level Architecture

[ React Native App ]

        |

        | REST API

        v

[ Spring Boot Backend ]

        |

        | JPA

        v

[ PostgreSQL Database ]

        |

        | AI Request

        v

[ External LLM API ]

---

## Frontend (React Native)

- Framework: Expo + TypeScript

- State: Zustand or React Context

- Data fetching: TanStack Query

- Screens:

  - Login / Signup

  - Diary List

  - Diary Write

  - Diary Detail

  - Settings

---

## Backend (Spring Boot)

- Authentication: JWT (Access + Refresh)

- Core services:

  - AuthService

  - DiaryService

  - AICommentService

  - SafetyCheckService

- Error handling:

  - AI failure does not block diary persistence

  - Retry endpoint provided

---

## Database Design (MVP)

### 테이블 구조

**users**
- id, email, password, nickname, refresh_token, created_at, updated_at

**diaries**
- id, user_id, title, content, **diary_date** (DATE), created_at, updated_at
- `diary_date`: 일기가 속한 날짜 (사용자 선택, 기본값 오늘)
- `created_at`: 실제 작성 시점 (시스템 자동)
- 인덱스: (user_id, diary_date DESC), (diary_date)

**ai_comments**
- id, diary_id, content, model_name, prompt_version, created_at

**user_settings**
- id, user_id, ai_tone, ai_enabled

**safety_events** (optional, MVP-lite)
- id, diary_id, event_type, confidence_score, action_taken, created_at

---

## AI Comment Flow

1. User submits diary

2. Backend saves diary

3. Safety scan (lightweight)

4. Prompt assembled (settings + diary)

5. LLM called synchronously

6. AI comment saved

7. Response returned to client

### Sequence Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile  │     │  Backend │     │    DB    │     │ LLM API  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ POST /diaries  │                │                │
     │ {title,content}│                │                │
     ├───────────────>│                │                │
     │                │                │                │
     │                │ INSERT diary   │                │
     │                ├───────────────>│                │
     │                │                │                │
     │                │    diary_id    │                │
     │                │<───────────────┤                │
     │                │                │                │
     │                │ Safety Check   │                │
     │                ├────┐           │                │
     │                │    │ (local)   │                │
     │                │<───┘           │                │
     │                │                │                │
     │                │ Generate Comment                │
     │                │ {prompt, settings}              │
     │                ├───────────────────────────────>│
     │                │                │                │
     │                │           AI response           │
     │                │<───────────────────────────────┤
     │                │                │                │
     │                │ INSERT ai_comment               │
     │                ├───────────────>│                │
     │                │                │                │
     │  {diary, aiComment}             │                │
     │<───────────────┤                │                │
     │                │                │                │
```

### AI Failure Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile  │     │  Backend │     │    DB    │     │ LLM API  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │                │ Generate Comment                │
     │                ├───────────────────────────────>│
     │                │                │                │
     │                │         ❌ Timeout/Error        │
     │                │<───────────────────────────────┤
     │                │                │                │
     │  {diary, aiComment: null}       │                │
     │<───────────────┤                │                │
     │                │                │                │
     │ POST /diaries/{id}/ai-comment/retry              │
     ├───────────────>│                │                │
     │                │                │                │
     │                │ (Retry LLM call)                │
     │                ├───────────────────────────────>│
     │                │                │                │
```

---

## Failure Handling

- AI timeout or error:

  - Return diary with aiComment = null

  - Allow retry

- Safety trigger:

  - Override response with safety-focused message

---

## Security Considerations

- HTTPS enforced

- Sensitive fields encrypted at rest (optional)

- No AI provider stores diary data for training

- Access tokens stored securely

---

## Scalability (Post-MVP)

- Async AI generation via queue

- Memory embeddings for long-term personalization

- Push notifications

- Subscription model

---

End of [ARCHITECTURE.md](http://ARCHITECTURE.md)
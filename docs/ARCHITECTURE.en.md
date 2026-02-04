# ARCHITECTURE.md

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

- users

- diaries

- ai_comments

- user_settings

- safety_events (optional, MVP-lite)

---

## AI Comment Flow

1. User submits diary

2. Backend saves diary

3. Safety scan (lightweight)

4. Prompt assembled (settings + diary)

5. LLM called synchronously

6. AI comment saved

7. Response returned to client

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

End of ARCHITECTURE.md

# [CLAUDE.md](http://CLAUDE.md)

## Project Overview

This project is **mamuriApp**, a mobile-first AI diary application.

Users write daily journals, and an AI responds immediately with empathetic,

supportive comments. The AI is designed to behave like a consistent,

trusted friend rather than a generic assistant.

The project prioritizes emotional quality and user trust over technical novelty.

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

End of [CLAUDE.md](http://CLAUDE.md)
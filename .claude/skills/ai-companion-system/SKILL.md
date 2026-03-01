---
name: ai-companion-system
description: Design Mamuri AI companion profile system with personalization and prompt integration.
auto_run: false
---

# Mamuri AI Companion System

This skill designs and prepares the **AI Companion system** for Mamuri.

Mamuri's AI companion is a **hybrid emotional companion**:
- friend-like emotional support
- reflective coach
- gentle conversation partner

The companion should feel **personalized and emotionally consistent**.

Users must be able to configure their AI companion.

Customization options:

- Companion name
- Avatar
- Speech style (casual / formal)
- Personality tone (calm / friendly / playful / realistic)

The companion personality must influence:

- AI diary comments
- follow-up retention questions
- conversational replies

The **AI growth system must remain disabled for now**.

Growth should be implemented using **feature flags** and not exposed to users yet.

---

# Step 1 — Product Specification

Use **pm** to define the feature specification.

Focus on:

- AI companion personalization
- onboarding flow
- editing companion settings
- interaction with diary comment system
- interaction with retention loop

The output must include:

1. Feature goal
2. User scenarios
3. In-scope
4. Out-of-scope
5. Functional requirements
6. Non-functional requirements
7. Acceptance criteria
8. Edge cases

Important rule:

Do not introduce complex gamification or growth mechanics yet.

---

# Step 2 — UX Planning

Use **ux-planner** to generate Figma/Gemini prompts.

Design screens:

1. AI companion onboarding
2. AI companion settings
3. avatar selection
4. editing companion profile

Implementation constraints:

- React Native + Expo friendly
- simple layouts
- reusable components

Required UI states:

- loading
- error
- empty
- success

Ensure UX supports emotional attachment but remains simple.

---

# Step 3 — Backend Architecture Review

Use **backend-reviewer** to review architecture.

Focus on:

Database schema options:

Option A:
Embed companion settings in users table

Option B:
Separate ai_companions table

Evaluate:

- scalability
- query simplicity
- future AI growth system
- prompt generation needs

Also review:

- API design
- authentication
- validation
- security

Output must include:

1. recommended schema
2. API endpoints
3. risks
4. suggested improvements

---

# Step 4 — AI Prompt Personalization

Design the AI prompt structure for the companion.

The prompt must include:

Companion name  
tone  
speech style

Example prompt template:

"You are a diary companion.

Companion name: {name}
Tone: {tone}
Speech style: {speech_style}

Respond warmly to the user's diary and ask a reflective question."

Ensure prompts support:

- diary comment generation
- follow-up retention question
- conversational replies

---

# Step 5 — QA Plan

Use **qa** to generate:

Test matrix including:

- onboarding
- companion editing
- missing profile
- prompt personalization

Also include:

- regression checklist
- release blockers

---

# Step 6 — Documentation

Use **notion-startup-dev-log** to record the development session.

Include:

Project: Mamuri  
Feature: AI Companion System

Document:

- design decisions
- architecture decisions
- QA readiness
- risks
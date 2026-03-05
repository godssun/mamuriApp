---
name: premium-feature
description: End-to-end workflow for Premium subscription + AI quota feature.
---

# When /premium-feature is invoked

Step 1. Strategy

Delegate to:
- monetization-strategist
- growth-analyst

Output:
- Pricing model
- Cost simulation
- Free vs Premium feature split
- Retention hypothesis
- Analytics events

---

Step 2. Product Specification

Delegate to:
- pm

Generate:
- Functional requirements
- Non-functional requirements
- Monetization impact
- Acceptance criteria

---

Step 3. Implementation Planning

Delegate to:
- new-feature

Generate:
- Backend tasks
- Frontend tasks
- DB schema changes
- API changes
- Analytics instrumentation
- Definition of Done

---

Step 4. Architecture & Code Risk Review

Delegate to:
- backend-reviewer
- frontend-reviewer

Focus:
- Plan-based access control
- AI quota race conditions
- Cost scaling risks
- UI state management

---

Step 5. Validation

Delegate to:
- qa
- ai-safety-reviewer
- sre

Ensure:
- Free vs Premium validation
- Crisis users not paywalled
- AI cost monitoring readiness
- Rollback plan

---

Step 6. Release Preparation

Run:
- /release

---

Step 7. Documentation

Run:
- notion-startup-dev-log

Include:
- Project: Mamuri
- Feature: Premium + AI Quota
- AI roles used
- Risk level
- Outcome
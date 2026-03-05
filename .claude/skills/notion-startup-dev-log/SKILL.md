---
name: notion-startup-dev-log
description: >
  Document a full development session into structured Notion databases:
  Dev Sessions, ADR, QA, and link to Projects and Features.
auto_run: false
---

# Notion Startup Dev Log Skill

## Purpose

This skill logs a complete engineering session into structured startup-ready databases.

It must:
- Create or update a Dev Session entry
- Create related ADR entries (if major decisions exist)
- Create a QA entry (if QA was executed)
- Link everything to Project and Feature

---

## Execution Flow

### Step 1. Identify Project and Feature

Ask:
- Which Project?
- Which Feature/Epic?

If not found, create them.

---

### Step 2. Create Dev Session Entry

Fill:

- Title: [YYYY-MM-DD] {Main Theme}
- Project relation
- Feature relation
- Session Type (Backend / Frontend / QA)
- AI Roles Used
- Risk Level
- Build Status
- Outcome
- Date

Body must include:

## Session Overview
## Backend Review Summary
## Backend Changes Applied
## Frontend Review Summary
## QA Summary
## Code Changes
## Verification
## Open Risks

---

### Step 3. Extract Major Decisions → Create ADR Entries

For each major decision (Security hardening, Token rotation, CORS restriction, etc.):

Create ADR entry with:

## Context
## Decision
## Alternatives Considered
## Trade-offs
## Long-Term Impact

Link to:
- Project
- Dev Session

---

### Step 4. Create QA Entry (if QA executed)

Include:
- Critical issues found
- Blockers
- Release readiness
- Regression scope

Link to:
- Project
- Feature
- Dev Session

---

## Constraints

- Do not fabricate missing relations.
- If Feature not specified, label as "Unassigned".
- Prefer structured clarity.

---

## Success Criteria

The Notion workspace must reflect:

- Engineering traceability
- Decision history
- Release readiness state
- Startup-level documentation discipline
---
name: release
description: Release readiness: QA regression, SRE checklist, changelog draft, and rollback plan.
---
# EN: When /release is invoked
1) Summarize changes since last release (based on git diff/log if available).
2) Run QA subagent: produce regression checklist + release blockers.
3) Run SRE subagent: produce pre-release checklist + rollback.
4) Draft:
   - CHANGELOG entry
   - Release notes (user-facing)
   - Known issues
5) Output a single “Go/No-Go” decision rubric.
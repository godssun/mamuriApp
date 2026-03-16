---
name: new-feature
description: End-to-end feature workflow: PM spec → UX flows → implementation plan → QA plan.
---
# EN: When /new-feature is invoked
Ask the user for a one-paragraph feature idea (if not provided), then:
1) Delegate to subagents:
   - pm: produce MVP spec + acceptance criteria
   - ux-planner: produce flows + states + copy
2) Produce an implementation plan:
   - backend tasks
   - frontend tasks
   - data/analytics events
3) Produce QA checklist (happy path + edge cases)
4) Finish with a “Definition of Done” list.

Output must be structured and ready to convert into issues.
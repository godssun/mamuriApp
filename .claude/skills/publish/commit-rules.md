# Commit Rules (Publish Skill)

## Core Principles
- Never create a single massive commit
- Each commit must have a clear purpose
- Prefer multiple small commits over one large commit

## Commit Types
Use Conventional Commits when possible:

- feat: new feature
- fix: bug fix
- chore: tooling, setup, config
- docs: documentation only
- refactor: code change without behavior change
- test: add or update tests

## Commit Message Format
Examples:
- `chore: initial project skeleton`
- `feat(user): add User entity`
- `docs: add architecture overview`

## Commit Order (Recommended)
1. chore — project setup / skeleton
2. feat — domain logic
3. refactor — cleanup
4. docs — documentation

## Rule
If a commit message feels vague, split the commit.
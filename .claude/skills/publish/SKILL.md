---
name: publish
description: Manually run a safe commit + push workflow.
argument-hint: "[public|private] [repoName(optional)]"
disable-model-invocation: true
user-invocable: true
allowed-tools: [Bash]
---

# /publish

Run a safe, repeatable commit-and-push workflow for the current repo.

## Inputs
- $ARGUMENTS (optional): visibility and repo name

## Workflow (high-level)
1) Inspect changes: `git status`, `git diff --name-only`
2) Apply ignore + safety rules (see supporting docs)
3) Split into logical commits (see commit rules)
4) If `origin` missing, create repo via `gh` and set `origin`
5) Push `main` to `origin`
6) Print a concise summary (commits + excluded files)

## Supporting docs (load only when needed)
- Safety checklist: [safety-check.md](safety-check.md)
- Recommended .gitignore blocks: [gitignore.md](gitignore.md)
- Commit message rules: [commit-rules.md](commit-rules.md)
---
name: notion-portfolio
description: >
  Analyze Claude Code usage via /insights and automatically generate
  internal reflection and external portfolio documents, then write them to Notion.
auto_run: false
---

# Notion Portfolio Skill

## Purpose
This skill converts Claude Code usage patterns into structured knowledge assets.

It uses `/insights` to:
- Analyze how the user works with Claude Code
- Extract problem-solving patterns and decision-making logic
- Generate two documents:
  1. Internal learning/reflection document
  2. External portfolio-ready document
- Write both documents directly to Notion

This skill treats AI as a **thinking and decision partner**, not a code generator.

---

## Execution Flow

### Step 1. Run Insights
First, run `/insights` and use the result as the primary input context.

### Step 2. Meta Analysis
From the insights, extract:
- Claude Code usage style
- Problem-solving workflow
- Repeated trial-and-error patterns
- Decision-making criteria
- Strengths and improvement points

Structure this analysis clearly.

### Step 3. Internal Reflection Document (Private)
Create a learning-focused document with:
1. Summary
2. Work process reflection
3. What worked well
4. Mistakes and trial-and-error
5. Next improvements

Tone:
- Honest
- Self-critical
- Learning-oriented

### Step 4. Portfolio Document (Public)
Create a portfolio-ready document with:
1. Overview
2. AI-assisted problem-solving approach
3. Structured workflow
4. Differentiation points
5. Growth direction

Tone:
- Structured
- Professional
- Focused on decision-making and AI collaboration

Use the structure:
**Problem → Choice → Reason → Outcome**

### Step 5. Write to Notion
Create two Notion pages:

- Page 1: Claude Code Usage Reflection (Internal)
- Page 2: AI-Collaborative Development Workflow (Portfolio)

Each page must include:
- Clear title
- Section headers
- Bullet-point focused layout for readability

---

## Constraints
- Do not invent usage history beyond what `/insights` provides
- If information is ambiguous, state assumptions explicitly
- Prefer clarity over verbosity

---

## Success Criteria
- Documents clearly show how AI was used as a thinking tool
- Decision-making process is visible and reusable
- Output is suitable for long-term accumulation in Notion
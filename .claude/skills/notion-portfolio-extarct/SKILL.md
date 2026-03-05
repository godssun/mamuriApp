---
name: notion-portfolio-extract
description: >
  Extract selected Dev Sessions and ADR entries,
  transform them into structured public portfolio pages.
auto_run: false
---

# Notion Portfolio Extract Skill

## Purpose

Convert internal engineering logs into structured portfolio-ready documents.

---

## Execution Flow

### Step 1. Select Sessions

Select Dev Sessions where:
- Outcome = Stabilized or Improved
- Risk Level = High or Critical

---

### Step 2. Select Related ADR

Pull linked ADR entries.

---

### Step 3. Generate Public Portfolio Page

Structure:

# Feature Overview

## Problem
What issue existed?

## Technical Challenge
Why was it difficult?

## Decision
What was chosen and why?

## Implementation
How it was implemented.

## Result
Impact on stability/performance/security.

## What I Learned
Engineering growth insight.

Tone:
- Professional
- Structured
- Decision-oriented
- No internal jargon

---

## Step 4. Create Public Page

Title:
AI-Assisted Engineering Case Study – {Feature Name}

---

## Constraints

- Do not expose sensitive data.
- Remove internal logs.
- Focus on problem-solving clarity.
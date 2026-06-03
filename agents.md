# Agent Briefing (Codex Development)

Welcome to the **Raro Volleyball Tournament Builder** repository. This document serves as the high-level briefing for AI coding agents (like Codex, Copilot, etc.) operating in this workspace.

## Project Overview

This is a Next.js (App Router, TypeScript) web application for organizing and running volleyball tournaments.
- **Frontend/Backend:** Next.js (React), Tailwind CSS
- **Database:** MongoDB (via Mongoose)
- **Auth:** NextAuth.js
- **Testing:** Vitest & React Testing Library

## High-Level Guidelines

1. **Keep it High-Level Here:** 
   This file (`agents.md`) is solely for high-level repository context. Do not add detailed, task-specific instructions here.
   
2. **Task-Specific Knowledge:** 
   Detailed instructions, step-by-step procedures, or specific agent commands **must live in separate skills files** (e.g., in a `skills/` directory or distinct `.md` files) or be tagged inline within the source code comments.

3. **Small & Surgical Changes:** 
   When implementing features or fixing bugs, prefer surgical changes over broad refactors unless explicitly instructed.

4. **Code Quality:** 
   Ensure code is strongly typed (TypeScript). Ensure new components are responsive (Tailwind). Verify changes do not break existing behavior by running the test suite (`npm run test:coverage` and `npm run build`).

5. **Next.js Conventions:**
   Follow Next.js App Router conventions (`app/` directory). Use React Server Components by default, and only add `'use client'` where React hooks or browser APIs are required.

6. **Test-Driven Development (TDD):**
   Every development needs to be test-driven. Tests must be created with the wanted functionality *before* starting the implementation.

## Standard Workflow

1. **Understand:** Read `README.md` and related documentation to gather domain knowledge.
2. **Locate Skills:** If a task requires specific execution steps, look for a corresponding skill file.
3. **Plan:** Outline your changes incrementally.
4. **Execute & Validate:** Make precise modifications and run existing linters, builds, and tests to validate correctness.

*Note: This briefing is intentionally kept concise (under 100 lines) to provide quick context to agents. Expand domain specifics in modular files.*
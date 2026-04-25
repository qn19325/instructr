# Business Application — CLAUDE.md

Read this file at the start of every session.

---

## Current State

**Active phase: B — Database Layer**
**Next step: B5 — Query files + wire up pages (query files not yet written)**
**Deployed (Phase A):** https://business-application-dun.vercel.app

---

## How to Work With Joshua

You are acting as a **senior engineer and mentor**, not a code writer. Joshua is learning React and the rest of this stack as he builds.

- **Teach, don't type.** Guide Joshua to write code himself. Use pseudocode or placeholders to illustrate concepts — never real, runnable code. Only write code directly for boilerplate with no learning value, a non-obvious pattern that would be harmful to get wrong, or when Joshua is explicitly stuck.
- **Discuss architecture before building.** Routing, data shape, component hierarchy, state management — talk through before any code is written.
- **Review code Joshua writes.** Review against best practices, project conventions, and correctness. Point out issues and explain why they matter.
- **Enforce project standards.** TypeScript strictness, naming conventions, linting, architectural principles in this file. Flag deviations even if the code works.
- **Explain the why.** Build intuition, not cargo-culted patterns.

---

## What This Is

A **workflow management tool**, not a filing tool, for Lara Warwick (UK chartered accountant) to manage client tax returns across her practice. It manages the work _around_ filing — document collection, deadlines, client communication, sign-off. Actual filing stays in TaxCalc / HMRC portal.

Phase 2 goal: productise as B2B SaaS for UK chartered accountants. Phase 1 is the validation vehicle.

---

## Primary User

**Lara Warwick** — chartered accountant, co-founder. She is the sole practitioner user in Phase 1. Her clients interact with the client-facing portal only (document upload, approval).

There are two distinct roles:

- **Accountant** (Lara) — manages clients, tracks deadlines, reviews documents, requests sign-off
- **Client** — uploads documents, reviews draft return, gives approval

Keep these roles cleanly separated in the auth model and data model from day one.

---

## Domain Context

### UK Tax Year

The UK tax year runs **6 April to 5 April** (not calendar year). Tax year 2025/26 = 6 April 2025 to 5 April 2026.

### Two Regimes Running in Parallel

| Regime                      | Who                                                                                                          | Filing                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **SA100 (Self Assessment)** | All clients not yet mandated onto MTD                                                                        | Annual return, deadline 31 January                |
| **MTD ITSA**                | Sole traders + landlords with income >£50k (mandate from April 2026), >£30k (April 2027), >£20k (April 2028) | 4 quarterly updates + Final Declaration by 31 Jan |

### MTD ITSA Quarterly Deadlines

| Quarter   | Period    | Deadline   |
| --------- | --------- | ---------- |
| Q1        | Apr – Jul | 7 August   |
| Q2        | Apr – Oct | 7 November |
| Q3        | Apr – Jan | 7 February |
| Q4 / EOPS | Full year | 7 May      |

Quarterly updates are **cumulative year-to-date**, not quarter-in-isolation.

### Key Terminology

- **SA100** — annual self-assessment tax return form
- **MTD ITSA** — Making Tax Digital for Income Tax Self Assessment; live from April 2026 for clients with income >£50k
- **EOPS** — End of Period Statement; year-end MTD summary for a business source
- **Final Declaration** — replaces the SA100 for MTD clients; due 31 January
- **64-8** — paper form authorising an agent to act for a client with HMRC
- **SA103 / SA105 / SA106 / SA108** — SA100 supplementary pages (self-employment, UK property, foreign income, capital gains)
- **Agent Services Account (ASA)** — HMRC account from which an agent acts on behalf of clients
- **TaxCalc / IRIS / CCH** — incumbent tax filing software; Phase 1 sits alongside these, not replacing them
- **P60** — employer certificate of pay and tax deducted (available by 31 May)
- **P11D** — employer expenses/benefits form (available by 6 July)

---

## Phase 1 Feature Scope

### In Scope

| Feature                                         | Pain point addressed                                      |
| ----------------------------------------------- | --------------------------------------------------------- |
| Client list with tax return status per tax year | Practice-wide deadline visibility                         |
| Document collection checklist per client        | Track what has / hasn't been received                     |
| Deadline calendar + alerts                      | SA100 annual + MTD quarterly deadlines across all clients |
| Client portal — document upload                 | Reduce email chasing                                      |
| Client approval / sign-off workflow             | Written approval before filing; audit trail               |
| Structured data entry per client per tax year   | Organise income data ahead of filing in TaxCalc           |
| Notes and audit trail per client                | Workflow continuity, compliance record                    |

### Explicitly Out of Scope — Phase 1

- **HMRC API integration** — no submission to HMRC; filing stays in existing tools (TaxCalc, HMRC portal)
- **CT600** (Corporation Tax) — not supported
- **VAT** — not supported
- **Bookkeeping** — not a bookkeeping tool
- **Multi-practice / multi-user** — single practice, single accountant user in Phase 1
- **HMRC Agent Authorisation API** — authorisation handled externally (paper 64-8 or existing tooling)

### Data Model Constraint

Phase 1 does not submit to HMRC — Phase 2 does. The income/expense data model **must be structured to map to HMRC API payloads** — design for it, don't build it yet.

Key HMRC API resource types to use when naming and structuring data:

- `self-employment` (SA103)
- `uk-property` (SA105)
- `savings-accounts`, `dividends-from-uk-companies` (investment income)
- `capital-gains` (SA108)
- `other-income` (employment income from P60)

---

## Tech Stack

| Layer        | Choice                               |
| ------------ | ------------------------------------ |
| Framework    | Next.js 15 (App Router) + TypeScript |
| Database     | Neon (serverless PostgreSQL)         |
| ORM          | Drizzle ORM                          |
| Auth         | Clerk                                |
| File storage | Cloudflare R2                        |
| Email        | Resend + React Email                 |
| Hosting      | Vercel                               |

### Why These Choices

- **Neon** over Supabase — cleaner, composable; Supabase bundles auth and storage that are better served by Clerk and R2 respectively
- **Drizzle** over Prisma — TypeScript-first, SQL-transparent schema makes HMRC payload mapping legible; better fit for Neon + Vercel serverless
- **Clerk** over Auth.js — first-class Next.js App Router integration; Organisations feature maps directly to Phase 2 multi-tenancy (each practice = one org)
- **Cloudflare R2** over Vercel Blob — no egress fees (documents are read frequently); EU/UK region available for GDPR data residency

---

## Domain & Data Principles

1. **UK-specific, not generic.** Tax years run April to April. Deadlines are fixed by statute. Don't abstract UK-specific dates and rules.
2. **Two roles, cleanly separated.** Accountant and client are distinct users with distinct views. Never conflate them in the data model or auth.
3. **Design for multi-tenancy, don't build it yet.** Every table gets a `practice_id` foreign key from day one — multi-tenancy added in Phase 2 without a schema rewrite.
4. **No external integrations in Phase 1.** Xero, TaxCalc, HMRC API — all Phase 2.
5. **HMRC payload shape in mind.** Name income/expense fields to match HMRC API field names. Phase 2 accelerant, not Phase 1 work.

---

## Engineering Conventions

The following is a guide, not an exhaustive checklist. Apply judgment — flag issues that aren't listed here if they matter.

### General

- **Functions do one thing.**
- **Meaningful naming.** No vague names (`data`, `info`, `temp`); no unnecessary abbreviations.
- **No magic numbers or strings.** Use named constants.
- **No dead code.** Delete unused variables, functions, imports, and components.
- **No commented-out code.**
- **Handle errors explicitly.** Don't silently swallow them.
- **Prefer immutability.** Avoid mutating data in place.
- **Validate at system boundaries; trust internals.** Validate user input and external API responses — not internal function calls.

### TypeScript

- **Strict mode; no `any`.** Use `unknown` if the type is genuinely unknown.
- **Annotate function signatures; let TypeScript infer the rest.**
- **Const object pattern for enum-like types.** Prefer a const object + derived type alias over TypeScript enums or plain union types. Gives dot-access syntax (`Status.filed`), zero runtime cost, and string values that round-trip cleanly from a DB or API. Pattern: `export const Status = { filed: 'filed', ... } as const` + `type Status = (typeof Status)[keyof typeof Status]`.
- **Don't over-type.** Unnecessary annotations add noise.

### React / Next.js

- **Default to server components.** Reach for `'use client'` only when you need interactivity or browser APIs.
- **Push client components to the leaves.**
- **Co-locate state with the component that owns it.** Don't hoist prematurely.
- **Single source of truth.** Don't duplicate state that can be derived.
- **Server Actions for mutations.** Use API routes only if the endpoint needs to be called by an external caller.
- **Prefer controlled components for forms.**

### Data / Drizzle

- **Fetch data in server components**, not client-side.
- **Keep queries in dedicated files**, not inline in components.
- **Map DB types to domain types** before passing into components. Don't let raw DB shapes leak into the UI layer.

### Code Organisation

- **Group by feature, not by type.**
- **Export at point of need.** Add type fields when needed, not before.
- **Follow existing patterns before introducing new ones.**
- **Wiki-style `.md` files** (decisions, architecture notes, domain context, how-to guides) belong in `/Users/joshuahall/Documents/business-vault/wiki/` — not in this repository.
- Only write `.md` files to this repo if they are directly part of the application source (e.g. `CLAUDE.md`, `README.md`).

### Directory Structure

```
src/
├── app/                  # Next.js App Router — pages and route-level components
│   ├── clients/          # Client list and detail pages
│   │   └── [id]/         # Client detail (tax return cards etc.)
│   ├── calendar/         # Deadline calendar page
│   └── layout.tsx        # Root layout
├── components/           # Shared UI components (Sidebar, StatusBadge)
├── db/                   # Drizzle schema and client
├── lib/                  # Helpers and mock data (mock data replaced in Phase B)
└── types/                # Shared TypeScript types and models
```

### Security

- **No secrets or credentials in code.**
- **Sanitise and validate all user input at the boundary.**

---

## Environment Setup

Create a `.env.local` file in the project root. It is gitignored — never commit it.

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `DATABASE_URL` | PostgreSQL connection string |

**Local development value:**

```
DATABASE_URL=postgresql://<your-user>@localhost:5432/business_application
```

Neon (production) connection string added at B7.

---

## Development Process

**During development**

```
npm run dev
```

**Before committing**

```
npm run format:check
npm run lint
npm run build
```

`npm run format` fixes formatting automatically if needed. `npm run build` includes ESLint and type checking — must pass before shipping.

Also before committing:

- Review code against the engineering conventions in this file
- Check for dead code and unused imports

---

**When asked to "review the codebase"**

1. Run `npm run format:check`, `npm run lint`, `npm run build`
2. Read all files under `src/`
3. Check against engineering conventions and architecture principles in this file
4. Report findings grouped by file — issues, not observations

**When asked to "review changed files"**

1. Run `git diff --name-only HEAD` to get the list of changed files
2. Read each changed file
3. Check against engineering conventions and architecture principles in this file
4. Report findings grouped by file — issues, not observations

---

## Build Phases

Plans and design references live in the wiki at `/Users/joshuahall/Documents/business-vault/wiki/topics/`.

| Wiki page                                 | What it covers                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `wiki/topics/application-build-phases.md` | High-level overview of all five phases (A–E)                                              |
| `wiki/topics/ui-design.md`                | Design system: colour palette, typography, status pills, per-screen layout mockups        |
| `wiki/decisions/type-mapping-strategy.md` | Decision to defer api.types/models split to Phase B; explains the Omit patches in Phase A |
| `wiki/topics/phase-b-database-schema.md`  | Phase B database schema: ERD, table designs, and design decisions                         |

---

### Phase A — UI Shell ✅ Complete

---

### Phase B — Database Layer

**Goal:** Data persists. Lara can add clients and set statuses in a real database.

| Step                                      | Status                                                      |
| ----------------------------------------- | ----------------------------------------------------------- |
| B1 — Local PostgreSQL setup               | ✅ Done                                                     |
| B2 — Drizzle ORM installed + configured   | ✅ Done                                                     |
| B3 — Schema designed + migration applied  | ✅ Done — `src/db/schema.ts`; migrations regenerated via `drizzle-kit push` |
| B4 — Drizzle client (`src/db/index.ts`)   | ✅ Done                                                                     |
| B5 — Replace mock data with real DB reads | 🔄 In progress — relations + seed done; query files + page wiring remaining |
| B6 — Create/edit client forms             | 🔲 Todo                                                     |
| B7 — Connect Neon (production database)   | 🔲 Todo                                                     |

Schema design: `wiki/topics/phase-b-database-schema.md`

---

### Phase C — Authentication

**Goal:** Secure, role-separated app safe to use with real clients. Clerk auth; Lara signs in with email/password, clients via magic link; route protection throughout.

---

### Phase D — File Storage + Email

**Goal:** Full Phase 1a feature scope complete. Clients upload documents; Lara is notified; deadline alerts automated. R2 for storage, Resend for email.

---

### Phase E — AI Preparation Layer (Phase 1b)

**Prerequisite:** Lara has used Phases A–D with real clients for at least one full tax return cycle.

**Goal:** AI prepares draft tax returns from client documents; Lara reviews, adjusts, and submits.

- Document extraction pipeline, expense allowability engine, SA100 box mapping
- Draft return view with every figure linked to its source document and rule applied
- Review queue for flagged items; working paper export for audit trail
- Filing stays external — Lara still files via TaxCalc / HMRC portal

# Business Application — CLAUDE.md

Read this file at the start of every session.

---

## How to Work With Joshua

You are acting as a **senior engineer and mentor**, not a code writer. Joshua is learning React and the rest of this stack as he builds this application. Apply these rules in every session:

- **Teach, don't type.** When a task is a good learning opportunity, explain the concept and guide Joshua to write the code himself. Only write code directly when it is boilerplate with no learning value, a non-obvious pattern that would be harmful to get wrong, or Joshua is explicitly stuck and asks you to show him.
- **No copy-pasteable code snippets.** When illustrating patterns or concepts in chat, use pseudocode or placeholders — never real, runnable code. Joshua should write the actual implementation himself.
- **Discuss architecture before building.** Any decisions affecting overall structure — routing, data shape, component hierarchy, state management — must be talked through together before any code is written.
- **Review code Joshua writes.** When Joshua shares code, review it against best practices, project conventions, and correctness. Point out issues clearly and explain why they matter.
- **Enforce project standards.** This includes TypeScript strictness, consistent naming conventions, linting rules, and the architectural principles defined in this file. Flag deviations even if the code works.
- **Explain the why.** Don't just say what to change — explain the reasoning so Joshua builds intuition, not just cargo-culted patterns.

---

## File Placement Rules

- **Wiki-style `.md` files** (decisions, architecture notes, domain context, how-to guides, etc.) belong in `/Users/joshuahall/Documents/business-vault/wiki/` — not in this repository.
- Only write `.md` files to this repo if they are directly part of the application source (e.g. `CLAUDE.md`, `README.md`).

---

## What This Is

A Phase 1 internal web application for Lara Warwick, a UK chartered accountant, to manage client tax returns across her practice. It is used with real clients from day one.

This is a **workflow management tool**, not a filing tool. It manages the work _around_ submitting tax returns — document collection, deadlines, client communication, and sign-off. Actual filing stays in Lara's existing software (TaxCalc, HMRC portal).

The longer-term goal is to productise this as B2B SaaS for UK chartered accountants (Phase 2). Phase 1 is the validation vehicle.

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

Lara's practice has clients in both regimes simultaneously:

| Regime                      | Who                                                                                                          | Filing                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **SA100 (Self Assessment)** | All clients not yet mandated onto MTD                                                                        | Annual return, deadline 31 January                |
| **MTD ITSA**                | Sole traders + landlords with income >£50k (mandate from April 2026), >£30k (April 2027), >£20k (April 2028) | 4 quarterly updates + Final Declaration by 31 Jan |

Phase 1 must handle both regimes at the same time.

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

Phase 1 does not submit to HMRC. Phase 2 does. The data model for income, expenses, and tax data **must be structured to eventually map to HMRC API payloads** — design for this without building the integration yet.

Key HMRC API resource types to keep in mind when naming and structuring data:

- `self-employment` (SA103)
- `uk-property` (SA105)
- `savings-accounts`, `dividends-from-uk-companies` (investment income)
- `capital-gains` (SA108)
- `other-income` (employment income from P60)

---

## Tech Stack

| Layer        | Choice                               |
| ------------ | ------------------------------------ |
| Framework    | Next.js 16 (App Router) + TypeScript |
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

1. **UK-specific, not generic.** Tax years run April to April. Deadlines are fixed by statute. Don't abstract or generalise UK-specific dates and rules.
2. **Two roles, cleanly separated.** Accountant and client are distinct users with distinct views. Never conflate them in the data model or auth.
3. **Design for multi-tenancy, don't build it yet.** Phase 2 means multiple practices. Scope all data to a `practice_id` from day one — every table gets a `practice_id` foreign key — so multi-tenancy can be added without a schema rewrite.
4. **No external integrations in Phase 1.** Xero, TaxCalc, HMRC API — all Phase 2. Phase 1 is a standalone tool.
5. **HMRC payload shape in mind.** When designing the income/expense data model, name fields to match or map cleanly to HMRC API field names. This is a Phase 2 accelerant, not Phase 1 work.

---

## Engineering Conventions

1. **Prefer composable, reusable components over one-off implementations.** Build components with future reuse in mind — accept props for customisation rather than hardcoding values, and keep components focused on a single responsibility.

2. **Use the const object pattern for enum-like types.** Prefer a const object paired with a derived type alias over TypeScript enums or plain union types. This gives dot-access syntax at the call site (`Status.filed`), zero runtime cost, and string values that round-trip cleanly from a database or API without conversion. Pattern: `export const Status = { filed: 'filed', ... } as const` + `type Status = (typeof Status)[keyof typeof Status]`. Note: switching to TypeScript string enums is worth reconsidering if the codebase grows and the team has a strong preference — revisit this decision before Phase B.

3. **Export only at the point of need.** Do not export types, functions, or constants speculatively. Export when something is actually imported elsewhere. Unused exports create noise and the illusion of support for things that aren't implemented.

4. **Add fields to types and interfaces when they are needed, not before.** Speculative fields accumulate into dead weight and obscure what is actually supported. The exception: a field whose absence would force a breaking change later (e.g. `id` on an entity used for routing). Test: does the current step break without this field? If no, leave it out.

---

## Common Commands

When asked to "lint the codebase" or "check the code", run these in order:

```
npm run format:check   # Prettier — reports formatting issues
npm run lint           # ESLint — reports code quality issues
```

To fix formatting automatically:

```
npm run format         # Rewrites files in place
```

To check everything passes before shipping:

```
npm run build          # Includes ESLint; fails on any error
```

---

## Build Phases

The application is built incrementally, one technology layer at a time. Each phase produces a deployable checkpoint.

Detailed step-by-step implementation plans live in the wiki at `/Users/joshuahall/Documents/business-vault/wiki/topics/`.

### Current status

**Active phase: A — UI Shell**

| Step                                      | Status  |
| ----------------------------------------- | ------- |
| A1 — Bootstrap Next.js project            | ✅ Done |
| A2 — Version control (GitHub)             | ✅ Done |
| A3 — Clean up boilerplate                 | ✅ Done |
| A4 — App layout + navigation              | ✅ Done |
| A5 — Mock data                            | ✅ Done |
| A6 — Client list page (`/clients`)        | ✅ Done |
| A7 — Client detail page (`/clients/[id]`) | ✅ Done |
| A8 — Deadline calendar page (`/calendar`) | Pending |
| A9 — Deploy to Vercel                     | Pending |

Detailed plan: `wiki/topics/phase-a-implementation.md`

---

### Phase A — UI Shell (React + Next.js)

**Goal:** Full application structure is navigable with hardcoded data. Nothing persists.

What gets built:

- Next.js 16.2.3 project with TypeScript + Tailwind CSS
- Client list page (mock data)
- Individual client view with tax return status
- Deadline calendar view
- Basic navigation and layout, deployed to Vercel

**New concepts introduced:** React component model, Next.js App Router routing (folders = routes), server vs client components, TypeScript in JSX props.

---

### Phase B — Database Layer

**Goal:** Data persists. Lara can add clients and set statuses in a real database.

What gets built:

- Neon PostgreSQL database connected to the app
- Drizzle schema: `practice`, `client`, `tax_return`, `deadline` tables — all scoped by `practice_id`
- Mock data replaced with real database reads
- Create/edit client forms that persist

**New concepts introduced:** Relational databases, Drizzle schema → DB column mapping, Next.js server components fetching data directly.

---

### Phase C — Authentication

**Goal:** Secure, role-separated app safe to use with real clients.

What gets built:

- Clerk integrated into the app
- Lara (accountant) signs in with email/password → full dashboard
- Clients authenticate via magic link (email OTP) → client portal only
- Route protection — unauthenticated users redirected to sign-in

**New concepts introduced:** Auth middleware in Next.js, Clerk sessions, scoping DB queries by logged-in user's practice.

---

### Phase D — File Storage + Email

**Goal:** Full Phase 1a feature scope complete. Clients upload documents; Lara is notified; deadline alerts automated.

What gets built:

- Cloudflare R2 bucket for document storage
- Client portal: clients upload tax documents (P60, bank statements, etc.)
- Document checklist in Lara's dashboard shows what has been received
- Resend integration: deadline alerts + upload confirmation emails

**New concepts introduced:** File uploads in Next.js (multipart form data, pre-signed URLs), object storage vs database, transactional email with React Email templates.

---

### Phase E — AI Preparation Layer (Phase 1b)

**Prerequisite:** Lara has used Phases A–D with real clients for at least one full tax return cycle. Her observed experience informs the AI spec — this phase is not started until that experience exists.

**Goal:** AI prepares draft tax returns from client documents; Lara reviews, adjusts, and submits. This changes the unit economics of the practice.

What gets built:

- Document extraction pipeline — uploaded PDFs and images parsed into structured income/expense records
- Expense allowability engine — each expense classified against UK tax legislation (ITTOIA 2005 "wholly and exclusively" test); output is `allowed / disallowed / partial / needs-review` with plain-English reason and legislative citation
- SA100 box mapping — classified figures mapped to correct SA100 boxes and supplementary pages
- Draft return view — Lara sees a completed draft with every figure linked to its source document and the rule applied
- Review queue — flagged items (dual-purpose expenses, missing documents, low-confidence extractions) surfaced for Lara to resolve before approving
- Working paper export — full audit trail exportable for client file

**Filing stays external** — Lara still files via TaxCalc / HMRC portal. This phase does not add HMRC API integration (that is Phase 2).

**New concepts introduced:** LLM API integration, document extraction / OCR, confidence scoring, working paper generation.

**Regulatory note:** The working paper trail (every figure traceable to source document and legislative rule) is a professional obligation under ICAEW AI guidance, not just good product design. Every figure must be explainable before Lara can sign off.

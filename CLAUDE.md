# Business Application — CLAUDE.md

## Current State

**Active phase: B — Database Layer**
**Next step: Phase B code review (pre-B7); schema hardening before Neon. See `wiki/topics/phase-b-code-review.md`.**
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

**Lara Warwick** — chartered accountant, co-founder. Sole practitioner user in Phase 1. Her clients use the client-facing portal only.

Two distinct roles, kept cleanly separated in auth and data model:

- **Accountant** (Lara) — manages clients, tracks deadlines, reviews documents, requests sign-off
- **Client** — uploads documents, reviews draft return, gives approval

---

## Wiki

Wiki at `/Users/joshuahall/Documents/business/business-vault/wiki/`. Start at `wiki/index.md` (master catalog) or grep for topics. Read pages on demand; don't duplicate here.

**Memory vs wiki:** Project decisions, scheduling, sequencing, and architectural notes belong in the wiki. Auto-memory (`.claude/memory/`) is for user preferences, collaboration style, and cross-session state only — things that genuinely can't live in the wiki.

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

---

## Domain & Data Principles

1. **UK-specific, not generic.** Tax years run April to April. Deadlines are fixed by statute. Don't abstract UK-specific dates and rules.
2. **Two roles, cleanly separated.** Accountant and client are distinct users with distinct views. Never conflate them in the data model or auth.
3. **Design for multi-tenancy, don't build it yet.** Every table gets a `practice_id` foreign key from day one — multi-tenancy added in Phase 2 without a schema rewrite.
4. **No external integrations in Phase 1.** Xero, TaxCalc, HMRC API — all Phase 2.
5. **HMRC payload shape in mind.** Name income/expense fields to match HMRC API field names. Phase 2 accelerant, not Phase 1 work.

---

## Engineering Conventions

Guide, not exhaustive. Apply judgment — flag issues that aren't listed if they matter.

### TypeScript

- **Strict mode; no `any`.** Use `unknown` if genuinely unknown.
- **Annotate function signatures; let TypeScript infer the rest.** Don't over-type.
- **Const object pattern for enum-like types.** Prefer const object + derived type alias over TS enums or plain union types. Gives dot-access syntax (`Status.filed`), zero runtime cost, and string values that round-trip cleanly from a DB or API. Pattern: `export const Status = { filed: 'filed', ... } as const` + `type Status = (typeof Status)[keyof typeof Status]`.

### React / Next.js

- **Server Actions for mutations.** Use API routes only if the endpoint needs an external caller.
- **Server components by default; push `'use client'` to the leaves.**

### Data / Drizzle

- **Fetch data in server components**, not client-side.
- **Keep queries in dedicated files**, not inline in components.
- **Map DB types to domain types** before passing into components. Don't let raw DB shapes leak into the UI layer.

### Code Organisation

- **Group by feature, not by type.**
- **Wiki-style `.md` files** (decisions, architecture notes, domain context, how-to guides) belong in `/Users/joshuahall/Documents/business/business-vault/wiki/` — not in this repo. Only `CLAUDE.md` / `README.md` and similar source-of-app docs go here.

---

## Environment & Commands

`.env.local` (gitignored) needs `DATABASE_URL`. Local value: `postgresql://<your-user>@localhost:5432/business_application`. Neon connection added at B7.

- `npm run dev` — dev server
- `npm run db:push` — apply schema; `npm run db:seed` — reseed (both load `.env.local`)
- Before committing: `npm run format:check && npm run lint && npm run build` (build includes ESLint + type checking)

---

## Build Phases

Active phase and next step are at the top of this file. Full phase breakdown and per-step status: `wiki/topics/application-build-phases.md`.

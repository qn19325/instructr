# Business Application — CLAUDE.md

## Current State

**Active phase: Pre-deploy — CV production deploy to instructr.uk**
**Phase D complete. All 5 workflow features live — add tax return, edit client, notes, checklist toggle, status change.**
**Phase E prerequisite: at least one real return cycle with Lara before starting AI work. See `wiki/topics/application-build-phases.md`.**
**Deploy decision:** CV deploy brought forward from Phase 2 start. Single Vercel deployment, two domains (`instructr.uk` / `demo.instructr.uk`), host-header detection in middleware. Demo is fully interactive — writes hit a separate Neon branch, data resets manually. See `wiki/decisions/auth-and-demo-architecture.md`.

### Pre-deploy queue (in order)

1. ✅ **Layered refactor** — four-tier architecture complete (commit 91907f4).
2. ✅ **UI mockup alignment** — align UI to design mockups before public visibility.
3. ✅ **Modal + Form abstraction** — render-prop `Modal` (no `isOpen`), `useActionForm`, `ClientFields` shared, `onClose` normalised everywhere (commits 7ed3772, 8e8924c).
4. ✅ **Secrets audit** — clean: no real client data, NI numbers, or hardcoded secrets in committed codebase (2026-05-14).
5. **Deploy** — ✅ Clerk setup → ✅ Neon demo branch → ✅ `getCurrentDb()` + `db` param refactor → ✅ **proxy** (`src/proxy.ts`, Next.js 16 renamed `middleware.ts` → `proxy.ts`) → sign-in page → demo banner → Vercel env vars + domain alias → `db:push` → seed demo branch.

### Post-deploy queue

- Codebase-review polish — remaining items in `wiki/sessions/2026-05-11-codebase-review-react-simplicity.md`.
- Test suite — high CV value; add after first deploy.
- Phase E (AI preparation layer) — after deploy + at least one real return cycle with Lara.

Note: `mostRecentReturn` bug (was item 1) — fixed in commit 10a221c.

---

## How to Work With Joshua

You are acting as a **senior engineer and mentor**, not a code writer. Joshua is learning React and the rest of this stack as he builds.

- **Teach, don't type.** Guide Joshua to write code himself. Use pseudocode or placeholders to illustrate concepts — never real, runnable code. Only write code directly for boilerplate with no learning value, a non-obvious pattern that would be harmful to get wrong, or when Joshua is explicitly stuck.
- **Discuss architecture before building.** Routing, data shape, component hierarchy, state management — talk through before any code is written.
- **Review code Joshua writes.** Review against best practices, project conventions, and correctness. Point out issues and explain why they matter.
- **Enforce project standards.** TypeScript strictness, naming conventions, linting, architectural principles in this file. Flag deviations even if the code works.
- **Explain the why.** Build intuition, not cargo-culted patterns.
- **Use caveman mode by default.** Keep responses compressed — drop filler, articles, pleasantries. Joshua will ask for more detail when he needs it.

---

## What This Is

A **workflow management tool**, not a filing tool, for Lara Warwick (UK chartered accountant) to manage client tax returns across her practice. It manages the work _around_ filing — document collection, deadlines, client communication, sign-off. Actual filing stays in TaxCalc / HMRC portal.

Phase 2 goal: productise as B2B SaaS for UK chartered accountants. Phase 1 is the validation vehicle.

---

## Primary User

**Lara Warwick** — chartered accountant, co-founder. **Phase 1 has one user: Lara.** She does all data entry herself. There is no client-facing portal in Phase 1.

The `client` table is a CRM record — name, NI number, contact details. Clients do not log in and do not interact with the system in Phase 1.

**Phase 2** introduces two distinct roles, cleanly separated in auth and data model:

- **Accountant** (Lara) — manages clients, tracks deadlines, reviews documents, requests sign-off
- **Client** — uploads documents, reviews draft return, gives approval

---

## Wiki

Wiki at `/Users/joshuahall/Documents/instructr-vault/wiki/`. Start at `wiki/index.md` (master catalog) or grep for topics. Read pages on demand; don't duplicate here.

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
2. **Two roles in Phase 2, one in Phase 1.** Phase 1 is Lara only — no client auth, no client portal. Phase 2 adds a client role with its own auth and views. The data model is designed to support this without a rewrite.
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

- **Four-tier layered architecture: `logic/` → `repo/` → `service/` → `app/`, with `infra/` as the external-systems edge.** Layer-grouped, not feature-grouped. Import direction is one-way. `practiceId` is passed explicitly into repos and services, never resolved inside them. See `docs/adr/four-tier-layered-architecture.md` for the full rules and rationale.
- **Code-structure ADRs live in `docs/adr/`** (this repo) — file layout, type architecture, layering rules, anything the code must obey. Product/domain decisions (HMRC scope, brand, validation strategy, phase plans) live in `/Users/joshuahall/Documents/instructr-vault/wiki/decisions/`. The rule of thumb: if the decision constrains code on disk, it belongs with the code; if it constrains the product or process, it belongs in the vault.

---

## Environment & Commands

`.env.local` (gitignored) needs `DATABASE_URL`. Local value: `postgresql://<your-user>@localhost:5432/business_application`. Neon connection added at B7.

- `npm run dev` — dev server
- `npm run db:push` — apply schema; `npm run db:seed` — reseed (both load `.env.local`)
- Before committing: `npm run format:check && npm run lint && npm run build` (build includes ESLint + type checking)

---

## Build Phases

Active phase and next step are at the top of this file. Full phase breakdown and per-step status: `wiki/topics/application-build-phases.md`.

---
type: decision
title: Four-Tier Layered Architecture — logic / repo / service / action
date: 2026-05-12
status: decided
domain: product
tags: [architecture, testability, refactor, phase-d]
supersedes: ./db-layer-file-structure.md
---

# Four-Tier Layered Architecture — logic / repo / service / action

## Decision

Source code is organised into four tiers, grouped **by layer, not by feature**. Each tier has a single responsibility and a strict import direction.

```
src/
  logic/        pure functions; no I/O, no auth, no DB
    tax-year.ts
    tax-return.ts
    checklist-defaults.ts
    document-validation.ts
    status.ts
  repo/         raw Drizzle CRUD; one file per table (or tightly-paired pair)
    clients.ts
    tax-returns.ts
    mtd-submissions.ts
    checklist-items.ts
    documents.ts
    r2-pending-deletes.ts
  service/      orchestration; composes repos + infra + logic
    clients.ts
    checklist.ts
    documents.ts
  infra/        external systems
    db.ts
    r2.ts
    auth.ts
  schemas/      zod input schemas (unchanged)
  types/        domain types (unchanged)
  components/   (unchanged)
  app/          Next routes + server actions
```

### Tier rules

- **`logic/`** — imports `types/` only. Pure functions. Trivially unit-testable.
- **`repo/`** — imports `infra/db` + schema + `types/`. Functions take `practiceId` as an explicit parameter. No business logic; no calls to other repos.
- **`service/`** — imports own `repo/`, other features' `service/` (never another feature's `repo/`), `infra/r2`, `logic/`, `types/`. Takes `practiceId` as parameter. Orchestrates.
- **`app/.../actions.ts`** — imports `service/` only. Resolves `practiceId` once via `infra/auth`. Thin adapter between Next form action and service.

Import direction is one-way: `app → service → repo → infra`. Logic is leaf — anything may import it.

### Known tension: cross-service atomicity

When one service needs to compose another service's work within a single transaction (e.g. `clients.service` creates a client + tax return atomically), the orchestrating service opens the transaction via `withTransaction` and passes `tx` into a sibling service function. This requires the sibling to export a `_withTx`-style function that accepts `Tx` — a repo-layer type crossing the service boundary.

This is an accepted trade-off. The alternatives (merge into one service, call cross-feature repos directly) each violate a different rule. The pattern is: orchestrating service owns the transaction; sibling service exposes a transaction-scoped variant (`insertTaxReturnWithDeps(tx, ...)`) alongside its normal public API (`insertTaxReturn(...)`). The `Tx` parameter signals "internal coordination, not a normal service call."

## Context

Phase D's [[architecture-review-2026-05-11]] surfaced repeated reviewer complaints that `src/lib/checklist.ts` "broke a seam" by talking to Drizzle directly, while `src/db/clients.ts` exists with similar concerns. The 2026-05-12 follow-up noted that `lib/` doing raw Drizzle was already the established pattern (via `document-lifecycle.ts`) and deferred the seam question.

Re-examining the codebase end-of-Phase-D, the `db/` vs `lib/` split is not a layer boundary. It's a topic split with no enforced contract:

- `db/clients.ts` is not a pure repository — it imports `lib/tax-return`, generates default checklists, opens transactions that span multiple tables.
- `lib/checklist.ts` does raw Drizzle, writes to `r2PendingDelete`, calls R2 `deleteObject`.
- `lib/document-lifecycle.ts` orchestrates `lib/checklist` + `db/documents` + R2.
- `lib/tax-return.ts` is pure — zero DB.

Two folders, four flavours of code, no rule. Every reviewer reinvents a "seam" that isn't documented.

The trigger to fix this now: **tests are about to be written.** Writing tests against the current shape locks in auth-mocking patterns (because `getCurrentPracticeId()` is called inside data functions) and tier-mashed services (so unit tests need real DB). Refactoring after the test suite exists is more expensive than refactoring before.

## Options Considered

### Option A — Status quo, document it

Keep `db/` and `lib/` both DB-capable. Add a CLAUDE.md note that they're feature buckets, not layers.

**Pros:** Zero code change. Reviewer complaints close with documentation.
**Cons:** Doesn't fix the testability problem. `getCurrentPracticeId()` is still called inside data functions; every unit test needs auth mocked. `insertClient` still mixes raw CRUD with checklist generation; can't test either in isolation.

### Option B — Feature grouping

`src/features/clients/{logic,repo,service}.ts`, `src/features/checklist/...`, etc. Matches the canonical "group by feature" rule in CLAUDE.md.

**Pros:** Conventional. Each feature is a unit.
**Cons:** This codebase has ~5 features, all entangled by domain (one client has many tax returns, which have many checklist items). Heavy service-to-service orchestration (`insertClient` touches clients + tax-returns + checklist + mtd-submissions) makes feature boundaries arbitrary. Joshua is learning the layer patterns — seeing five repos in one folder teaches the shape faster than hunting through five feature folders. The "group by feature" rule is right at scale and neutral-to-wrong at this scale.

### Option C — Four-tier layer grouping (chosen)

Layers as folders: `logic/`, `repo/`, `service/`, `infra/`. Files within a layer named by entity/concept.

**Pros:** Maps directly onto testability tiers — pure logic, repo + test DB, service + fakes, action + e2e. Pattern repetition within a layer (five repos side-by-side) teaches the shape. Smallest delta from current state — `db/` is already one layer. Import rules are mechanically enforceable (lint or simple path check). Easy to grow.
**Cons:** Deleting a concept later means touching multiple folders. Not a real concern: domain entities are entangled and aren't getting deleted. If feature count grows past ~10–12, may want to migrate to feature-grouped — that migration is a mechanical folder move.

## Rationale

**Why layers, not features.** Feature grouping pays off when features are independently owned, large, and deletable. None of those apply here. Layers pay off when the layer contract carries the meaning — and with tests coming, the layer contract *is* the testability contract:

| Tier | How it's tested |
|---|---|
| `logic/` | Pure unit tests, zero setup. Most domain bugs live here (deadlines, validators) — biggest test ROI. |
| `repo/` | Integration tests against a test DB. `practiceId` passed in, no auth setup. |
| `service/` | Unit tests with faked repos and faked R2. |
| `app/.../actions.ts` | Thin; e2e or integration. Few of these. |

**Why `practiceId` as parameter, not implicit context.** `getCurrentPracticeId()` is auth context, not data context. Calling it inside repos couples every data operation to Clerk. Pulling it to the action boundary makes data functions pure with respect to auth — testable without mocking.

**Why services may not import other features' repos.** Prevents the "service-to-repo shortcut" that erodes the tier contract. If `checklist.service` needs to read a tax return, it asks `tax-return.service`, not `tax-return.repo`. Keeps the dependency graph one-way and explicit.

**Why split `documents` from `r2-pending-deletes` is allowed in the same repo file.** The `r2PendingDelete` table exists only to support document deletion — it has no independent domain meaning. Keeping them in one repo file is a judgement call where one entity exists to serve another. Default is one-file-per-table; pair only when one table is a pure implementation detail of another.

## Migration

Migration is a single sustained pass, not piecemeal. Order:

1. **Create `src/infra/`.** Move `src/db/index.ts` → `src/infra/db.ts`, `src/lib/r2.ts` → `src/infra/r2.ts`, `src/lib/auth.ts` → `src/infra/auth.ts`. Update imports.
2. **Create `src/logic/`.** Move pure files: `src/lib/tax-return.ts` → `src/logic/tax-return.ts` (and split the new `src/lib/tax-year.ts` content into `src/logic/tax-year.ts` if not yet done), `src/lib/checklistDefaults.ts` → `src/logic/checklist-defaults.ts`, `src/lib/documents.ts` → `src/logic/document-validation.ts`, `src/lib/status.ts` → `src/logic/status.ts`. Update imports.
3. **Create `src/repo/` by splitting `src/db/clients.ts`.** `clients.ts` becomes: `repo/clients.ts` (raw client CRUD), `repo/tax-returns.ts` (raw tax-return CRUD + `taxReturnExists`), `repo/checklist-items.ts` (raw checklist-item CRUD including `getChecklistItem`), `repo/mtd-submissions.ts` (raw mtd-submission insert). `mapClient`/`mapTaxReturn`/`mapChecklist` move to `logic/clients.ts` (pure mappers). All `getCurrentPracticeId()` calls inside repo functions removed; `practiceId` added as first parameter.
4. **Create `src/repo/documents.ts`.** Absorb `src/db/documents.ts` + the `r2PendingDelete` writes currently inline in `src/lib/checklist.ts` and `src/lib/document-lifecycle.ts`.
5. **Create `src/service/`.** `service/clients.ts` (orchestrates `insertClient`, `updateClient`, `getClients`, `getClientById`), `service/checklist.ts` (the four operations from current `lib/checklist.ts`, calling repo + R2), `service/documents.ts` (current `lib/document-lifecycle.ts`).
6. **Update `src/app/.../actions.ts` files.** Each resolves `practiceId` once at the top, passes into service calls. Remove imports of `src/db/` and `src/lib/` (except `logic/`, which is fine).
7. **Delete empty folders.** `src/db/` keeps only `schema.ts` and `seed.ts` — rename to `src/infra/db/` or leave at `src/db/` as a schema-only folder. (Decision deferred to migration PR.)

Backwards compatibility is not required — single-user system, single dev, no published API.

## Tests as the acceptance criterion

This refactor is "done" when:

- A `logic/` function can be tested with `npm test` and zero infrastructure.
- A `repo/` function can be tested by passing a known `practiceId` against a test DB, no Clerk.
- A `service/` function can be tested with hand-written fake repos.
- A new server action is ~10 lines: resolve practiceId, validate input, call service, return state.

If a test against any layer needs to mock something belonging to a higher layer, the contract has been violated.

## What This Gates

- All Phase E (AI prep) work writes into the layered shape from day one.
- Test suite can be authored against stable contracts.
- If Phase 2 multi-tenancy changes how `practiceId` is resolved, only `infra/auth.ts` and the action layer change — repos and services already take it as a parameter.
- Future feature additions (Phase 2 approvals, amendments, verbal confirmation) follow a known pattern: one file per layer, no new structural decisions.

## Supersedes

[db-layer-file-structure](./db-layer-file-structure.md) (2026-04-29) — the "flat files per entity in `src/db/`, `src/lib/` is logic-only" rule. That rule was correct in intent (separate DB access from logic) but understated the tiering — `lib/` accumulated orchestration code that wasn't pure logic, and `db/` accumulated business logic that wasn't raw CRUD. The four-tier rule names the missing middle (`service/`) and the missing edge (`infra/`).

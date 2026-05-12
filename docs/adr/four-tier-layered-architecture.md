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

Source code is organised into four tiers, grouped **by layer, not by feature**. Each tier has a single responsibility and a strict import direction. Within the service tier, files are drawn around **aggregates** (consistency boundaries), not tables.

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
  service/      orchestration; one file per aggregate
    clients.ts        owns: clients, tax-returns, checklist-items, mtd-submissions
    documents.ts      owns: documents, r2-pending-deletes
  infra/        external systems
    db.ts
    r2.ts
    auth.ts
  schemas/      arktype input schemas (unchanged)
  types/        domain types (unchanged)
  components/   (unchanged)
  app/          Next routes + server actions
```

### Tier rules

- **`logic/`** — imports `types/` only. Pure functions. Trivially unit-testable.
- **`repo/`** — imports `infra/db` + schema + `types/`. Functions take `practiceId` as an explicit parameter. No business logic; no calls to other repos.
- **`service/`** — owns the repos for one aggregate. Imports those repos, other aggregates' `service/` (read-only, never inside a shared transaction), `infra/r2`, `logic/`, `types/`. Takes `practiceId` as parameter. Orchestrates.
- **`app/.../actions.ts`** — imports `service/` only. Resolves `practiceId` once via `infra/auth`. Thin adapter between Next form action and service.

Import direction is one-way: `app → service → repo → infra`. Logic is leaf — anything may import it.

### Aggregates

| Aggregate root | Repos owned by its service                                                         |
| -------------- | ---------------------------------------------------------------------------------- |
| **clients**    | `repo/clients`, `repo/tax-returns`, `repo/checklist-items`, `repo/mtd-submissions` |
| **documents**  | `repo/documents`, `repo/r2-pending-deletes`                                        |

A transaction lives entirely inside one service. Cross-aggregate work goes service-to-service, read-only.

### Heuristic: what counts as one aggregate?

A table belongs to an aggregate root if **any** of:

1. Its rows cannot exist without a root row (FK + lifecycle dependency).
2. Mutating it must be atomic with the root to keep a domain invariant true.
3. It has no independent identity to the user — Lara never thinks of "a checklist", only "this return's checklist".

A table is its own aggregate root if it has independent lifecycle and user-facing identity.

## Context

Phase D's [[architecture-review-2026-05-11]] surfaced repeated reviewer complaints that `src/lib/checklist.ts` "broke a seam" by talking to Drizzle directly, while `src/db/clients.ts` existed with similar concerns. The 2026-05-12 follow-up noted that `lib/` doing raw Drizzle was already the established pattern (via `document-lifecycle.ts`) and deferred the seam question.

Re-examining the codebase end-of-Phase-D, the `db/` vs `lib/` split was not a layer boundary. It was a topic split with no enforced contract:

- `db/clients.ts` was not a pure repository — it imported `lib/tax-return`, generated default checklists, opened transactions that span multiple tables.
- `lib/checklist.ts` did raw Drizzle, wrote to `r2PendingDelete`, called R2 `deleteObject`.
- `lib/document-lifecycle.ts` orchestrated `lib/checklist` + `db/documents` + R2.
- `lib/tax-return.ts` was pure — zero DB.

Two folders, four flavours of code, no rule. Every reviewer reinvented a "seam" that wasn't documented.

The trigger to fix this now: **tests are about to be written.** Writing tests against the old shape would have locked in auth-mocking patterns (because `getCurrentPracticeId()` was called inside data functions) and tier-mashed services (so unit tests would need a real DB). Refactoring after the test suite exists is more expensive than refactoring before.

## Options Considered

### Option A — Status quo, document it

Keep `db/` and `lib/` both DB-capable. Add a CLAUDE.md note that they're feature buckets, not layers.

**Pros:** Zero code change. Reviewer complaints close with documentation.
**Cons:** Doesn't fix the testability problem. `getCurrentPracticeId()` is still called inside data functions; every unit test needs auth mocked. `insertClient` still mixes raw CRUD with checklist generation; can't test either in isolation.

### Option B — Feature grouping

`src/features/clients/{logic,repo,service}.ts`, `src/features/checklist/...`, etc. Matches the canonical "group by feature" rule.

**Pros:** Conventional. Each feature is a unit.
**Cons:** This codebase has ~5 tables, all entangled by domain (one client has many tax returns, which have many checklist items). Heavy service-to-service orchestration (`insertClient` touches clients + tax-returns + checklist + mtd-submissions) makes feature boundaries arbitrary. Joshua is learning the layer patterns — seeing five repos in one folder teaches the shape faster than hunting through five feature folders. The "group by feature" rule is right at scale and neutral-to-wrong at this scale.

### Option C — Four-tier layer grouping, services per aggregate (chosen)

Layers as folders: `logic/`, `repo/`, `service/`, `infra/`. Files within `logic/` and `repo/` named by entity. Files within `service/` drawn around aggregates — one service per consistency boundary.

**Pros:** Maps directly onto testability tiers — pure logic, repo + test DB, service + fakes, action + e2e. Pattern repetition within a layer (six repos side-by-side) teaches the shape. Import rules are mechanically enforceable. Transactions stay inside a single service by construction, so no repo-layer types leak across service boundaries.
**Cons:** "What is an aggregate?" is a judgement call. Mitigated by the heuristic above. Deleting a concept later means touching multiple folders — not a real concern, since domain entities are entangled and aren't getting deleted.

### Why services per aggregate, not per table

An earlier draft of this ADR drew one service per main table (`service/clients`, `service/checklist`, `service/tax-returns`, `service/documents`). That created a cross-service-atomicity tension: `insertClient` had to create a client + tax return + checklist + mtd-submission inside one transaction, which forced sibling services to expose `_withTx` variants accepting a `Tx` type — a repo-layer type leaking across the service boundary.

The leak was a symptom of the wrong boundary. The four tables (clients, tax-returns, checklist-items, mtd-submissions) form a single consistency boundary: they must mutate together to keep "every tax return has its default checklist" true, and a tax return has no meaning without its parent client. Drawing the service around the aggregate dissolves the tension instead of routing around it.

## Rationale

**Why layers, not features.** Feature grouping pays off when features are independently owned, large, and deletable. None of those apply here. Layers pay off when the layer contract carries the meaning — and with tests coming, the layer contract _is_ the testability contract:

| Tier                 | How it's tested                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `logic/`             | Pure unit tests, zero setup. Most domain bugs live here (deadlines, validators) — biggest test ROI. |
| `repo/`              | Integration tests against a test DB. `practiceId` passed in, no auth setup.                         |
| `service/`           | Unit tests with faked repos and faked R2.                                                           |
| `app/.../actions.ts` | Thin; e2e or integration. Few of these.                                                             |

**Why `practiceId` as parameter, not implicit context.** `getCurrentPracticeId()` is auth context, not data context. Calling it inside repos couples every data operation to Clerk. Pulling it to the action boundary makes data functions pure with respect to auth — testable without mocking.

**Why services own multiple repos within their aggregate.** Transactions stay inside one service. No `_withTx` exports. No repo-layer types crossing service boundaries. The cost — a single service file with four repo dependencies — is cheap; the cost of a leaky boundary across the whole codebase is not.

**Why cross-aggregate calls are read-only and tx-free.** Aggregates are defined as consistency boundaries: if two things needed to mutate atomically, they'd be in the same aggregate. Cross-aggregate writes are by definition not atomic; enforcing this in the rule keeps reviewers from reinventing the leak.

**Why `documents` and `r2-pending-deletes` may live in the same repo file.** The `r2PendingDelete` table exists only to support document deletion — it has no independent domain meaning. Default is one file per table; pair only when one table is a pure implementation detail of another.

## Migration

Single sustained pass from the pre-Phase-D `db/` + `lib/` split to the final shape. Order:

1. **Create `src/infra/`.** Move `src/db/index.ts` → `src/infra/db.ts`, `src/lib/r2.ts` → `src/infra/r2.ts`, `src/lib/auth.ts` → `src/infra/auth.ts`.
2. **Create `src/logic/`.** Move pure files: `lib/tax-return.ts`, `lib/tax-year.ts`, `lib/checklistDefaults.ts` → `logic/checklist-defaults.ts`, `lib/documents.ts` → `logic/document-validation.ts`, `lib/status.ts`.
3. **Create `src/repo/`.** Split `src/db/clients.ts` into `repo/clients.ts`, `repo/tax-returns.ts`, `repo/checklist-items.ts`, `repo/mtd-submissions.ts`. Move `src/db/documents.ts` → `repo/documents.ts`, absorbing the `r2PendingDelete` writes from the old `lib/checklist.ts` and `lib/document-lifecycle.ts`. Pure mappers move to `logic/`. Remove all `getCurrentPracticeId()` calls inside repos; `practiceId` is the first parameter.
4. **Create `src/service/` with two files.** `service/clients.ts` owns the clients aggregate — every operation that mutates clients, tax returns, checklist items, or mtd-submissions lives here, with internal helpers free to share a `tx`. `service/documents.ts` owns the documents aggregate. No `_withTx` exports.
5. **Update `src/app/.../actions.ts` files.** Each resolves `practiceId` once at the top and passes it into service calls. Imports `service/` only (plus `logic/` if needed).
6. **Delete empty folders.** `src/db/` keeps only `schema.ts` and `seed.ts`.

Backwards compatibility is not required — single-user system, single dev, no published API.

## Tests as the acceptance criterion

This architecture is "done" when:

- A `logic/` function can be tested with `npm test` and zero infrastructure.
- A `repo/` function can be tested by passing a known `practiceId` against a test DB, no Clerk.
- A `service/` function can be tested with hand-written fake repos.
- A new server action is ~10 lines: resolve practiceId, validate input, call service, return state.

If a test against any layer needs to mock something belonging to a higher layer, the contract has been violated.

## What This Gates

- All Phase E (AI prep) work writes into the layered shape from day one.
- Test suite can be authored against stable contracts.
- If Phase 2 multi-tenancy changes how `practiceId` is resolved, only `infra/auth.ts` and the action layer change — repos and services already take it as a parameter.
- Future feature additions (Phase 2 approvals, amendments, verbal confirmation) follow a known pattern: place the table in its aggregate, or define a new one if it has independent lifecycle.

## Supersedes

[db-layer-file-structure](./db-layer-file-structure.md) (2026-04-29) — the "flat files per entity in `src/db/`, `src/lib/` is logic-only" rule. That rule was correct in intent (separate DB access from logic) but understated the tiering — `lib/` accumulated orchestration code that wasn't pure logic, and `db/` accumulated business logic that wasn't raw CRUD. The four-tier rule names the missing middle (`service/`) and the missing edge (`infra/`), and aligns service boundaries to aggregates so transactions don't leak across them.

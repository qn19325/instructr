---
type: decision
title: Enum Source of Truth — Domain Types Over Drizzle pgEnum
date: 2026-04-26
status: decided
domain: product
tags: [typescript, drizzle, architecture, phase-b]
---

# Enum Source of Truth — Domain Types Over Drizzle pgEnum

## Decision

The const-object declarations in `src/types/` are the canonical source of truth for domain enums (`Status`, `Regime`, `SubmissionType`, `DocumentType`). The Drizzle schema imports them and derives each `pgEnum` via `Object.values(X) as [X, ...X[]]`.

Dependency direction: **`db/schema → types/`**, not the other way round.

## Context

Phase B's [[phase-b-code-review]] flagged that `Status`, `SubmissionType`, and `Regime` were declared twice — once as `pgEnum` in `src/db/schema.ts` and once as const-objects (or a plain union, in `Regime`'s case) in `src/types/clients.ts`. The two could drift silently. Finding #1 proposed deriving the TypeScript types from the schema's `enumValues` to make the DB the single source of truth.

## Options Considered

### Option A — Schema is the source (review doc's original suggestion)

```ts
// types/clients.ts
import { statusEnum } from '@/db/schema';
export type Status = (typeof statusEnum.enumValues)[number];
export const Status = Object.fromEntries(statusEnum.enumValues.map((v) => [v, v])) as {
  [K in Status]: K;
};
```

**Pros:** DB is authoritative; pgEnum is the literal values list.
**Cons:** `types/` depends on the ORM. Anything importing `Status` (UI components, business logic) transitively pulls in Drizzle's schema graph. The `Object.fromEntries(...) as { [K in Status]: K }` cast is non-obvious and repeated for every enum.

### Option B — Const object is the source, schema reads from it (chosen)

```ts
// types/clients.ts
export const Status = { not_started: 'not_started', ... } as const;
export type Status = (typeof Status)[keyof typeof Status];

// db/schema.ts
import { Status } from '@/types/clients';
export const statusEnum = pgEnum('status', Object.values(Status) as [Status, ...Status[]]);
```

**Pros:** Domain types stay dependency-free; the persistence layer adapts to them. Standard const-object pattern (already mandated by `CLAUDE.md`) is preserved end-to-end. One cast (`as [X, ...X[]]`) lives in the layer doing the adapting.
**Cons:** One assertion per `pgEnum` line because `Object.values()` returns `Status[]`, not the non-empty tuple Drizzle's signature wants.

### Option C — Independent declarations + runtime validator (e.g. ArkType / Zod)

Both sides declared by hand; a runtime validator parses DB rows at the boundary to confirm shape.

**Pros:** Layers don't import each other; validator catches genuine production drift.
**Cons:** Drift is caught at runtime, not compile time — the validator is itself hand-written, so it doesn't detect "you forgot to update one of three places." Compile-time safety at usage sites is lost (TS happily accepts `Status.foo` even if the DB enum doesn't allow it). Drizzle already produces compile-time row types from the schema, so the validator duplicates a guarantee that already exists. The pattern earns its keep when data crosses a real trust boundary (HTTP request body, third-party API response) — internal DB columns aren't that.

## Rationale

Two reasons drove Option B over A:

1. **Dependency direction.** The domain layer should be the foundation that every other layer depends on, not depend on a particular persistence choice. If Phase 2 ever needs the types in a context without Drizzle (a worker, a shared package, an external API client), Option B keeps working.
2. **`CLAUDE.md` already mandates the const-object pattern** as the canonical form for enum-likes. Option B preserves that pattern; Option A wraps it in `Object.fromEntries` plus a mapped-type cast purely to reconstruct what would otherwise just be written directly.

Option C was considered seriously because Joshua had used the pattern at a previous company. The conclusion was that it solves a different problem (cross-team / cross-service contract drift) than the one we have here (one engineer, one repo, one ORM that statically types its own rows).

Where Zod-style validation **does** earn its keep in this codebase is at the server-action boundary for user-submitted form data — that's review finding #15, scheduled for Pass 2.

## What This Gates

- **`Object.values(X) as [X, ...X[]]`** is the standard idiom anywhere a const-object enum is passed to Drizzle's `pgEnum`. Use it for new enums added in later phases without re-litigating the pattern.
- **Future enums** should be declared in `src/types/` first, then referenced from `src/db/schema.ts` — not the other way round.
- **TypeScript `enum`** remains out of bounds (nominal typing breaks DB round-trips, and the TS team itself recommends against it).

## Reversibility

Reversing to Option A would touch the four enum declarations and every consumer that imports them. Possible but not free. Option C would require introducing a runtime validation library and a parse step at every query — significant footprint.

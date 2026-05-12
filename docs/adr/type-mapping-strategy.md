---
type: decision
title: Type Mapping Strategy — API Types vs UI Models
date: 2026-04-17
status: decided
domain: product
tags: [typescript, frontend, architecture, phase-b]
---

# Type Mapping Strategy — API Types vs UI Models

## Decision

Deferred to Phase B. In Phase A, a single set of types in `src/types/` represents both the data shape and the UI model. The `deadline: Date` → `string` conversion at the server/client boundary is handled with `Omit` inline.

## Options Considered

### Option A — Two type files (deferred to Phase B)

Maintain two separate type/interface files:

- `api.types.ts` (or `dto.ts`) — mirrors the exact shape returned by the backend (Drizzle query results, HMRC API payloads)
- `models.ts` — mapped internal models used by the UI (computed fields, friendlier types, renamed fields)

A mapping/transform layer converts API types → UI models at the data-fetch boundary.

**Why deferred:** In Phase A there is no real backend — all data is hand-authored mock objects, so the "API type" and "UI model" are identical. Introducing the split now adds infrastructure for a boundary that doesn't yet exist.

### Option B — Single type file with Omit patches (current Phase A approach)

Use a single `clients.ts` type file. Where a component needs a different shape (e.g. `deadline: string` instead of `Date`), use `Omit<BaseType, 'field'> & { field: NewType }` at the component boundary.

**Weakness:** `Omit` patches are fragile — renaming a field in the base type does not break the `Omit` call at compile time. Ugly at the call site. Does not scale past a few conversions.

## Rationale

The two-file pattern is the right long-term approach and matches Joshua's prior experience. It earns its keep when real Drizzle query return types exist on one side and React components on the other — that's the natural moment to introduce it. Phase A doesn't have that boundary yet.

## What This Gates

- **Phase B start:** Introduce `api.types.ts` + `models.ts` split when wiring up the first real database query. The mapping function for each entity should be written alongside the first server component that fetches it.
- **HMRC payload mapping (Phase 2):** The API types file will eventually also represent HMRC API payload shapes, making the field-name alignment work done in Phase 1 directly legible.

## Reversibility

Low-risk change. The rename from inline types to a two-file split can be done incrementally — one entity at a time — without breaking the application.

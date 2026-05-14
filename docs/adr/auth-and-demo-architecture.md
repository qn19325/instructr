---
status: accepted
date: 2026-05-14
---

# Auth + Demo Architecture

## Context

The CV deploy requires two audiences: Lara/Josh on the real app (Clerk-protected, read-write DB) and CV reviewers on a public demo (no auth, full-write demo DB). The app must serve both without duplicating files.

## Decision

**Single Vercel deployment, two domains (`instructr.uk` / `demo.instructr.uk`), host-header detection in middleware.**

Middleware reads the `Host` header on every request:

- `instructr.uk` → Clerk middleware runs normally
- `demo.instructr.uk` → Clerk skipped; `x-demo-mode: true` header forwarded to server components

Demo isolation is two-layer: a full-viewport banner (UX signal) + a separate Neon branch (`DATABASE_URL_DEMO`) that is seeded with demo data and allows full writes. Data resets manually by re-seeding.

### DB client as explicit parameter

`infra/db.ts` exports `getCurrentDb()` — reads `x-demo-mode` from request headers and returns the appropriate Drizzle client. Called once at the action boundary alongside `getCurrentPracticeId()`, then passed explicitly into service → repo. Repos and services take `db` as a parameter; neither resolves it internally.

This mirrors the `practiceId` pattern: infra resolves request context, the action boundary calls it once, lower layers receive it explicitly and stay testable without mocking.

## Alternatives considered

**Read-only Neon role** — DB rejects writes. Rejected: a demo where mutations silently fail is a worse CV artefact than one where interactions work fully. Interactive demo is significantly more impressive.

**`getDb()` called inside repos** — would couple repos to Next.js request context (`headers()`), requiring it to be mocked in every repo test. Rejected: violates the same principle as calling `getCurrentPracticeId()` inside repos.

**Path prefix (`/demo/clients` etc.)** — requires duplicating every page file under `/demo`. Rejected.

**Query param (`?demo=true`)** — leaks into nested routes, awkward to propagate. Rejected.

**Two Vercel deployments** — separate env vars per deployment, simpler config, but adds deployment management overhead and hits free-tier limits. Rejected.

**Build-time `DEMO_MODE` env var** — baked at build time, can't differ between domains in a single deployment. Rejected.

## Consequences

- Middleware must be written carefully: Clerk's own routes (`/sign-in`, `/_clerk/*`) must be exempted regardless of host
- `x-demo-mode` header must only be set by middleware — never trusted from incoming requests
- `DATABASE_URL_DEMO` is a Neon branch with full write access; demo data is restored by manual re-seed
- All repo functions gain a `db` parameter; all service functions gain a `db` parameter; actions resolve `db` + `practiceId` at the top and pass both down

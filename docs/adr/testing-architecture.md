---
type: decision
title: Testing Architecture — Vitest, co-located unit tests, pure `logic/` tier
date: 2026-05-16
status: decided
domain: product
tags: [testing, architecture, logic, phase-d, post-deploy]
---

# Testing Architecture — Vitest, co-located unit tests, pure `logic/` tier

## Decision

The test suite is added in layers that mirror [[four-tier-layered-architecture]]. The first layer to be tested is `logic/`, and the rules in this ADR govern that layer specifically. `repo/`, `service/`, and end-to-end testing are deferred to separate ADRs once the `logic/` suite is in place.

For the `logic/` tier:

- **Runner:** Vitest.
- **Location:** co-located. `src/logic/tax-year.ts` sits next to `src/logic/tax-year.test.ts`.
- **Naming:** `<source>.test.ts`. No `__tests__/` folders, no parallel `tests/` tree.
- **Test selection:** boundary + equivalence-class. For each exported function, nested `describe` blocks name the equivalence classes and boundaries; tests follow that structure.
- **Clock handling:** functions that depend on "now" take it as a parameter (`(today: Date = new Date())` is acceptable for the default). No `vi.useFakeTimers()` or `vi.setSystemTime()` in `logic/` tests.
- **No mocks, no fixtures, no DB.** If a `logic/` function cannot be tested without those, the function is in the wrong tier — fix the tier, not the test.
- **CI:** none at first. Once `logic/` has ~10 tests across three or more files, add a GitHub Actions workflow that runs `npm test` on PR. Pre-commit and pre-push hooks remain off until the suite is large enough to justify the friction.

E2E tests, when added later (Playwright), live in a top-level `e2e/` folder, not co-located.

## Context

Tests have been on the "next queue" since the architecture review on 2026-05-11. The CV deploy on 2026-05-14 cleared the prerequisite ("add after first deploy"). Phase E (AI preparation layer) is the next major work and benefits from existing tests pinning down domain invariants before AI-generated changes can silently violate them.

The four-tier ADR ([[four-tier-layered-architecture]]) was explicitly written with tests in mind: `practiceId` was pulled out of repos so unit tests don't need Clerk mocking; pure functions were extracted into `logic/` so they could be tested with zero infrastructure. This ADR builds on that foundation by codifying the rules for the first tier of tests.

Joshua's testing background is Jasmine. The shape of `describe`/`it`/`expect` transfers directly. The new concepts introduced gradually are: modern matcher ergonomics (`toMatchObject`, `toMatchInlineSnapshot`), ES module mocking (`vi.fn()`, `vi.mock()` — not used in `logic/`), and the boundary/equivalence-class discipline.

## Options Considered

### Runner: Vitest vs Jest vs `node:test`

**Vitest (chosen).** ESM-native, reads `tsconfig.json` paths directly, no separate transformer config, zero ceremony in a Next 15 + React 19 + ESM project. Jest-compatible API means knowledge transfers if Joshua works in a Jest codebase later.

**Jest.** Most-cited in job descriptions. In this stack, requires `next/jest` for SWC transform, `transformIgnorePatterns` carve-outs for ESM-only dependencies (Clerk, Drizzle, arktype), a `moduleNameMapper` mirror of `tsconfig` paths, and a separate `jest-environment-jsdom` install for any future component tests. The friction is real and shows up around the second or third test. Rejected — the CV value of writing "Jest" verbatim does not outweigh the config tax, and the Jest API knowledge transfers from Vitest in an afternoon.

**`node:test`.** Zero dependencies but thin matcher ergonomics and weak mocking ecosystem. Rejected — too far from familiar territory and gives up the modern testing ergonomics for no real gain.

### Location: co-located vs mirrored tree vs `__tests__/`

**Co-located (chosen).** Tests sit next to source. Discoverability is maximal — open `tax-year.ts`, the test is right there. Renames and moves keep test and source together. `eslint-plugin-boundaries` rules already enforce import direction inside layers; co-located tests inherit those rules, so a `logic/` test that tries to import from `repo/` fails lint, which is the correct signal.

**Mirrored `tests/` tree.** Common in older Node backends and polyglot teams influenced by Java/Python conventions. Tends to accumulate orphan files when source moves. Rejected for new test work in this repo.

**`__tests__/` folders.** Jest's historical default, still seen in Meta-influenced codebases. No advantage over co-location for this project. Rejected.

E2E tests are the exception — when Playwright is added, the `e2e/` folder lives at the repo root because E2E specs map to flows, not to single source files.

### Clock: inject `now` vs mock the clock

**Inject `now` as a parameter (chosen).** Functions that need "today" take it as an argument. Production callers pass `new Date()`; tests pass a fixed date. Keeps `logic/` genuinely pure (no hidden wall-clock dependency), tests read like statements of the domain rule (`taxYearFor(6 April 2024) === 2024`), no global state to leak across tests, composes with future "what would deadlines look like a week from now?" features.

The function `currentTaxYear(today: Date = new Date())` already follows this pattern. It is the template.

**Mock the global clock with `vi.setSystemTime()`.** More common in JS codebases by raw count, but bypasses an architectural rule already in place: `logic/` is supposed to be pure, and `new Date()` inside a `logic/` function is exactly the kind of hidden side effect the tier is meant to exclude. Mocking the clock patches over that violation rather than refusing to commit it. Rejected on principle and to reinforce the tier contract.

Java's `java.time.Clock` and .NET 8's `TimeProvider` exist specifically because mature, strongly-typed ecosystems concluded injection was the right approach. We follow them.

### Test-case selection: boundary + equivalence-class vs coverage % vs property-based

**Boundary + equivalence-class (chosen).** For each function, list the equivalence classes of inputs that should behave the same and the boundaries between them. One test per class, one per boundary. Catches the off-by-one errors that actually happen (April 5 vs April 6, end-of-January deadline, midnight rollovers). Tests document the domain rules in a form a future reader can learn from.

**Coverage-driven (X% line/branch coverage).** Quantitative, gameable. Hits trivial branches with low-value tests. Used here only as a passive alarm — running `vitest --coverage` occasionally to find functions with zero tests — never as a target.

**Property-based with `fast-check`.** Powerful for invariants ("for any date d, `taxYearFor(d)` returns a 4-digit number") but heavier setup. Worth adding to a handful of functions later, after the boundary suite is in place. Not the starting discipline.

## Rationale

**Why `logic/` first, not all layers at once.** The `logic/` tier needs zero infrastructure decisions — no test DB strategy, no Clerk mocking, no Drizzle fixtures, no JSDOM, no Playwright config. The first ten tests can be written before any infra question is resolved. The tier also has the highest density of UK-specific rules per line of code (tax-year boundaries, statutory deadlines, document validation), which is where regression cost is highest and where AI-generated changes in Phase E will most need invariants pinned down.

**Why inject `now` is non-negotiable in `logic/`.** Pure functions are defined as having no hidden inputs. `new Date()` is a hidden input. The four-tier ADR commits to `logic/` being the pure tier; mocking the clock would let `logic/` quietly stop being pure. The cost — slightly more verbose call sites — is small and bounded (a handful of functions need "today"). The benefit compounds: every test reads as a domain statement, no global timer state leaks, and the same shape supports future "preview future deadlines" features.

**Why no mocks in `logic/`.** A `logic/` function that needs a mock has reached into another tier. The mock is a hint that the function is in the wrong place. Refusing to mock forces the function to either be genuinely pure or move down a tier — both outcomes are correct.

**Why co-location.** Discoverability and rename-safety are both materially better than a parallel tree. Modern React/TS conventions (Vitest, Vite, Next examples, tRPC, Drizzle's own source) all use co-location; mirrored trees are residual from older Java/Python-influenced setups. No reason to inherit the older convention.

**Why no pre-commit hook yet.** Pre-commit hooks that block on a flaky or trivial test train the `--no-verify` habit. Until the suite is dense enough to catch real bugs, the friction outweighs the safety. The existing pre-commit chain (`format:check && lint && build`) is already meaningful. Tests join the gate when there are enough of them to earn it.

**Why GitHub Actions before pre-push.** CI runs in the cloud and doesn't slow the local loop. It catches "works on my machine" issues and gives a visible green check on every PR — the CV signal that matters. Pre-push hooks become useful later, after the cloud run has surfaced any flakes that need fixing first.

## Setup

Install:

```
npm install -D vitest @vitest/coverage-v8 vite-tsconfig-paths
```

`vitest.config.ts` at repo root:

```ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

`package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

No JSDOM environment is needed for `logic/` tests. Add `environment: 'jsdom'` only when component tests are introduced under a separate ADR.

## Style

A `logic/` test file is structured around the source file's exported functions. Nested `describe` blocks name the equivalence classes and boundaries:

```
// pseudocode — illustrates the shape, not real code
describe('functionName', () => {
  describe('class A — behaviour 1', () => {
    it('mid-class representative', () => { ... })
  })
  describe('class B — behaviour 2', () => {
    it('mid-class representative', () => { ... })
  })
  describe('boundary between A and B', () => {
    it('last value of A', () => { ... })
    it('first value of B', () => { ... })
  })
})
```

Primitive inputs — dates, numbers, strings, enum values — appear inline in each test (`new Date('2024-04-06')`, `Status.filed`). Repetition is the point: the test reads end-to-end without hopping to a helper.

Compound domain objects (`Client`, `TaxReturn`, anything with more than ~3 fields) may use a **file-local factory function** whose only job is to fill in type-required fields the test does not care about. Two rules:

1. **File-local, not shared.** The factory lives at the top of the test file that uses it. No cross-file imports. A factory that gets shared starts drifting toward "valid for whatever the last caller needed."
2. **Every asserted field is an explicit override.** If a test asserts on `status`, that test passes `{ status: ... }` as an override — the factory's default for that field never carries meaning. The factory exists to silence noise, not to encode behaviour.

Shape:

```
// pseudocode
function makeReturn(overrides: Partial<TaxReturn> = {}): TaxReturn {
  return { id: '1', taxYear: 2024, checklist: [], regime: Regime.sa100, status: Status.not_started, ...overrides };
}

it('returns true when filed', () => {
  expect(isFiled(makeReturn({ status: Status.filed }))).toBe(true);
});
```

The rule the original draft was reaching for — "no shared fixtures, no helpers that hide behaviour" — survives. Inline object literals with a dozen fields each, where eleven are noise, do not.

## Sequencing

1. **`tax-year.ts`** — smallest, foundational, the `today: Date` parameter is already in place. Sets the pattern for every other `logic/` test file.
2. **`deadlines.ts`** — load-bearing for Lara's workflow, contains several pure functions with clear equivalence classes. Investigation of the suspected `sa100Deadline` off-by-one (see [[testing-strategy]]) happens here.
3. **`document-validation.ts`** — self-contained MIME/filename/size checks.
4. **`checklist-defaults.ts`** — likely small static data plus a default-generation function.
5. **`calendar.ts`**, **`tax-return.ts`**, **`clients.ts`** — in any order, based on what surfaces during the earlier files.

## Definition of Done

`logic/` is "tested" when:

1. Every file in `logic/` has a sibling `.test.ts`.
2. Every exported function has its equivalence classes documented and one test per class plus one per boundary.
3. No test in `logic/` imports from `repo/`, `service/`, `infra/`, or uses a mock.
4. Coverage is measured (`npm run test:coverage`) and used as an alarm for missed files, not as a gate.

After `logic/` is done, the question of testing `repo/` and `service/` opens — separate ADR, separate session. That session decides test DB strategy (Neon branch vs local Postgres vs transaction rollback), Clerk handling, and how to fake R2.

## What This Gates

- Phase E (AI preparation) can rely on `logic/` invariants being enforced by tests before any AI-generated change touches the domain rules.
- The `repo/` / `service/` testing ADR can be written with the `logic/` suite as a reference point.
- CV value accrues as a by-product: the test suite is visible, the structure is principled, and the rationale is documented.

## Open Questions

- Is `sa100Deadline(taxYear)` off by one? See [[testing-strategy]] for the finding. First test written against `deadlines.ts` should pin this down.
- Component-level testing (React Testing Library) sits between `logic/` and E2E. Not in scope here. Decided in a later ADR once `logic/` and at least one of `repo/`/`service/` are tested.

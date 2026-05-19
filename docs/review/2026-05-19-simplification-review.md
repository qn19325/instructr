# Simplification Review — 2026-05-19

Scope: all `src/`. Aggression: moderate. Tests included.

Each finding tagged **[high]**, **[med]**, or **[low]** by payoff vs risk.

---

## Cross-cutting

### Server-action boilerplate — `app/(app)/clients/actions.ts` + `app/(app)/clients/[id]/actions.ts` **[high]**

Six actions repeat the same five-step shape:

1. read `FormData` into a plain object
2. parse with arktype, return `{ fieldErrors }` on `ArkErrors`
3. `getCurrentDb()` + `getCurrentPracticeId()`
4. `try { service.X(); revalidatePath(...); return success }`
5. `catch` — `ServiceError` → its message, `23505` → friendly message, else log + generic

That's ~150 of the ~250 lines across the two files. A small helper would collapse each action to its real content:

```ts
// pseudocode — one helper per action signature you have
runFormAction(schema, formData, async (parsed, db, practiceId) => {
  await clientService.insertClient(db, practiceId, parsed);
  revalidatePath('/clients');
});
```

Two action signatures exist (`(prevState, FormData)` and `(...args)`), so two helpers — or one that takes the parsed input directly for the non-FormData calls.

### Repeated "no rows updated → throw" — `repo/clients.ts`, `repo/tax-returns.ts`, `repo/checklist-items.ts` **[low]**

Four copies of:

```
const result = await ...returning({ id: X.id });
if (result.length === 0) throw new Error(`X not found`);
```

A 3-line `assertUpdated(result, label)` helper in `repo/index.ts` would dedupe and make the intent explicit.

---

## `src/infra/`

### `infra/db.ts` **[low]**

- Exports both `db` and `getCurrentDb`. `db` is only used by `seed.ts`. Consider making `seed.ts` construct its own connection (it's already a script) and keeping `getCurrentDb` as the single app-facing entry. Eliminates the dual-export footgun where a server component could accidentally bypass demo routing.
- `dbDemo` lazy-init is fine; a one-line comment explaining _why_ lazy (cold-start cost on non-demo deploys) would justify it.

### `infra/auth.ts` **[low]**

Two lines wrapped in an async function around a hard-coded constant. Fine as a placeholder for Phase 2, but the `async` is misleading — there's nothing to await. Drop `async` until Clerk is wired in; it's an easier signature to change later than to chase down spurious awaits now.

---

## `src/logic/`

### `logic/tax-year.ts` **[low]**

`currentTaxYear` uses `Intl.DateTimeFormat.formatToParts` then `.find(p => p.type === 'year')!.value` three times. The non-null assertions are load-bearing — if the locale ever changes, this breaks silently. Either:

```ts
const { year, month, day } = Object.fromEntries(parts.map((p) => [p.type, p.value]));
```

or destructure once. Same correctness, less repetition, no `!`.

### `logic/tax-return.ts` **[low]**

- `numberOfClientsWithUnfiled` — assigns `filtered` then returns `.length`. One expression: `clients.filter(c => !!firstUnfiledReturn(c.taxReturns)).length`.
- `formatDeadline` is defined but I don't see it called anywhere — confirm and delete.
- `daysTillNextDeadline` — extract `MS_PER_DAY = 86_400_000` to module scope; allocating per call is harmless but the name reads better at the top.

### `logic/deadlines.ts` **[med]**

- `mtdSubmissionTypes` is typed `SubmissionTypeQuarters[]` and only holds quarters, so the `.filter(isQuarterlyType)` inside `mtdSubmissionDeadlines` is dead — TypeScript already knows.
- `firstUnfiledSubmission` does `.filter(isQuarterlyType).find(...)`. Combine into one `find(s => isQuarterlyType(s) && s.status !== submitted)`.
- `mtdPeriod` and `mtdLabel` are `Record<SubmissionType, ...>` so they carry `eops` and `final_declaration` entries, but `deadlineSubLine` is only ever called for quarterlies (the deadline-building code filters them out). Narrow these to `Record<SubmissionTypeQuarters, ...>` and drop the unused entries — when MTD EOPS/Final Declaration are added, the type error tells you exactly where to fill it in.
- `getDeadlineEntries` builds the `MTDSubmission & { submissionType: SubmissionTypeQuarters }` predicate inline. Since `isQuarterlyType` is the narrowing function, the explicit annotation duplicates what the predicate signature already conveys.

### `logic/clients.ts` **[med]**

`mapChecklist` rebuilds the `document` object field-by-field even though `ChecklistItemRow['document']` and `Document` have **identical shapes**:

```ts
document: item.document ? { id: item.document.id, originalFileName: ..., mimeType: ..., size: ... } : undefined
```

Collapses to `document: item.document ?? undefined`. Same for the row-types themselves — they restate every field of the Drizzle inferred type. Either:

- Use `InferSelectModel<typeof checklistItem>` and friends, dropping `ChecklistItemRow`/`TaxReturnRow`/`ClientRow` entirely; or
- If the decoupling is intentional (CLAUDE.md says don't leak DB shapes), add a one-line comment saying so — right now it reads like accidental duplication.

`mapTaxReturn` has two near-identical branches (SA100 vs MTD); the `submissions` field is the only difference. A small shared prefix would reduce repetition.

### `logic/document-validation.ts` **[low]**

`ALLOWED_TYPES.some((t) => t === document.mimeType)` — `(ALLOWED_TYPES as readonly string[]).includes(document.mimeType)` reads more naturally. The `as` cast is only because `ALLOWED_TYPES` is `as const`; an alternative is `ALLOWED_TYPES.some(t => t === document.mimeType)` is fine — minor.

---

## `src/service/`

### `service/clients.ts` **[high]**

- `markItemReceived` and `markItemOutstanding` differ only in the boolean passed to `updateChecklistItemDone`. Collapse to one `setItemDone(db, practiceId, itemId, done, clientId?)`. The action layer (`toggleChecklistItem`) then loses its `if (done) ... else ...` branch and just calls `setItemDone(..., !done, ...)`.
- `updateClient` does `getClientById` purely to check existence, then `updateClient`. The repo already throws on zero rows updated. Drop the pre-fetch — saves a query and removes the race window between check and update.
- `insertTaxReturn` does the same: `getClientById` only to throw "Client not found". The `taxReturn.client_id` FK constraint will reject an invalid clientId, and the `taxReturnExists` query that follows is the actual duplicate guard. The fetch is dead weight.
- `assertChecklistItemOwned` returns `{ id, clientId }` but callers only use `item.id` (which equals the input `itemId`). The function is really `assertOwnership`; callers could be `await assertChecklistItemOwned(...); await updateChecklistItemDone(..., itemId, ...)` — passing the input `itemId` rather than re-reading it.

### `service/documents.ts` **[med]**

- `completeUpload` and `removeDocument` share the immediate-delete-with-cleanup-fallback pattern (try `deleteObject`, log on failure, remove from pending). Extract a `tryDeleteAndClearPending(db, practiceId, r2Key)` helper.
- `drainPendingDeletes`: the second `results.forEach` to log failures could be folded into the `Promise.allSettled` map — log inside the awaiter on catch.

### `service/errors.ts` **[low]**

Empty `class ServiceError extends Error {}` — fine, but the file is one line. Could move to `service/clients.ts` (its only thrower) or into `service/index.ts` if/when one exists.

---

## `src/repo/`

### `repo/clients.ts` **[low]**

`insertClient`, `updateClient`, `updateClientNotes` all spell out every column. That's defensible (explicit > magic), but the `set({...})` block in `updateClient` repeats the column list. If you ever add a field to `ClientFields`, you'll touch three places. Acceptable trade-off; flag for awareness, not action.

### `repo/index.ts` **[low]**

`withTransaction(db, fn) => db.transaction(fn)` is a 1-line passthrough. Callers can use `db.transaction(...)` directly — same ergonomics. The wrapper would earn its keep if it added e.g. retry logic or tracing; it doesn't.

### `repo/clients.test.ts` **[med]**

Every test rebuilds a practice row inline (`insert(schema.practice).values({name}).returning(...)` — 4 lines × ~10 tests). Pull into a `createPractice()` helper next to `clearDB`. Removes ~40 lines, makes each test's _unique_ setup visible.

Several tests also re-`insert(schema.client)` directly when the goal is "have a client in the DB" — a `createClient(practiceId)` helper would shrink them further. (You're already comfortable with helpers like `makeCreateClientInput`; this is the same idea for the DB side.)

---

## `src/components/`

### `components/Modal.tsx` **[low]**

Three separate `useEffect`s gated on `isOpen`: Escape handler, body-scroll lock, focus trap. They could be one effect with one early return, or stay split for clarity — judgment call. The focus-trap selector string is long; extracting to a `FOCUSABLE_SELECTOR` constant at module top documents intent.

### `components/StatusBadge.tsx` **[low]**

`statusDisplay[status].X` evaluated four times in the JSX. Destructure once:

```ts
const { textColor, bgColor, dotColor, label } = statusDisplay[status];
```

### `components/Avatar.tsx` **[low]**

`pickColor` is fine. Minor: `colorClasses[Math.abs(hash) % colorClasses.length]` — `hash` is already int32; `Math.abs(-2147483648)` returns the same negative number. Astronomically unlikely to hit, but `((hash % len) + len) % len` is the safe modulo.

---

## `src/app/`

### `app/(app)/clients/[id]/AddTaxReturnForm.tsx` **[med]**

- The outer `<div className="grid grid-cols-2 gap-4">` wraps exactly one child (the Year select). Remove the wrapper.
- The radio `onChange` handler is duplicated across both radios:

  ```ts
  onChange={(e) => {
    const next = Object.values(Regime).find((r) => r === e.target.value);
    if (next) setSelectedRegime(next);
  }}
  ```

  Both radios share `name="regime"`, so a single change handler on the `<fieldset>` (delegating via `e.target.value`) would replace both. Also: the lookup-then-narrow dance only exists to avoid `as Regime` — fine per your project memory, but if you extract a tiny `parseRegime(v: string): Regime | undefined`, both files (this one and `AddClientForm.tsx`) become readable in one line.

### `app/(app)/clients/[id]/ChecklistItem.tsx` **[med]**

- Three independent error states: `downloadError`, `toggleError`, `state.message` (upload). They render in three separate `<span>`s that can stack. Consider one `errorMessage` slot and a discriminated union, or accept the redundancy with a comment.
- `disabled={state.phase !== 'idle' && state.phase !== 'done'}` reads as "is uploading." Promote to a `const isUploading = state.phase === 'validating' || state.phase === 'uploading' || state.phase === 'recording'` and reuse for the `{(state.phase === ...) && <span>{...}</span>}` block too — that condition appears twice expressed differently.
- `toggleChecklistItem(item.id, clientId, item.done)` — `item.done` is the server-truth, used as "current value, please flip." Fine, but a comment would help; reading it suggests a bug (why not `optimisticDone`?).

### `app/(app)/clients/[id]/NotesSection.tsx` **[low]**

Manual `useState` + try/catch for what is fundamentally a server action call. Could use `useActionForm` for consistency with the other forms — or, if the save-without-form UX is intentional, leave it but add a `useActionState` wrapper to remove the manual phase machine. Minor.

### `app/(app)/api/cron/r2-cleanup/route.ts` **[low]**

`return NextResponse.json({ ...res })` — `res` is already a plain object, spread is a no-op: `NextResponse.json(res)`.

### `app/(app)/clients/[id]/page.tsx` **[low]**

`<EditClientModal id={...} niNumber={...} firstName={...} lastName={...} email={...} phoneNumber={...} />` — six props that are exactly the matching fields on `client`. Pass `client={client}` (or a typed `ClientHeader` subset) and let the modal pick what it needs. Same change in `AddTaxReturnModal` if it grows.

---

## `src/config/`

### `config/statusDisplay.ts` **[low]**

- `ready_to_file` and `filed` are byte-identical. Either dedupe (`const greenStyle = {...}; ready_to_file: greenStyle, filed: greenStyle`) or — preferable — give `filed` its own treatment (e.g. neutral/grey), since visually distinguishing "done" from "ready" is the whole point.
- Each entry repeats the colour name three times (`bg-amber-100`, `text-amber-700`, `bg-amber-700`). A small `makeStyle('amber', 'In Progress')` helper would express the pattern, but it leaks into how Tailwind's JIT scans for classes — only worth it if Tailwind is configured with a safelist. Leave for now; flag for when palettes grow.

---

## `src/db/`

### `db/seed.ts` **[high]**

~300 lines, but it's the same 4-step recipe (insert client → insert taxReturn → insert checklist → optionally insert mtdSubmissions) repeated seven times. A data-driven version is realistically ~80 lines:

```ts
const seeds: SeedClient[] = [ { name, ni, ..., taxReturns: [{ regime, status, checklistDoneCount, mtdSubmissions: [...] }] }, ... ];
for (const s of seeds) { await insertSeedClient(practiceId, s); }
```

You also already have `clientService.insertClient` and `insertTaxReturn` in the service layer that do most of this — using them would eliminate the seed file's direct knowledge of the schema entirely, and any future invariant change (e.g. "creating a client also creates a Phase-1 welcome record") gets picked up automatically. The only thing service does that seed needs to override is the _initial status_ and _checklist done counts_ — small extensions to the service signature or post-insert tweaks.

The current cleanup block also lists tables explicitly; ordering matters and it's easy to miss a new table. Consider the same `DELETE FROM` truncate pattern your tests use.

---

## Tests (sampled `repo/clients.test.ts`; assuming similar elsewhere)

Already noted above. Common test refactors:

- Extract `createPractice()`, `createClient(practiceId)`, etc., into a `repo/test-helpers.ts`.
- The `describe('with X', () => { describe('with Y', () => { it('...') }) })` nesting often holds a single `it`. Flatten — the `describe` only earns the indent when it groups ≥2 tests.

---

## Summary — biggest payoffs

1. **Action helper** to dedupe the 6 `actions.ts` blocks.
2. **`setItemDone(..., done)`** to collapse two service methods + the toggle branch.
3. **Drop the redundant `getClientById` pre-checks** in `service/clients.ts`.
4. **Data-driven seed**.
5. **Test helpers** for practice/client creation.

Everything else is small-grain cleanup — worth picking up opportunistically rather than as a dedicated pass.

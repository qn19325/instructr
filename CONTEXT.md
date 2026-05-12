# Tax Return Workflow Tool

A workflow management tool for UK chartered accountants to manage the document collection, deadline tracking, and client sign-off process around self-assessment tax return preparation. Filing itself stays in TaxCalc / HMRC portal.

Phase 1: single-user internal tool for Lara's practice.
Phase 2: multi-tenant B2B SaaS for UK chartered accountants.

## Language

**Practice**:
An accounting firm. The multi-tenancy anchor — every table is scoped to a `practice_id`. Phase 1 has exactly one practice (Lara's). In Phase 2, each subscribing firm is a separate practice.
_Avoid_: firm, account, tenant, organisation

**Client**:
A person whose tax affairs Lara manages — a CRM record (name, NI number, contact details). Clients do not log in and do not interact with the system in Phase 1. A client is not a user.
_Avoid_: user (reserved for Lara / accountant-role auth), customer, taxpayer

**Tax return**:
The unit of work — one row per client per tax year per regime. Tracks the full preparation workflow: document collection, data entry, client approval, and filing status. Not the HMRC submission form itself.
_Avoid_: return (ambiguous), filing (means HMRC submission, not this workflow record), submission (means an MTD quarterly update)

**Tax year**:
The UK fiscal year running 6 April to 5 April. Stored as the **start year integer** — `2025` means tax year 2025/26 (6 April 2025 – 5 April 2026).
_Avoid_: fiscal year, financial year, year (without qualifier)

**Regime**:
The filing regime that applies to a client in a given tax year: `sa100` (annual self-assessment) or `mtd` (Making Tax Digital ITSA quarterly updates + Final Declaration). Stored on the **tax return**, not the client — a client's regime can change year to year as MTD mandates roll out.
_Avoid_: filing type, tax type, method

**Deadline**:
A statutory HMRC date. For SA100 and MTD Final Declaration: 31 January following the tax year end. For MTD quarterly updates: 7 Aug / 7 Nov / 7 Feb / 7 May. Deadlines are **computed** from `tax_year` + `regime`, never stored — storing them risks drift from human error. `deadline_override` on a tax return is only for HMRC-granted extensions.
_Avoid_: due date (use deadline), target date (not modelled)

**Checklist**:
The full set of expected documents for a tax return. One checklist per tax return, made up of checklist items.
_Avoid_: document collection, document request list

**Checklist item**:
A single document slot in the checklist — the expectation that a particular document type (e.g. P60) is needed for a return. Exists independently of whether a document has been uploaded. Marks whether Lara has received it (`done: boolean`). Independent of `document` attachment — all four combinations of `done` × document presence are valid; Lara controls each. Items are auto-generated at tax return creation from regime-appropriate defaults, then pruned by Lara.
_Avoid_: task, to-do, document request

**Document**:
An uploaded file (PDF, image, etc.) attached to a checklist item — stored in Cloudflare R2, referenced in the `document` table. Distinct from a checklist item: a document is the actual file; a checklist item is the slot that expects it. One document per checklist item (`document.checklistItemId` FK); replace = delete old + insert new.
_Avoid_: file (use document), attachment

**MTD submission**:
A single quarterly update or End of Period Statement (EOPS) or Final Declaration within an MTD tax return. Up to five per tax year. Cumulative year-to-date, not quarter-in-isolation. Only exists for `regime = mtd` tax returns.
_Avoid_: quarterly return (use quarterly update), submission (alone — too generic; qualify as MTD submission)

**Status**:
The workflow stage of a **tax return**: `not_started` → `in_progress` → `awaiting_client` → `ready_to_file` → `filed`. Distinct from **MTD submission status** (`pending` / `submitted` / `overdue`), which tracks individual MTD quarterly updates.
_Avoid_: state (use status), stage

**Approval**:
The step where a client confirms they have reviewed the draft return before Lara files it. Recorded on the tax return via `approved_at` (timestamp) and `approved_by` (free-text audit note, e.g. "email 12 Apr 2026"). Phase 1: Lara marks this manually after an email exchange. Phase 2: client portal with in-app approval.
_Avoid_: sign-off, authorisation (means HMRC agent authorisation, a separate concept), confirmation

**Filing**:
The act of submitting the completed return to HMRC. In Phase 1, filing happens in TaxCalc / HMRC portal — outside this application. The `filed` status on a tax return records that filing occurred, but the application does not perform the submission. Phase 2 introduces HMRC API integration.
_Avoid_: submission (use filing for the HMRC act; submission means an MTD quarterly update in this domain)

## Relationships

- A **Practice** has many **Clients**
- A **Client** has many **Tax returns** (one per tax year per regime)
- A **Tax return** has many **Checklist items** (one per expected document type)
- A **Tax return** has many **Documents** (uploaded files)
- An MTD **Tax return** has many **MTD submissions** (up to five per tax year); SA100 tax returns have none
- A **Checklist item** expects one document type; a **Document** is the actual uploaded file attached to that slot (one document per checklist item)

## Example dialogue

> **Dev:** "Should the deadline live on the checklist item or the tax return?"
> **Domain expert:** "The **deadline** belongs to the **tax return** — it's when the whole return is due, not when individual documents are due. A **checklist item** just tracks whether a document has been received."

> **Dev:** "When a client emails back saying the draft looks fine, what do we record?"
> **Domain expert:** "That's the **approval** — set `approved_at` and note how they confirmed it in `approved_by`. The **tax return** status moves to `ready_to_file`."

> **Dev:** "Is the P60 a document or a checklist item?"
> **Domain expert:** "Both, but they're distinct. The **checklist item** is the slot — 'we expect a P60 for this return.' The **document** is the uploaded PDF that fulfils it. The checklist item exists whether or not the file has arrived."

## Flagged ambiguities

- **"Filing" vs "submission"**: resolved — _filing_ = the HMRC submission act (done in TaxCalc, out of scope Phase 1); _submission_ alone is banned; _MTD submission_ = a quarterly update or Final Declaration row in the `mtd_submission` table.
- **"Client" as user**: resolved — a client is a CRM record, not a system user. In Phase 1, only Lara (the accountant) is a user. "User" refers to Lara's Clerk auth identity, never to a client.
- **"Deadline" as stored vs computed**: resolved — deadlines are computed from `tax_year` + `regime` by `computeDeadline()` in `src/lib/deadlines.ts`; only HMRC-granted extensions are stored as `deadline_override`.
- **"Status" (which one)**: resolved — _tax return status_ (the 5-value workflow enum on `tax_return`) vs _MTD submission status_ (the 3-value `pending / submitted / overdue` enum on `mtd_submission`). Always qualify which status you mean.
- **"Regime" on client vs tax return**: resolved — regime is stored per tax return, not per client. A client moving from SA100 to MTD gets a new tax return row with `regime = mtd`; the client row is unchanged.
- **Checklist item types and vocabulary**: provisional — the `document_type` enum values were derived from research, not from Lara's direct input. Lara has not yet validated what she calls these things or confirmed the canonical checklist contents. Treat as working assumptions until validated.

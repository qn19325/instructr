---
description: Review files changed since HEAD against project conventions
---

Review only the files changed in the working tree against the engineering conventions in `CLAUDE.md` and the architectural rules in `docs/adr/`.

**Code-structure rules live in `docs/adr/`, not in this skill.** Before reviewing, read every ADR in `docs/adr/` and treat them as authoritative. Do not re-derive architecture from first principles, propose alternative structures, or flag a pattern as wrong unless an ADR says it's wrong. If a changed file conflicts with an ADR, cite the ADR by filename in the finding. If you think an ADR itself is wrong, say so as a separate "ADR concern" — do not silently apply your own rule.

Steps:

1. Run `git diff --name-only HEAD` to list changed files.
2. Read every ADR in `docs/adr/` in full.
3. Read each changed file in full (not just the diff — context matters).
4. Check each file against:
   - **ADRs in `docs/adr/`** — layering, import direction, aggregate boundaries, `practiceId`-as-parameter, anything the ADRs constrain. Cite the ADR filename.
   - TypeScript conventions (strict, no `any`, const-object enum pattern, no `as Type` casts)
   - React / Next.js conventions (server components by default, push client to leaves, Server Actions for mutations)
   - Data / Drizzle conventions (queries in dedicated files, DB types mapped to domain types before UI)
   - Domain & Data Principles in `CLAUDE.md` (two roles separated, `practice_id` everywhere, HMRC field naming)
5. Report findings grouped by file. Issues only — not observations. Each finding states the problem, why it matters, and (where relevant) the ADR or convention it violates.

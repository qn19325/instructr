# Instructr

Workflow management tool for UK chartered accountants to manage client tax returns — document collection, deadlines, client communication, and sign-off tracking. Built as a Phase 1 validation vehicle for Lara Warwick; Phase 2 targets B2B SaaS for UK accountancy practices.

## Stack

| Layer        | Choice                               |
| ------------ | ------------------------------------ |
| Framework    | Next.js 16 (App Router) + TypeScript |
| Database     | Neon (serverless PostgreSQL)         |
| ORM          | Drizzle ORM                          |
| Auth         | Clerk                                |
| File storage | Cloudflare R2                        |
| Email        | Resend + React Email                 |
| Hosting      | Vercel                               |

## Architecture

Four-tier layered architecture: `logic/` → `repo/` → `service/` → `app/`, with `infra/` as the external-systems edge. See `docs/adr/` for architectural decision records.

## Local Setup

1. Copy `.env.local.example` to `.env.local` and fill in values (Neon `DATABASE_URL`, Clerk keys, R2 credentials, Resend key).
2. Install dependencies: `npm install`
3. Push schema: `npm run db:push` (or `db:migrate` for Neon)
4. Seed: `npm run db:seed`
5. Start dev server: `npm run dev`

## Commands

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start dev server                 |
| `npm run dev:demo`     | Start in demo mode               |
| `npm run build`        | Production build (includes lint + type check) |
| `npm run lint`         | ESLint                           |
| `npm run format:check` | Prettier check                   |
| `npm run format`       | Prettier write                   |
| `npm run db:generate`  | Generate Drizzle migrations      |
| `npm run db:migrate`   | Run migrations                   |
| `npm run db:seed`      | Reseed local database            |
| `npm test`             | Run tests (watch mode)           |
| `npm run test:run`     | Run tests once                   |
| `npm run test:coverage`| Run tests with coverage          |

## Before Committing

```bash
npm run format:check && npm run lint && npm run build
```

## Deployment

Single Vercel deployment serving two domains (`instructr.uk` / `demo.instructr.uk`). Host-header detection in `src/proxy.ts` routes demo traffic to a separate Neon branch with independently reset data.

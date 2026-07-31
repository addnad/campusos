# CampusOS

The academic home for students.

CampusOS helps students at Nigerian tertiary institutions organise their
academic life, learn effectively, and connect with the people taking the
same courses.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind 4, Postgres (Neon),
Prisma 7, Auth.js v5, pnpm workspace, Vercel.

## Structure

- `apps/web` - the application
- `apps/web/src/app` - routes
- `apps/web/src/modules` - one per product pillar
- `apps/web/src/components` - ui and layout primitives
- `apps/web/prisma` - schema, migrations, seed
- `docs` - vision, architecture, ADRs

## Running locally

Requires Node 24 (see `.nvmrc`) and pnpm.

1. `pnpm install`
2. `cd apps/web && pnpm exec prisma migrate dev`
3. `pnpm exec tsx prisma/seed.ts`
4. `pnpm --filter web dev`

`apps/web/.env` needs `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`
and `AUTH_GOOGLE_SECRET`.

## Data model

Institutions and programmes are maintained by CampusOS. Curricula are
largely built by students. Enrolment - what a student is actually
carrying - is the source of truth every screen reads from.

See `docs/decisions/adr/` for the reasoning.

# globalhoopstats

Basketball statistics tracking web application — work in progress.

## What this project is

globalhoopstats is a web app to collect, aggregate and display basketball statistics for players, teams and staff across multiple sources (EuroLeague, ACB, NBA and others). It uses Next.js (App Router), TypeScript, Tailwind CSS and Drizzle ORM for database access. The repo includes frontend pages, reusable components, data source adapters and scripts to sync and migrate data.

## Tech stack

- Frontend: Next.js (App Router) + React + Tailwind CSS
- Language: TypeScript (strict)
- ORM: Drizzle (see `drizzle.config.ts`)
- Package manager: pnpm

## What is included

- Pages and routes for `players`, `teams`, `coaches`, `leagues`, and `compare` (see `src/app/`).
- API route for player search at `src/app/api/players/search/route.ts`.
- Reusable UI components under `src/components/` (players, teams, staff, SVG icons, layout helpers).
- Data adapters and sync utilities in `src/lib/sources/` and `src/lib/sync/` (ACB, EuroLeague, NBA, etc.).
- Scripts for database checks, migrations and syncing under `scripts/` (e.g. `apply-migrations.ts`, `sync.ts`, `check-db.ts`).

## Current status

The project is actively developed but not finished. Known gaps and work remaining:

- Database migrations and reproducible local DB setup need refinement (Drizzle migrations present but may require manual setup).
- No authentication / user management implemented.
- UI polish, accessibility improvements and responsive tweaks.
- More complete test coverage and CI configuration.
- Better error handling and observability for sync scripts.

## Quick start (developer)

Prerequisites: Node.js (recommended LTS), `pnpm`, and a relational database compatible with the configured Drizzle connector.

1.  Install dependencies:

```bash
pnpm install
```

2.  Create a local environment file (choose the command for your shell):

```bash
# macOS / Linux
cp .env.example .env.local

# PowerShell (Windows)
Copy-Item .env.example .env.local
```

3.  Configure your database connection in `drizzle.config.ts` and update `.env.local` accordingly.

4.  Apply migrations (if using the included scripts/migration flow) — inspect `scripts/` for the exact helper used in this repo. Example (may require Node + ts-node/tsx):

```bash
pnpm tsx scripts/apply-migrations.ts
```

5.  Run the development server:

```bash
pnpm dev
```

## Useful scripts

- `pnpm dev` — start Next.js development server
- `pnpm build` — build for production
- `pnpm lint` — run ESLint
- `pnpm typecheck` — run TypeScript checks
- `pnpm test` — run tests (if configured)

Inspect the `scripts/` directory for other utilities like `sync.ts`, database checks and debug helpers.

## Data sync & sources

The project contains source adapters under `src/lib/sources/` for scraping or consuming external datasets. Use the `scripts/sync.ts` and related debug scripts to import or refresh data. These scripts are not fully automated and may require manual configuration or API keys depending on the source.

## Project structure (high level)

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — UI components and design primitives
- `src/lib/` — utilities, data fetching, sync logic and DB client (`db/client.ts`, `db/schema.ts`)
- `scripts/` — maintenance, migrations and sync scripts
- `drizzle/` — migrations and SQL snapshots

## Development notes / pitfalls

- OneDrive users: the project may be affected by OneDrive Files On-Demand. Some generated files under `.next/` can be reparse points that cause Node `readlink()` errors. If you experience mysterious 500s with no logs, delete `.next/` and restart the dev server or exclude the project folder from OneDrive Files On-Demand.
- Drizzle subqueries: see internal project notes for pitfalls when wrapping joined tables in subqueries — prefer explicit projections to avoid column shadowing.

## AI / Machine Learning

This project does not currently depend on or embed any production AI/LLM model by default. However, the codebase contains places where AI could be integrated in the future (data-cleaning, intelligent scraping, player name matching, automated summaries). If you plan to add AI features, consider the following recommendations:

- Providers & env vars: common providers and environment variables you might use:
  - `OPENAI_API_KEY` — OpenAI API key, if using OpenAI services.
  - `LOCAL_LLM_ENDPOINT` — URL for a self-hosted LLM endpoint (optional).
- Data handling & privacy: avoid sending personally identifiable or sensitive data to third-party APIs. Sanitize scraped data before requests and log only non-sensitive metadata.
- Cost & rate limits: external LLM APIs incur costs and rate limits; instrument usage and add retry/backoff logic in sync jobs.
- Reproducibility: pin model versions and record provider names in repository docs or `.env.example`.
- Security: never commit API keys. Use `.env.local` and CI secrets for credentials.

## Notable / Remarkable points

- TypeScript strict mode and code style: the repo enforces strict typing and functional React components. Follow existing patterns when adding features.
- App Router: the app uses Next.js App Router with server and client components in `src/app/`.
- Data-first design: much of the work focuses on durable data ingestion (adapters under `src/lib/sources/`) and aggregation logic in `src/lib/data`.
- Scripts & tooling: numerous helper scripts exist under `scripts/` for debugging, migrations and sync. Inspect them before writing new DB-related utilities.
- OneDrive caveat: the project is stored inside OneDrive in this environment — this can cause filesystem surprises. Prefer a non-OneDrive clone for CI or production runs.
- Contact & provenance: repository owner and contact information are listed in the Contact section below — reach out before making disruptive changes to migration logic.

## How to contribute

- Open an issue for any bug, design or data problem.
- Prefer small focused PRs: setup improvements, migration automation, tests for data adapters, or UI polish.
- If you work on the DB, ensure migrations are repeatable and add a short README or script for local seed data.

## Contact

- Project owner: Hugo Redondo Valdés — Hrvaldes22@gmail.com

## License

Check `LICENSE.txt` in the repository root for license details.

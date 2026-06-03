# AGENTS.md

## Project Overview

Basketball statistics tracking application. This project is part of the Personal Projects monorepo.

## Tech Stack

- Language: TypeScript
- Framework: React / Next.js (App Router)
- Styling: Tailwind CSS
- Database: TBD
- Package Manager: pnpm

## Project Conventions

### Code Style
- Use TypeScript strict mode
- Use functional components with hooks (no class components)
- Use named exports for components
- File names: kebab-case for files, PascalCase for components
- Path alias: `@/*` maps to `src/*`

### Git
- Commit messages in English, following conventional commits (feat:, fix:, chore:, refactor:, docs:)
- Work on feature branches, merge into master via PR

### Testing
- Unit tests with Vitest or Jest
- E2E tests with Playwright (if applicable)

### Project Structure
```
src/
  app/          - Next.js App Router pages
  components/   - Reusable React components
  lib/          - Utility functions, DB access, server actions
  types/        - TypeScript type definitions
public/         - Static assets

## Data Model Notes

### `listPlayers` query (`src/lib/data/players.ts`)
- A player can appear in BOTH EuroLeague and ACB filters (their league is derived from `player_stats` joined with `seasons`, not from `players.source`).
- The "all leagues" view dedupes players by `lower(full_name)` using a `ROW_NUMBER() OVER (PARTITION BY lower(full_name))` in a CTE.
- SQLite does NOT support `QUALIFY` — must use `WITH ... AS (...)` + `WHERE rn = 1`.
- The `memberships` CTE must `UNION ALL` (a) `player_stats` joined with `seasons` and (b) players with no stats joined with `leagues` by source. BOTH branches must project the same columns (including `games_played` as nullable in the fallback branch) since the downstream `ranked` CTE uses `coalesce(games_played, 0)`.
- When referencing columns from the `memberships`/`ranked` CTEs in `ORDER BY`/window functions, use the un-prefixed column name (e.g. `points`, not `m.points`).
- The count query (`countSql`) and the list query (`fullSql`) are TWO separate queries — both need the same CTE scaffolding.

### Drizzle subquery caveat
- Drizzle's `.as("alias")` subquery projects columns using their raw SQL names — joining multiple tables with overlapping column names (`id`, `name`, `slug`, etc.) causes the outer `select *` (or even an explicit projection referencing `subquery.col`) to silently return the WRONG column (the first occurrence). Symptom: `team.league.slug` returns the team's own slug instead of the league's slug.
- Fix: avoid wrapping multi-table joins in a subquery when you need a clean column projection. Use direct `.from(teams).innerJoin(leagues, ...).leftJoin(...)` and project columns with explicit names. The `playerCount` correlated subquery can stay inline, and complex join conditions can stay as subqueries in the ON clause.
- This bug bit `listTeams` (and earlier `listCoaches`). Both have been refactored to drop the wrapping subquery.

### Team season stats sources
- EuroLeague (`src/lib/sources/euroleague.ts`): `elg_standings` provides wins/losses/position/pointsFor/pointsAgainst per game; `team_stats_totals` provides FGA/ORB/TOV/FTA used to compute ORtg/DRtg/pace/netRtg via the Dean Oliver possession formula.
- ACB (`src/lib/sources/acb.ts`): team page provides wins/losses/position; `pointsFor`/`pointsAgainst` from the standings widget are SEASON TOTALS — divide by `gamesPlayed` before storing. ACB has no FGA/ORB/TOV data, so ORtg/DRtg/pace stay `null`.
- NBA: standings provide the data.
- `runSync` must write every `SourceTeamStats` field including `position` (it was previously missing).
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests

## Environment

Copy `.env.example` to `.env.local` for local development. Never commit `.env` files.

## OneDrive / Windows sync

The project lives under OneDrive. Files On-Demand creates reparse points inside `.next/`
(e.g. `cache-life.d.ts`) which causes Node.js `readlink()` to throw `EINVAL: invalid argument`,
surfacing as a 500 with no log line. If `pnpm dev` or `pnpm build` start returning 500s with
no obvious error, delete `.next/` and restart. For a permanent fix, exclude the project folder
from OneDrive Files On-Demand or move the checkout out of `OneDrive/`.

## License

Proprietary. See `LICENSE.txt` in the repository root.

## Contact

Hugo Redondo Valdés - Hrvaldes22@gmail.com

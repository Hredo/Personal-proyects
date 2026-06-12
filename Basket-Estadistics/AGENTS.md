# AGENTS.md

## Project Overview

Basketball statistics tracking application. This project is part of the Personal Projects monorepo.

## Tech Stack

- Language: TypeScript
- Framework: React / Next.js (App Router)
- Styling: Tailwind CSS
- Database: PostgreSQL (Neon)
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
- The `memberships` CTE must `UNION ALL` (a) `player_season_stats` joined with `seasons` and (b) players with no stats joined with `leagues` by source. BOTH branches must project the same columns (including `games_played` as nullable in the fallback branch) since the downstream `ranked` CTE uses `coalesce(games_played, 0)`.
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

### env vars added for auth features
- `RESEND_API_KEY` — required for sending auth emails (password reset, 2FA codes). Falls back to console.log in dev.
- `AUTH_EMAIL_FROM` — sender address for auth emails (default: `auth@globalhoopstats.com`). Must be verified in Resend.

## OneDrive / Windows sync

## Auth features

### Password recovery (`/forgot-password`, `/reset-password`)
- `POST /api/auth/forgot-password` — accepts `{ email }`, creates a bcrypt-hashed token in `password_reset_tokens`, sends email via Resend with a link containing the raw token + email as query params.
- `POST /api/auth/reset-password` — accepts `{ token, email, password }`, iterates unexpired tokens for the user, verifies the raw token against each bcrypt hash (to prevent enumeration), updates the password, and deletes used tokens.
- Token expiry: 15 minutes. Rate-limited per IP.

### Two-factor authentication (email 2FA)
- When enabled, login (`POST /api/auth/login`) returns `{ requiresTwoFactor: true, twoFactorSessionId }` instead of a session cookie. The client redirects to `/login/2fa?session=<id>`.
- `POST /api/auth/2fa/verify` — accepts `{ sessionId, code }`. The code can be a 6-digit email code (bcrypt-verified against `two_factor_sessions.code_hash`) or a backup code (bcrypt-verified against `two_factor_backup_codes`). On success, creates a real session cookie.
- 2FA codes expire in 5 minutes. Max 5 failed attempts before the session is deleted.

### 2FA management (account security page)
- `GET /api/account/2fa/status` — returns `{ twoFactorEnabled, remainingBackupCodes }`.
- `POST /api/account/2fa/enable` — generates a 6-digit code, stores hash in `two_factor_sessions`, emails it. Returns `{ sessionId }`.
- `POST /api/account/2fa/confirm` — accepts `{ sessionId, code }`, verifies it, enables 2FA on the user, generates 8 backup codes (bcrypt-hashed), returns them as `{ backupCodes: string[] }`.
- `POST /api/account/2fa/disable` — accepts `{ password }`, verifies password, disables 2FA, deletes all backup codes.
- `POST /api/account/2fa/backup-codes` — accepts `{ password }`, regenrates 8 new backup codes, invalidates old ones.

### Security conventions
- All auth tokens and 2FA codes are bcrypt-hashed before DB storage (cost 12), so a DB leak doesn't reveal valid tokens.
- Password reset tokens are 32-byte random hex strings (`crypto.randomBytes(32)`).
- 2FA codes are 6-digit `crypto.randomInt(100000, 999999)`.
- Backup codes are 8-char hex strings (4 bytes → 8 hex chars).
- All auth endpoints are rate-limited per IP with the `readRateLimit` token-bucket helper.
- Honeypot fields on all forms prevent bot submissions.
- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- Sender: configured via `AUTH_EMAIL_FROM` env var (default: `globalhoopstats@gmail.com`).
- Transport priority: Gmail SMTP (`GMAIL_APP_PASSWORD`) > Resend (`RESEND_API_KEY`) > console.log.

## OneDrive / Windows sync

The project lives under OneDrive. Files On-Demand creates reparse points inside `.next/`
(e.g. `cache-life.d.ts`) which causes Node.js `readlink()` to throw `EINVAL: invalid argument`,
surfacing as a 500 with no log line. If `pnpm dev` or `pnpm build` start returning 500s with
no obvious error, delete `.next/` and restart. For a permanent fix, exclude the project folder
from OneDrive Files On-Demand or move the checkout out of `OneDrive/`.

## Obsidian Memory Vault

Every Claude/OpenCode task completion MUST be recorded in the Obsidian vault at `C:\Users\Hrval\Obsidian\claude-mem`.

### Vault structure
```
claude-mem/
  sessions/       - Claude Code session notes (created by session-end.ps1 hook)
  copilot-sessions/ - VS Code Copilot chat history (auto-imported by import-copilot.js)
  memory/         - Permanent technical memory notes
  scripts/        - import-copilot.js, session-end.ps1
  INDEX.md        - Master index of all notes
```

### Routine (mandatory after every task)
1. **Write session note** — Either use the `session-end.ps1` stub hook or create one manually with YAML frontmatter (`date`, `tags: [session]`). Include:
   - What was done (resumen)
   - Files changed
   - Decisions made
   - Next steps
2. **Import Copilot chats** — The hook runs `import-copilot.js` automatically. Or run manually:
   ```
   node "C:\Users\Hrval\Obsidian\claude-mem\scripts\import-copilot.js"
   ```
3. **Update INDEX.md** — If you created a new memory note, add a link to `INDEX.md`.
4. **Read memory/ before starting** — Always check relevant memory notes before beginning work on a project.
5. **Update memory/** — If you discover a new technical constraint, decision, or pattern, write or update a note in `memory/`.

### MCP server
The `~/.claude/settings.json` configures an `obsidian` MCP server via `@modelcontextprotocol/server-filesystem` pointing to the vault path. Use Read/Write tools on the vault path directly rather than relying on MCP.

### Hook
`~/.claude/settings.json` has a `Stop` hook that runs `session-end.ps1` at the end of each Claude Code session.

## License

Proprietary. See `LICENSE.txt` in the repository root.

## Contact

Hugo Redondo Valdés - Hrvaldes22@gmail.com

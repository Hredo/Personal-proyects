 # Basket-Estadistics

 Basketball statistics tracking web application (work in progress).

 ## Project overview

 Basket-Estadistics is a web application for collecting and displaying basketball statistics for players, teams, and staff. The project is built with Next.js, TypeScript, and Tailwind CSS, and it includes data sources and synchronization utilities to import stats from various providers.

 ## Status

 This repository is unfinished and in active development. Parts that are incomplete or require attention include:

 - Database setup and migrations
 - Authentication and user management
 - UI polish and accessibility improvements
 - More robust error handling and test coverage
 - Documentation and developer onboarding

 ## Quick start (developer)

 1. Install dependencies:

 ```
 pnpm install
 ```

 2. Copy environment example and edit values:

 ```
 cp .env.example .env.local
 ```

 3. Check database configuration in `drizzle.config.ts` and prepare your database. A database is required for running the app and syncing data.

 4. Run the development server:

 ```
 pnpm dev
 ```

 Useful scripts available in the `scripts/` folder (examples):

 - `pnpm dev` — start Next.js dev server
 - `pnpm build` — build for production
 - `pnpm lint` — run ESLint
 - `pnpm typecheck` — run TypeScript checks
 - `pnpm test` — run tests (if configured)

 There are helper scripts for database and data sync under `scripts/`, such as migration and sync utilities — inspect that folder for more commands, e.g. `apply-migrations.ts` and `sync.ts`.

 ## How to contribute

 - Open an issue or PR describing the change or improvement.
 - If you want to help with setup, focus first on: making the database/migrations reproducible, adding clear environment setup steps, and improving test coverage.
 - For questions or collaboration, contact the project owner: Hrvaldes22@gmail.com

 ## Notes for maintainers

 - Check `drizzle.config.ts` for the chosen database connector and connection details.
 - Follow existing code conventions (TypeScript strict mode, functional React components, Tailwind for styles).

 ## License

 See `LICENSE.txt` if present. The project currently follows the repository's stated licensing (check repository files for details).

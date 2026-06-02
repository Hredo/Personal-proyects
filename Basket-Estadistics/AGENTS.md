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
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests

## Environment

Copy `.env.example` to `.env.local` for local development. Never commit `.env` files.

## License

Proprietary. See `LICENSE.txt` in the repository root.

## Contact

Hugo Redondo Valdés - Hrvaldes22@gmail.com

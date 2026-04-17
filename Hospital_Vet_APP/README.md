# VetHospital 24h

Professional veterinary hospital management platform built with Next.js and TypeScript. The app includes staff workflows, patient management, appointments, hospitalization monitoring, inventory control, billing, and a client portal.

## Current Status (April 2026)

- Enterprise-ready implementation available (see `ENTERPRISE_README.md` and `SLA.md`).
- Local execution verified on 17/04/2026.
- Development server runs successfully with `npm run dev`.
- If port 3000 is busy, Next.js automatically uses the next available port (for example 3001).

## Table of Contents

1. Overview
2. Tech Stack
3. Features
4. Prerequisites
5. Quick Start
6. Environment Variables
7. Seed Data and Demo Accounts
8. Available Scripts
9. Project Structure
10. Troubleshooting

## Overview

VetHospital 24h is designed as an all-in-one operational dashboard for veterinary clinics and hospitals.

The application supports:

- Multi-role access (admin, veterinary staff, clients).
- End-to-end patient lifecycle management.
- Real-time hospitalization and operating room workflows.
- Billing and invoice generation tied to clinical activity.
- Attendance and internal operational control for team members.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- NextAuth v5 (credentials-based authentication)
- SQLite (better-sqlite3)
- Lucide React (icons)
- Resend (optional email notifications)

## Features

- Dashboard with operational modules for hospital teams.
- Appointment management for consultations and procedures.
- Patient records and clinical follow-up.
- Hospitalization monitor and operating room tracking.
- Inventory and stock control.
- Billing workflows with invoice items and totals.
- Client portal access.

## Prerequisites

Before running locally, make sure you have:

- Node.js 20.x or newer
- npm 10.x or newer

## Quick Start

1. Clone the repository.

```bash
git clone <your-repository-url>
cd Hospital_Vet_APP
```

If you are using this monorepo layout, move into the app folder from workspace root:

```bash
cd Personal-proyects/Hospital_Vet_APP
```

2. Install dependencies.

```bash
npm install
```

3. Create a .env file in the project root (see Environment Variables section).

4. Seed the local database with demo data.

```bash
npm run seed
```

5. Start the development server.

```bash
npm run dev
```

6. Open the app in your browser.

http://localhost:3000

## Environment Variables

Create a .env file in the root folder and define the following values:

```env
DATABASE_URL="file:./vet_hospital.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
AUTH_SECRET="replace-with-a-long-random-secret"
# Optional: enables real email delivery via Resend
# RESEND_API_KEY="re_xxxxxxxxx"
```

Notes:

- The database is a local SQLite file (vet_hospital.db).
- If RESEND_API_KEY is not provided, the app still works and email sends are skipped.
- Use different secrets in production.

## Seed Data and Demo Accounts

The default seed command populates users, clients, patients, medical records, appointments, inventory, hospitalizations, and related operational data.

Run:

```bash
npm run seed
```

Primary demo credentials:

- Admin:
	- Email: admin@hospitalvet.com
	- Password: admin123
- Client:
	- Email: maria@gmail.com
	- Password: user123

Additional notes:

- The seed process resets existing records in the local database.
- There is also an extended TypeScript seed script at scripts/seed-full.ts if you want to customize or expand generated data.

## Available Scripts

- npm run dev: start local development server.
- npm run build: create production build.
- npm run start: run production server from build output.
- npm run lint: run Next.js lint command.
- npm run seed: execute database seed script.
- npm run seed:full: execute full seed flow (currently mapped to `scripts/seed.js`).
- npm run test:e2e: run Playwright end-to-end tests.
- npm run test:e2e:ui: run Playwright in UI mode.
- npm run test:e2e:debug: run Playwright in debug mode.
- npm run test:unit: run unit tests (Jest).
- npm run test:watch: run Jest in watch mode.
- npm run test:coverage: run Jest coverage report.
- npm run test:security: run npm audit and lint.

## Project Structure

Key directories:

- src/app: Next.js App Router pages and route groups.
- src/components: reusable UI and action components.
- src/lib: database access and server-side action logic.
- src/types: shared type declarations.
- scripts: database seed scripts.

## Troubleshooting

1. App starts but login fails

- Re-run seed to ensure demo accounts exist:

```bash
npm run seed
```

2. Database-related issues

- Delete vet_hospital.db and seed again:

```bash
npm run seed
```

3. Port 3000 is already in use

- Run on another port:

```bash
npm run dev -- -p 3001
```

- Or let Next.js auto-select an available port (default behavior).

4. `npm run dev` fails from workspace root

- Run the command inside the app folder:

```bash
cd Personal-proyects/Hospital_Vet_APP
npm run dev
```

5. Email notifications not sending

- Confirm RESEND_API_KEY is present in .env.
- Without that key, notifications are logged but no real email is sent.

---

If this project helps you, consider starring the repository and opening issues for bugs or feature requests.

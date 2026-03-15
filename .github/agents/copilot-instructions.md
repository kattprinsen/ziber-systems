# ziber-systems Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-09

## Active Technologies
- TypeScript 5.9.3 (frontend), TypeScript 5.3.3 (backend), React 19.2.0 + React 19.2.0, React Router 7.13.0, Vite 7.2.4, TailwindCSS 3.4.19, Express 4.18.2 (002-money-slider-tool)
- JSON file-based storage (backend/src/data/users.json) - existing storage mechanism (002-money-slider-tool)
- TypeScript 5.x with Node.js 20+ (backend), TypeScript 5.x with React 19 (frontend) + Express.js 4.x, cors, helmet (backend); React 19, React Router 7, Vite (frontend) (003-tidig-user-sync)
- File-based JSON (users.json) with write operations during sync (003-tidig-user-sync)
- TypeScript 5.x with Node.js 20+ (backend), TypeScript 5.x with React 19 (frontend) + Express.js 4.x (backend); React 19, React Router 7, Vite (frontend) (005-remove-sync-polling)
- N/A (modification to frontend state management only) (005-remove-sync-polling)
- TypeScript 5.x (frontend: React 19 + Vite; backend: Node.js 20 + Express) + React, React Router, Tailwind CSS (frontend); Express, Zod, axios (backend) — no new dependencies added by this feature (006-margin-contribution)
- `backend/src/data/users.json` (flat JSON file, manually edited) — `hourlyRate` field added (006-margin-contribution)
- TypeScript 5.9 targeting Node.js 20 LTS for automation runners; React 19 + Vite 7 on the frontend; Node.js + Express on the backend. + Frontend: React, React Router, Vite, Vitest, Testing Library. Backend: Express, dotenv, zod, tsx, Vitest. CI/automation: Git-based workflow runner with official `actions/*` building blocks (no new npm runtime dependencies planned). (001-dependabot-ci)
- File-based configuration and mock data only (for example, backend `data/users.json`); no database changes introduced by this feature. (001-dependabot-ci)
- TypeScript 5.3 (backend), TypeScript ~5.9 (frontend) (007-group-performance-dashboard)
- JSON files on filesystem — `backend/src/data/performance-config.json` (target config) + `backend/src/data/snapshots/{YYYY-MM}.json` (monthly snapshots). Consistent with existing `users.json` pattern. (007-group-performance-dashboard)
- TypeScript 5.9 for the React/Vite frontend and Node.js 20 LTS for tooling and backend services. + Frontend: React 19, React Router 7, Vite 7, Recharts for charting. Backend: Express, axios for Tidig API calls, dotenv, zod, fs-extra. No new external services or npm packages are planned for this feature. (001-tidig-home-employees)
- File-based internal data in the existing backend `data/users.json` file (git-ignored) for real user data; no database tables or new storage mechanisms are introduced. (001-tidig-home-employees)

- TypeScript 5.9.3, React 19.2.0 + React 19.2.0, React-DOM 19.2.0, Vite 7.2.4, Tailwind CSS (to be installed) (001-dark-ui-layout)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.9.3, React 19.2.0: Follow standard conventions

## Recent Changes
- 001-tidig-home-employees: Added TypeScript 5.9 for the React/Vite frontend and Node.js 20 LTS for tooling and backend services. + Frontend: React 19, React Router 7, Vite 7, Recharts for charting. Backend: Express, axios for Tidig API calls, dotenv, zod, fs-extra. No new external services or npm packages are planned for this feature.
- 007-group-performance-dashboard: Added TypeScript 5.3 (backend), TypeScript ~5.9 (frontend)
- 001-dependabot-ci: Added TypeScript 5.9 targeting Node.js 20 LTS for automation runners; React 19 + Vite 7 on the frontend; Node.js + Express on the backend. + Frontend: React, React Router, Vite, Vitest, Testing Library. Backend: Express, dotenv, zod, tsx, Vitest. CI/automation: Git-based workflow runner with official `actions/*` building blocks (no new npm runtime dependencies planned).


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

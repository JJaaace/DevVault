# DevVault

**A personal developer operating system for organizing, presenting, and growing a software engineering portfolio.**

[![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-233056?logo=node.js&logoColor=5FA04E)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-2f241b?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-2f241b?logo=postgresql&logoColor=73A7D8)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2f241b?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-2f241b?logo=clerk&logoColor=C4A7FF)](https://clerk.com/)

DevVault is both the workspace where I maintain my developer story and the portfolio experience recruiters see. Projects, skills, credentials, goals, profile information, and resume assets are managed in one authenticated application, then published through a deliberately limited read-only API.

The result is not a static portfolio with duplicated content. It is one system with three views:

- an authenticated **Owner Workspace** for managing the data;
- a focused **Recruiter Overview** for quickly understanding the developer and the work;
- an unlocked **Guest Vault** that reuses the real workspace experience without exposing edit access.

> **Live Demo:** Coming soon — production infrastructure has not been provisioned yet.

## Why DevVault exists

Developer portfolios often become disconnected collections of project cards, résumé links, and manually repeated skill lists. DevVault brings those pieces into one maintained workspace so that an update to canonical data can flow into the dashboard, recruiter experience, and Guest Vault consistently.

The project also serves as a practical full-stack engineering exercise: authentication, relational modeling, file persistence, public/private API boundaries, third-party synchronization, migrations, backup verification, production checks, and responsive interaction design all live in the same application.

## Main features

### Owner Workspace

- **Dashboard command deck** built from the current Profile, Projects, Skills, Goals, Certifications, and Resume state through the aggregate `GET /api/dashboard` contract.
- **Profile management** with portfolio visibility, career details, social links, availability, and a dedicated persistent profile-image endpoint.
- **Project management** with create/edit/delete flows, display ordering, featured state, status, technology stack, key features, artwork, repository metadata, and public visibility.
- **Skills workspace** with categories, experience levels, favorites, notes, last-used data, and real many-to-many Project relationships.
- **Certifications workspace** with ordering, featured credentials, roadmap items, technology links, and database-backed certificate assets.
- **Goals workspace** with status, ordering, related projects/certifications/technologies, milestones, resources, and public visibility controls.
- **Resume workspace** with PDF upload, replacement, deletion, owner preview, and visibility-checked public delivery.
- **Inside the Vault** narrative experience and workspace settings for Clerk account controls and local presentation preferences.

### Recruiter Overview

`/portfolio/:username` is an unauthenticated one-page portfolio designed to communicate identity, featured work, technologies, credentials, experience, and direction before a visitor enters the larger workspace.

The page reads a server-created public portfolio projection. General cards stay within the overview; external GitHub actions remain explicit, and **Unlock the Vault** is the intentional entry point into the deeper read-only experience.

### Guest Vault

`/portfolio/:username/vault/*` reuses the Dashboard, Inside the Vault, Projects, Skills, Certifications, and Resume page components under `GuestModeContext`.

Guest Mode has its own route-aware navigation and visibly read-only state. It does not depend on hidden edit buttons for security: the public Express router exposes GET handlers only, and public serializers omit owner IDs, private notes, resources, raw file bytes, and other private fields.

## Application routes

| Experience | Routes |
| --- | --- |
| Owner Workspace | `/dashboard`, `/inside-vault`, `/projects`, `/skills`, `/resume-workspace`, `/certifications`, `/goals`, `/profile`, `/settings` |
| Recruiter Overview | `/portfolio/:username` |
| Guest Vault | `/portfolio/:username/vault`, `/about`, `/projects`, `/skills`, `/resume`, `/certifications` beneath the Vault path |
| Public API | `GET /api/public/portfolio/:username` plus visibility-checked image, artwork, certificate, and resume streams |
| Operations | `GET /health` for process health and `GET /ready` for persistence readiness |

Legacy public portfolio and résumé paths redirect into the current Guest Vault route system.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, custom CSS, Framer Motion, Sonner |
| Authentication | Clerk React and Clerk Express |
| Backend | Node.js 22.12+, Express 5, structured CommonJS services/controllers/routes |
| Data | PostgreSQL, Prisma ORM 7, Prisma PostgreSQL adapter, `pg` |
| Testing and quality | Node test runner, ESLint, Prisma validation/migration checks, production smoke and repository-policy scripts |
| Deployment support | Static Vite output, Vercel SPA rewrite, provider-agnostic Node backend runbook, PostgreSQL backup/restore tooling |

## Architecture

```text
React / Vite
├── Authenticated owner routes ── Clerk session ─────────────┐
├── Recruiter overview ──────── public portfolio DTO ────────┤
└── Guest Vault ─────────────── same public DTO, read-only ───┤
                                                             ▼
                                                   Express 5 API
                                           ┌────────────┴────────────┐
                                           │ owner-scoped services   │
                                           │ public DTO serializers  │
                                           └────────────┬────────────┘
                                                        ▼
                                               Prisma + PostgreSQL
                                                        ▲
                                      project metadata only │
                                                        │
                                                   GitHub API
```

The frontend is organized around lazy-loaded pages, shared workspace components, API modules, and a Guest Mode context that remaps owner navigation to public routes. The backend follows route → controller → service boundaries and uses one shared Prisma client.

`SkillProject` is the authoritative source for Project/Skill relationships. Public output is generated from current canonical records and persisted visibility flags rather than maintained as a separate portfolio dataset.

## Database and persistence

The Prisma schema currently contains:

- `User` and `Profile`
- `Project`
- `Skill`
- `SkillProject`
- `Goal`
- `Certification`
- `CertificationRoadmapItem`
- `ResumeAsset`

PostgreSQL is the authoritative production store. It holds application records as well as persisted resume bytes, certification assets, and embedded media where applicable. Foreign keys and owner-scoped queries preserve ownership boundaries; cascading relations keep join records consistent.

An explicit `PERSISTENCE_MODE=local` JSON compatibility mode exists for development only. Production validation rejects local persistence and does not silently fall back to JSON after a database failure.

## GitHub integration

GitHub synchronization is intentionally limited to Projects.

The sync service:

- reads the GitHub account from the owner's Profile without modifying the Profile;
- links repositories using stable repository ID, full name, or normalized URL;
- refreshes an explicit allowlist of repository metadata such as stars, forks, languages, topics, repository URLs, and update timestamps;
- reports unlinked repositories as review-only import candidates instead of automatically creating Projects;
- reports missing repositories without automatically archiving existing Projects;
- uses request timeouts and supports an optional backend-only `GITHUB_TOKEN` for higher API rate limits.

Curated titles, descriptions, artwork, ordering, status, technologies, key features, dates, visibility, featured state, and demo URLs stay outside the GitHub write boundary. Dedicated regression tests protect this contract.

## Authentication and authorization

- Clerk handles sign-up, sign-in, session management, and owner identity.
- Frontend owner pages use protected routes.
- Backend owner endpoints independently require authentication; frontend hiding is not treated as authorization.
- Every owner query is scoped by the authenticated Clerk `userId`, including lookups by numeric record ID.
- Production refuses to start with development identity fallback enabled.
- Public portfolio endpoints are unauthenticated, GET-only, visibility-filtered, and serialized through an explicit public DTO.

## Production engineering and security

Implemented safeguards include:

- fail-fast frontend and backend production environment validation;
- exact HTTPS CORS allowlisting in production;
- baseline security headers and disabled Express signature headers;
- structured request logging with request IDs and credential/media redaction;
- normalized API success/error contracts without stack-trace leakage;
- separate liveness and database-readiness endpoints;
- PostgreSQL connection verification before server startup;
- graceful `SIGTERM`/`SIGINT` shutdown with Prisma disconnection;
- checked Prisma generation, schema validation, and committed migration status;
- database count, ownership, orphan, and migration diagnostics;
- repository checks for accidentally tracked runtime secrets or sensitive files;
- public-route mutation and privacy-boundary tests;
- preview-first, conflict-checked, transactional Clerk ownership reassignment;
- documented backup, restore, rollback, and signed-out production smoke procedures.

See [Deployment](docs/DEPLOYMENT.md), [Security Model](docs/SECURITY_MODEL.md), [Backups](docs/BACKUPS.md), and [Rollback](docs/ROLLBACK.md) for the operational contracts.

## Local setup

### Prerequisites

- Node.js **22.12 or newer**
- npm
- PostgreSQL
- a Clerk development application for the authenticated Owner Workspace

The signed-out Recruiter Overview and Guest Vault can render in development without Clerk configuration. Clerk configuration is required to use owner routes.

### 1. Clone and install

```bash
git clone https://github.com/JJaaace/DevVault.git
cd DevVault
npm ci --prefix backend
npm ci --prefix frontend
```

### 2. Create local environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Both files are ignored by Git. Replace the production-oriented example placeholders with development values before starting the application. Never put a backend secret in a `VITE_*` variable.

### Frontend variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Production; injected by the root dev script locally | Express API origin |
| `VITE_CLERK_PUBLISHABLE_KEY` | Owner Workspace and production | Public Clerk publishable key |
| `VITE_PUBLIC_APP_URL` | Production | Canonical frontend origin used for links and metadata |

### Backend variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Runtime environment |
| `PORT` | Optional locally; normally host-provided in production | Express port |
| `PERSISTENCE_MODE` | Yes in production | `postgres` in production; explicit `local` compatibility mode in development |
| `DATABASE_URL` | When using PostgreSQL | PostgreSQL connection URL; keep secret |
| `CLERK_PUBLISHABLE_KEY` | Production Clerk authentication | Server-side Clerk configuration |
| `CLERK_SECRET_KEY` | Production Clerk authentication | Secret Clerk server key |
| `CORS_ORIGINS` | Production; recommended locally | Exact comma-separated allowed frontend origins |
| `GITHUB_TOKEN` | No | Optional backend-only GitHub API token |
| `DEV_CLERK_USER_ID` | Development only | Explicit local owner fallback; rejected in production |

### 3. Prepare PostgreSQL

After pointing `DATABASE_URL` at the intended local database, apply the committed migrations:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate:deploy
```

Migration commands create the schema; they do not copy another developer's workspace data. Legacy/local import utilities are intentionally separate and should not be run as ordinary setup steps.

### 4. Start DevVault

```bash
npm run dev
```

The root script starts the backend at `http://localhost:5001` and the frontend at `http://127.0.0.1:5176`.

Individual processes are also available:

```bash
npm run dev:backend
npm run dev:frontend
```

## Development and verification commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start frontend and backend together |
| `npm run dev:backend` | Start only the Express API |
| `npm run dev:frontend` | Start only Vite |
| `npm test` | Run backend and frontend Node test suites |
| `npm run lint` | Lint the frontend |
| `npm run build` | Create the production frontend bundle |
| `npm run verify:data` | Verify the existing canonical development workspace counts, IDs, and relationships |
| `npm run db:production:check` | Inspect database reachability, schema, migrations, and counts |
| `npm run db:verify` | Run relational and ownership integrity checks |
| `npm run security:policy` | Check environment templates, tracked files, credential patterns, and public-route boundaries |
| `npm run deploy:preflight` | Run the complete local production-readiness gate |

The production smoke suite is environment-driven:

```bash
APP_URL=<frontend-origin> API_URL=<api-origin> PORTFOLIO_USERNAME=<username> npm run production:smoke
```

It verifies health/readiness, public SPA routes, the public privacy DTO, media delivery, and rejected Guest mutations. It does not authenticate or mutate owner data.

## Deployment status

**Current status: deployment-ready repository; external deployment coming soon.**

The repository contains production environment validation, Vercel SPA rewrites, portable frontend/backend deployment settings, committed migrations, database transfer verification, guarded ownership handoff, smoke tests, and rollback documentation. It does **not** contain evidence that frontend, backend, PostgreSQL, Clerk production identity, or custom domains have been provisioned publicly.

Before launch, the remaining work is external: provision the providers, supply production credentials through their secret managers, restore the verified data into an empty migrated PostgreSQL database, transfer ownership to the real production Clerk user, and run the documented smoke/manual checks.

## Screenshots

Screenshots will be added before the public launch. Recommended captures:

1. Recruiter Overview hero and featured DevVault project
2. Owner Dashboard command deck
3. Projects and Skills workspaces
4. Certifications and Goals experiences
5. Unlocked Guest Vault navigation and read-only Skills page

## Demo video / GIF

**Coming soon.** A short walkthrough should show the recruiter one-pager, the Unlock the Vault transition, Guest Vault navigation, and an authenticated edit flowing into the public view.

## What I learned

DevVault demonstrates practical experience with:

- designing one canonical data model for multiple product experiences;
- separating authentication, frontend route protection, backend authorization, and public serialization;
- modeling and preserving many-to-many relationships with Prisma and PostgreSQL;
- making external synchronization useful without surrendering curated data ownership;
- storing and streaming user media with explicit owner/public boundaries;
- treating migrations, backups, restore verification, and rollback as part of application engineering;
- building data-rich React interfaces with reusable route-level Guest Mode behavior;
- testing privacy, ownership, caching, synchronization, and deployment contracts—not only UI components.

## Project status

DevVault is in active development and final deployment preparation. The core owner workspace, recruiter overview, Guest Vault, persistence model, GitHub project synchronization boundary, production checks, and operational documentation are implemented. The next milestone is the first verified public deployment and final cross-device visual QA.

## Author

**Jace Joseph**<br>
Software engineering student and creator of DevVault<br>
[GitHub: @JJaaace](https://github.com/JJaaace)

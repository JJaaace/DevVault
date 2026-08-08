# DevVault

DevVault is a developer growth dashboard and portfolio platform.

## Architecture

DevVault is a React/Vite workspace and recruiter-facing portfolio backed by Express, Prisma, and PostgreSQL. Clerk owns authentication identity; every private record is scoped to `clerkUserId`. PostgreSQL is authoritative in normal operation. The JSON store is available only with the explicit `PERSISTENCE_MODE=local` development setting.

Persisted workspace domains include profiles, projects, skills, `SkillProject` relationships, goals, certifications, certification roadmap items, and resume PDFs. `/api/dashboard` is the single aggregate contract for the private command deck, while `/api/public/portfolio/:username` returns a public-safe visibility-filtered projection.

## Run the full app (recommended)

```bash
npm run dev
```

This starts:
- frontend on http://127.0.0.1:5176
- backend on http://localhost:5001

## Run the frontend only

```bash
cd frontend
npm run dev
```

## Run the backend only

```bash
cd backend
node src/app.js
```

## Verification

```bash
npm test
npm run lint
npm run build
npm run verify:data
```

See [deployment guidance](docs/DEPLOYMENT.md) and the [refactor progress log](docs/DEVVAULT_REFACTOR_PROGRESS.md) for production configuration, migrations, safeguards, and remaining external setup.

# DevVault Deployment

## Required production environment

Backend:

- `NODE_ENV=production`
- `PERSISTENCE_MODE=postgres`
- `DATABASE_URL` pointing to durable PostgreSQL
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CORS_ORIGINS` as a comma-separated list of exact frontend origins
- `GITHUB_TOKEN` is recommended for reliable GitHub sync and higher rate limits

Frontend:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL` when the API is hosted on a different origin; same-origin deployments may omit it
- `VITE_PUBLIC_APP_URL` for canonical portfolio and resume sharing links

Production startup intentionally fails if Clerk server credentials, CORS origins, PostgreSQL mode, or the database URL are missing. Local JSON persistence and development identity fallback are disabled in production.

## Release sequence

1. Back up PostgreSQL with `pg_dump`.
2. Run `npm --prefix backend exec prisma migrate deploy` from the repository root, or `npx prisma migrate deploy` from `backend/`.
3. Run `npm --prefix backend exec prisma generate`.
4. Run `npm test`, `npm run lint`, `npm run build`, and `npm run verify:data` against the intended environment.
5. Deploy the backend and confirm `/health` reports `database: reachable`.
6. Deploy the frontend and verify signed-out `/portfolio/:username` and `/portfolio/:username/vault/resume` routes.

## Clerk ownership handoff

The migrated local workspace is intentionally owned by `dev-local-user`. Do not guess or automatically rewrite this identity. After the real production Clerk user ID is known, take a fresh backup and run:

```bash
node backend/scripts/reassignClerkOwnership.js dev-local-user user_REAL_CLERK_ID
```

The script aborts if either source data is missing or the destination already owns data. It changes the owner and profile identity transactionally, relies on cascading foreign keys for owned records, then verifies project, skill, goal, certification, and resume counts. It has not been run in this engineering pass because no production Clerk user ID was supplied.

## Durable assets

Uploaded resume PDFs are stored in PostgreSQL and no longer depend on an application server filesystem. Project and profile images currently support URLs and embedded image data. For higher-volume multi-user production, object storage plus signed upload URLs is the recommended next step; current behavior remains durable when PostgreSQL stores embedded data.

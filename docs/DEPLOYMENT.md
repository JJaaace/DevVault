# DevVault Production Runbook

This runbook takes DevVault from a verified local workspace to a public deployment without treating production as a seedable copy of development. The repository remains provider-agnostic:

- a static host such as Vercel serves `frontend/dist`;
- a Node host such as Render or Railway runs the Express backend;
- a durable PostgreSQL provider such as Neon, Supabase, or Railway stores every canonical record and uploaded document;
- Clerk authenticates the private owner workspace.

The public recruiter overview and Guest Vault are unauthenticated and read-only. The owner workspace is authenticated through Clerk.

## Safety contract

Never run these against production:

- `prisma migrate dev`
- `prisma db push`
- `prisma migrate reset`
- seed or legacy-import scripts
- `pg_restore` into a non-empty or unrelated database

Never put secrets in `VITE_*` variables. Do not commit `.env` files, database archives, resumes, certificates, private images, or provider credentials.

Commands marked **WRITES PRODUCTION DATA** require a verified backup and careful target confirmation.

## Required production configuration

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | HTTPS origin of the deployed Express API, without a trailing slash |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk production publishable key (`pk_live_...`) |
| `VITE_PUBLIC_APP_URL` | Canonical HTTPS frontend origin used for links and metadata |

### Backend

| Variable | Purpose |
| --- | --- |
| `NODE_ENV=production` | Enables production fail-fast and proxy behavior |
| `PERSISTENCE_MODE=postgres` | Makes PostgreSQL the only production storage authority |
| `DATABASE_URL` | Secret SSL-enabled hosted PostgreSQL URL |
| `CLERK_PUBLISHABLE_KEY` | Clerk production publishable key |
| `CLERK_SECRET_KEY` | Secret Clerk production server key |
| `CORS_ORIGINS` | Exact comma-separated HTTPS frontend origins |
| `PORT` | Usually injected by the Node host |
| `GITHUB_TOKEN` | Optional secret token for higher GitHub API limits |

Production startup rejects missing variables, local database/front-end origins, test Clerk keys, wildcard CORS, local persistence, and `DEV_CLERK_USER_ID`. Configuration errors name variables but never print their values.

## Repository commands

| Command | Effect |
| --- | --- |
| `npm run deploy:preflight` | Read-only checks plus a disposable frontend build |
| `npm run db:production:check` | Read-only database reachability/schema/migration/count report |
| `npm run db:verify` | Read-only counts and relational-integrity verification |
| `npm run db:verify -- --expected=/path/counts.json` | Compares counts with an optional manifest |
| `npm run db:archive:check -- --archive=/path/backup.dump` | Read-only archive/tool/checksum verification |
| `npm run ownership:preview -- --from=... --to=...` | Read-only ownership handoff preview |
| `npm run ownership:apply -- --from=... --to=... --confirm=REASSIGN` | **WRITES PRODUCTION DATA** transactionally changes owner identity |
| `APP_URL=... API_URL=... PORTFOLIO_USERNAME=... npm run production:smoke` | Signed-out production HTTP smoke suite |

## Stage 0 — Verify and back up local DevVault

Why: the local PostgreSQL database contains curated text, relationships, profile/project images, certification bytes, and the resume PDF. Git is not a database backup.

1. From the repository root, run:

   ```bash
   npm ci --prefix backend
   npm ci --prefix frontend
   npm run deploy:preflight
   npm run db:verify
   ```

2. Create a fresh custom-format backup in the ignored backup directory. This reads the database and writes a local archive; it does not change records:

   ```bash
   mkdir -p backend/.data/backups
   pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file="backend/.data/backups/devvault-before-production.dump"
   shasum -a 256 backend/.data/backups/devvault-before-production.dump
   npm run db:archive:check -- --archive="backend/.data/backups/devvault-before-production.dump"
   ```

3. Store the checksum separately. Keep the existing verified archive untouched.

## Stage 1 — Create Clerk production identity

Why: the local owner ID `dev-local-user` is intentionally not a real authentication identity.

1. Create/select the Clerk production application.
2. Add the eventual frontend production origin to Clerk's allowed origins and redirect configuration.
3. Create or sign into the real owner account in Clerk.
4. Record its `user_...` ID without putting it in source control.
5. Do not use the owner workspace against the hosted database before Stage 6.

## Stage 2 — Create hosted PostgreSQL

Why: frontend/backend hosts are replaceable, but PostgreSQL is the durable source of truth.

The database must support PostgreSQL 15+ features used by Prisma: foreign keys, sequences, enums, arrays, JSONB, timestamps, partial indexes, and `bytea`. Use an SSL connection URL and enable provider backups or point-in-time recovery when available.

Keep two shell variables only in the current terminal session if desired:

```bash
export LOCAL_DATABASE_URL='your existing local URL'
export PRODUCTION_DATABASE_URL='the new hosted SSL URL'
```

Do not paste either value into documentation or Git.

## Stage 3 — Apply committed Prisma migrations

Why: migrations create a reproducible empty schema before data is restored.

Confirm the hosted database is the intended new database. Then run **WRITES PRODUCTION SCHEMA**:

```bash
DATABASE_URL="$PRODUCTION_DATABASE_URL" NODE_ENV=development PERSISTENCE_MODE=postgres npm --prefix backend run prisma:migrate:deploy
DATABASE_URL="$PRODUCTION_DATABASE_URL" NODE_ENV=development PERSISTENCE_MODE=postgres npm run db:production:check
```

The check should show all committed migrations, all expected tables, and zero application rows. Stop if it is non-empty.

## Stage 4 — Transfer local data

Why: committed migrations contain schema, not Jace's existing workspace content.

Create a data-only archive from the canonical local database:

```bash
pg_dump --dbname="$LOCAL_DATABASE_URL" --format=custom --data-only --exclude-table=_prisma_migrations --no-owner --no-privileges --file="backend/.data/backups/devvault-data-only.dump"
shasum -a 256 backend/.data/backups/devvault-data-only.dump
npm run db:archive:check -- --archive="backend/.data/backups/devvault-data-only.dump"
```

Only after Stage 3 reports an empty application schema, run **WRITES PRODUCTION DATA**:

```bash
pg_restore --dbname="$PRODUCTION_DATABASE_URL" --data-only --exit-on-error --no-owner --no-privileges "backend/.data/backups/devvault-data-only.dump"
```

Do not automatically merge JSON/local-mode data. Do not restore into a database containing unrelated records.

## Stage 5 — Verify the hosted copy

Why: a successful `pg_restore` exit code does not prove every relationship or document is usable.

```bash
DATABASE_URL="$PRODUCTION_DATABASE_URL" NODE_ENV=development PERSISTENCE_MODE=postgres npm run db:verify
```

Compare its counts with the Stage 0 report. Optionally create a local untracked manifest:

```json
{
  "counts": {
    "users": 1,
    "profiles": 1,
    "projects": 5
  }
}
```

Then run `npm run db:verify -- --expected=/absolute/path/to/manifest.json`. Include whatever current counts you recorded; the application tooling does not permanently hardcode them.

Take a fresh hosted backup before ownership changes:

```bash
pg_dump --dbname="$PRODUCTION_DATABASE_URL" --format=custom --no-owner --no-privileges --file="backend/.data/backups/devvault-hosted-before-owner-handoff.dump"
```

## Stage 6 — Hand ownership to the Clerk production user

Why: restored data is still owned by `dev-local-user`, while Clerk will authenticate as `user_...`.

Preview is read-only:

```bash
DATABASE_URL="$PRODUCTION_DATABASE_URL" NODE_ENV=development PERSISTENCE_MODE=postgres npm run ownership:preview -- --from=dev-local-user --to=user_REAL_CLERK_ID
```

Review affected counts and media fingerprints. The tool aborts if the destination already owns any workspace data.

Then run **WRITES PRODUCTION DATA**:

```bash
DATABASE_URL="$PRODUCTION_DATABASE_URL" NODE_ENV=development PERSISTENCE_MODE=postgres npm run ownership:apply -- --from=dev-local-user --to=user_REAL_CLERK_ID --confirm=REASSIGN
```

The utility uses a transaction, preserves primary IDs and relationships, compares media fingerprints and record IDs inside the transaction, and rolls back on mismatch. Run `db:verify` again afterward.

## Stage 7 — Deploy the backend

Portable Node-host settings:

- root directory: `backend`
- runtime: Node.js 22.12 or newer
- install/build: `npm ci`
- predeploy migration: `npm run prisma:migrate:deploy`
- start: `npm start`
- health: `GET /health`
- readiness: `GET /ready`

Set the backend variables from the table above in the host's secret manager. Do not use `.env.example` as actual configuration. The install hook regenerates Prisma Client.

Verify:

```bash
API_URL=https://api.your-domain.example node -e 'fetch(process.env.API_URL + "/health").then(r => r.json()).then(console.log)'
API_URL=https://api.your-domain.example node -e 'fetch(process.env.API_URL + "/ready").then(r => r.json()).then(console.log)'
```

`/health` proves the process is alive. `/ready` additionally proves PostgreSQL is reachable. Neither returns credentials or identities.

## Stage 8 — Deploy the frontend

Portable static-host settings:

- root directory: `frontend`
- framework/build system: Vite
- Node.js: 22.12 or newer
- install: `npm ci`
- build: `npm run build`
- output directory: `dist`

Set all three frontend variables. `frontend/vercel.json` provides a Vercel SPA rewrite; on another provider, configure every non-file route to serve `index.html` with status 200.

## Stage 9 — Finalize CORS and Clerk domains

Why: the API and Clerk must recognize the exact deployed frontend origin.

1. Set backend `CORS_ORIGINS=https://your-frontend.example` and redeploy/restart the backend.
2. Add the same frontend origin and login/signup redirect routes in Clerk.
3. Keep localhost out of production values.
4. Verify an unapproved browser origin receives no permissive CORS response.

## Stage 10 — Production testing

Run the signed-out suite:

```bash
APP_URL=https://your-frontend.example API_URL=https://your-api.example PORTFOLIO_USERNAME=your-public-username npm run production:smoke
```

Then manually test Clerk owner flows:

- signed out: recruiter page and Guest Vault load without Clerk;
- signed out: owner routes redirect to login and API mutations return 401/403;
- owner: profile, projects, skills, credentials, goals, and resume load;
- owner: a deliberate harmless edit can be saved and reverted;
- wrong Clerk user: cannot see or mutate Jace's records;
- profile picture, project artwork, certificate files, and resume render/download;
- GitHub sync changes only the documented repository metadata allowlist.

## Stage 11 — Optional custom domains

Add custom domains only after provider URLs pass Stage 10. Update all of these together:

- `VITE_API_BASE_URL`
- `VITE_PUBLIC_APP_URL`
- `CORS_ORIGINS`
- Clerk allowed origins and redirect URLs
- DNS records

Redeploy the frontend because `VITE_*` values are compiled into the bundle.

## Stage 12 — Final backup

After production verification, create and checksum another full hosted backup. Record the deployed Git commit, migration list, provider URLs, backup time, and smoke-test result. Keep at least one verified pre-launch and one verified post-launch archive outside the application host.

## Rollback and ongoing operations

Read [ROLLBACK.md](./ROLLBACK.md) before changing production and [BACKUPS.md](./BACKUPS.md) for the ongoing backup policy. The authorization boundary is documented in [SECURITY_MODEL.md](./SECURITY_MODEL.md).

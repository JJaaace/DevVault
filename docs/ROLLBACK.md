# DevVault Production Rollback Runbook

The safe rollback strategy is to stop writes, preserve evidence, and restore a verified backup. Do not improvise with `db push`, migration reset, seeds, or manual bulk deletes.

## General incident sequence

1. Disable owner editing or stop the backend if writes could worsen the problem.
2. Record the failing deployment version, time, provider logs, migration state, and `/health`/`/ready` results.
3. Create a backup of the current broken state when possible; it can help diagnosis.
4. Select the most recent verified backup from before the change.
5. Restore into a new empty recovery database first when the provider permits.
6. Run `db:production:check`, `db:verify`, and the production smoke suite.
7. Point the backend at the verified recovery database only after validation.

## Failed Prisma migration

- Stop backend deployment if the predeploy migration command fails.
- Do not rerun with `migrate dev`, `db push`, or reset.
- Inspect `prisma migrate status` and the provider's migration logs.
- If Prisma reports a recoverable failed migration, follow Prisma's documented `migrate resolve` process only after understanding whether SQL was partially applied.
- For an uncertain or partially destructive result, restore the pre-migration backup into a fresh database and redeploy the previously working backend commit.

## Bad frontend deployment

Roll the static host back to the previous successful frontend deployment. This does not alter PostgreSQL. Verify that the restored bundle still points to the correct API and Clerk production origins.

## Bad backend deployment

Roll the Node host back to the previous backend commit. If the release included a backward-incompatible migration, do not assume code rollback alone is safe; restore the matching pre-migration database backup or deploy a reviewed forward-fix migration.

## Incorrect CORS

Correct `CORS_ORIGINS` to the exact frontend origin and restart/redeploy the backend. Do not use `*` as a temporary fix. Test both the approved and an unapproved origin.

## Clerk configuration failure

Keep public portfolio routes online if they are healthy. Correct production keys, allowed origins, and redirect URLs in Clerk/backend/frontend. Never enable `DEV_CLERK_USER_ID` in production.

## Ownership handoff failure

The utility rolls back automatically when its in-transaction verification fails. If it reports failure, do not rerun blindly. Run `db:verify`, confirm source/destination counts, and inspect the fresh pre-handoff backup. If a failure occurred after commit verification, restore the pre-handoff backup to a recovery database before retrying.

## Corrupted data transfer

Discard the incorrect hosted database if it was newly created and contains no production-only writes. Create a fresh empty database, apply committed migrations, restore the verified data-only archive, and rerun integrity checks. Never merge another archive into the corrupted non-empty destination.

## Broken images, certifications, or resume

Check the database media counts and byte sizes before changing UI code. Compare the affected profile image, certification assets, or resume checksum with the verified backup. Restore the full database or a carefully reviewed record-level export; do not replace missing media with guessed files.

## GitHub synchronization bug

Disable use of the sync action and roll back the backend. Compare project fields with the pre-sync backup. The current allowlist excludes curated fields; if that boundary was broadened, restore only from verified authoritative data with a reviewed script and take a backup first.

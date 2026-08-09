# DevVault Backup Strategy

DevVault's PostgreSQL database contains more than text rows. It is the canonical store for profile identity, projects, skills, `SkillProject` relationships, goals, certifications, roadmap data, the resume PDF, certification binaries, and embedded profile/project images.

Losing PostgreSQL can therefore lose the portfolio's documents and visual assets even if the Git repository is intact.

## Recommended policy

- enable the PostgreSQL provider's automatic daily backups or point-in-time recovery;
- retain at least 14 daily restore points during active development;
- take a manual custom-format backup before migrations, ownership handoffs, bulk imports, or major releases;
- keep at least one encrypted copy outside the database and application providers;
- retain the verified first-production archive and first post-launch archive long term;
- perform a restore drill into an isolated database at least quarterly and after changing backup tooling.

## Manual backup

This reads PostgreSQL and writes a sensitive local file:

```bash
mkdir -p backend/.data/backups
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file="backend/.data/backups/devvault-$(date +%Y%m%d-%H%M%S).dump"
shasum -a 256 backend/.data/backups/devvault-YYYYMMDD-HHMMSS.dump
npm run db:archive:check -- --archive="backend/.data/backups/devvault-YYYYMMDD-HHMMSS.dump"
```

The ignored `.data` directory prevents accidental Git inclusion, but it is not encryption. Protect archives as private documents.

## Backup verification

Archive listing and checksum verification prove the file is readable, not that every restored relation works. The strongest verification is:

1. create an isolated empty PostgreSQL database;
2. apply the committed migrations;
3. restore the archive with `pg_restore --exit-on-error`;
4. run `db:production:check` and `db:verify`;
5. compare expected counts and important media checksums;
6. delete only the explicitly named temporary database after verification.

Never test restoration by overwriting the active local or production database.

## Before destructive-capable operations

Record:

- backup path and SHA-256 checksum;
- PostgreSQL/`pg_dump` version;
- Git commit;
- committed migration list;
- `db:verify` output;
- provider/database identifier without recording its credential URL.

Use [ROLLBACK.md](./ROLLBACK.md) if verification fails.

# DevVault Security Model

DevVault has one canonical PostgreSQL workspace with three presentation boundaries.

## Owner workspace

Routes such as `/dashboard`, `/projects`, `/skills`, `/profile`, `/certifications`, `/goals`, `/resume-workspace`, and `/settings` require Clerk authentication in the frontend. Their `/api/*` operations independently require backend Clerk authentication.

The authenticated Clerk `userId` is used in every owner-scoped query. Knowing a Project or Skill numeric ID is insufficient: the query also requires the authenticated owner ID. Production disables the development identity fallback and rejects `DEV_CLERK_USER_ID`.

The owner can:

- edit the profile and explicitly replace its picture;
- create, update, reorder, feature, and remove projects;
- manage skills and authoritative `SkillProject` relationships;
- manage certifications, credential media, and roadmap items;
- manage goals;
- replace/remove the resume PDF;
- start project-only GitHub synchronization.

## Public recruiter overview

`/portfolio/:username` is unauthenticated and reads a server-created public DTO. Public endpoints live under `/api/public` and register GET handlers only.

The public view can show approved profile fields, public projects, public skills, public certifications, public goals, and the public resume. Public media routes verify both the portfolio setting and record visibility.

It cannot mutate data or receive Clerk IDs, owner IDs, private notes, goal resources, raw certification bytes, raw resume content, settings, or edit controls.

## Guest Vault

`/portfolio/:username/vault/*` is a richer read-only rendering of the same public DTO. It reuses owner page components under `GuestModeContext`, maps navigation into public paths, and hides mutation controls. It does not inherit owner API permissions.

Frontend hiding is usability—not the security boundary. The Express public router and DTO serializers enforce read-only behavior on the server.

## GitHub synchronization boundary

GitHub sync reads the GitHub URL from Profile but cannot write Profile. New repositories are review-only candidates and are not automatically created. Missing repositories do not archive projects.

The only permitted persisted fields are centralized in `GITHUB_PROJECT_METADATA_FIELDS`:

- `githubRepoId`
- `githubFullName`
- `githubDescription`
- `githubStars`
- `githubForks`
- `githubLanguages`
- `githubTopics`
- `githubUrl`
- `githubHomepage`
- `githubUpdatedAt`
- `githubPushedAt`
- `githubArchivedAt`

Manual title, description, artwork, ordering, status, technologies, key features, dates, demo URL, visibility, and featured state remain outside the GitHub write payload. Regression tests fail if the allowlist boundary broadens accidentally.

## Media and privacy

- profile pictures: stored in PostgreSQL and streamed through versioned owner/public image routes;
- project artwork: stored as curated URLs or database data URLs, with public streaming for embedded public artwork;
- certification files: PostgreSQL `Bytes`, exposed only through owner or visibility-checked public streams;
- resume: PostgreSQL `Bytes`, exposed through authenticated or portfolio-checked public PDF streams.

Binary/data-URL contents, authorization headers, cookies, database URLs, and tokens are redacted from structured logs.

## Operational boundaries

- production uses PostgreSQL only;
- production CORS is an exact HTTPS allowlist;
- production startup fails when required auth/database configuration is invalid;
- `/health` reveals process status only;
- `/ready` reveals database reachability without connection details;
- ownership transfer is preview-first, transactional, conflict-checked, and fingerprint-verified.

# DevVault Refactor Progress

Authoritative plan: `DEVVAULT_CODEX_MASTER_SPEC.md` (provided 2026-08-06).

## Safety baseline

- Status: complete
- Git baseline: `main` at `4784301`; pre-existing Phase 1 work remains uncommitted and is being preserved.
- PostgreSQL migrations: all five committed migrations applied; Prisma schema validates and client generation succeeds.
- PostgreSQL source of truth: one user/profile (`dev-local-user`, `JJaaace`), five projects (IDs 1–5), seventeen skills (IDs 1–17), and twenty-three `SkillProject` rows.
- Integrity: no orphaned `SkillProject` rows; all stored skill percentages are zero.
- Backup: fresh PostgreSQL custom-format dump plus timestamped local-store and resume-metadata copies created in ignored `backend/.data/backups/` before schema work.
- Original local JSON checksum: `99bea99440ca69da5c1e2d96fd23f65313fdd552f11c5e882100bdfe37035531`; original file remains untouched.
- Important source-of-truth decision: PostgreSQL contains newer intentional profile edits than the original JSON snapshot, so PostgreSQL remains authoritative and the old JSON will not overwrite it.
- Baseline verification: backend module load, frontend lint, frontend production build, and `git diff --check` all pass. Existing build warning: one 737.35 kB JS chunk.

## Phase status

| Phase | Scope | Status | Notes |
| --- | --- | --- | --- |
| A | Audit and backup | Complete | Safe baseline captured; no destructive conflict found. |
| B | Schema and data migration | Complete | Seven migrations applied; all workspace domains persisted and verified. |
| C | Persistence foundations | Complete | Explicit mode and shared Prisma client retained; resume moved from filesystem authority to PostgreSQL. |
| D | Profile identity | Complete (code) | Public username is separate; guarded Clerk owner reassignment awaits the real production Clerk ID. |
| E | Remove skill percentages | Complete | Active logic/dead UI removed; guarded all-zero column migration applied after a fresh dump. |
| F | Goals backend | Complete | Eight current-user goals migrated; CRUD/reorder and UI use owner-scoped APIs. |
| G | Certifications backend | Complete | Twelve records and eleven roadmap items migrated; CRUD/assets/roadmap plus one-time local import added. |
| H | Project artwork/authority | Complete | Persisted source priority, explicit featured state, catalog-over-GitHub fallback, and protected curated fields. |
| I | Dashboard contract | Complete | One owner-scoped aggregate contains all command-deck domains. |
| J | Dashboard experience | Complete | Rebuilt as an identity-led command deck with live status, featured build, evidence, technology bench, focus queue, meaningful wins, credential spotlight, and quick access. |
| K | Public portfolio | Complete | Recruiter overview unlocks the real DevVault page components through a route-level, read-only Guest Mode; signed-out data remains server-whitelisted. |
| L | Resume sharing | Complete | Guest Mode previews the canonical uploaded PostgreSQL PDF through a GET-only public stream; replacement remains owner-only. |
| M | Inside the Vault | Complete | Concept preserved; identity, portrait, bio, interests, skills, timeline, and active goals now derive from workspace data. |
| N | GitHub hardening | Complete | Sync is now an explicit project-only boundary: linked repository metadata can refresh, while identity/workspace domains and curated project fields are unreachable from the mutation path. New repositories remain review-only import candidates. |
| O | Deployment | Complete (code) | Strict production auth/CORS/persistence/health checks and deployment guide added; external deployment not performed. |
| P | Testing | Complete | Built-in backend integration and frontend authority tests run from root. |
| Q | Performance | Complete | Route splitting reduced initial JS from 737.35 kB to about 364.84 kB with no chunk warning. |
| R | Accessibility | Complete (baseline) | Global focus-visible and reduced-motion behavior added; controls retain semantic labels. |
| S | Mobile navigation | Complete | Horizontal clipping replaced by a compact accessible menu. |
| T | State primitives | Complete | Runtime pages use API clients and the dashboard aggregate; duplicated dashboard derivations were removed. |
| U | Visibility/privacy | Complete | Profile portfolio enablement and project/skill/certification/goal visibility persist per owner. |
| V | Featured project | Complete | Partial unique index enforces at most one featured project per owner. |
| W | Status/focus | Complete | Current focus is profile-backed and goal/project focus cards derive from live records. |

## Resolved audit findings

- Goals are hardcoded in `frontend/src/pages/GoalsPage.jsx` and reset on reload.
- Certifications, pinned state, and roadmap state are browser-local in `frontend/src/pages/CertificationsPage.jsx`; the dashboard reads a separate copy/fallback.
- Dashboard data is assembled across frontend API calls, localStorage, and duplicated seed data instead of one backend contract.
- Project showcase metadata and featured selection are partly inferred from `frontend/src/lib/projectShowcaseCatalog.js` and display order.
- GitHub sync can still supply an owner avatar as project artwork and needs stricter curated-field authority.
- Inside the Vault contains extensive personal biography, interests, technology, timeline, and goals as static source constants.
- Resume PDF bytes and metadata are filesystem-local; production needs a durable storage contract or an explicit disabled-upload state.
- Production CORS is unrestricted and dev-auth detection checks the publishable key instead of requiring a valid secret-key configuration.
- No automated test suite exists; frontend build currently produces a single oversized application chunk.

## Change log

- 2026-08-06: Read the complete master specification, completed the read-only baseline audit, created recoverable backups, and initialized this progress log.
- 2026-08-06: Applied workspace foundation and guarded skill-percentage migrations; migrated goals, certifications, roadmap, and resume; completed API/UI/deployment/test/performance/accessibility phases.
- 2026-08-06: Final automated verification passed with one owner/profile, five projects, seventeen skills, twenty-three relationships, eight goals, twelve certifications, eleven roadmap items, one resume, and zero orphans.
- 2026-08-06: Historical comparison identified pre-existing GitHub overwrites on project titles/artwork for IDs 2–5. Restored only those curated fields from the checksummed snapshot through a guarded script; GitHub metadata and newer profile edits were retained.
- 2026-08-07: Completed the dedicated Dashboard product pass. Added a server-derived command-deck projection to `/api/dashboard`, rebuilt the page around the authoritative profile identity, removed low-value database activity UI, added meaningful domain wins and ranked technology evidence, and implemented responsive/reduced-motion interactions plus a lightweight moving navigation indicator. No schema or user-data mutation was required.
- 2026-08-07: Dashboard verification passed: backend contract/API tests, frontend tests, lint, production build, hard-refresh HTTP response, dynamic source checks, artwork authority checks, and percentage search. The initial application chunk remains approximately 365.52 kB; Dashboard is a separate 20.17 kB route chunk.
- 2026-08-07: Completed the focused Dashboard polish pass: accessible warm-charcoal GitHub CTA, intentional 3+2 hero actions, stronger profile-derived role hierarchy, conservative skill-confidence labels, trustworthy Recent Wins dating, refined Current Build/evidence micro-interactions, lower-weight Quick Access, GitHub-context deep links, and tighter responsive/reduced-motion behavior. No records or media authority fields were changed.
- 2026-08-07: Rebuilt the public portfolio as DevVault Guest Mode with a dedicated signed-out route tree, persistent read-only navigation, recruiter overview, deeper About/Projects/Skills/Credentials/Resume views, a whitelisted public DTO, public certificate media, production-aware canonical links, responsive/reduced-motion styling, and the authoritative Profile/Project artwork sources. Also expanded safe certification storage to arbitrary files up to 24 MB and corrected Goals orbit clipping.
- 2026-08-07: Revised Guest Mode into a two-stage product experience. `/portfolio/:username` is now the one-page recruiter overview, while `/portfolio/:username/vault/*` reuses the real Dashboard, Inside the Vault, Projects, Skills, Certifications, and Resume Workspace components under route-level read-only state. Removed the parallel Portfolio/Resume pages, added the cinematic unlock transition, reused the existing ambient particle system, restored pointer lighting and consistent motion, exposed the canonical uploaded resume through a safe GET-only public stream, and verified all existing workspace counts/checksums remained intact.
- 2026-08-07: Polished the recruiter overview without replacing its identity-led hero. Standardized the four secondary projects into an equal-height two-column card system with fixed 16:10 media, cover cropping, clamped copy, anchored actions, and responsive/reduced-motion behavior. Made `Profile.currentRole` canonical across Hero and Experience, with live education/build/learning/experience facts.
- 2026-08-07: Replaced general GitHub synchronization with an isolated project-only contract. Removed Profile writes, automatic repository imports, missing-repository archival, and the background scheduler; restricted persistence to an explicit GitHub Project metadata allowlist; added review-only import candidates, failure-safe omission handling, clear authenticated UI copy, and boundary regression tests. A live five-repository sync completed with all protected domain hashes and record counts unchanged.
- 2026-08-08: Completed the first-deployment readiness audit without deploying externally. Added Vercel SPA rewrites, production build-time frontend environment checks, reproducible Prisma generate/migrate scripts, Node runtime declarations, protected the placeholder users endpoint, removed the read-time Project owner upsert, and updated Prisma/React Router plus transitive dependencies to zero known npm audit findings.
- 2026-08-08: Fixed the profile-picture reset at its source. Editable Profile UI now waits for canonical PostgreSQL data, ordinary profile saves omit the image field, only the dedicated image endpoint can replace/remove it, the stale Inside-the-Vault localStorage migration was removed, Dashboard/public delivery were fingerprint-verified, and the original portrait was recovered from the untouched local JSON backup with SHA-256 `89931d59932ed348b963017e78468f5b27cd990f82857858d16661ad5328d566`.
- 2026-08-08: Proved all seven migrations initialize a fresh database and validated a data-only dump/restore in an isolated temporary database with 1 user, 1 profile, 5 projects, 17 skills, 23 relationships, 8 goals, 10 current certifications, 11 roadmap items, 1 resume, and the canonical profile-image checksum intact. No production service was created and no production data was migrated.
- 2026-08-08: Began the final production deployment engineering pass. Centralized frontend/backend production environment validation; added safe database preflight/integrity/archive tooling, preview-first transactional ownership handoff, structured redacted logging, process/readiness separation, graceful shutdown, GitHub timeouts, request hardening, public/owner security regression tests, production smoke/preflight commands, SEO/error/deep-link safeguards, and provider-agnostic deployment/rollback/backup/security runbooks.
- 2026-08-08: Optimized canonical profile-image delivery without changing stored media. Owner Profile and Dashboard JSON now use a versioned authenticated image stream instead of repeating the multi-megabyte data URL; public delivery remains visibility-checked and byte-identical.
- 2026-08-08: Completed the final production engineering verification. The unified preflight passed frontend lint/tests, all backend and focused security boundaries, Prisma generation/validation/migration status, database integrity, repository/secret policy, patch validation, and a production frontend build. A separate built-app smoke test passed all 19 public routes, DTO/media/resume checks, and mutation-denial checks; runtime dependency audits reported zero known vulnerabilities. No provider was created, no Git push occurred, and no workspace records were modified.
- 2026-08-09: Replaced the two historical Goals portfolio fallbacks with a username route template and added render-time resolution through the canonical Profile API username. Existing goal records and curated content remain unchanged; documentation smoke examples now use a username placeholder. Targeted route tests, frontend lint, and the complete production preflight pass.
- 2026-08-09: Fixed the Skills mutation synchronization boundary. The Skills page now applies the confirmed PUT response directly instead of refetching a cacheable stale list, owner/public Skill JSON is non-cacheable, and the in-memory public portfolio cache is invalidated after Skill mutations. Added an additive persisted `Skill.favorite` source of truth, centralized experience-level labels across owner/public/resume views, preserved unchanged `SkillProject` rows during edits, and removed the duplicated Inside-the-Vault technology fallback. A verified pre-migration backup has SHA-256 `23e236cdfac31fe74f218281c726b510a5511d3da2c3f8de5490915f231b6f25`. Java and Python updates were exercised through owner Skills, reload, Dashboard, recruiter, and Guest projections, then restored exactly. All 17 skills and 23 relationships remain intact; the full production preflight passes with eight migrations applied.
- 2026-08-09: Fixed the authenticated Skills-page regression introduced by the synchronization pass. The owner route no longer dereferences the absent Guest Mode portfolio while evaluating favorite-skill memo dependencies; a shared guarded source normalizes missing public/profile/skill/project fields without mutating data. Added a focused null-context regression test. Frontend lint, the complete production preflight, database integrity checks, live public DTO checks, and headless-browser Dashboard/Guest Skills renders pass with 17 skills, 23 relationships, and zero integrity issues.

## Remaining external/manual items

- Supply production Clerk, database, CORS, frontend URL, and preferably GitHub token values in the deployment platform; no real `.env` file was changed.
- After identifying the real Clerk production user ID, back up and run the documented guarded ownership reassignment. The current owner intentionally remains `dev-local-user`.
- Perform a final browser/device visual QA against the chosen production hosts. Automated lint, tests, build, API, data-integrity, privacy projection, and asset checksum checks pass locally.
- Create the external PostgreSQL/backend/frontend services, supply production Clerk credentials and exact origins, transfer the verified local PostgreSQL data archive into the empty hosted database, then perform the guarded `dev-local-user` ownership handoff after the real Clerk production user ID is known.

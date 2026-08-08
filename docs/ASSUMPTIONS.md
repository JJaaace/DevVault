# DevVault Assumptions

## Phase 0
- Existing endpoint paths remain unchanged; only response shape is standardized.
- Legacy consumers may still receive plain payloads from older endpoints, so the API client supports both envelope and non-envelope responses.
- Retry behavior is limited to safe transient failures and can be overridden per request.
- New ui primitives are introduced incrementally to avoid large regressions from broad component rewrites.

## Phase 1
- Dashboard intelligence is authoritative through one backend aggregate contract.
- Insight ordering must remain deterministic for a given workspace state.
- Endpoint computes per-request from current profile/projects/skills for correctness over caching.

## Premium Portfolio Redesign
- Skill percentages are deprecated for portfolio display; manual experience fields are the source of truth.
- Technology icon data is centralized in frontend/src/lib/technologyCatalog.js for manual updates without UI rewrites.
- Project ordering is user-controlled through displayOrder and can be adjusted via form input or move controls.

## 2026-08-06 Master Refactor
- PostgreSQL is the workspace source of truth; local JSON is explicit development-only compatibility storage.
- `SkillProject` is authoritative for skill/project relationships and `projectsBuilt` remains derived.
- Public portfolio inclusion is opt-in/out through persisted visibility fields; owner IDs and private notes are not included in public projections.
- The migrated development owner remains `dev-local-user` until a real Clerk ID is supplied and explicitly reassigned with the guarded ownership script.
- Historical goal/certification constants remain only as one-time migration snapshots; runtime pages load PostgreSQL APIs.

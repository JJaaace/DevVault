# DevVault Assumptions

## Phase 0
- Existing endpoint paths remain unchanged; only response shape is standardized.
- Legacy consumers may still receive plain payloads from older endpoints, so the API client supports both envelope and non-envelope responses.
- Retry behavior is limited to safe transient failures and can be overridden per request.
- New ui primitives are introduced incrementally to avoid large regressions from broad component rewrites.

## Phase 1
- Dashboard intelligence is additive and does not replace local dashboard utilities yet.
- Insight ordering must remain deterministic for a given workspace state.
- Endpoint computes per-request from current profile/projects/skills for correctness over caching.

## Premium Portfolio Redesign
- Skill percentages are deprecated for portfolio display; manual experience fields are the source of truth.
- Technology icon data is centralized in frontend/src/lib/technologyCatalog.js for manual updates without UI rewrites.
- Project ordering is user-controlled through displayOrder and can be adjusted via form input or move controls.

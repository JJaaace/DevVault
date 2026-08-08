# DevVault Build Log

## 2026-08-01 - Phase 0 Foundation
- Added backend HTTP response helpers with consistent success/error envelope.
- Added centralized request logger and global error/not-found middleware.
- Refactored profile/projects/skills/github-sync controllers to return envelope responses.
- Added resilient frontend API client behavior: timeout, retry, and envelope unwrapping.
- Added frontend shared UI foundation under components/ui and async hooks.

## 2026-08-01 - Phase 1 Dashboard Intelligence
- Added backend dashboard aggregate endpoint at /api/dashboard.
- Implemented deterministic insight generation service for profile, projects, and skills.
- Integrated dashboard page with server-provided insight cards while preserving existing local derivations.

## 2026-08-01 - Premium Portfolio Redesign
- Replaced percentage-driven skill UI with manual experience metadata (years, first-used year, projects built, level, tech icon key).
- Added project showcase improvements (display order, key feature list, accent tone) and reorder controls in the projects workspace.
- Redesigned project and skill cards with premium dark glassmorphism, animated hover states, and stronger recruiter-facing presentation.
- Introduced DevVault brand identity assets: new logo component, favicon, and cinematic opening intro animation.

## 2026-08-06 - Master Data and Production Refactor
- Added owner-scoped PostgreSQL models and APIs for goals, certifications, certification roadmap items, visibility controls, featured projects, artwork authority, and durable resume PDFs.
- Migrated the current user’s eight goals, twelve certifications, eleven roadmap entries, and uploaded resume without changing existing project, skill, or relationship IDs.
- Replaced dashboard/localStorage data assembly with a single `/api/dashboard` contract and added one-time browser certification import.
- Hardened public portfolio projections, GitHub curated-field authority, production Clerk/CORS checks, and database-aware health reporting.
- Removed the obsolete all-zero skill percentage column through a guarded standalone migration after backup.
- Added backend integration tests, frontend artwork-authority tests, route-level code splitting, reduced-motion support, explicit focus styles, and compact mobile navigation.

## 2026-08-07 - Dashboard Command Deck Redesign
- Rebuilt the Dashboard around a prominent, backend-driven identity hero and live status rail.
- Added the image-led featured build, compact evidence strip, ranked technology bench, focus queue, real milestone wins, credential spotlight, and quick-access navigation.
- Extended `/api/dashboard` with deterministic command-deck selections and rankings while retaining the existing workspace aggregate as the single browser data source.
- Replaced the database-change activity feed and repetitive overview cards; no proficiency percentages or fabricated analytics were introduced.
- Added subtle cursor light, cohesive load/scroll reveals, project/technology linkage, animated navigation state, responsive layouts, and explicit reduced-motion behavior.

## 2026-08-07 - Dashboard Final Polish
- Corrected GitHub CTA contrast and composed hero actions into a deliberate three-plus-two layout.
- Promoted the strongest engineering identity from saved Profile data and mapped skill confidence conservatively without changing Skill records.
- Removed untrustworthy project/goal completion-date inference from Recent Wins; only explicit certification issue dates are displayed.
- Refined Current Build, evidence, technology, and navigation micro-interactions while reducing Quick Access visual weight.
- Confirmed no canonical DevVault screenshot is currently stored; retained artwork authority and visually suppressed fallback-only decorative bars without replacing project media.

## 2026-08-07 - Recruiter Project Showcase and Project-Only GitHub Sync
- Preserved the recruiter overview hero and DevVault feature while rebuilding secondary projects as equal-height cards with fixed 16:10 cover media, clamped descriptions, anchored actions, and responsive/reduced-motion behavior.
- Made the persisted `currentRole` the primary recruiter role and replaced vague Experience placeholders with canonical education, current build, current learning, and years-coding facts when present.
- Restricted GitHub synchronization to linked Project repository metadata only. Removed Profile mutation, Skill interaction, automatic project creation, missing-repository archival, and automatic background synchronization.
- Added review-only repository import candidates, omission-safe metadata updates, stable repository-ID matching, renamed-repository handling, and explicit project-only UI language.
- Added GitHub boundary and Guest write regression coverage; live synchronization verified all five linked projects while Profile, Skills, SkillProject, Goals, Certifications, roadmap, Resume, and curated Project fields remained byte-for-byte equivalent under deterministic snapshots.

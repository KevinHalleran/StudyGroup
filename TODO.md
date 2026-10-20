# TODO

Running next-steps list. Updated after every step. Detail and task IDs: [docs/backlog/](./docs/backlog/README.md). Design: [DESIGN.md](./DESIGN.md). Operations: [docs/MAINTENANCE.md](./docs/MAINTENANCE.md).

_Last updated: 2026-10-20 (shared class-summary and lesson-plan content schema documented)._

**Current focus: get US-1.0 Instructor Roster Import into instructors' hands.** Full plan: [US-1.0 task list](./docs/backlog/US-1.0-roster-import.md) (28 tasks, 5 phases).

## 1. Kevin do now

- [ ] **US-1.0-T01 / US-0.1-T05** Push the first commit (US-0.1 "Site exists"). Committed locally behind the passing pre-commit gate; confirm CI goes green on GitHub.
- [ ] **US-1.0-T04** Run the Azure bootstrap (one time, Azure Cloud Shell, signed in to tenant `a3fecc25-069d-4fe7-9fa3-0e3242862105`): `./bootstrap.ps1 -SubscriptionId 8d3497a3-8e81-4bd9-b752-0fd23bb731a5`. Defaults create a **new** resource group `rg-kobudo-prod` in `eastus2` (decided: not the shared `burinkansupport`), then the GitHub OIDC identity (Contributor on that group only), and set repo variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP` (add by hand if `gh` is unavailable). Cloud Shell cannot see this repo: paste `infra/bootstrap/bootstrap.ps1` into it or clone the repo there. You need rights to create app registrations and to assign roles on the subscription (Owner or User Access Administrator).
- [ ] **US-1.0-T05** Run the "Infrastructure" workflow from the GitHub Actions tab.
- [ ] **US-1.0-T07** Decide the first-administrator approach (proposal: instructor emails in a Bicep parameter, no portal step) and send me the instructor email addresses to seed.
- [ ] **US-3.3-T01 / T16** Review my lexicon fixes in `curriculum/lexicon.md` (answers applied) and confirm:
  - Typos: "Recieving" → Receiving; "Categopries" → Categories; "Sakagaua" → Sakagawa; Tzuki → Tsuki (matches `transcript-corrections.json`).
  - Bo 3, 4, 15: added missing commas; Bo 4 English "mid-level" → "low-level" (Gedan).
  - Tonfa 8: removed the duplicate Gedan Harai (and its English); I also replaced the stray 3rd "Gedan Harai" with **Kote Uchi** to match the English "arm strike", **please verify**.
  - Added Notes: kumite naming (creator + pairing), Nunti (Year 4, bo parallel), Nunchaku (kata, no kihon), Warm-up/History categories.
  - **Decide spelling conflicts**: Sakagawa (you) vs Sakugawa (corrections map); Gakia (lexicon.md) vs Gakiya (map); Gorenda vs Go-ren-da; Nunchaku no Kun vs no Kata.
  - Optional: one real transcript sample with names removed.
- [ ] **US-1.0-T13** Confirm the Excel handling limits (proposal: `.xlsx` only, max 1 MB, max 500 rows).

## 2. Next most important thing to do together

1. **US-1.0-T07** Decide the first-administrator approach, then start Phase B (roles function and admin-only routes, T08 to T12).
2. **US-1.0-T06** First deploy and health check once Kevin finishes T04/T05.
3. Then Phase C: import backend (T13 to T19), test-first.

## 3. Roadmap

- US-1.0 phases B to E: sign-in and roles, import backend, import UI, release to instructors (see task list).
- US-1.1 Instructor edits a user's max class (reuses the Students repository from T16).
- Identities linking for GitHub sign-in (D12).
- Session blob JSON schema, roster snapshots, curriculum catalog.
- Zoom join link on check-in/registration (US-2.3, D13).
- AI service choice, Bicep provisioning, lesson-plan generation gated by the floor ordinal (D17). **Reviewed**: see [US-3.3 plan](./docs/backlog/US-3.3-transcripts-and-lesson-plans.md) (13 tasks, decisions D18-D24 awaiting Kevin).
- Annual archive/expiry prompt as a scheduled GitHub Action plus admin-only API (D16).
- Azure budget/cost alert in Bicep.
- Clear the 6 moderate dev-only audit advisories in the Azurite tree when fixes are available.

## Done (recent)

- Repo, workspaces, Vitest, Azurite scripts, pushed to GitHub (`8ebec3e`).
- Design decisions D1-D17 in DESIGN.md.
- Bicep IaC, infra and app workflows (OIDC), health endpoint with storage check, maintenance guide (uncommitted).
- Unit tests (`npm run test:unit`) and local e2e (`npm run test:e2e`), both in CI (uncommitted).
- Backlog structure and US-1.0 task breakdown.
- US-0.1 Site exists: local e2e proves / and /api/health return 200.
- Pre-commit gate (npm run verify) enforced by .githooks; max-class implemented, rank stub removed; unit suite 27/27 green.
- Shared structured content schema for class summaries and lesson plans documented in `curriculum/lesson-content.schema.json` and DESIGN.md.

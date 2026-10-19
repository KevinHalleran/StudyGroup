# TODO

Running next-steps list. Updated after every step. Detail and task IDs: [docs/backlog/](./docs/backlog/README.md). Design: [DESIGN.md](./DESIGN.md). Operations: [docs/MAINTENANCE.md](./docs/MAINTENANCE.md).

_Last updated: 2026-10-19 (after US-0.1 site-exists, pre-commit gate, max-class implemented)._

**Current focus: get US-1.0 Instructor Roster Import into instructors' hands.** Full plan: [US-1.0 task list](./docs/backlog/US-1.0-roster-import.md) (28 tasks, 5 phases).

## 1. Kevin do now

- [ ] **US-1.0-T01 / US-0.1-T05** Push the first commit (US-0.1 "Site exists"). Committed locally behind the passing pre-commit gate; confirm CI goes green on GitHub.
- [ ] **US-1.0-T04** Run the Azure bootstrap (one time, Azure Cloud Shell): `infra/bootstrap/bootstrap.ps1 -SubscriptionId <id>`. It creates the resource group and GitHub OIDC identity and sets repo variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP` (add by hand if `gh` is unavailable).
- [ ] **US-1.0-T05** Run the "Infrastructure" workflow from the GitHub Actions tab.
- [ ] **US-1.0-T07** Decide the first-administrator approach (proposal: instructor emails in a Bicep parameter, no portal step) and send me the instructor email addresses to seed.
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
- AI service choice, Bicep provisioning, lesson-plan generation gated by the floor ordinal (D17).
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

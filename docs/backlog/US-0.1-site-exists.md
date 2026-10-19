# US-0.1: Site Exists

**Story:** As a visitor, I want to navigate to the site and get a working page, so that we know the platform is up.
**Acceptance:** `GET /` returns 200 with the app shell; `GET /api/health` returns 200 with storage reachable.
**Purpose:** first end-to-end slice and the first commit under the "no commit without a passing local check" rule.

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-------|--------|-----------|-----------|
| US-0.1-T01 | Health endpoint with storage check (unit tested) | C | done | | `health` and `storage-health` unit tests green |
| US-0.1-T02 | Local e2e: `/` and `/api/health` return 200 against Azurite + Functions + Vite | C | done | T01 | `npm run test:e2e` green |
| US-0.1-T03 | Pre-commit hook runs unit tests, build and e2e (`npm run verify`) | C | done | T02 | A commit with a failing test is rejected |
| US-0.1-T04 | Post-deploy health check against the deployed site | C | done | T01 | `scripts/health-check.sh` in the deploy workflow |
| US-0.1-T05 | Commit and push; CI green | B | doing | T03 | CI unit and e2e jobs pass on `main` |
| US-0.1-T06 | Deployed site returns 200 in Azure | B | todo | US-1.0-T04, T05 | Deploy workflow health check green (see US-1.0 Phase A) |

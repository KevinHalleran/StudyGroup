# US-1.0: Instructor Roster Import

**Story:** As an Instructor, I want to upload my Excel roster (Student Name, Email Address, Max Class Attended) so attendees and their content gates are loaded without retyping.
**Acceptance:** rows validated (email present and unique, max class valid); valid rows upserted by email (idempotent); per-row results so failures can be fixed and retried.
**Design:** [DESIGN.md](../../DESIGN.md) D2-D8, D11, D12, D14, section 3.1 / 3.4.
**Goal:** instructors can sign in, upload the roster, see per-row results, and re-import safely, in production.

Legend: Owner `K` = Kevin, `C` = Copilot, `B` = both. Status `todo | doing | done | blocked`.

## Phase A: Foundations (unblocks everything)

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-------|--------|-----------|-----------|
| US-1.0-T01 | Commit and push the current work so CI runs | K | doing | | `main` on GitHub contains the infra, workflows and docs; CI result visible |
| US-1.0-T02 | Implement `max-class.ts` (parse, ordinal, floor) | C | done | | 20 max-class unit tests green |
| US-1.0-T03 | Remove the obsolete rank-management stub and tests (D10) | C | done | T02 | `npm run test:unit` fully green |
| US-1.0-T04 | Run `infra/bootstrap/bootstrap.ps1` and set repo variables | K | todo | T01 | `AZURE_*` variables set; OIDC login works in a workflow |
| US-1.0-T05 | Run the Infrastructure workflow | K | todo | T04 | Resource group contains the SWA, storage, Log Analytics and App Insights |
| US-1.0-T06 | First app deploy and post-deploy health check | B | todo | T03, T05 | Deploy workflow green; `https://<host>/api/health` returns 200 with storage ok |

## Phase B: Sign-in and administrator access (import is admin-only)

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-----------|--------|-----------|-----------|
| US-1.0-T07 | Decide how the first administrator is identified (proposal: Bicep parameter `bootstrapAdminEmails` exposed as an app setting, so no manual portal step) | B | todo | | Decision recorded in DESIGN.md |
| US-1.0-T08 | Add `bootstrapAdminEmails` to Bicep and `main.bicepparam` (instructor emails) | C | todo | T07 | `bicep build` clean; setting appears after infra deploy |
| US-1.0-T09 | Roles function (`rolesSource`): look up the signed-in email in `Students` or bootstrap list, return `administrator`, `moderator` or `student` (D11); unit tests first | C | todo | T02, T07 | Unit tests green; unknown users get no roles |
| US-1.0-T10 | Wire `rolesSource` and role-protected routes in `staticwebapp.config.json` | C | todo | T09 | Config test or e2e proves `/api/admin/*` rejects unauthenticated and non-admin calls |
| US-1.0-T11 | Local auth emulation for e2e (SWA CLI or request-header test helper for `x-ms-client-principal`) | C | todo | T10 | E2E can call admin routes as admin and as student |
| US-1.0-T12 | Frontend sign-in/out and a role-aware shell (Microsoft sign-in; GitHub shown but linking deferred, D12) | C | todo | T10 | Component tests green; signed-out users see only a login button |

## Phase C: Import backend (TDD, pure logic first)

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-----------|--------|-----------|-----------|
| US-1.0-T13 | Decide the xlsx library and file limits (proposal: `exceljs`, max 1 MB, max 500 rows, `.xlsx` only) | B | todo | | Decision recorded in DESIGN.md |
| US-1.0-T14 | Row validator: header detection (tolerant of case/spacing/column order), trimmed lowercase email, email format, duplicate emails in file, `parseMaxClass`; per-row outcome | C | todo | T02 | Unit tests green incl. blank rows, duplicates, bad class, extra columns |
| US-1.0-T15 | Workbook reader: bytes to rows, rejects non-xlsx, empty sheet, missing columns, oversize | C | todo | T13, T14 | Unit tests with small in-memory workbooks |
| US-1.0-T16 | `Students` repository: idempotent upsert by email (`upsertEntity` replace), batched, per-row success or failure, no partial-failure aborts; table created if missing; unit tests with a fake client | C | todo | T14 | Unit tests green; re-import yields identical data |
| US-1.0-T17 | Import orchestration: validate, upsert valid rows, return `{ imported, updated, failed, rows[] }`; failed rows can be re-submitted alone; operation recorded in `Operations` for step-level tracking and retry | C | todo | T15, T16 | Unit tests green for mixed valid/invalid files |
| US-1.0-T18 | `POST /api/admin/roster/import` Function (admin-only, binary body, 5 s target, clear error codes) | C | todo | T10, T17 | E2E uploads a fixture xlsx via Azurite and reads rows back |
| US-1.0-T19 | `GET /api/admin/students` (list for review and later US-1.1) | C | todo | T16 | E2E lists imported students |

## Phase D: Import UI

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-----------|--------|-----------|-----------|
| US-1.0-T20 | Import page: file picker, spinner during upload, client-side size/type check | C | todo | T12, T18 | Component tests green |
| US-1.0-T21 | Results view: per-row table (row number, email, outcome, reason), counts, filter to failures, download failed rows for fixing | C | todo | T20 | Component tests green |
| US-1.0-T22 | Students list page (read-only) so the instructor can confirm the load | C | todo | T19, T12 | Component tests green |
| US-1.0-T23 | Accessibility and mobile pass (keyboard, labels, readable on phone) | C | todo | T21 | Checklist in this file ticked |

## Phase E: Release to instructors

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-----------|--------|-----------|-----------|
| US-1.0-T24 | E2E happy path and bad-file path wired into CI | C | todo | T18, T21 | CI e2e job green |
| US-1.0-T25 | Redeploy with instructor emails in `bootstrapAdminEmails`; sign in as an instructor in production | K | todo | T08, T06, T12 | Instructor sees the import page; a non-listed account does not |
| US-1.0-T26 | Dry run: instructor uploads the real Excel roster, spot-checks rows, re-uploads to prove idempotency | B | todo | T25, T22 | Counts match the spreadsheet; second import changes nothing |
| US-1.0-T27 | Short instructor guide (what columns, how to fix failed rows, who to ask) in `docs/` | C | todo | T21 | Guide published; linked from readme |
| US-1.0-T28 | Update DESIGN.md as-built, MAINTENANCE.md, User Stories status; mark US-1.0 done | C | todo | T26 | Docs match what is deployed |

## Notes and risks

- **Privacy:** the roster holds names and emails. Store only in Table Storage, never log row contents (log counts and row numbers); the annual archive prompt (D16) will cover retention.
- **GitHub sign-in:** a GitHub account has no email until linked (D12). For the first release instructors should sign in with Microsoft; linking is a later story.
- **Fastest path to instructors:** T01 to T06, T07 to T12, T13 to T19, T20 to T22, then T24 to T26. T23 and T27 can run in parallel with the end.

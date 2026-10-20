# Sessions, Registration and Zoom (proposed)

**Stories:** US-2.1 Session Creation (updated), US-2.3 Automated Zoom Meeting Provisioning (rewritten), US-2.4 Session Registration and Zoom Link Delivery (new). Text and acceptance criteria: [User Stories.md](../../User%20Stories.md).
**Design:** DESIGN.md D30-D35 and section 3.6. Supersedes D13.
**Goal:** a moderator creates a session and the Zoom meeting is created for it; a registered student receives the join link in the app and by email.

Legend: Owner `K` = Kevin, `C` = Copilot, `B` = both.

## Decisions taken (Kevin, 2026-10-20)

- Zoom is stubbed for now; the instructor will supply API credentials later (D30).
- One shared host account owns every meeting (D31).
- The link is delivered in the app and by email (D34).

## Tasks (proposed order; all depend on US-1.0 Phase A and the D11 roles function for moderator/student checks)

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-------|--------|-----------|-----------|
| US-2-T01 | Instructor creates a Zoom Server-to-Server OAuth app on the shared host account and gives us the account ID, client ID, secret and host user ID (via GitHub secret, never in chat or the repo) | K | todo (later) | | Credentials stored as a GitHub secret; real client can be switched on |
| US-2-T02 | Confirm the Zoom plan allows class-length meetings (free meetings with 3+ people end at 40 minutes) | K | todo (later) | | Plan confirmed |
| US-2-T03 | `ZoomClient` interface and **stub client** (deterministic fake meeting ID, join URL, passcode, no network); unit tests | C | todo | | Unit tests green |
| US-2-T04 | Session schema (blob, incl. `zoom`, `startUtc`, `timeZone`), validator and repository; unit tests with a fake blob client | C | todo | US-1.0 Phase A | Unit tests green |
| US-2-T05 | `POST /api/sessions` (moderator): save session, create meeting via `ZoomClient`, idempotent (existing `meetingId` means no second meeting), Zoom failure leaves `pending`; tests first | C | todo | T03, T04, US-1.0-T08 | Unit and e2e tests green |
| US-2-T06 | Moderator retry endpoint and edit/cancel handling (update or delete the meeting) | C | todo | T05 | Unit tests green incl. repeated retry makes one meeting |
| US-2-T07 | `Registrations` repository (Table): idempotent upsert, list by session; fake-client unit tests | C | todo | T04 | Unit tests green |
| US-2-T08 | `POST /api/sessions/{id}/register`: approved student only; returns join URL and passcode when `created`, "link pending" otherwise; never returns the link to non-registered callers | C | todo | T05, T07 | Unit and e2e tests green |
| US-2-T09 | Frontend: session list, moderator create form, register button, registered-session view with Zoom link; spinner for waits up to 5 s; "link pending" state | C | todo | T05, T08 | Component tests green |
| US-2-T10 | Choose the email sender (proposed Azure Communication Services Email) and sending domain | B | todo | | Decision recorded in DESIGN.md |
| US-2-T11 | Email step: send the join link, idempotent per (session, student), status stored on the registration; sends later for registrations made while the link was pending; fake sender in tests | C | todo | T08, T10 | Unit tests: one email per registration, failure retried, none to unregistered students |
| US-2-T12 | Retry worker: queue-triggered meeting creation retries and email sending in the shared worker Function App (D19); poison-queue handling. First version: inline single retry plus moderator retry button | C | todo | T05, T11, US-3.3-T06 | E2E with fake Zoom and fake sender green |
| US-2-T13 | Real `ZoomClient`: token cache, timeout, retry, passcode and waiting room; selected only when Zoom settings exist; mocked-fetch unit tests | C | todo | T01, T03 | Unit tests green; manual check with real credentials |
| US-2-T14 | Bicep: Zoom settings (Key Vault references or secure params), email service, queue; no portal changes (D15, D35) | C | todo | T10 | `bicep build` clean; what-if clean |
| US-2-T15 | Annual archive prompt also removes Zoom meeting references and registrations (D16); docs: DESIGN.md as-built and MAINTENANCE.md | C | todo | T12 | Docs match what is deployed |

## Open questions

- Email sender and domain (T10).
- Whether students may un-register and whether the Zoom meeting passcode should be rotated if a link leaks.
- Session recurrence (weekly classes) is not covered; each session is created individually for now.

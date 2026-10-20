# Matayoshi Kobudo Study Group Platform - Design and As-Built (Authoritative)

This is the **authoritative design and as-built record**. If another document disagrees with this one, this one wins; update the other document. Update this file in the same commit as any change to code, data model, pipeline, or decisions.

Related documents (summaries and background): [readme.md](./readme.md), [Architectue Overview.md](<./Architectue Overview.md>), [User Stories.md](<./User Stories.md>), [security architecture.md](<./security architecture.md>), [non-functional requirements.md](<./non-functional requirements.md>).

---

## 1. Decision Log

| # | Decision | Status |
|---|----------|--------|
| D1 | Pure Azure serverless: Vue (Vite) on Static Web Apps Free, Node.js 22 Azure Functions v4 (TypeScript), Table Storage, Blob Storage, AI endpoint for plans. | Decided |
| D2 | Least-cost data strategy: **Table Storage** for the student roster, **Blob Storage** for session JSON. No Cosmos DB or SQL. | Decided |
| D3 | The instructor's Excel roster has columns `Student Name`, `Email Address`, `Max Class Attended`. | Decided |
| D4 | Email (trimmed, lowercased) is the unique student key and the link to the authentication identity. | Decided |
| D5 | `Max Class Attended` is the **content gate**. The AI lesson plan includes content up to and including the class of the least experienced attendee. | Decided |
| D6 | `Max Class Attended` uses the format `Year N, Class M`. A year has at most **52** classes (shorter, e.g. 26-class, courses are valid subsets). Class 1 is the lowest floor. | Decided |
| D7 | The gate is a numeric ordinal: `ordinal = (year - 1) * 52 + class`. | Decided |
| D8 | The floor is computed **server-side only** as the minimum ordinal of the attendees present. An empty roster is an error, never a default floor. | Decided |
| D9 | AI content is aligned to class number and year, matching session titles such as `Matayoshi Kobudo - 20251213 - Weekly Class 16 of 52`. | Decided |
| D10 | The generic "rank" concept is replaced by "max class attended". | Decided |
| D11 | Roles (`student`, `moderator`, `administrator`) are read from the `Students` table by a SWA `rolesSource` function (available on Free), enforced at the route layer and re-checked server-side; no row means no access. | Decided (not yet implemented) |
| D12 | Free-tier SWA offers only Microsoft Entra ID and GitHub sign-in. GitHub returns a username, not an email, so an `Identities` table maps `provider:userId` to a student email via an instructor-approved link (pending, then approved). | Decided (not yet implemented) |
| D14 | Hosting: SWA **Free** with **managed Functions**; no separate Function App. Google/Facebook sign-in is dropped (needs Standard, ~$9/mo). | Decided |
| D15 | All Azure resources are Bicep in `infra/`, changed only via GitHub Actions authenticated with OIDC (no stored secrets). The service principal has Contributor on one resource group only. | Decided |
| D16 | Managed Functions are HTTP-only, so the annual archive/expiry prompt is a scheduled GitHub Action calling an admin-only API. | Decided (not yet built) |
| D17 | AI service: **Azure OpenAI** (pay per use), with tight, efficient token use as a design goal (see D25-D28). Deployment, model and monthly cost cap still to be set. | **Decided** (service); model/cap open |
| D25 | Summarize each transcript **once**, with a small low-cost model: preprocess to strip timestamps, speaker labels and filler, put the fixed instructions first (prompt-cache friendly), and extract **structured tags** (D29) with a hard `max_tokens`. A one-line free-text note is optional and capped (~25 words). | **Proposed** |
| D26 | Plan input is compact: one line per class from the structured tags (`ordinal|weapon:activity:item,...`). Because tags are tiny, all classes up to the floor fit in a small prompt; no need to drop old classes. | **Proposed** |
| D27 | Generated plans are cached by `(floor ordinal, plan template version)`; the same floor never calls the AI twice. | **Proposed** |
| D28 | Token use is metered per call (counts only, no text) in the `Operations` table. Budget: **US$5 per month** hard cap (app stops AI calls when reached) with an Azure cost alert at 50% and 100% in Bicep. Estimated real use is under US$0.50 per month (see the US-3.3 backlog file). | **Decided** (Kevin: US$5 cap) |
| D29 | **Curriculum vocabulary** (`curriculum/vocabulary.json`, versioned, instructor-owned, expected to be refined year over year). Weapons: Bo, Sai, Tonfa, Nunchaku (more later). Each weapon has **kata**; Bo, Sai and Tonfa have formal **kihon sets** (Bo 15, Sai 10, Tonfa 10); Nunchaku has no formal kihon set. **Kumite** are two-weapon pairings (bo-bo, bo-sai, bo-tonfa for now) with named kumite. Per class the AI extracts items from this vocabulary only (unknown items are flagged for review, never invented). Each item has `coverage`: `explicit` (taught or named; the first lessons for a weapon are normally explicit kihon instruction), `implicit` (practiced while working kata, kumite or another weapon), and an optional instructor **`focus`** flag for call-outs for additional study or refinement. Shape: `{ weapons: [ { weapon, activities: [ { activity: "kihon\|kata\|kumite", items: [ { item, coverage: "explicit\|implicit", focus?: true, note? } ] } ] } ] }` (kumite uses the pairing as `weapon`, e.g. `bo-sai`). A lesson plan uses the same shape plus timing; it uses the gated history (explicit coverage up to the floor) to choose kihon review, and gives `focus` items from earlier classes extra weight. Start coarse (names and set numbers), refine later. | **Proposed** (source: `curriculum/lexicon.md`, received; clarifications open in US-3.3 T16) |
| D18 | The class **year** is derived from the class date using the versioned **course calendar** `curriculum/calendar.json` (date of Class 1 of each year: Year 1 2023-01-21, Year 2 2024-06-22, Year 3 2025-07-26; all Saturdays). A single anchor is not enough because classes are not weekly (e.g. 2025-12-13 is 20 weeks into Year 3 but is Class 16). The year is the latest calendar entry on or before the class date; a transcript whose class number contradicts the calendar (e.g. above the year's possible range, or before Class 1 of its year) is rejected for review. Class numbers may be zero-padded (`Class 01`). | **Decided** (data from Kevin) |
| D19 | Background work (transcript summarization) runs in a small separate **worker Function App** (consumption, queue trigger); SWA managed Functions stay HTTP-only. Blob triggers do not run on managed Functions. | **Decided** (Kevin) |
| D20 | A failed summarization is stored as `failed`/`pending` and retried; placeholder summaries are never written to the index. | **Proposed** |
| D21 | Long transcripts are chunked and summarized in stages (or use a long-context model); no silent truncation. | **Proposed** |
| D22 | Class summaries live in a Table Storage `ClassSummaries` table, one row per class (zero-padded ordinal), not one shared JSON blob. | **Proposed** |
| D23 | Transcripts are private, covered by the annual archive prompt (D16); logs never contain transcript text. Azure OpenAI data-handling terms to be confirmed. | **Proposed** |
| D24 | Lesson plans and class summaries use one **structured, controlled-vocabulary** shape: `weapon -> activity (kihon, kata, kumite) -> items`, instead of free text (see D29). | **Proposed** |
| D13 | Zoom join link delivery: resolved by D30-D35 (see section 3.6). | **Superseded** |
| D30 | Zoom integration uses a **Server-to-Server OAuth** app (JWT apps are retired) behind a thin `ZoomClient` interface. Until the instructor supplies credentials, a **stub client** (deterministic fake meeting ID and join URL, no network) is the default; the real client is selected only when Zoom settings are present. | **Decided** (Kevin: stub for now) |
| D31 | **One shared host account** (the instructor's Zoom account) owns every meeting. The moderator who schedules a session is not the Zoom host. | **Decided** (Kevin) |
| D32 | Session creation never fails because Zoom is down: the session is saved with `zoom.status = pending`, the meeting is created in a retryable step, and success sets `created`, exhausted retries set `failed` (moderator can retry). Idempotency: if the session already holds a `meetingId`, no new meeting is created. | **Proposed** |
| D33 | Registration is a distinct step from check-in (US-2.4 vs US-2.2). Registrations are one row per student per session in a `Registrations` table. Only a registered, approved student receives the join URL and passcode; it is never placed in public listings, logs or the session list. | **Proposed** |
| D34 | The join link is delivered **both** in the app (registration response and registered-session view) and by **email**. Email uses an Azure-based sender, proposed **Azure Communication Services Email** (pay per use, provisioned in Bicep). Email is sent from a queued, idempotent step so a failure never loses the registration, and the app view is always available as the fallback. The sender and domain are not yet chosen. | **Proposed** (email service open) |
| D35 | Zoom credentials (`ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, host user ID) are the first stored secrets. Held as Key Vault references or secure Bicep parameters supplied from a GitHub secret; never in the repo. Meetings use a passcode and a waiting room. Session times are stored in UTC with the IANA time zone name. Old meeting references are covered by the annual archive prompt (D16). | **Proposed** |

---

## 1.1 Curriculum content schema

Class summaries and lesson plans share the structured content shape defined in [`curriculum/lesson-content.schema.json`](./curriculum/lesson-content.schema.json):

```json
{
  "weapons": [
    {
      "weapon": "Bo",
      "activities": [
        {
          "activity": "kihon",
          "items": [
            { "item": "Kihon 1", "coverage": "explicit" }
          ]
        }
      ]
    }
  ]
}
```

`activity` is `kihon`, `kata`, or `kumite`; `coverage` is `explicit` or `implicit`. An optional `focus: true` marks an instructor call-out, and `note` is optional. For kumite, `weapon` is the pairing (for example, `bo-sai`). The schema defines structure; allowed names and items are checked against the instructor-owned curriculum vocabulary, which is not yet formalized as JSON.

Lesson plans add timing to this shared content shape. The exact timing placement and the surrounding class-summary/session record envelopes are not defined by this schema.

The related token/cost optimizations are D25-D28 above: summarize each transcript once, keep plan input compact, cache plans by floor and template version, and meter AI use against the monthly cap. The task-level cost estimate is in [`docs/backlog/US-3.3-transcripts-and-lesson-plans.md`](./docs/backlog/US-3.3-transcripts-and-lesson-plans.md).

---

## 2. Architecture

```text
[ Vue SPA ] --> [ Azure Static Web Apps (Free) ]
      |
 REST / JSON
      v
[ Azure Functions (Node.js 22, TypeScript) ]
   |                 |                  |
[ Table Storage ] [ Blob Storage ]  [ AI endpoint ]
 Students          Session JSON      Lesson plan generation
```

The API runs as **SWA managed Functions** (D14). Every API route must still validate identity and role server-side (see D11). Infrastructure and operations: [docs/MAINTENANCE.md](./docs/MAINTENANCE.md).

---

## 3. Data Model

### 3.1 `Students` table

One row per potential attendee, populated from the instructor's Excel file.

| Field | Source | Notes |
|-------|--------|-------|
| `PartitionKey` | constant, e.g. `matayoshi` | Single small partition; allows multiple dojos later. |
| `RowKey` | `Email Address` | Trimmed, lowercased. Re-importing the same email overwrites (idempotent upsert). |
| `displayName` | `Student Name` | Display only. |
| `maxClassLabel` | `Max Class Attended` | Normalized, e.g. `Year 2, Class 38`. |
| `maxYear` | parsed | Integer >= 1. |
| `maxClass` | parsed | Integer 1-52. |
| `maxLessonOrdinal` | computed | `(maxYear - 1) * 52 + maxClass`. The gate. |
| `role` | administrator-managed | `student` (default), `moderator`, `administrator` (see D11). |
| `updatedAt`, `updatedBy` | system | Audit. |

### 3.2 Max class value

| Label | Ordinal |
|-------|---------|
| Year 1, Class 1 | 1 (lowest floor) |
| Year 1, Class 14 | 14 |
| Year 2, Class 38 | 90 |
| Year 3, Class 7 | 111 |
| Year 3, Class 52 | 156 |

Validation rules (implemented by `parseMaxClass`):

- Accepts `Year N, Class M`, case-insensitive, tolerant of extra whitespace; stores the normalized label.
- Rejects blank values (never treated as zero, which would silently drop the floor), year or class below 1, class above 52, decimals, negatives, non-numeric text, and trailing text.

### 3.3 Session document (Blob)

One blob per session, e.g. `sessions/session-YYYY-MM-DD.json`. It holds the session title, the attendee emails, a **snapshot** of each attendee's max class at check-in (so past sessions stay auditable if levels change later), the computed `floor`, and the generated plan. The annual instructor prompt archives, aggregates, or expires these blobs and the related student data. The exact JSON schema is not yet defined, except for the Zoom part below.

### 3.4 Excel import (instructor only)

1. An administrator-only Function receives the `.xlsx` and parses it server-side.
2. Each row is validated: non-empty email, valid `Max Class Attended`, no duplicate emails in the file.
3. Valid rows are upserted by email in batches. Re-running the import is harmless.
4. The response lists a result per row, so failed rows can be corrected and retried without affecting successful ones.

### 3.5 Floor and AI gate

At check-in close, the Function reads the attendees' rows and sets `floor = min(maxLessonOrdinal)`, writes it to the session blob, and passes it to the AI prompt as "include content up to and including Year Y, Class C". Class 1 is the lowest possible floor. A curriculum catalog (topics per Year/Class) is required for the plan engine and does not yet exist.

### 3.6 Sessions, registration and Zoom (proposed, D30-D35)

Session blob additions:

```json
{
  "zoom": {
    "status": "pending | created | failed",
    "meetingId": "...",
    "joinUrl": "...",
    "passcode": "...",
    "attempts": 0,
    "lastError": "..."
  },
  "startUtc": "2026-11-07T14:00:00Z",
  "timeZone": "America/New_York"
}
```

`Registrations` table: `PartitionKey = sessionId`, `RowKey = student email`, plus `registeredAt` and `emailStatus` (`pending | sent | failed`).

Flow:

1. `POST /api/sessions` (moderator): validate, save the session with `zoom.status = pending`, then run the create-meeting step through `ZoomClient`. Success stores the meeting and sets `created`; failure leaves `pending` for retry (D32). A moderator-only retry endpoint re-runs the step.
2. `POST /api/sessions/{id}/register` (approved student): upsert the registration, return the link if `created`, otherwise a "link pending" response. The email step is queued and idempotent (D34).
3. When a pending meeting is later created, the link is emailed to students already registered.
4. Session edit or cancel updates or deletes the Zoom meeting.

Code layout (test-first, injected dependencies): `api/src/zoom.ts` (`ZoomClient` interface, stub client, real client with token cache, timeout and retry), `api/src/sessions.ts` (create, retry, edit, cancel) and `api/src/registrations.ts` (register, link delivery, email step).

Background retries and email sending cannot run on SWA managed Functions (D14, D19), so they use the same worker Function App and queue as US-3.3 (D19). Until the worker exists, the first version retries inline once and relies on the moderator retry button.

---

## 4. As-Built Status

Last updated: 2026-10-20.

| Area | State |
|------|-------|
| Repository | https://github.com/KevinHalleran/StudyGroup, `main`, initial commit `8ebec3e`. |
| Workspaces | npm workspaces: `api` (Functions v4, TypeScript) and `frontend` (Vue 3 + Vite). |
| Local storage emulation | Azurite via `npm run storage:start` (Blob and Table on 127.0.0.1). `api/local.settings.json` is local-only and ignored; `api/local.settings.example.json` is the template. |
| Test framework | Vitest 5 for both workspaces (`npm test`, `npm run test:api`, `npm run test:web`). |
| Frontend | Scaffold only (placeholder `App.vue`); one passing component test; `staticwebapp.config.json` has SPA fallback and security headers, but **no auth providers or role routes yet**. |
| API | No Functions are registered yet. `rank-management.ts` is a stub and **should be replaced** by max-class update logic (D10). |
| `max-class` module | `api/src/max-class.ts` exists as stubs; `api/tests/max-class.test.ts` has 20 failing tests (TDD red). Not committed. |
| Infrastructure as code | `infra/main.bicep` plus modules (storage, monitoring, static web app); compiles clean. **Not yet deployed**: needs the one-time `infra/bootstrap/bootstrap.ps1`. |
| CI/CD | `infra.yml` (lint, what-if, deploy, weekly drift check) and `azure-deploy.yml` (tests gate, deploy SWA + managed API, health check). OIDC auth via repo variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`; no secrets. Workflows are untested against live Azure. |
| Post-deploy health check | `GET /api/health` (done, tested) and `scripts/health-check.sh` run after each deploy. |
| Known issues | Failing tests intentionally block deployment. Six moderate dev-dependency advisories remain in the Azurite tree (production dependencies clean). |

---

## 5. Next Steps

1. Implement `max-class.ts` until its tests pass.
2. Replace the rank-update test and stub with an administrator-only "update max class" operation.
3. Write failing tests, then implement, the Excel import validation and idempotent upsert.
4. Implement the D11 roles function and D12 identity linking.
5. Define the session blob JSON schema (Zoom part proposed in 3.6) and the curriculum catalog.
6. Run the bootstrap, deploy the infrastructure, and choose and add the AI service (D17).
7. Sessions, registration and Zoom (US-2.1, US-2.3, US-2.4): see the [US-2 backlog](./docs/backlog/US-2-sessions-registration-zoom.md); start with the stub `ZoomClient`.

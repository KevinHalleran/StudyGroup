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
| D17 | The AI service is not yet chosen or provisioned. | **Open** |
| D13 | User Stories now include US-2.3 (Zoom join link on check-in/registration). Where the link is stored and how it is delivered is not yet designed. | **Open** |

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

One blob per session, e.g. `sessions/session-YYYY-MM-DD.json`. It holds the session title, the attendee emails, a **snapshot** of each attendee's max class at check-in (so past sessions stay auditable if levels change later), the computed `floor`, and the generated plan. The annual instructor prompt archives, aggregates, or expires these blobs and the related student data. The exact JSON schema is not yet defined.

### 3.4 Excel import (instructor only)

1. An administrator-only Function receives the `.xlsx` and parses it server-side.
2. Each row is validated: non-empty email, valid `Max Class Attended`, no duplicate emails in the file.
3. Valid rows are upserted by email in batches. Re-running the import is harmless.
4. The response lists a result per row, so failed rows can be corrected and retried without affecting successful ones.

### 3.5 Floor and AI gate

At check-in close, the Function reads the attendees' rows and sets `floor = min(maxLessonOrdinal)`, writes it to the session blob, and passes it to the AI prompt as "include content up to and including Year Y, Class C". Class 1 is the lowest possible floor. A curriculum catalog (topics per Year/Class) is required for the plan engine and does not yet exist.

---

## 4. As-Built Status

Last updated: 2026-10-19.

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
5. Define the session blob JSON schema and the curriculum catalog.
6. Run the bootstrap, deploy the infrastructure, and choose and add the AI service (D17).

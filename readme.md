# Matayoshi Kobudo Study Group Platform

A lightweight, pure Azure serverless application designed to maintain study group continuity while strictly enforcing curriculum boundaries based on each attendee's maximum class attended.

> **Authoritative design and as-built record: [DESIGN.md](./DESIGN.md).** This README is a summary; where documents disagree, `DESIGN.md` wins.

---

## Architecture Overview

The application is built using a modern, zero-cost (or free-tier) cloud architecture optimized for low-volume usage, fault-tolerance, and seamless student check-ins.

```text
[ Vue.js SPA (Mobile-First) ]  ---(HTTPS / Static Assets)-->  [ Azure Static Web Apps (Free) ]
           |
     (REST API / JSON)
           v
[ Azure Functions (Node.js) ] --(Serverless Compute)
   |                  |                  |
   v                  v                  v
[ Azure Table ]   [ Azure Blob ]   [ AI Endpoint ]
(User Profiles    (Session Roster   (Dynamic Study 
 & Ranks)          JSONs & Logs)     Plan Generation)
```

### Technology Stack
* **Frontend Tier**: Vue.js Single Page Application hosted via **Azure Static Web Apps** (Free Tier).
* **Compute Tier**: **Azure Functions** (Node.js 22, managed by Static Web Apps Free tier) serving API endpoints and AI orchestration.
* **Data Tier**: 
  * **Azure Table Storage**: Key-value store for user profiles, identity mappings, and each student's max class attended (`Year N, Class M`).
  * **Azure Blob Storage**: JSON document repository for session rosters, attendance logs, and archived study plans.
* **Authentication**: Azure Static Web Apps managed authentication with **Microsoft** and **GitHub** sign-in (Free tier; Google/Facebook need Standard).

---

## Non-Functional Requirements (NFRs) Summary

* **Performance & Latency**: Roster updates and check-ins support up to 5 seconds of predictable execution latency accompanied by clear visual loading indicators.
* **Reliability & Fault Tolerance**: Step-level failure tracking and transaction idempotency ensure that user actions are never lost, supporting automatic and user-driven retries.
* **Security & Compliance**: Role-Based Access Control (RBAC) separates students from instructor admin tools. Session records persist until an annual instructor prompt triggers archiving, aggregation, or expiration.
* **Usability**: Student views feature a lightweight, mobile-responsive UI optimized for smartphone check-ins on the dojo floor; administrative tools are optimized for desktop use.
* **Maintainability & CI/CD**: Fully automated deployment pipelines via GitHub. Test-First Development (TDD) ensures regression coverage, and in-repository Markdown documentation is maintained via GitHub Copilot integration.

---

## Getting Started (Local Development)

Requirements: Node.js 22 LTS, npm, and Azure Functions Core Tools v4.

1. Install workspace dependencies from the repository root:
   ```bash
   npm ci
   ```
2. Start Azurite (Blob and Table endpoints) in one terminal:
   ```bash
   npm run storage:start
   ```
3. Start the Vue development server and Functions host in a second terminal:
   ```bash
   npm run dev
   ```
   The frontend is served at `http://127.0.0.1:5173`; the Functions host uses its normal local address.
4. Run frontend tests:
   ```bash
   npm run test:web
   ```
   The Module 1 tests (rank/max-class management) are intentionally red until implemented; see `DESIGN.md` section 4:
   ```bash
   npm run test:api
   ```
   Run `npm run test:unit` (alias `npm test`) for all unit tests and `npm run build` to build both workspaces.
5. Run the end-to-end suite (starts Azurite, the Functions host and Vite, runs the tests, then stops everything; needs Azure Functions Core Tools v4):
   ```bash
   npm run test:e2e
   ```

**Test layers.** Unit tests (`api/tests/*.test.ts`, `frontend/src/*.test.js`) are pure: no network, no Azurite, no Functions host, and they run on demand with `npm run test:unit` (or `npm run test:unit:watch`). End-to-end tests (`e2e/*.e2e.test.ts`) exercise the running local stack. CI runs both; deploys require both to pass.

`api/local.settings.json` is local-only and ignored by Git. Its checked-in template is
`api/local.settings.example.json`; both use Azurite's development connection string.

**Commit habit.** `npm install` enables a pre-commit hook (`.githooks/pre-commit`) that runs
`npm run verify` (unit tests, build, local end-to-end) and rejects the commit if anything
fails. Documentation-only commits skip it. Run `npm run verify` yourself any time. CI repeats
the same checks, so a green local verify is the expected state of every commit.

## Deployment Pipeline

All Azure resources are Bicep (`infra/`) and managed only through GitHub Actions:
`infra.yml` provisions and drift-checks them; `azure-deploy.yml` tests, deploys the
Static Web App with its managed Functions API, and runs a health check. Authentication
uses GitHub OIDC (no stored secrets). One-time setup: run `infra/bootstrap/bootstrap.ps1`,
then the Infrastructure workflow. See [docs/MAINTENANCE.md](./docs/MAINTENANCE.md).
Tests that are deliberately failing in this bootstrap block deployment until implemented.

---

## License & Compliance
Maintained under dojo governance guidelines. All training material is dynamically bounded by the least experienced attendee present (the lowest max class attended on the active roster).
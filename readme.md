# Matayoshi Kobudo Study Group Platform

A lightweight, pure Azure serverless application designed to maintain study group continuity while strictly enforcing dojo belt-rank constraints and curriculum boundaries. 

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
* **Compute Tier**: **Azure Functions** (Node.js runtime, Consumption Plan) serving API endpoints and AI orchestration.
* **Data Tier**: 
  * **Azure Table Storage**: Key-value store for user profiles, identity mappings, and verified Matayoshi Kobudo belt ranks.
  * **Azure Blob Storage**: JSON document repository for session rosters, attendance logs, and archived study plans.
* **Authentication**: Azure Static Web Apps managed authentication supporting federated **Google** and **Facebook** logins.

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
   The initial Module 1 rank-management tests are intentionally red until the feature is implemented:
   ```bash
   npm run test:api
   ```
   Run `npm test` for both suites and `npm run build` to build both workspaces.

`api/local.settings.json` is local-only and ignored by Git. Its checked-in template is
`api/local.settings.example.json`; both use Azurite's development connection string.

## Deployment Pipeline

`.github/workflows/azure-deploy.yml` validates changes on pull requests and deploys on
pushes to `main` after tests and builds pass. Configure the repository variable
`AZURE_FUNCTIONAPP_NAME` and secrets `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` and
`AZURE_STATIC_WEB_APPS_API_TOKEN`. The workflow deploys to already-provisioned Azure
resources; it does not provision them. Since the Module 1 API test is deliberately
failing in this bootstrap, deployment remains blocked until its implementation makes
the test pass.

The API is deployed as a separate Function App. Static Web Apps managed authentication
does not by itself enforce roles on that separate host; implement server-side identity
and role validation for every API route (and configure the required CORS origin) before
exposing API functionality.

---

## License & Compliance
Maintained under dojo governance guidelines. All training material access is dynamically bounded by the lowest-grade attendee present on the active roster.
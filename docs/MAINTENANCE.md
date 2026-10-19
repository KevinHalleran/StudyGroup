# Maintenance Guide

How the Matayoshi Kobudo platform is built, deployed and administered. All Azure resources are defined as code in [infra/](../infra) and changed only through GitHub Actions. Portal changes are prohibited (they are reverted by the next deploy and flagged by the weekly drift check).

Authoritative design: [DESIGN.md](../DESIGN.md).

## Architecture (serverless)

| Concern | Resource | Defined in |
|---|---|---|
| Frontend + API | Azure Static Web Apps, **Free** tier, with managed Functions (Node 22, HTTP triggers) | `infra/modules/staticwebapp.bicep` |
| Data | Storage account (Standard_LRS): Tables `Students`, `Identities`, `Operations`; Blob containers `sessions`, `archive` | `infra/modules/storage.bicep` |
| Telemetry | Log Analytics (30-day retention, daily cap) + Application Insights | `infra/modules/monitoring.bicep` |
| Sign-in | SWA built-in providers: Microsoft (Entra ID) and GitHub | `frontend/public/staticwebapp.config.json` |
| AI lesson plans | **Not yet provisioned** (service choice pending) | n/a |

Cost: all components are consumption/free; expected cost is cents per month for storage and logs.

## Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `infra.yml` | PR / push to `infra/**`, manual, weekly | Lint Bicep; what-if on PRs and weekly (drift check); deploy on main |
| `azure-deploy.yml` | push to main, PRs, manual | Run tests and build (gate), then deploy site + API, then health check |

Order on first setup: bootstrap, then `Infrastructure`, then `Build, test, and deploy`.
Pull requests run tests only; deploys happen only from `main`. Failing tests block deployment.

## One-time bootstrap (manual, unavoidable)

GitHub Actions needs an Azure identity before it can do anything, so this is the only manual step.

1. Open Azure Cloud Shell (or any shell with `az`), sign in, and run `infra/bootstrap/bootstrap.ps1 -SubscriptionId <id>`.
2. It registers resource providers, creates resource group `rg-kobudo-prod` (eastus2), creates an app registration with GitHub OIDC federated credentials (no secrets), and grants **Contributor on that resource group only**.
3. It sets repository variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP` (via `gh`, or prints them to add under Settings > Secrets and variables > Actions > Variables).
4. Run the `Infrastructure` workflow from the Actions tab.

The script is idempotent and safe to re-run.

## Routine operations

- **Change infrastructure**: edit `infra/`, open a PR, review the what-if in the job summary, merge.
- **Deploy the app**: merge to `main`. The deploy job fetches the SWA deployment token at run time (masked), so no deployment token is stored in GitHub.
- **Health check**: `scripts/health-check.sh <host>` runs after each deploy, retrying `/` and `/api/health` (which verifies storage reachability). A failure fails the workflow.
- **Drift**: the Monday what-if lists any out-of-band changes. Merge a fix or re-run the deploy to restore the declared state.
- **Storage key rotation**: rotate the key in a controlled way, then re-run `Infrastructure`; Bicep re-reads the key and rewrites the SWA app setting.
- **Annual archive/expiry prompt**: managed Functions have no timers, so this will be a scheduled GitHub Action calling an admin-only API (not yet built).
- **Roles**: instructors are granted via the `Students` table role field (roles function planned, see DESIGN.md D11).

## Local development

See [readme.md](../readme.md): `npm run storage:start` (Azurite), `npm run test:unit` (pure unit tests, on demand), `npm run test:e2e` (full local stack: Azurite + Functions host + Vite, started and stopped automatically), `npm run build`. CI runs both test layers before any deploy.

## Known gaps

- AI service module not provisioned.
- `rolesSource` roles function and Identities linking not implemented yet.
- No Azure budget resource (deferred; set a cost alert via Bicep later).
- Free tier limits apply (no Google/Facebook sign-in; 2 custom domains; no private endpoints).

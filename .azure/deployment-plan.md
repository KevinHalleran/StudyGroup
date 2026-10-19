# Azure Deployment Plan

> **Status: Approved by user direction (decisions below); Phase 2 executing**

## 1. Scope
Make every Azure resource infrastructure as code (Bicep), serverless, and administered through GitHub Actions. Provide a maintenance document. Authoritative design: [DESIGN.md](../DESIGN.md).

## 2. Mode
MODIFY existing workspace (npm workspaces: `frontend` Vue/Vite, `api` Azure Functions v4 TypeScript).

## 3. Decisions
| Item | Decision |
|------|----------|
| Recipe | Bicep, deployed by GitHub Actions with `az deployment group` (no azd, per project directives: GitOps via Actions) |
| Frontend + API hosting | Azure Static Web Apps **Free**, managed Functions in `api/` (user choice A). No separate Function App. |
| Sign-in | Free plan preconfigured providers only: **Microsoft Entra ID and GitHub**. Google/Facebook require Standard (~$9/mo); user chose Free. |
| Roles | Roles function (`rolesSource`) reads the `Students` table; enforced by SWA routes |
| Data | One Storage account (Standard_LRS, StorageV2): Tables `Students`, `Identities`, `Operations`; Blob containers `sessions`, `archive` |
| Monitoring | Log Analytics (daily cap) + workspace-based Application Insights |
| AI | Deferred (not defined yet); module added when the service choice is made |
| CI auth to Azure | GitHub OIDC federated credential (no stored secrets); one-time bootstrap script |
| Scope | Resource group scope; RG created by bootstrap script; service principal has Contributor on that RG only; no role assignments in Bicep |
| Region | eastus2 |
| Subscription | Supplied to the bootstrap script by the user (Azure CLI is not installed on this machine) |

## 4. Artifacts
- `infra/main.bicep`, `infra/modules/{storage,monitoring,staticwebapp}.bicep`, `infra/main.bicepparam`
- `infra/bootstrap/bootstrap.ps1` (one-time OIDC and resource group setup)
- `.github/workflows/infra.yml` (lint, what-if, deploy, weekly drift check); `azure-deploy.yml` rewritten for SWA-managed API plus health check
- `api/src/health.ts` (+ test first) and `api/src/functions/health.ts`
- `docs/MAINTENANCE.md`; updates to `DESIGN.md` and related documents

## 5. Validation
Bicep compiled with the standalone Bicep CLI; unit tests; no live deployment possible from this machine (no Azure CLI or subscription context).

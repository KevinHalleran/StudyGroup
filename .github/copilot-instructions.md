# Matayoshi Kobudo Study Group Platform - Copilot Directives

# Autonomous Engineering & DevOps Agent Instructions

## Role & Capabilities
You are an autonomous Senior Full-Stack & Cloud DevOps Engineer. Your goal is to write, configure, test, and deploy the entire Matayoshi Kobudo platform with minimal human intervention. You have access to terminal execution, file creation, and Git.

## Technical Stack & Local Environment
- **Frontend**: Vue.js (Vite) configured for Azure Static Web Apps.
- **Backend**: Azure Functions (Node.js runtime v20+ / TypeScript or JavaScript).
- **Storage Emulation**: Azurite (local Azure Table and Blob storage emulator via Docker/NPM).
- **CI/CD & IaC**: GitHub Actions workflow (`.github/workflows/deploy.yml`) using Azure CLI / Static Web Apps CLI for automated deployments.

## Working Agreement
- After every step, update `TODO.md` in the project root (sections: Kevin do now; Next most important thing to do together; Roadmap).

## Execution Directives
1. **Infrastructure as Code & Local Setup**: Automatically generate all configuration files (`host.json`, `local.settings.json`, `staticwebapp.config.json`, Docker compose or npm scripts for Azurite).
2. **Test-Driven Development (TDD)**: Write unit and integration tests (Jest / Vitest) *before* implementing any business logic or Azure Function code.
3. **Local Testing Automation**: Provide exact shell commands or npm scripts to spin up Azurite, run local Azure Functions, and execute test suites locally.
4. **Remote Deployment & Verification**: Write the complete GitHub Actions workflow to deploy both the static web app and Azure functions, ensuring environment secrets are properly templated.

## Tech Stack & remote Environment
- **Frontend**: Vue.js hosted on Azure Static Web Apps (Free Tier).
- **Backend**: Azure Functions (Node.js 22) managed by Static Web Apps Free tier.
- **Data Tier**: Azure Table Storage (student roster with max class attended) & Azure Blob Storage (session JSON rosters). See DESIGN.md (authoritative).
- **Authentication**: Azure Static Web Apps managed authentication with Microsoft and GitHub sign-in (Free tier). See DESIGN.md D12/D14.
- **AI Integration**: Azure OpenAI/AI service integration via Azure Functions for dynamic study plan generation based on the floor (lowest max class attended, Year/Class ordinal; see DESIGN.md).

## Non-Functional Requirements & Engineering Standards
- **Performance**: Predictable operation latency up to 5 seconds, always accompanied by visual loading indicators (spinners).
- **Fault Tolerance**: Step-level failure tracking, transaction idempotency, and clean queuing for automatic/user retries without data loss.
- **Compliance & Privacy**: Records persist until an annual instructor prompt triggers archiving, aggregation, or expiration.
- **Testing & CI/CD**: Test-Driven Development (TDD) mandatory for all code. Fully automated deployments via GitHub Actions.
- **Documentation**: All architecture, requirements, and project notes must be maintained as Markdown files in the repository and updated automatically upon check-in.

## Architectural & DevOps Standards
- **Infrastructure as Code & GitOps**: All Azure services (functions, static web apps, storage tables/blobs, and AI integrations) must be maintained, configured, deployed, and administered exclusively through code versioned in GitHub and automated via GitHub Actions pipelines. Manual configuration changes in the Azure Portal are prohibited.
- **Mandatory Pre-Deployment Regression Testing**: Every code update, backend function, and frontend component must pass local automated unit and regression test suites inside the GitHub Actions CI pipeline prior to executing any deployment step.
- **Automated Post-Deployment Health Checks**: Every deployment or environment update must execute a scripted health check (HTTP ping / endpoint validation) immediately after deployment to verify target service availability and functional responsiveness.
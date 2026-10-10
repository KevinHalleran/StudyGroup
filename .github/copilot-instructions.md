# Matayoshi Kobudo Study Group Platform - Copilot Directives

# Autonomous Engineering & DevOps Agent Instructions

## Role & Capabilities
You are an autonomous Senior Full-Stack & Cloud DevOps Engineer. Your goal is to write, configure, test, and deploy the entire Matayoshi Kobudo platform with minimal human intervention. You have access to terminal execution, file creation, and Git.

## Technical Stack & Local Environment
- **Frontend**: Vue.js (Vite) configured for Azure Static Web Apps.
- **Backend**: Azure Functions (Node.js runtime v20+ / TypeScript or JavaScript).
- **Storage Emulation**: Azurite (local Azure Table and Blob storage emulator via Docker/NPM).
- **CI/CD & IaC**: GitHub Actions workflow (`.github/workflows/deploy.yml`) using Azure CLI / Static Web Apps CLI for automated deployments.

## Execution Directives
1. **Infrastructure as Code & Local Setup**: Automatically generate all configuration files (`host.json`, `local.settings.json`, `staticwebapp.config.json`, Docker compose or npm scripts for Azurite).
2. **Test-Driven Development (TDD)**: Write unit and integration tests (Jest / Vitest) *before* implementing any business logic or Azure Function code.
3. **Local Testing Automation**: Provide exact shell commands or npm scripts to spin up Azurite, run local Azure Functions, and execute test suites locally.
4. **Remote Deployment & Verification**: Write the complete GitHub Actions workflow to deploy both the static web app and Azure functions, ensuring environment secrets are properly templated.

## Tech Stack & remote Environment
- **Frontend**: Vue.js hosted on Azure Static Web Apps (Free Tier).
- **Backend**: Azure Functions (Node.js runtime, Consumption Plan).
- **Data Tier**: Azure Table Storage (user profiles, ranks) & Azure Blob Storage (session JSON rosters).
- **Authentication**: Azure Static Web Apps managed authentication with Google and Facebook federated social login.
- **AI Integration**: Azure OpenAI/AI service integration via Azure Functions for dynamic study plan generation based on the lowest rank floor.

## Non-Functional Requirements & Engineering Standards
- **Performance**: Predictable operation latency up to 5 seconds, always accompanied by visual loading indicators (spinners).
- **Fault Tolerance**: Step-level failure tracking, transaction idempotency, and clean queuing for automatic/user retries without data loss.
- **Compliance & Privacy**: Records persist until an annual instructor prompt triggers archiving, aggregation, or expiration.
- **Testing & CI/CD**: Test-Driven Development (TDD) mandatory for all code. Fully automated deployments via GitHub Actions.
- **Documentation**: All architecture, requirements, and project notes must be maintained as Markdown files in the repository and updated automatically upon check-in.
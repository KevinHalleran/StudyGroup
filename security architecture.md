> **Authoritative design and as-built record: [DESIGN.md](./DESIGN.md).** Roles come from the `Students` table via a SWA `rolesSource` function (D11), and GitHub identities are linked to a student email through the `Identities` table (D12). The API runs as SWA managed Functions, and every route must still validate identity and role server-side.

### Authentication & Identity Provider (IdP) Strategy

* **Platform Built-In Auth**: Utilize **Azure Static Web Apps (Free Tier) Managed Authentication**, which natively handles social identity providers.
* **Configured Providers**: Use the Free-tier preconfigured **Microsoft (Entra ID)** and **GitHub** providers (`/.auth/login/aad`, `/.auth/login/github`). Google and Facebook require the Standard tier and are not used (DESIGN.md D14).
* **Identity Mapping**: GitHub returns a username rather than an email, so a user's `provider:userId` is linked to a student email through an instructor-approved record in the `Identities` table. Microsoft sign-in maps by email claim.

---

### Access Control & Authorization Model

* **Role-Based Access Control (RBAC)**: Define three distinct access tiers within `staticwebapp.config.json` and your database:
* `anonymous`: Public landing or unauthenticated state.
* `authenticated`: Verified students who can view schedules and check-in.
* `administrator`: Reserved strictly for the instructor to manage user profiles, max class assignments, and curriculum definitions.


* **Whitelist / Invitation Gateway**: To prevent unauthorized users from registering, use Azure Static Web Apps Role Management to pre-approve user identities by their email or social provider principal ID before they can access active study group data.

---

### Data Protection & Least Privilege

* **Data Partitioning in Table Storage**: Isolate user profiles and max class data using Partition Keys (e.g., partitioned by dojo or credential type) so that user records cannot be manipulated client-side.
* **Secure API Boundaries**: Protect all Azure Functions endpoints by setting `auth` rules in routing files to mandate `authenticated` or `administrator` roles, ensuring unauthenticated clients receive instant `401 Unauthorized` responses before hitting compute logic.
* **Secret Management**: Store OAuth client secrets and AI service API keys securely as **Azure Static Web Apps Application Settings** (environment variables) rather than committing configuration credentials to source control.

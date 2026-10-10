### Authentication & Identity Provider (IdP) Strategy

* **Platform Built-In Auth**: Utilize **Azure Static Web Apps (Free Tier) Managed Authentication**, which natively handles social identity providers.
* **Configured Providers**: Configure **Google** and **Facebook** as federated identity providers within the Static Web Apps configuration (`staticwebapp.config.json`).
* **Identity Mapping**: When a user logs in via either their Google or Facebook account, Azure generates a unique principal ID and maps their email address, providing a consistent user identity across sessions regardless of which social login they choose.

---

### Access Control & Authorization Model

* **Role-Based Access Control (RBAC)**: Define three distinct access tiers within `staticwebapp.config.json` and your database:
* `anonymous`: Public landing or unauthenticated state.
* `authenticated`: Verified students who can view schedules and check-in.
* `administrator`: Reserved strictly for the instructor to manage user profiles, rank assignments, and curriculum definitions.


* **Whitelist / Invitation Gateway**: To prevent unauthorized users from registering, use Azure Static Web Apps Role Management to pre-approve user identities by their email or social provider principal ID before they can access active study group data.

---

### Data Protection & Least Privilege

* **Data Partitioning in Table Storage**: Isolate user profiles and rank data using Partition Keys (e.g., partitioned by dojo or credential type) so that user records cannot be manipulated client-side.
* **Secure API Boundaries**: Protect all Azure Functions endpoints by setting `auth` rules in routing files to mandate `authenticated` or `administrator` roles, ensuring unauthenticated clients receive instant `401 Unauthorized` responses before hitting compute logic.
* **Secret Management**: Store OAuth client secrets and AI service API keys securely as **Azure Static Web Apps Application Settings** (environment variables) rather than committing configuration credentials to source control.

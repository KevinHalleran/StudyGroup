### High-Level Architecture Diagram

```text
[ Vue.js Single Page App ]  ---(HTTPS / Static Assets)-->  [ Azure Static Web Apps (Free) ]
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

---

### Component Breakdown & System Mapping

* **1. Frontend Presentation Tier**
* **System**: **Azure Static Web Apps (Free Tier)**
* **Role**: Hosts the single-page application built with Vue.js. Provides global edge distribution, automatically renewing SSL certificates, and a zero-dollar baseline cost. Handles user navigation, check-in interfaces, moderator controls, and the instructor audit dashboard.


* **2. Serverless Compute Tier**
* **System**: **Azure Functions (Node.js runtime, Consumption Plan)**
* **Role**: Acts as the backend API bridge. Executes lightweight JavaScript/TypeScript functions triggered via HTTP endpoints to process check-ins, evaluate constraints, update records, and orchestrate calls to the AI service.


* **3. Data & Storage Tier (NoSQL / Lightweight)**
* **System A**: **Azure Table Storage**
* **Role**: Key-value data store used to persist user profiles, authentication metadata, and verified Matayoshi Kobudo belt/grade ranks.


* **System B**: **Azure Blob Storage**
* **Role**: Document storage repository maintaining structured JSON files (`session-YYYY-MM-DD.json`) that capture session rosters, attendance arrays, computed floor grades, and final session logs for instructor auditing.




* **4. Intelligence Tier**
* **System**: **AI Service / OpenAI Endpoint**
* **Role**: Integrated directly via Azure Function HTTP requests. Dynamically receives the minimum rank constraint of the checked-in roster and evaluates it against the curriculum catalog to output a grade-appropriate, structured review plan.



---

### Architectural Data Flow

1. **Authentication & Roster Maintenance**: The instructor logs into the Vue SPA, hits an Azure Function endpoint, and updates a student's rank in **Azure Table Storage**.
2. **Session Initialization & Check-In**: The moderator opens a session via the frontend. Attendees check in, which triggers an Azure Function to update the active session JSON document stored in **Azure Blob Storage**.
3. **Constraint Calculation**: Upon check-in closure, the backend function queries **Azure Table Storage** for the ranks of all present students, computes the lowest rank grade floor, and updates the session document.
4. **Curriculum Generation**: The moderator requests a study plan; the system passes the floor constraint to the **AI Endpoint**, rendering a targeted drill list in the UI.
5. **Audit Oversight**: The instructor navigates to the archive view, pulling historical session JSON documents directly from **Azure Blob Storage** to verify dojo policy compliance.

---

> Would you like to review the specific Azure Table entity schema or the Blob JSON structure for the session rosters to begin scaffolding the repository?
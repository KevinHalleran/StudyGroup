Here is the structured array of user stories for your Matayoshi Kobudo study group application, organized by functional module to align with your pure Azure (Node, Vue, Azure Functions, Blob/Table Storage) architecture.

---

> **Authoritative design and as-built record: [DESIGN.md](./DESIGN.md).** "Rank" and "grade" in these stories mean *max class attended* (`Year N, Class M`, 1-52 classes per year). Where documents disagree, `DESIGN.md` wins.

### Module 0: Platform Foundations

* **US-0.1: Site Exists**
* *As a* visitor, *I want to* navigate to the site and get a working page, *so that* we know the platform is up.
* *Acceptance Criteria*: `GET /` returns HTTP 200 with the app shell; `GET /api/health` returns HTTP 200 with storage reachable. Verified locally by `npm run test:e2e` before every commit, and after each deployment by the post-deploy health check.

### Module 1: User & Max Class Management (Admin)

* **US-1.0: Instructor Roster Import**
* *As an* Instructor, *I want to* upload my Excel roster (Student Name, Email Address, Max Class Attended), *so that* attendees and their content gates are loaded without retyping.
* *Acceptance Criteria*: Rows are validated (email present and unique, max class valid); valid rows are upserted by email so re-imports are idempotent; the result lists each row's outcome so failed rows can be fixed and retried.


* **US-1.1: Instructor User Profile Management**
* *As an* Instructor, *I want to* view a list of all registered study group participants and update their max class attended, *so that* the system enforces the correct content gate.
* *Acceptance Criteria*: Admin UI displays users stored in Azure Table Storage; instructor can edit a user's max class; invalid values are rejected; changes persist immediately.


* **US-1.2: Student Self-Registration & Roster Opt-In**
* *As a* Student, *I want to* create or access my profile, *so that* I can be included in active session rosters.
* *Acceptance Criteria*: Simple frontend form for users to register their name and credentials, writing a new entity to Azure Table Storage via an Azure Function endpoint.

* **US-1.1: Instructor User Registration Management**
* *As an* Instructor, *I want to* provide a list of all potential study group participants that can update their cumulative Matayoshi Kobudo courses, *so that* the system knows where eveyone is at in their training.
* *Acceptance Criteria*: Admin UI displays users stored in Azure Table Storage; instructor can edit a user's regtistered material field; changes persist immediately.


---

### Module 2: Session Initialization & Attendance (Moderator)

* **US-2.1: Session Creation**
* *As a* Moderator, *I want to* schedule an upcoming study group session, *so that* attendees can check in.
* *Acceptance Criteria*: Moderator creates a session entry that generates a corresponding JSON document template stored in Azure Blob Storage. Creating the session also creates the Zoom meeting through Zoom's API under the shared host account (US-2.3). If Zoom is unavailable the session is still saved, shown as "Zoom link pending", and the meeting creation is retried (never duplicated).


* **US-2.2: Attendee Check-In & Roster Lock**
* *As a* Student or Moderator, *I want to* check off attendees for the current session, *so that* the system knows who is present on the floor.
* *Acceptance Criteria*: Vue frontend lets users check-in; updates the session JSON document in Blob Storage with the active attendee array.

* **US-2.3: Automated Zoom Meeting Provisioning**
* *As a* Moderator, *I want* the system to create the Zoom meeting when I create a session, *so that* I do not have to set up and paste a link by hand.
* *Acceptance Criteria*: Azure Function calls Zoom's API to create one meeting under the single shared host account and stores the meeting ID, join URL and passcode on the session. Creation is idempotent (a retry never makes a second meeting), a Zoom failure or timeout leaves the session saved with a visible pending/failed state, and the moderator can retry. Editing or cancelling the session updates or deletes the Zoom meeting. Until the Zoom credentials exist, a stub Zoom client stands in (D30).

* **US-2.4: Session Registration and Zoom Link Delivery**
* *As a* Student, *I want to* register for an upcoming session and receive its Zoom join link, *so that* I can join the virtual floor if training remotely.
* *Acceptance Criteria*: Registration is limited to signed-in, approved students and is idempotent per student and session. The response (and the registered-session view, with a loading spinner) shows the join URL and passcode, and the same link is emailed to the student. If the Zoom link is still pending, registration succeeds and the link is delivered as soon as it exists. The link is never returned to anyone who is not registered.

---

### Module 3: Dynamic Floor Calculation & Curriculum Engine

* **US-3.1: Automated Grade Floor Calculation**
* *As the* System, *I want to* evaluate the active attendee roster against Azure Table Storage ranks upon check-in completion, *so that* it identifies the lowest grade present.
* *Acceptance Criteria*: Azure Function reads the session roster, queries Table Storage for ranks, computes the minimum max-class ordinal (the floor), and appends the floor value to the session JSON document. The floor is computed server-side; an empty roster is an error.


* **US-3.2: AI-Powered Study Plan Generation**
* *As a* Moderator, *I want to* request an AI-generated study plan based on the active session's lowest grade floor, *so that* we practice appropriate kihon, forms, and drills.
* *Acceptance Criteria*: Azure Function passes the grade floor constraint to the AI endpoint, returning a structured list of grade-appropriate review items displayed in the Vue frontend.


---

### Module 4: Audit & Oversight (Instructor)

* **US-4.1: Session Audit & History Review**
* *As an* Instructor, *I want to* review past session JSON documents and AI-generated study plans, *so that* I can verify compliance with dojo standards.
* *Acceptance Criteria*: Instructor dashboard lists archived session JSON files from Blob Storage, displaying attendees, computed grade floor, and covered topics.



---

> Would you like to map out the initial JSON schema for the session roster blob document to begin writing the Azure Functions?
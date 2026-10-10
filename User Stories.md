Here is the structured array of user stories for your Matayoshi Kobudo study group application, organized by functional module to align with your pure Azure (Node, Vue, Azure Functions, Blob/Table Storage) architecture.

---

### Module 1: User & Rank Management (Admin)

* **US-1.1: Instructor User Profile Management**
* *As an* Instructor, *I want to* view a list of all registered study group participants and update their verified Matayoshi Kobudo progress, *so that* the system enforces the correct ceiling.
* *Acceptance Criteria*: Admin UI displays users stored in Azure Table Storage; instructor can edit a user's rank field; changes persist immediately.


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
* *Acceptance Criteria*: Moderator creates a session entry that generates a corresponding JSON document template stored in Azure Blob Storage.


* **US-2.2: Attendee Check-In & Roster Lock**
* *As a* Student or Moderator, *I want to* check off attendees for the current session, *so that* the system knows who is present on the floor.
* *Acceptance Criteria*: Vue frontend lets users check-in; updates the session JSON document in Blob Storage with the active attendee array.

* US-2.3: Automated Zoom Link Provisioning **
* *As a* Student, *I want to receive the active Zoom meeting join link upon checking in or registering for a study group session, *so that* I can seamlessly join the virtual floor if training remotely.
* Acceptance Criteria: Azure Function successfully queries Zoom's API, attaches the join_url to the response payload with a visual loading spinner on the frontend, and gracefully handles network timeouts via the step-level retry queue.

---

### Module 3: Dynamic Floor Calculation & Curriculum Engine

* **US-3.1: Automated Grade Floor Calculation**
* *As the* System, *I want to* evaluate the active attendee roster against Azure Table Storage ranks upon check-in completion, *so that* it identifies the lowest grade present.
* *Acceptance Criteria*: Azure Function reads the session roster, queries Table Storage for ranks, computes the minimum grade threshold, and appends the floor value to the session JSON document.


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
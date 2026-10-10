* **Performance & Latency**
* Check-in and roster updates support up to 5 seconds of predictable execution latency.
* All asynchronous actions must display clear visual loading indicators (spinners) during processing to maintain user feedback.


* **Reliability & Fault Tolerance**
* The system must implement step-level failure tracking and transaction idempotency.
* Operations must be fault-tolerant, queuing incomplete multi-step actions for automatic or user-driven retry without data loss or duplicate state mutation.


* **Security, Privacy & Compliance**
* Authentication leverages Azure Static Web Apps managed login with Google and Facebook federated providers.
* Role-Based Access Control (RBAC) separates standard student access from instructor/admin privileges.
* Data privacy is maintained via an annual instructor prompt mechanism to expire, archive, or aggregate historical session records.


* **Usability & Accessibility**
* Student-facing interfaces must feature a lightweight, mobile-responsive design optimized for quick check-ins on smartphone browsers from the dojo floor.
* Administrative and technical management tools are tailored for desktop usage by technologists and the instructor.


* **Maintainability & Documentation**
* All deployments must run through automated CI/CD pipelines hosted via GitHub.
* Development must follow a test-first approach (TDD) to guarantee full regression coverage on every deployment.
* All project and system documentation must reside in-repository as Markdown files, maintained and updated automatically via GitHub Copilot integration upon code check-in.
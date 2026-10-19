# Backlog conventions

Long-term, versioned work tracking. Markdown now; designed so it can move to GitHub Issues/Projects (or similar) later without renumbering.

## Layout

| File | Purpose |
|------|---------|
| [../../TODO.md](../../TODO.md) | Short, current view: what Kevin does now, what we do next, roadmap. Links here for detail. |
| `docs/backlog/<story-id>-<slug>.md` | One file per user story: goal, scope, decisions, and its tasks. |
| [../../User Stories.md](../../User%20Stories.md) | Source of truth for story text and acceptance criteria. |
| [../../DESIGN.md](../../DESIGN.md) | Source of truth for design decisions (D-numbers). |

## Identifiers (stable, never reused)

- Story: `US-1.0` (from User Stories.md).
- Task: `US-1.0-T03` (story + sequence). If tasks move to GitHub Issues, put the ID in the issue title and keep this file as the index.
- Decision: `D14` in DESIGN.md. Tasks cite the decisions they implement.

## Task format

Each task has: ID, title, **owner** (`Kevin` = needs your hands, `Copilot` = I do it, `Both`), **status** (`todo`, `doing`, `done`, `blocked`), **depends on**, and a **done when** line that is objectively checkable. Code tasks follow TDD: failing test first.

## Growing into something bigger

- Add a `Priority`/`Milestone` field when there is more than one release in flight.
- Add one file per epic (`docs/backlog/epics/`) once stories exceed ~20.
- When a tool is adopted, a script can generate issues from these files (the IDs and fields are the import keys).
- Closed stories stay in the repo as history; update `TODO.md` after every step.

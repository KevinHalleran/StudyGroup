# Transcript Indexing and Lesson Plan Generation (proposed)

**Stories:** US-3.2 AI-Powered Study Plan Generation (existing), plus new **US-3.3 Transcript Upload and Summary Index** (proposed, below).
**Source spec and review:** [../LessonPlan.md](../LessonPlan.md) (draft by Kevin); review findings are recorded in DESIGN.md as D18-D24 (all **Proposed** until Kevin confirms).
**Goal:** instructors upload class transcripts; each is summarized once and indexed by class ordinal; a session's lesson plan is generated from the summaries up to and including the floor ordinal.

**US-3.3 (proposed):** *As an* Instructor, *I want to* upload a class transcript, *so that* its summary becomes part of the curriculum index used for lesson plans. *Acceptance:* transcript is accepted only with a valid year, class number and date; structured tags (weapon or kumite pairing; kihon, kata and kumite items; explicit or implicit coverage; instructor `focus` call-outs) appears in the index; a failed summarization is visible and retryable, never silently replaced by a placeholder; re-uploading the same class replaces its summary (idempotent).

Legend: Owner `K` = Kevin, `C` = Copilot, `B` = both.

## Review of LessonPlan.md (summary)

Sound: the "lowest grade bound" rule (`absoluteId <= min`) matches D7/D8, and one summary per class feeding a plan is a cheap, sensible design. Needs change before building:

| # | Finding | Severity | Recommendation |
|---|---------|----------|----------------|
| 1 | The filename convention (`... - 20251213 - Weekly Class 16 of 52`) has **no year**; the code defaults year to 1, so every Year 2/3 transcript gets the wrong ordinal and breaks the content gate. A single anchor date (Year 1 Class 1 = 2023-01-21) is not enough either: classes are not weekly (2025-12-13 is week 152 yet "Class 16"). | Critical | Derive year from a course calendar of each year's Class 1 date, and reject contradictions (D18). |
| 2 | Blob triggers (`app.storageBlob`) do **not run on SWA managed Functions** (HTTP only, D14/D16). | Critical | Split work: SWA API for HTTP, separate small worker Function App for background jobs (D19). |
| 3 | Fallback writes a fake summary into the index when OpenAI fails and logs only; this permanently poisons the content the plans rely on and violates the fault-tolerance requirement. | High | Record `status: pending/failed` with a retryable operation; never write placeholder content (D20). |
| 4 | `text.substring(0, 12000)` summarizes only roughly the first 10 minutes of a ~60-minute class. | High | Chunk and summarize in stages (map-reduce), or use a long-context model (D21). |
| 5 | `class-summaries.json` is read-modify-written; two uploads at once lose an update. | High | One Table Storage row per class (RowKey = zero-padded ordinal); range query for `<= floor` (D22). |
| 6 | Regex hardcodes "of 52", but 26-class courses exist. | Medium | Accept `of \d+`; keep 52 as the ordinal multiplier (D6/D7). |
| 7 | Mixed storage setting names (`AzureWebJobsStorage` for data) and `transcripts` container is not in Bicep. | Medium | Use `STORAGE_CONNECTION_STRING`; add container, tables and OpenAI to Bicep. |
| 8 | Transcripts contain students' words and names; no retention, access or processor rules. | Medium | Private container, covered by the annual archive prompt (D16); log counts only; confirm Azure OpenAI data handling (D23). |
| 9 | Plan synthesis (step 3) has no code, prompt, output schema or token budget; "weapon" is free text and kihon/kata/kumite are not captured. | Medium | Structured weapon -> activity -> items shape with a controlled vocabulary (D24, D29). |
| 10 | Style: CommonJS + axios + preview API version, `context.log.warn`. | Low | TypeScript ESM, built-in `fetch`, current GA API version, Functions v4 `context.warn`. |

## Tasks (proposed order; all depend on US-1.0 Phase A and the D17 AI service decision)

| ID | Task | Owner | Status | Depends on | Done when |
|----|------|-------|--------|-----------|-----------|
| US-3.3-T01 | Cap approved (US$5/month). Lexicon received (`curriculum/lexicon.md`). Kevin answers the lexicon questions below and optionally supplies one real transcript sample (names removed) for test fixtures | K | doing | | Questions answered; D17 closed |
| US-3.3-T02 | Course calendar and transcript filename parser: year from date, class and "of N", date; rejects class/calendar contradictions; unit tests incl. 26-class courses and year boundaries | C | todo | T01 | Unit tests green; reuses `max-class.ts` ordinal |
| US-3.3-T03 | `ClassSummaries` repository (Table): idempotent upsert of structured tags (D29), range query `ordinal <= floor`, status field; fake-client unit tests | C | todo | T01, T16 | Unit tests green |
| US-3.3-T04 | Transcript preprocessing (strip timestamps, speaker labels, filler), chunking and tag merge as pure functions with an injected AI client; token estimate; unit tests | C | todo | T01, T16 | Unit tests green incl. long transcripts, AI failure, measurable size reduction |
| US-3.3-T05 | AI client wrapper (Azure OpenAI, key via Bicep secure param, timeouts, retries) | C | todo | T04 | Unit tests with mocked fetch |
| US-3.3-T06 | Bicep: AI service, `transcripts` container, `ClassSummaries` table, queue, worker Function App (consumption), budget alert | C | todo | T01 | `bicep build` clean; infra what-if clean |
| US-3.3-T07 | Admin upload endpoint (`POST /api/admin/transcripts`): validate name, store blob, enqueue job, return operation id | C | todo | T02, US-1.0-T10 | Unit and e2e tests green |
| US-3.3-T08 | Worker: queue-triggered summarizer with poison-queue handling and retry status | C | todo | T03, T05, T06 | E2E with a fake AI endpoint green |
| US-3.3-T09 | Operation status endpoint and UI: upload page, per-transcript status, retry button | C | todo | T07 | Component tests green |
| US-3.3-T10 | Lesson plan generator: compact tag input, plan schema (weapon -> activity -> items + timing), token budget, floor filter, output validated against the vocabulary; unit tests with fake AI | C | todo | T03, T05, T16, US-1.0-T02 | Unit tests green; plan contains no content above the floor and no unknown items |
| US-3.3-T11 | `POST /api/sessions/{id}/plan` and UI with spinner (5 s target; long work async) | C | todo | T10 | E2E green |
| US-3.3-T12 | Backfill: instructor uploads existing transcripts; spot-check summaries | B | todo | T09 | Index covers the uploaded classes |
| US-3.3-T13 | Update DESIGN.md as-built, MAINTENANCE.md, privacy and retention notes | C | todo | T12 | Docs match what is deployed |
| US-3.3-T14 | Token budget and metering: per-call token counts in `Operations`, US$5 monthly hard cap that blocks calls, Azure cost alert at 50% and 100% in Bicep (D28) | C | todo | T05, T06 | Unit tests green; cap blocks the next call |
| US-3.3-T15 | Plan cache keyed by (floor ordinal, template version) in Blob (D27) | C | todo | T10 | Unit tests: second request for the same floor makes no AI call |
| US-3.3-T16 | Convert `curriculum/lexicon.md` into `curriculum/vocabulary.json` (weapons, 35 kihon sets: Bo 15, Sai 10, Tonkuwa 10; kata; kumite = creator + pairing; activity categories incl. warm-up and history; Japanese/English glossary used to normalize spellings); schema, loader and validator unit tests | B | todo | T01 | Kevin confirms the file; validator tests green |
| US-3.3-T17 | Review queue for tags not in the vocabulary (flag, do not invent); instructor approves or edits. Includes marking `focus` call-outs | C | todo | T08, T16 | E2E: unknown item is flagged, not indexed; focus items are preserved |

## Cost estimate (US-3.3, assumption-based)

Assumes one transcript per week and gpt-4.1-mini-class pricing of about US$0.40 per million input tokens and US$1.60 per million output tokens (**verify current Azure OpenAI prices before relying on these**).

| Item | Tokens | Cost |
|------|--------|------|
| Weekly summary, 2k-token transcript (+1k prompt/vocabulary in, 0.3k out) | 3k in, 0.3k out | about US$0.002 |
| Weekly summary, **full 60-minute class** (about 13k-token transcript) | 14k in, 0.3k out | about US$0.006 |
| One lesson plan (about 6k tokens of tags + prompt in, 1k out), cached per floor | 7k in, 1k out | about US$0.004 |
| One-off backfill of 150 full classes | about 2.2M in | about US$1 |

Steady state is roughly US$0.05 to US$0.20 per month, and even 10 plans per week stays under US$0.50. Recommended cap: **US$5 per month** (about 10x headroom for retries and backfill reruns), with alerts at 50% and 100%. No fixed cost: pay-as-you-go deployments bill only per token.

**Size note (corrected):** the real transcript is about 45 KB and 7,700 words (about 10,000 tokens); the earlier 2 KB file was a 30-second transcription test. The cost table above (about 13k-token class) therefore applies as is. Steady state stays well under the US$5 cap.

## Lexicon review (curriculum/lexicon.md)

Good: it is exactly the lexicon needed (descriptive words, activity categories, weapons, numbered kihon, kata by weapon, kumite). Items to fix or confirm before it becomes ocabulary.json:

1. **Spelling inconsistency**: `Tzuki` (word list) vs `Tsuki` (kihon rows); `Recieving`, `Categopries`, kata `Sakagaua`. Confirm canonical spellings (the AI will normalize transcript spellings to these).
2. **Nunti** is listed as a weapon but has no kihon or kata. Is it used yet, or a placeholder?
3. **Bo 4** English says "mid-level horizontal strike" but the Japanese is Gedan (low); Bo 3 and Bo 4 and Bo 15 rows are missing commas. Please confirm the English.
4. **Tonkuwa 8** has 5 Japanese actions but 6 English ones ("arm strike, low level block, high level strike" vs three `Gedan Harai` plus `Jodan Uchi`). Confirm the intended sequence.
5. **Kumite** lines read as "Creator + pairing" (`Kimo Wall Bo-Bo`, `Gakia Bo-Sai`). Confirm that `Kimo Wall` and `Gakia` are creators/styles and the pairing is the last word, and whether there are other kumite (e.g. numbered).
6. **Categories** include `Warm-up` and `History`. The design only tagged kihon, kata and kumite; we will add warm-up and history as activity types (history carries no technique items).
7. **Kata list**: no per-weapon numbering; fine for now. Nunchaku has kata only (no kihon set), as expected.

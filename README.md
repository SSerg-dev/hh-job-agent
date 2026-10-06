# HH Job Agent

Local personal job-search workspace. Native TypeScript + HTML + Tailwind CSS, Node.js 24 and SQLite. Development follows GSD Core only.

## Run

Requires Node.js 24 or newer. From this directory:

```powershell
npm install
npm run build
npm start
```

Open http://127.0.0.1:4310 (the exact loopback address). `npm run check` checks TypeScript; `npm test` runs behavior tests.

On this Windows computer, `./start.ps1` also locates the bundled Node.js 24 runtime if system Node is older.

## Current state

Validation on 2026-10-06: 38 behavior tests, TypeScript check and Vite production build passed on Node 24.19.0. Agent-browser checks on isolated databases confirmed inline regeneration/cancellation, save/reload persistence, stale-tab conflict handling, disabled competing controls during a delayed save and the separate nonblocking optional-skill note. Earlier live public-page import also passed. These checks are not user acceptance of all personal document facts or full Phase 3 completion. Evidence is recorded in `.planning/quick/261006-s8o-protect-local-letter-edits-and-reconcile/261006-s8o-UI-CHECKS.md` and the subsequent quick summaries.

The supported workflow is local manual preparation, without automatic submissions:

1. Review and save the candidate profile and criteria.
2. Open the vacancy list. Paste an HTTPS HH vacancy URL and click the import button, or enter the text manually.
3. Import reads the public HTML page, not the HH API. It replaces all form fields; unknown conditions remain empty. Review the source city, work format, monthly RUB lower salary bound, tax basis and explicitly listed skills before saving. Import alone does not save a card.
4. Save the vacancy to receive an explainable matching decision and an editable Russian letter. Save/copy the letter in vacancies or letters.

Letters are deterministic local templates, not external AI output. They select curated candidate facts backed by source quotations and hashes in SQLite; absent verified facts fall back to the short profile with a warning. Regeneration asks for confirmation before replacing saved text and unsaved edits. A stale saved-letter snapshot blocks regeneration if another tab changed the letter. Ordinary manual saves are not versioned and still use last-write-wins behavior. Copy important drafts before replacing them.

Malformed source/fact catalog entries are skipped with a warning instead of supplying claims or crashing generation. The hashes bind facts to the archived catalog; generation does not reopen PDFs or automatically re-extract changed documents. The local audit on 2026-10-06 confirmed all three archived file hashes and all four quotations. Source attribution describes the generated draft, not proof of subsequent manual edits. Curated paragraph meaning and current accuracy still require candidate approval.

SQLite retains cards and edited letters; maximum 100 manual entries. Cards can be deleted together with their letters, and the input form can be reset. No OAuth account is connected and nothing is sent. Public-page import can fail when HH is unavailable, restricts access or changes its HTML; manual entry remains available.

Phase 1 is verified. Phase 2 API search, pagination, full details and matching are implemented, but a positive live API search remains unverified after HTTP 403. Manual sourcing does not satisfy the original live-search requirement. Parts of Phase 3 are implemented through quick tasks; formal phase acceptance is still pending. Account integration, automatic applications, scheduling and tracking are not implemented.

Read-only API access guidance: [docs/hh-api-access.md](docs/hh-api-access.md). The recorded API probe returned generic `forbidden`, which does not establish an authentication failure. Copy `.env.example` to `.env` only when a valid official HH access token is available, then restart the server. A token is not guaranteed to resolve generic 403. Do not send credentials in chat. The registration-form evidence recorded in planning reported applicant API discontinuation; reassess official integration availability before Phase 4, rather than registering a personal applicant app as an employer integration.

Salary evaluation preserves the HH source values: missing salary follows the approved permission; monthly net RUB minimum is checked; gross, nonmonthly or ambiguous ranges require review. Tech Lead/junior and nonmatching city/format roles are rejected. Required skills use explicit equivalent aliases; general skills cannot prove narrower skills. AI/LLM integrations are distinguished from ML/model-training requirements. List previews remain review-only until full details are loaded.

Matching recognizes explicit language alternatives such as `Python or C#`, `Python или C#` and `one of` / `один из` lists. One confirmed language satisfies that alternative without adding the other languages to candidate experience. Separately required languages, AND requirements, bare comma/slash lists and mixed AND/OR wording are not automatically waived. This is bounded rule-based parsing, not a complete natural-language requirements parser.

Clearly marked optional sections (`Будет плюсом`, `Nice to have`, etc.) do not turn missing bonus skills into mandatory gaps. Missing recognized optional languages/frameworks and optional listed tags are shown separately. Mandatory headings and explicit mandatory wording restore review requirements. Unknown tags or unclear wording remain review-only; unrelated job tags are not automatically inferred from candidate documents. Coverage measures the remaining individually required skill tags, excludes optional tags and waived alternatives, and can be null; it is not overall job fit or interview probability.

Optional .NET/frontend mentions alone do not establish the selected backend/fullstack specialization. A single unsupported language beneath an explicit mandatory heading remains a gap even when the source lists no skill tags. Saving a letter disables competing actions in that card until completion; this is not cross-tab save versioning.

Profile database is in ignored `data/agent.sqlite`. Candidate sources and curated letter facts also live in that local database; private source documents are in ignored `output/`. Generated build and credentials are excluded from Git. Back up `data/` and `output/` together with the app stopped if you need to preserve these materials. Tests use separate disposable databases, not personal cards.

The server exposes only `dist/`, binds loopback and validates API origin/Host. Open the exact address `http://127.0.0.1:4310`, not `localhost`. After source edits, rebuild and restart the server; `start.ps1` builds only when `dist/index.html` is absent. `PORT` and `DATA_DIR` can select an isolated local test instance. Do not expose this app through a public proxy. Vercel/cloud deployment is deferred by user decision; deploying `dist/` alone does not provide the required server API.

Accepted criteria: minimum 160,000 RUB/month net; missing salary accepted; Saint Petersburg office/hybrid/remote, Moscow remote; Senior .NET, .NET full stack and AI integration; no Tech Lead; full/part/project employment.

GSD state and roadmap: `.planning/`. Account reserve policy: `AGENTS.md`.

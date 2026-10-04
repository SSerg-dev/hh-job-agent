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

Manual mode: open the vacancy list, paste vacancy text and enter the source city, work format, monthly RUB lower salary bound and explicitly listed skills. The app stores the vacancy, explains profile matching and creates an editable Russian cover letter from profile facts and matched skills. Letters are local templates without an external AI service. Save/copy letters in either vacancies or letters screen. No sending occurs. SQLite retains entries and edited drafts; maximum 100 manual entries. 13 tests/typecheck/build pass. Applicant API support discontinuation is visible on the HH registration form; do not register this personal applicant app as an employer integration.

Phase 1 is verified: editable persistent candidate profile and criteria. Phase 2 code implements HH search, pagination, full vacancy details and explainable matching. Nine behavior tests, TypeScript and production build pass. Live unauthenticated search returned HH 403; positive live results remain unverified until official API access is configured. Later screens show that their functionality is not implemented. No HH account OAuth is connected and no applications are sent.

Read-only API access guidance: [docs/hh-api-access.md](docs/hh-api-access.md). The latest probe returned generic `forbidden`, which does not establish an authentication failure. Copy `.env.example` to `.env` only when a valid official HH access token is available, then restart the server. A token is not guaranteed to resolve generic 403. Do not send credentials in chat. Applicant OAuth, token refresh and resume selection are scheduled for Phase 4. Ten behavior tests now pass.

Salary evaluation preserves the HH source values: missing salary follows the approved permission; monthly net RUB minimum is checked; gross, nonmonthly or ambiguous ranges require review. Tech Lead/junior and nonmatching city/format roles are rejected. Required skills use explicit equivalent aliases; general skills cannot prove narrower skills. AI/LLM integrations are distinguished from ML/model-training requirements. List previews remain review-only until full details are loaded.

Profile database is in ignored `data/agent.sqlite`. Resume PDFs, npm cache, generated build and credentials are excluded from Git. Production server exposes only `dist/`, binds loopback and validates API origin/Host. Do not expose this personal app through a public proxy.

Accepted criteria: minimum 160,000 RUB/month net; missing salary accepted; Saint Petersburg office/hybrid/remote, Moscow remote; Senior .NET, .NET full stack and AI integration; no Tech Lead; full/part/project employment.

GSD state and roadmap: `.planning/`. Account reserve policy: `AGENTS.md`.

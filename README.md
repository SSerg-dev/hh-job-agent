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

Phase 1 implements editable persistent candidate profile and criteria. Other screens clearly show that their functionality is not yet implemented. No HH account is connected and no applications are sent.

Profile database is in ignored `data/agent.sqlite`. Resume PDFs, npm cache, generated build and credentials are excluded from Git. Production server exposes only `dist/`, binds loopback and validates API origin/Host. Do not expose this personal app through a public proxy.

Accepted criteria: minimum 160,000 RUB/month net; missing salary accepted; Saint Petersburg office/hybrid/remote, Moscow remote; Senior .NET, .NET full stack and AI integration; no Tech Lead; full/part/project employment.

GSD state and roadmap: `.planning/`. Account reserve policy: `AGENTS.md`.

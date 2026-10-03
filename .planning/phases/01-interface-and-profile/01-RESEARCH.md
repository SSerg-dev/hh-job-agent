# Phase 1 Research
Verified 2026-10-03 from official sources:
- Vite supports a native TypeScript/HTML entrypoint: https://vite.dev/guide/
- Tailwind Vite plugin builds CSS locally: https://tailwindcss.com/docs/installation/using-vite
- Node SQLite DatabaseSync provides local durable persistence: https://nodejs.org/api/sqlite.html
Use Node 24, native HTTP server and SQLite; Vite for frontend build, no React/Vue runtime. Bind to 127.0.0.1 and enforce exact origin/Host for API requests. Serve only built frontend assets, not project files or .env. Configuration input needs validation and payload limits. Tests should demonstrate actual persistence after reopening the database and invalid request rejection.

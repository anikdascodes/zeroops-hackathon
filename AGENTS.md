# Zerops Academy — Agent Guide

Interactive zerops tutorial app deployed on Zerops itself: Next.js 15 + PostgreSQL + Valkey + cron.

## Project layout

- `web/` — Next.js 15 (App Router) app, `devDependencies` hold the build/test toolchain.
- `web/src/content/lessons.ts` — curated lesson library + quiz.js, the product's source of truth.
- `web/scripts/build.js` — `npm run build` wrapper: `next build` → copy `web/build/standalone` to repo-root `dist/` → esbuild-bundle `migrate.js` and `daily.js`.
- `web/scripts/migrate.js` / `daily.js` — migration + cron scripts, bundled with esbuild so they run without `node_modules`.
- `dist/` — build output at **repo root**, what `deployFiles` ships. NOT committed.
- `zerops.yml` — the full pipeline (build, deploy, run, crontab, env wiring).

## Non-negotiable conventions

- **`distDir: 'build'`**, never `.next`. Zerops deploy drops dot-directories from deploy artifacts; this project hit that bug twice already.
- `deployFiles: dist` ships to `/var/www/dist`; `run.start` is `node dist/server.js`.
- Migrations run in `run.initCommands` via `node dist/migrate.cjs`.
- The daily cron script must close DB/cache connections and `exit(0)` (see `web/scripts/daily.js`).
- Treat the cache as a transparent accelerator: `src/lib/cache.ts` swallows cache failures and routes fall back to DB/defaults.
- Tests: `npm test` (fast, no build) and `npm run test:build` (full pipeline). BuildCommands run `npm test` as a quality gate.

## Rebuild + verify

```bash
cd web && npm run build   # produces repo-root dist/
node dist/server.js       # smoke: http://localhost:3000/api/health
```

<!-- ZEROPS:REFLOG -->
### 2026-08-08 — Zerops Academy build-out: curated lesson library (10 lessons + quizzes), /api/quiz + /api/leaderboard, Valkey cache layer, daily crontab job, vitest suite (19 tests).

- **Runtime:** app (nodejs@24, simple)
- **Services:** db (postgresql:single@18), cache (valkey:single@7.2)

### 2026-08-07 — Bootstrap: Create a Next.js runtime service (app), PostgreSQL (db), and Valkey (cache) for the Zerops Tutor project.

- **Runtime:** app (nodejs@24, simple)
- **Dependencies:** db (postgresql:single@18), cache (valkey:single@7.2)
- **Session:** fa5c6eec953f153e

> This is a historical record. Verify current state via `zerops_discover`.
<!-- /ZEROPS:REFLOG -->

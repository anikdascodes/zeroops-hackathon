# Zerops Academy

**Learn Cloud. Deploy Fast.** — an interactive academy *about* Zerops, deployed *on* Zerops.

Ask any Zerops question and get an animated video lesson with a generated script and scenes, complete a quiz that gets graded and persisted on a Postgres-backed leaderboard, all cached through Valkey for snappy repeat loads.

> Built for the **Zerops Challenge 2026** (WeMakeDevs × Zerops).

## Architecture

| Piece | Zerops role | What it does |
| --- | --- | --- |
| **app** (`ubuntu/nodejs@24`) | runtime | Next.js 15 SSR frontend + API + Remotion player |
| **db** (`postgresql:single@18`) | managed DB | lessons cache, quiz scores, leaderboard |
| **cache** (`valkey:single@7.2`) | managed cache | generated-lesson cache, leaderboard cache, daily-job output |

Production-grade touches:

- `run.initCommands` runs a **bundled** migration (`node dist/migrate.cjs`) on every deploy so the schema is always current.
- `run.crontab` runs a **daily job** (`dist/daily.cjs`) that picks the featured lesson and recomputes stats.
- `deploy.readinessCheck` gates traffic on `/api/health` — a broken version never receives requests.
- `run.envVariables` wires service credentials via `${db_connectionString}` / `${cache_connectionString}` — zero secrets in the repo.

## Content

10 curated Zerops lessons (deploys, env wiring, migrations, caching with Valkey, cron, safe deploys, networking, scaling, ZCP + AI agents) each with scenes, code snippets, and a 3-question quiz with explanations. Unknown questions are generated live via an LLM (Gemini) and fall back to a curated overview.

## Zerops services used

- **postgresql** — persistent store for generated lessons + quiz scores (leaderboard is a live SQL aggregation)
- **valkey** — transparent caching: 1h TTL on generated lessons, 30s TTL on the leaderboard, featured-lesson + stats written by the cron job
- **crontab (workers)** — daily background job, no extra VM

## Local development

```bash
cd web
npm ci --legacy-peer-deps
DATABASE_URL=postgres://user:pass@localhost:5432/academy npm run dev
# optional, for caching: CACHE_URL variable
```

```bash
npm test           # fast unit tests
npm run test:build # full production build + artifact verification
```

## Deployment

```bash
zcli push
```

Secrets (e.g. `GEMINI_API_KEY`) are configured via project-level `envSecrets`, never in `zerops.yml` or tracked code.

## Stack

Next.js 15 · React 19 · Remotion · Tailwind · Drizzle ORM · PostgreSQL · Valkey · Vitest · esbuild

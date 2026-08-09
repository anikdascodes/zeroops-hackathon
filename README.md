# Zerops Academy

**Learn Cloud. Deploy Fast.** — an interactive academy *about* Zerops, deployed *on* Zerops.

Ask any Zerops question in plain English and get an animated, narrated video lesson in ~2.5 seconds. 10 curated lessons ship as pre-rendered MP4s; novel questions generate a live Remotion composition on the fly, grounded in real Zerops documentation via RAG, narrated by Groq TTS, and persisted in Postgres for instant replay.

> Built for the **Zerops Challenge 2026** (WeMakeDevs x Zerops).
>
> **Live demo:** https://app-2ab6-3000.prg1.zerops.app

---

## How it works

```
User types a question
        │
        ▼
  ① Valkey cache (1h TTL) ──── hit? ──► return instantly
        │ miss
        ▼
  ② PostgreSQL lessons table ─ existing? ──► return
        │ miss
        ▼
  ③ Curated lesson matcher ─── match? ──► return curated MP4 + quiz
        │ no match
        ▼
  ④ Topic guard (isZeropsRelated) ── off-topic? ──► "Not a Zerops Topic"
        │ Zerops-related
        ▼
  ⑤ RAG: TF-IDF retrieval over 19 Zerops doc chunks ──► top-4 context
        │
        ▼
  ⑥ Groq LLM (llama-3.3-70b-versatile) ──► structured JSON lesson (title + scenes)
        │
        ▼
  ⑦ Groq TTS (Orpheus v1, voice "autumn") ──► WAV narration per scene
        │
        ▼
  ⑧ Postgres: store lesson + audio bytes (base64 in audio_assets table)
        │
        ▼
  ⑨ Return lesson with /api/audio/<hash>.wav URLs
        │
        ▼
  Browser: @remotion/player renders animated composition with synced narration
```

**End-to-end latency for a novel AI lesson: ~2.5 seconds** (RAG + LLM + TTS + DB write).

---

## Architecture

| Service | Zerops role | What it does |
|---------|-------------|-------------|
| **app** (`ubuntu/nodejs@24`) | Runtime | Next.js 15 SSR frontend + API routes + Remotion player |
| **db** (`postgresql:single@18`) | Managed DB | Generated lessons, quiz scores, TTS audio bytes (base64), leaderboard |
| **cache** (`valkey:single@7.2`) | Managed cache | Generated-lesson cache (1h TTL), leaderboard cache (30s), daily-job stats |
| **crontab** | Worker | Daily featured-lesson picker + stats recomputation (`0 0 * * *`) |

### zerops.yml — the full pipeline

```yaml
zerops:
  - setup: app
    build:
      base: nodejs@24
      os: ubuntu                          # Ubuntu needed for headless Chrome (Remotion)
      buildCommands:
        - cd web && npm ci --legacy-peer-deps && npm run build
        - cd web && npm test              # 15 tests as a build quality gate
      deployFiles:
        - dist                            # standalone Next.js + bundled scripts
      cache:
        - web/node_modules               # npm ci is fast on rebuilds
    deploy:
      readinessCheck:
        httpGet:
          port: 3000
          path: /api/health              # broken builds never receive traffic
    run:
      base: nodejs@24
      os: ubuntu
      initCommands:
        - node dist/migrate.cjs          # auto-migration on every deploy
      start: node dist/server.js
      ports:
        - port: 3000
          httpSupport: true
      crontab:
        - command: node dist/daily.cjs   # daily job, no extra VM
          timing: "0 0 * * *"
          allContainers: false
      envVariables:
        DATABASE_URL: ${db_connectionString}
        CACHE_URL: ${cache_connectionString}
```

Project-level env secrets (`GROQ_API_KEY`, `GEMINI_API_KEY`) are configured via the Zerops GUI and auto-inherited by all services — never in code or `zerops.yml`.

---

## Features

### Curated lessons (10)
Pre-rendered animated video lessons covering core Zerops topics:

1. Your First Deploy on Zerops
2. Anatomy of zerops.yml
3. Environment Variables & Service Wiring
4. PostgreSQL + Migrations on Zerops
5. Caching with Valkey
6. Cron Jobs & Background Work
7. Safe Deploys: Readiness & Rollouts
8. Networking & Public Access
9. Scaling Your App
10. ZCP: AI Agents on Real Infra

Each lesson includes 2-3 animated scenes with code snippets and a 3-question quiz with explanations. Videos are rendered at **build time** using Remotion + headless Chrome, then shipped as static MP4s.

### AI-generated lessons (unlimited)
For any Zerops question not covered by curated content:

- **RAG**: 19 documentation chunks scraped from `docs.zerops.io`, retrieved via TF-IDF cosine similarity (top-4 injected into the LLM prompt)
- **LLM**: Groq `llama-3.3-70b-versatile` generates a structured JSON lesson (title + scenes with code snippets), grounded in the retrieved docs
- **TTS**: Groq `canopylabs/orpheus-v1-english` (voice "autumn") narrates each scene — WAV bytes stored as base64 in Postgres `audio_assets` table, served via `/api/audio/<hash>.wav`
- **Topic guard**: Non-Zerops questions ("best pizza recipe") get a polite "Not a Zerops Topic" refusal

### Production-grade touches

- **Auto-migration**: `node dist/migrate.cjs` runs in `run.initCommands` on every deploy
- **Readiness checks**: `/api/health` gates traffic — broken builds never go live
- **Cache as accelerator**: `src/lib/cache.ts` swallows all Valkey errors; routes fall back to DB → curated → defaults
- **DB-persisted audio**: TTS bytes stored in Postgres, surviving container restarts and working across replicas
- **Skip-render optimization**: `render-videos.js` skips the entire Remotion pipeline if all 10 MP4s already exist (fast rebuilds)
- **Bundled scripts**: `migrate.cjs` and `daily.cjs` are esbuild-bundled so they run without `node_modules` on the runtime
- **Custom distDir**: `distDir: 'build'` (not `.next`) — Zerops drops dot-directories from deploy artifacts

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Video | Remotion 4 (`@remotion/cli` for build-time renders, `@remotion/player` for live browser rendering) |
| AI / LLM | Groq `llama-3.3-70b-versatile` (OpenAI-compatible API) |
| TTS | Groq `canopylabs/orpheus-v1-english` (voice "autumn") |
| RAG | Custom TF-IDF retriever over 19 Zerops doc chunks (no vector DB needed) |
| Database | PostgreSQL 18 via Drizzle ORM |
| Cache | Valkey 7.2 via ioredis |
| Testing | Vitest (15 tests, run as a build quality gate) |
| Build | esbuild (script bundling), `next build` (standalone output) |
| Deploy | Zerops zcli |

---

## Project structure

```
.
├── zerops.yml                  # Full pipeline: build, deploy, run, crontab, env
├── .deployignore               # Exclude node_modules etc. from deploy artifact
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── lesson/route.ts     # Main lesson API (cache→DB→curated→RAG→LLM→TTS)
│   │   │   │   ├── quiz/route.ts       # Quiz grading + score persistence
│   │   │   │   ├── leaderboard/route.ts# Live SQL aggregation
│   │   │   │   ├── audio/[file]/route.ts # DB-backed TTS audio serving
│   │   │   │   └── health/route.ts     # Readiness check + env diagnostics
│   │   │   └── page.tsx               # Main UI (lesson cards, terminal input, player)
│   │   ├── content/lessons.ts          # 10 curated lessons + quizzes + matcher
│   │   ├── lib/
│   │   │   ├── rag.ts                  # 19 doc chunks + TF-IDF retriever + topic guard
│   │   │   ├── tts.ts                  # Groq TTS → Postgres persistence
│   │   │   └── cache.ts                # Valkey wrapper (swallows errors)
│   │   ├── remotion/
│   │   │   ├── LessonComposition.tsx   # Animated scene renderer (motion graphics)
│   │   │   ├── LessonPlayer.tsx        # <video> for curated, <Player> for AI lessons
│   │   │   └── Root.tsx                # Remotion composition registry
│   │   └── db/
│   │       ├── index.ts                # Drizzle + pg Pool
│   │       └── schema.ts               # lessons, scores, audio_assets tables
│   ├── scripts/
│   │   ├── build.js                    # next build → copy standalone → esbuild bundle
│   │   ├── render-videos.js            # Remotion @remotion/cli render pipeline
│   │   ├── migrate.js                  # CREATE TABLE IF NOT EXISTS (idempotent)
│   │   └── daily.js                    # Cron: featured lesson + stats
│   ├── public/
│   │   ├── videos/                     # 10 pre-rendered MP4s (committed)
│   │   └── audio/                      # TTS WAVs for curated videos (committed)
│   └── tests/                          # 15 Vitest tests
└── dist/                               # Build output (not committed, shipped by deployFiles)
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Readiness check + env var diagnostics |
| GET | `/api/lesson?slug=list` | List all 10 curated lessons |
| GET | `/api/lesson?slug=<slug>` | Get a specific curated lesson |
| POST | `/api/lesson` | Generate/retrieve a lesson (`{"query":"..."}`) |
| POST | `/api/quiz` | Grade a quiz (`{"username":"...","lessonId":"...","answers":[...]}`) |
| GET | `/api/leaderboard` | Top scores (live SQL, cached 30s) |
| GET | `/api/audio/<hash>.wav` | DB-backed TTS audio (immutable cache) |

---

## Local development

```bash
cd web
npm ci --legacy-peer-deps

# Set required env vars (or use a local .env.local)
export DATABASE_URL=postgres://user:pass@localhost:5432/academy
export CACHE_URL=redis://localhost:6379           # optional
export GROQ_API_KEY=gsk_...                       # for AI lessons + TTS

npm run dev          # http://localhost:3000
```

```bash
npm test             # 15 fast unit tests
npm run test:build   # full production build + artifact verification
npm run build        # next build + render videos + esbuild bundle → dist/
```

---

## Deployment

```bash
# From the repo root (zerops.yml must be present):
zcli service deploy app -S <service-id> --version-name "v1"
```

The build pipeline runs on Zerops infrastructure:
1. `npm ci` (cached `web/node_modules`)
2. `npm run build` (next build → render 10 MP4s → copy standalone → esbuild bundle)
3. `npm test` (15 tests as a quality gate)
4. Deploy `dist/` to runtime containers
5. `node dist/migrate.cjs` (auto-migration)
6. `node dist/server.js` (start)
7. Readiness check on `/api/health` before traffic is routed

Secrets (`GROQ_API_KEY`, `GEMINI_API_KEY`) are set via project-level env secrets in the Zerops GUI and auto-inherited by all services.

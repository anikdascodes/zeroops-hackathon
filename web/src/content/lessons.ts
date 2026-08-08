import { LessonScene, QuizQuestion } from '@/types/lesson';

export interface CuratedLesson {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  /** keywords used to match a free-text question to this lesson */
  tags: string[];
  minutes: number;
  scenes: LessonScene[];
  quiz: QuizQuestion[];
}

export const curatedLessons: CuratedLesson[] = [
  {
    id: 'first-deploy',
    slug: 'first-deploy',
    title: 'Your First Deploy on Zerops',
    tagline: 'From zero to a live URL in one config file.',
    tags: ['deploy', 'first', 'start', 'begin', 'hello', 'zerops.yml', 'zcli'],
    minutes: 3,
    scenes: [
      {
        title: 'One file: zerops.yml',
        text: 'Zerops deploys from a single zerops.yml at your repo root. It declares the build image, build commands, runtime image, and start command.',
        code: 'zerops:\n  - setup: app\n    build:\n      base: nodejs@24\n      buildCommands:\n        - npm ci\n        - npm run build\n      deployFiles:\n        - dist\n    run:\n      start: npm start\n      ports:\n        - port: 3000\n          httpSupport: true',
        durationInFrames: 210,
      },
      {
        title: 'Push to deploy',
        text: 'Run zcli push (or push through GitHub integration). Zerops builds inside a build container, then switches traffic to a fresh runtime container.',
        code: 'zcli login <token>\nzcli push',
        durationInFrames: 150,
      },
      {
        title: 'Live, with HTTPS',
        text: 'Your service gets a public HTTPS URL automatically. Add a custom domain later from the service settings.',
        code: 'https://app-3k2j-3000.prg1.zerops.app',
        durationInFrames: 120,
      },
    ],
    quiz: [
      {
        q: 'Where does zerops.yml live?',
        options: ['~/.zerops/config', 'At the repository root', 'In /etc/zerops', 'In package.json'],
        answerIndex: 1,
        explanation: 'Zerops reads zerops.yml from the root of your repository.',
      },
      {
        q: 'What does deployFiles control?',
        options: ['Which files are git-ignored', 'Which build output is shipped to the runtime', 'Database files only', 'Docker volumes'],
        answerIndex: 1,
        explanation: 'deployFiles bridges the build container and the runtime container: only listed artifacts enter the runtime.',
      },
      {
        q: 'How do you deploy manually?',
        options: ['git push zerops main', 'zcli push', 'docker push', 'nsenter'],
        answerIndex: 1,
        explanation: 'zcli push builds and deploys your project to Zerops.',
      },
    ],
  },
  {
    id: 'zerops-yml-anatomy',
    slug: 'zerops-yml-anatomy',
    title: 'Anatomy of zerops.yml',
    tagline: 'build vs run vs deploy — know your sections.',
    tags: ['yaml', 'yml', 'config', 'build', 'run', 'deploy', 'zerops.yaml'],
    minutes: 4,
    scenes: [
      {
        title: 'build section',
        text: 'build defines the build image (base + os), buildCommands, deployFiles, and cache. Everything here runs once per version inside the build container.',
        code: 'build:\n  base: nodejs@24\n  os: alpine\n  buildCommands:\n    - cd web && npm ci && npm run build\n  deployFiles:\n    - dist\n  cache:\n    - web/node_modules',
        durationInFrames: 180,
      },
      {
        title: 'run section',
        text: 'run defines the runtime: base image, start command, initCommands (migrations), ports, crontab, env variables, and health checks.',
        code: 'run:\n  base: nodejs@24\n  initCommands:\n    - node dist/migrate.cjs\n  start: node dist/server.js\n  envVariables:\n    DATABASE_URL: ${db_connectionString}',
        durationInFrames: 180,
      },
      {
        title: 'deploy section',
        text: 'deploy controls how new versions roll out. readinessCheck gates traffic so a broken version never receives requests.',
        code: 'deploy:\n  readinessCheck:\n    httpGet:\n      port: 3000\n      path: /api/health',
        durationInFrames: 150,
      },
    ],
    quiz: [
      {
        q: 'Where should you put database migrations?',
        options: ['buildCommands', 'run.initCommands', 'crontab only', 'readinessCheck'],
        answerIndex: 1,
        explanation: 'initCommands run after the new version starts but before traffic is gated — the right place for migrations.',
      },
      {
        q: 'readinessCheck failure results in…',
        options: ['Traffic routes anyway', 'The old version keeps serving traffic', 'A 500 for users', 'Container deletion'],
        answerIndex: 1,
        explanation: 'Deploy fails safely: the previous version keeps serving until readiness passes.',
      },
      {
        q: 'Which list makes rebuilds faster?',
        options: ['deployFiles', 'cache', 'ports', 'envVariables'],
        answerIndex: 1,
        explanation: 'build.cache (e.g. node_modules) is restored between builds.',
      },
    ],
  },
  {
    id: 'env-variables-wiring',
    slug: 'env-variables-wiring',
    title: 'Environment Variables & Service Wiring',
    tagline: 'How db_connectionString becomes DATABASE_URL.',
    tags: ['env', 'variables', 'secrets', 'wiring', 'connection', 'database', 'cache', 'reference', 'password'],
    minutes: 4,
    scenes: [
      {
        title: 'Managed vars, auto-created',
        text: 'Every managed service generates variables named after its hostname: db_connectionString, db_user, db_password, cache_port, and more.',
        code: 'run:\n  envVariables:\n    DATABASE_URL: ${db_connectionString}\n    CACHE_URL: ${cache_connectionString}',
        durationInFrames: 180,
      },
      {
        title: 'References resolve at start',
        text: '${hostname_varName} references are resolved when the container starts — no credentials in your repo, no .env files needed in prod.',
        code: '# Never commit this\nDATABASE_URL=postgres://user:pass@db:5432/app',
        durationInFrames: 150,
      },
      {
        title: 'Secrets for sensitive values',
        text: 'Values you should not print (API keys, tokens) belong in envSecrets, set via project import or zcli. They store encrypted and inject at runtime.',
        code: 'services:\n  - hostname: app\n    envSecrets:\n      GEMINI_API_KEY: <secret>',
        durationInFrames: 150,
      },
    ],
    quiz: [
      {
        q: 'How do you reference db’s connection string from app?',
        options: ['${db.connectionString}', '${db_connectionString}', 'db:5432 hardcoded', '$DB_CONN'],
        answerIndex: 1,
        explanation: 'References use ${hostname_varName}: ${db_connectionString}.',
      },
      {
        q: 'When are env references resolved?',
        options: ['At build time', 'At container start', 'During zcli push', 'In the browser'],
        answerIndex: 1,
        explanation: 'References resolve when the container starts — rotated creds apply on next start.',
      },
      {
        q: 'Where do API keys belong?',
        options: ['In zerops.yml run.envVariables', 'envSecrets', 'Hardcoded in routes', 'In the README'],
        answerIndex: 1,
        explanation: 'Sensitive values go into envSecrets, not build/run env or code.',
      },
    ],
  },
  {
    id: 'postgres-migrations',
    slug: 'postgres-migrations',
    title: 'PostgreSQL + Migrations on Zerops',
    tagline: 'A real database, reachable by hostname db — and migrations done right.',
    tags: ['postgres', 'database', 'migration', 'db', 'sql', 'drizzle', 'table'],
    minutes: 4,
    scenes: [
      {
        title: 'Managed PostgreSQL',
        text: 'Add a postgresql service to your import or zcli project zerops setup. Single mode for stage, HA mode for prod.',
        code: 'services:\n  - hostname: db\n    type: postgresql@16\n    mode: SINGLE_DEV',
        durationInFrames: 150,
      },
      {
        title: 'Connect over the private network',
        text: 'Services talk over the project’s private network. Your app reaches the DB by hostname db on port 5432 — via ${db_connectionString}, never hardcoded.',
        code: "const pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n});",
        durationInFrames: 150,
      },
      {
        title: 'Migrations in initCommands',
        text: 'Run schema migrations as run.initCommands so every deploy applies pending migrations before traffic arrives. Bundle the script (e.g. with esbuild) so it needs no node_modules.',
        code: 'run:\n  initCommands:\n    - node dist/migrate.cjs',
        durationInFrames: 180,
      },
    ],
    quiz: [
      {
        q: 'How should runtime code reach PostgreSQL?',
        options: ['Public IP from the dashboard', '${db_connectionString} in envVariables', 'localhost:5432', 'Shared volume'],
        answerIndex: 1,
        explanation: 'Use the auto-generated reference; services communicate on the private network.',
      },
      {
        q: 'Where do migrations run?',
        options: ['buildCommands', 'run.initCommands', 'In the browser', 'crontab'],
        answerIndex: 1,
        explanation: 'initCommands run at every deploy before the readiness check must pass.',
      },
      {
        q: 'Why bundle the migration script?',
        options: ['It looks cool', 'Migrations must not depend on runtime node_modules', 'Postgres requires bundles', 'YAML requires it'],
        answerIndex: 1,
        explanation: 'A bundled migrate.cjs runs anywhere, even without app dependencies installed.',
      },
    ],
  },
  {
    id: 'valkey-caching',
    slug: 'valkey-caching',
    title: 'Caching with Valkey',
    tagline: 'Redis-compatible speed for sessions, leaderboards, and hot reads.',
    tags: ['valkey', 'redis', 'cache', 'session', 'leaderboard', 'ioredis', 'memory'],
    minutes: 4,
    scenes: [
      {
        title: 'Valkey managed service',
        text: 'Add a valkey service; Zerops manages instances, HA, and persistence. Reach it via ${cache_connectionString}.',
        code: 'services:\n  - hostname: cache\n    type: valkey@7.2\n    mode: SINGLE_DEV',
        durationInFrames: 150,
      },
      {
        title: 'Cache the hot path',
        text: 'Cache expensive reads: generated lessons, computed leaderboards, API responses. Use short TTLs so freshening is easy and staleness bounded.',
        code: 'const cached = await redis.get(key);\nif (cached) return JSON.parse(cached);\n// compute...\nawait redis.set(key, JSON.stringify(data), \'EX\', 300);',
        durationInFrames: 210,
      },
      {
        title: 'Degrade gracefully',
        text: 'Treat the cache as an accelerator, not a dependency. If Cache is down or empty, fall back to the source of truth (e.g. Postgres) — the API still answers.',
        code: "try { /* cache */ } catch {\n  /* fall back to DB */\n}",
        durationInFrames: 150,
      },
    ],
    quiz: [
      {
        q: 'Valkey is…',
        options: ['A Zerops VM', 'A Redis-compatible managed cache', 'A DNS service', 'An AI model'],
        answerIndex: 1,
        explanation: 'Valkey is a Redis-compatible in-memory store, managed on Zerops.',
      },
      {
        q: 'Good candidates for caching?',
        options: ['Only static HTML', 'Computed/expensive reads like leaderboards', 'Secrets', 'Docker images'],
        answerIndex: 1,
        explanation: 'Cache results that are expensive to recompute and safe to be briefly stale.',
      },
      {
        q: 'If the cache fails you should…',
        options: ['Crash the API', 'Fall back to the source of truth', 'Hardcode data', 'Disable the route'],
        answerIndex: 1,
        explanation: 'Design the cache as a transparent accelerator with a fallback.',
      },
    ],
  },
  {
    id: 'cron-workers',
    slug: 'cron-workers',
    title: 'Cron Jobs & Background Work',
    tagline: 'Scheduled jobs with run.crontab — no extra VM required.',
    tags: ['cron', 'worker', 'schedule', 'job', 'jobs', 'background', 'crontab'],
    minutes: 3,
    scenes: [
      {
        title: 'crontab in zerops.yml',
        text: 'Schedule commands inside an existing service with run.crontab. Standard cron syntax, and allContainers=false runs it on a single container.',
        code: 'run:\n  crontab:\n    - command: node dist/jobs/daily.cjs\n      timing: "0 0 * * *"\n      allContainers: false',
        durationInFrames: 180,
      },
      {
        title: 'Write exit-zero scripts',
        text: 'Cron jobs must exit 0 on success and clean up connections (close pools/redis) so the process actually exits instead of hanging the cron daemon.',
        code: "await pool.end();\nredis.disconnect();\nprocess.exit(0);",
        durationInFrames: 150,
      },
      {
        title: 'Share via the DB or cache',
        text: 'The cron container shares your DB and cache — write a daily digest row or warm a cache key the API reads. That’s how a nightly job becomes instant UI data.',
        code: "await redis.set('academy:featured', JSON.stringify(lesson));",
        durationInFrames: 150,
      },
    ],
    quiz: [
      {
        q: 'Where do you schedule jobs in zerops.yml?',
        options: ['build.schedule', 'run.crontab', 'deploy.hooks', 'envVariables'],
        answerIndex: 1,
        explanation: 'run.crontab defines scheduled commands with cron timing.',
      },
      {
        q: 'allContainers: false means…',
        options: ['Job never runs', 'Job runs on only one container', 'Job runs without logs', 'Job runs in build'],
        answerIndex: 1,
        explanation: 'With multiple containers, this prevents duplicate executions.',
      },
      {
        q: 'A cron script should…',
        options: ['Stay connected forever', 'Close connections and exit 0', 'Print to stdout only', 'Never use the DB'],
        answerIndex: 1,
        explanation: 'Graceful exit keeps the scheduler and runtime healthy.',
      },
    ],
  },
  {
    id: 'deploy-strategy',
    slug: 'deploy-strategy',
    title: 'Safe Deploys: Readiness & Rollouts',
    tagline: 'Ship without downtime — the new version earns traffic.',
    tags: ['deploy', 'readiness', 'rollback', 'release', 'downtime', 'green', 'blue'],
    minutes: 3,
    scenes: [
      {
        title: 'New version ≠ new traffic',
        text: 'Each deploy builds a fresh container set, runs initCommands, then probes readiness. Until readiness passes, users keep hitting the old version.',
        code: 'deploy:\n  readinessCheck:\n    httpGet:\n      port: 3000\n      path: /api/health\n    failureTimeout: 60s',
        durationInFrames: 180,
      },
      {
        title: 'Health ≠ readiness',
        text: 'readinessCheck gates deploy traffic. healthCheck continuously monitors running pods and restarts them if your app wedges later.',
        code: 'run:\n  healthCheck:\n    httpGet:\n      port: 3000\n      path: /api/health',
        durationInFrames: 150,
      },
      {
        title: 'Fast rollbacks',
        text: 'Shipping the wrong fix is fine: redeploy the previous artifact. With a ready motion this is a minute, not an incident.',
        code: 'zcli service deploy --to=<previous-version>',
        durationInFrames: 120,
      },
    ],
    quiz: [
      {
        q: 'readinessCheck protects…',
        options: ['Build speed', 'Users from broken versions', 'SSL certs', 'Container memory'],
        answerIndex: 1,
        explanation: 'Traffic only switches when the new version proves it can answer.',
      },
      {
        q: 'A good readiness endpoint…',
        options: ['Trains a model', 'Returns 200 only when dependencies are usable', 'Always 404', 'Needs auth'],
        answerIndex: 1,
        explanation: 'Check critical deps (DB, cache acceptable-when-down per design).',
      },
      {
        q: 'healthCheck after deploy…',
        options: ['Is unused', 'Restarts unhealthy containers', 'Runs migrations', 'Scales containers'],
        answerIndex: 1,
        explanation: 'healthCheck keeps the live service self-healing after deploy.',
      },
    ],
  },
  {
    id: 'networking',
    slug: 'networking',
    title: 'Networking & Public Access',
    tagline: 'Public URLs, ports, and the project’s private network.',
    tags: ['network', 'ports', 'domain', 'access', 'url', 'https', 'public', 'private'],
    minutes: 3,
    scenes: [
      {
        title: 'Bind 0.0.0.0',
        text: 'Not localhost. Zerops routes to your container over the private network; binding localhost makes the service unreachable from the load balancer.',
        code: "const port = process.env.PORT || 3000;\napp.listen(port, '0.0.0.0');",
        durationInFrames: 150,
      },
      {
        title: 'ports + httpSupport',
        text: 'Declare the port the app serves and whether it speaks HTTP. Zerops terminates TLS at the edge and forwards plain HTTP.',
        code: 'run:\n  ports:\n    - port: 3000\n      httpSupport: true',
        durationInFrames: 150,
      },
      {
        title: 'Private hostnames inside',
        text: 'Inside the project, reach services by hostname: db:5432, cache:6379, app:3000. Keep internal traffic private; never route it through the public internet.',
        code: 'curl http://api-internal:3000/health',
        durationInFrames: 150,
      },
    ],
    quiz: [
      {
        q: 'Your web server must bind to…',
        options: ['127.0.0.1', '0.0.0.0', 'the DB hostname', 'a random port'],
        answerIndex: 1,
        explanation: 'The LB forwards to the container’s network interface, not to loopback.',
      },
      {
        q: 'TLS in prod on Zerops…',
        options: ['You must implement it', 'Terminated at the edge, plain HTTP to your app', 'Not supported', 'Uses PEM files in repo'],
        answerIndex: 1,
        explanation: 'Zerops handles HTTPS; your app serves HTTP on the declared port.',
      },
      {
        q: 'App-to-app traffic inside a project uses…',
        options: ['Public URLs', 'Private hostnames/ports', 'SSH tunnels', 'DNS TXT records'],
        answerIndex: 1,
        explanation: 'Private networking keeps latency low and traffic off the internet.',
      },
    ],
  },
  {
    id: 'scaling',
    slug: 'scaling',
    title: 'Scaling Your App',
    tagline: 'Horizontal containers or vertical size — two knobs, one slider.',
    tags: ['scale', 'scaling', 'autoscal', 'performance', 'containers', 'ha', 'load', 'vertical', 'horizontal'],
    minutes: 3,
    scenes: [
      {
        title: 'Horizontal scaling',
        text: 'minContainers/maxContainers set how many replicas of your service run. Keep them stateless and use shared state (DB, Valkey) for anything sticky.',
        code: 'services:\n  - hostname: app\n    minContainers: 2\n    maxContainers: 6',
        durationInFrames: 180,
      },
      {
        title: 'Vertical scaling',
        text: 'RAM/CPU profiles control container size. Autoscaling adjusts within the bounds you set based on load.',
        code: '# Increase via Service settings or zcli\nresources:\n  minRam: 1\n  maxRam: 4\n  cpuMode: SHARED',
        durationInFrames: 150,
      },
      {
        title: 'Design for replicas',
        text: 'Sessions in Valkey, uploads in object storage, cache everywhere. If app-1 and app-2 both answer identically, scaling is free.',
        code: "// session in Valkey, upload to MinIO, cache in Valkey",
        durationInFrames: 150,
      },
    ],
    quiz: [
      {
        q: 'Horizontal scaling means…',
        options: ['Bigger containers', 'More containers', 'Longer code', 'More services'],
        answerIndex: 1,
        explanation: 'min/maxContainers control replica count.',
      },
      {
        q: 'Where should sessions live at 2+ containers?',
        options: ['Container memory', 'Valkey', 'The DB schema only', 'Static files'],
        answerIndex: 1,
        explanation: 'Shared state (Valkey) keeps requests consistent across replicas.',
      },
      {
        q: 'Vertical scaling adjusts…',
        options: ['Port numbers', 'Container RAM/CPU size', 'DNS TTL', 'The YAML language'],
        answerIndex: 1,
        explanation: 'Vertical scaling resizes each container’s resources.',
      },
    ],
  },
  {
    id: 'zcp-agents',
    slug: 'zcp-agents',
    title: 'ZCP: AI Agents on Real Infra',
    tagline: 'Your coding agent, sitting inside a live Zerops project.',
    tags: ['zcp', 'ai', 'agent', 'mcp', 'coding', 'claude', 'opencode', 'workflow'],
    minutes: 3,
    scenes: [
      {
        title: 'Agents with real tools',
        text: 'ZCP gives your coding agent MCP tools: discover services, read state, deploy, tail logs, run verify — everything in the agent context, no pasting.',
        code: '# The agent decides build/run/deploy\n# and shows proof: URL, response, logs',
        durationInFrames: 180,
      },
      {
        title: 'You bring the model',
        text: 'Use your own Claude, Grok, Codex, or OpenCode key. Zerops keeps the project state; the model stays yours.',
        code: 'opencode.json + AGENTS.md\n→ your stack rules, in agent context',
        durationInFrames: 150,
      },
      {
        title: 'Proof, not promises',
        text: 'Every task ends with evidence: a reachable URL, endpoint responses, logs, or an explicit blocker — the agent reads Zerops state to verify its own work.',
        code: 'https://app-xxxx-3000.prg1.zerops.app ✓ 200',
        durationInFrames: 150,
      },
    ],
    quiz: [
      {
        q: 'ZCP gives the agent…',
        options: ['A new language', 'Project state controls + workflow instructions', 'Free GPUs', 'Localhost access only'],
        answerIndex: 1,
        explanation: 'MCP tools plus workflow instructions let agents act on real services.',
      },
      {
        q: 'Which model do you use?',
        options: ['Only Zerops models', 'Any AI agent/model you already have', 'None', 'Only GPT-5'],
        answerIndex: 1,
        explanation: 'ZCP wires the workspace; your own model/agent subscription does the thinking.',
      },
      {
        q: 'Completion means…',
        options: ['Code compiles locally', 'A working deployed URL + evidence or a called blocker', 'Silent success', 'A zip file'],
        answerIndex: 1,
        explanation: 'Evidence-based completion: URL, endpoint result, or named blocker with logs.',
      },
    ],
  },
];

export function findCuratedLesson(query: string): CuratedLesson | undefined {
  const tokens = new Set(
    query
      .toLowerCase()
      .replace(/\./g, '')
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
  let best: { lesson: CuratedLesson; score: number } | undefined;
  for (const lesson of curatedLessons) {
    let score = 0;
    for (const tag of lesson.tags) {
      if (tag.includes(' ')) {
        if (query.toLowerCase().includes(tag)) score += 2;
      } else if (tokens.has(tag)) {
        score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { lesson, score };
  }
  return best?.lesson;
}

export function lessonMatchesSlug(query: string): CuratedLesson | undefined {
  return curatedLessons.find((l) => l.slug === query || l.id === query);
}
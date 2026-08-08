/**
 * Zerops documentation knowledge base for RAG.
 * Scraped from docs.zerops.io — chunked into ~200-word segments.
 * Used by the RAG retriever to find relevant context for LLM lesson generation.
 */

export interface DocChunk {
  id: string;
  url: string;
  title: string;
  content: string;
}

export const zeropsDocs: DocChunk[] = [
  {
    id: 'overview',
    url: 'https://docs.zerops.io',
    title: 'Zerops Overview',
    content: 'Zerops is a developer-first Platform-as-a-Service, running on bare metal, with every part built from scratch. Zerops aims to be the perfect mix of developer experience, flexibility, and reliability. You deploy apps, databases, and infrastructure using a single zerops.yaml file or the GUI. Zerops handles build, deploy, scaling, networking, SSL, and high availability automatically.',
  },
  {
    id: 'yaml-spec',
    url: 'https://docs.zerops.io/zerops-yaml/specification',
    title: 'zerops.yaml Configuration',
    content: 'The zerops.yaml file is crucial for defining how Zerops should build and deploy your application. Add the zerops.yaml file to the root of your repository. Each service configuration requires a run section. Optional build and deploy sections can be added. The build section defines base image, OS, buildCommands, deployFiles, and cache. The run section defines base image, OS, ports, start command, initCommands, envVariables, crontab, and healthCheck. The deploy section controls readinessCheck and temporaryShutdown. You can have multiple setups (e.g. app, api) in one zerops.yml file using the setup key.',
  },
  {
    id: 'yaml-build',
    url: 'https://docs.zerops.io/zerops-yaml/specification',
    title: 'Build Configuration',
    content: 'The build section defines how your application is built. base specifies the build image (e.g. nodejs@24). os can be alpine or ubuntu. buildCommands is a list of shell commands executed in order. deployFiles specifies which files/directories from the build output are shipped to the runtime container. cache specifies paths to cache between builds (e.g. node_modules). The build container is temporary and free — Zerops spins it up, runs your build, saves the output, and deletes it. Build containers have 1-5 CPU cores, 8 GB RAM, up to 100 GB disk. The entire build pipeline has a 1 hour time limit.',
  },
  {
    id: 'yaml-run',
    url: 'https://docs.zerops.io/zerops-yaml/specification',
    title: 'Runtime Configuration',
    content: 'The run section defines the runtime environment. base specifies the runtime image (e.g. nodejs@24). os can be alpine or ubuntu. start is the command to launch your app. initCommands run before start (useful for migrations). ports defines which ports are exposed with httpSupport for HTTP traffic. envVariables injects environment variables at runtime, using ${service_key} references to wire services. crontab defines scheduled commands. healthCheck configures automatic health monitoring. routing controls how traffic is distributed.',
  },
  {
    id: 'yaml-deploy',
    url: 'https://docs.zerops.io/zerops-yaml/specification',
    title: 'Deploy Configuration',
    content: 'The deploy section controls how new versions roll out. readinessCheck gates traffic so a broken version never receives requests. It uses httpGet with a port and path, a failureTimeout (e.g. 60s), and a retryPeriod (e.g. 10s). The readiness check polls your health endpoint until it returns 200 or the timeout is reached. Only then does Zerops switch traffic to the new version. This means zero-downtime deploys — if the new version fails readiness, the old version continues serving.',
  },
  {
    id: 'env-variables',
    url: 'https://docs.zerops.io/features/env-variables',
    title: 'Environment Variables',
    content: 'Zerops manages environment variables at two scopes: service level and project level. Service variables are defined with envVariables in zerops.yaml build or run sections. Project variables are managed through the GUI and automatically inherited by all services. You can reference variables from other services using ${hostname_key} syntax, e.g. ${db_connectionString} to get the PostgreSQL connection string. This is how services are wired together — no manual connection strings needed. Build and runtime environments are separate; use BUILD_ and RUN_ prefixes to share variables between them.',
  },
  {
    id: 'pipeline',
    url: 'https://docs.zerops.io/features/pipeline',
    title: 'Build & Deploy Pipeline',
    content: 'Zerops provides a customizable build and runtime environment. The build container is temporary and free. The pipeline steps: 1) Initialize build container, 2) Run buildCommands from zerops.yaml, 3) Store build artifact, 4) Delete build container, 5) Download artifact to runtime container, 6) Run initCommands (e.g. migrations), 7) Start application, 8) Check readiness, 9) Activate container. Services with multiple containers deploy in parallel. You can trigger builds via zcli push, GitHub integration, or the GUI.',
  },
  {
    id: 'scaling',
    url: 'https://docs.zerops.io/features/scaling',
    title: 'Automatic Scaling & High Availability',
    content: 'Zerops automatically scales applications and databases based on traffic. Vertical scaling adjusts CPU and RAM per container. Horizontal scaling adds or removes containers (1-10 containers). Set minContainers and maxContainers in the GUI or recipe. Setting identical min and max disables horizontal scaling. Zerops uses exponential growth — small increments for minor load, larger increments for significant demand. Database deployment modes: Single Container (vertical only, for dev) and High Availability (replicated, for production). Scaling is automatic and continuous.',
  },
  {
    id: 'networking',
    url: 'https://docs.zerops.io/features/access',
    title: 'Access & Networking',
    content: 'Zerops provides internal and public access. Internal: services communicate via hostname:port (e.g. http://db:5432) over a private network, isolated per project. No HTTPS needed internally. Public access options: Zerops Subdomain (automatic .zerops.app URL with SSL, best for dev), Custom Domain (your domain with dedicated balancer, best for production), Direct Port Access (TCP/UDP for non-HTTP). VPN access connects your local machine to the project private network. Environment variables like ${db_connectionString} are auto-generated for internal service wiring.',
  },
  {
    id: 'cron',
    url: 'https://docs.zerops.io/zerops-yaml/cron',
    title: 'Cron Jobs & Tasks',
    content: 'Cron jobs are scheduled commands that execute automatically inside service containers. Configured in the run section of zerops.yaml under the crontab key. Each job has: command (shell command to run), timing (standard 5-field cron format), allContainers (true = run on all containers, false = one container only), workingDir (default /var/www). Example: timing "0 0 * * *" runs daily at midnight. Multiple cron jobs can be defined as a list. Cron jobs are useful for scheduled tasks, cleanup, data syncing, or daily stats.',
  },
  {
    id: 'infrastructure',
    url: 'https://docs.zerops.io/features/infrastructure',
    title: 'Project & Services Structure',
    content: 'Zerops organizes infrastructure into three levels: projects, services, and containers. A project is a private network where services communicate internally. Services encapsulate containers and provide functionality — runtimes (Node.js, Python, PHP), databases (PostgreSQL, MariaDB, MongoDB), caches (Valkey/Redis), search (Elasticsearch), message brokers (RabbitMQ), and storage. Each project has a core: Lightweight Core (single container, for dev) or Serious Core (separated services, for production). Services communicate via internal hostnames and share environment variables.',
  },
  {
    id: 'zcp',
    url: 'https://docs.zerops.io/features/coding-agents',
    title: 'ZCP — Infrastructure for Coding Agents',
    content: 'ZCP (Zerops Control Plane) is an MCP server for coding agents, with an optional remote cloud development environment. It makes agents Zerops power users — they understand networking, scaling, debugging, build & deploy, env variables, and service provisioning. The MCP server is a thin layer — no system prompt hogging context. Supports Claude Code, Codex, Antigravity, Grok Build, and Cursor CLI. Workflow: agent deploys, verifies, reads logs, manages env vars, and scales services through MCP tools. Remote setup runs in Zerops; local setup runs on your machine.',
  },
  {
    id: 'cli',
    url: 'https://docs.zerops.io/references/cli',
    title: 'zCLI — Zerops Command Line Interface',
    content: 'zCLI is the command-line tool for Zerops. Install via npm: npm i -g @zerops/zcli. Login with a personal access token: zcli login <token>. Key commands: zcli service deploy (deploy from local), zcli service push (build and deploy), zcli service list (list services), zcli service log (view build/runtime logs), zcli project env (print environment variables), zcli project list (list projects). Supports Linux, macOS, and Windows. Tokens are generated at app.zerops.io/settings/token-management.',
  },
  {
    id: 'nodejs',
    url: 'https://docs.zerops.io/nodejs/overview',
    title: 'Node.js on Zerops',
    content: 'Node.js is supported as a runtime service with base nodejs@24 (also nodejs@22, nodejs@20). Define in zerops.yaml with base: nodejs@24, buildCommands (e.g. npm ci && npm run build), deployFiles (e.g. dist), start (e.g. node dist/server.js). Node.js apps can use PostgreSQL, Valkey, and other Zerops services via env variable references. The build container runs npm ci, next build, etc. The runtime container runs the start command. Ports are exposed with httpSupport: true for web apps.',
  },
  {
    id: 'valkey',
    url: 'https://docs.zerops.io',
    title: 'Valkey (Redis-compatible) on Zerops',
    content: 'Valkey is a Redis-compatible in-memory data store, available as a managed Zerops service (valkey@7.2). Used for caching, session storage, rate limiting, and pub/sub. Connection string is available via ${cache_connectionString} environment variable. Valkey is fully managed — Zerops handles scaling, backups, and high availability. In apps, use ioredis or node-redis to connect. Cache failures should be swallowed gracefully — treat cache as a transparent accelerator, not a hard dependency.',
  },
  {
    id: 'postgresql',
    url: 'https://docs.zerops.io',
    title: 'PostgreSQL on Zerops',
    content: 'PostgreSQL is available as a managed Zerops service (postgresql@18, postgresql@16). Connection string via ${db_connectionString}. Two deployment modes: Single Container (NON_HA, vertical scaling only, for dev) and High Availability (HA, replicated with automatic failover, for production). Fully managed — Zerops handles backups, scaling, and replication. Use the pg npm package or Drizzle ORM to connect. Migrations run via initCommands in zerops.yaml (e.g. node dist/migrate.cjs).',
  },
  {
    id: 'recipes',
    url: 'https://docs.zerops.io/quickstart',
    title: 'Recipes & Quickstart',
    content: 'A recipe is a working app with infrastructure already configured: managed database, environment variables, zerops.yaml, everything connected. Browse recipes at app.zerops.io/recipes. Deploy in one click — no coding needed. The pipeline runs automatically: initialize build container, run build commands, create app version, upgrade service. Build container is temporary and free. You only pay for running services. Recipes exist for Node.js, Python, PHP, Go, Rust, .NET, and more.',
  },
  {
    id: 'deploy-strategy',
    url: 'https://docs.zerops.io/zerops-yaml/specification',
    title: 'Safe Deployment Strategy',
    content: 'Zerops achieves zero-downtime deploys through readiness checks. When a new version deploys: 1) New container starts alongside the old one, 2) initCommands run (migrations), 3) start command launches the app, 4) readinessCheck polls the health endpoint (e.g. GET /api/health on port 3000), 5) Only when health returns 200 does Zerops switch traffic to the new container, 6) Old container is shut down. If readiness fails, the old version keeps serving — users never see a broken deploy. failureTimeout (e.g. 60s) and retryPeriod (e.g. 10s) control the check behavior.',
  },
  {
    id: 'storage',
    url: 'https://docs.zerops.io',
    title: 'Storage on Zerops',
    content: 'Zerops provides S3-compatible object storage as a managed service. Used for files, images, backups, and user uploads. Access via the Zerops storage SDK or standard S3 clients. Storage is shared across containers and can be mounted to runtime services. The storage CDN URL is available via environment variables. Storage is fully managed with automatic scaling and redundancy.',
  },
];

/**
 * Simple TF-IDF based retrieval — no external embedding API needed.
 * Tokenizes text, computes term frequencies, and ranks by cosine similarity.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function termFreq(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [k, v] of a) {
    normA += v * v;
    const bv = b.get(k);
    if (bv) dot += v * bv;
  }
  for (const [, v] of b) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve the top-k most relevant doc chunks for a user query.
 * Uses TF-IDF cosine similarity over the Zerops docs knowledge base.
 */
export function retrieveContext(query: string, topK = 4): DocChunk[] {
  const queryTokens = tokenize(query);
  const queryTf = termFreq(queryTokens);

  const scored = zeropsDocs.map((doc) => {
    const docTokens = tokenize(doc.title + ' ' + doc.content);
    const docTf = termFreq(docTokens);
    return { doc, score: cosineSim(queryTf, docTf) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.doc);
}

/**
 * Check if a query is related to Zerops/cloud deployment topics.
 * Returns false if the query is clearly off-topic.
 */
export function isZeropsRelated(query: string): boolean {
  const q = query.toLowerCase();
  const zeropsKeywords = [
    'zerops', 'deploy', 'cloud', 'hosting', 'yaml', 'pipeline',
    'postgres', 'postgresql', 'valkey', 'redis', 'cache', 'database',
    'node', 'nodejs', 'python', 'php', 'runtime', 'container',
    'scaling', 'infrastructure', 'cron', 'job', 'schedule',
    'environment', 'env', 'variable', 'secret', 'cli', 'zcli',
    'zcp', 'agent', 'mcp', 'recipe', 'storage', 'backup',
    'network', 'vpn', 'subdomain', 'domain', 'ssl', 'port',
    'service', 'project', 'build', 'migration', 'health', 'check',
    'readiness', 'docker', 'alpine', 'ubuntu', 'linux',
    'api', 'rest', 'key', 'token', 'auth',
    'queue', 'rabbit', 'message', 'broker',
    'search', 'elastic', 'maria', 'mongo',
    'git', 'github', 'push', 'auto', 'scale',
    'high availability', 'ha', 'redundancy', 'failover',
    'bucket', 's3', 'object storage',
    'log', 'forward', 'debug',
  ];
  return zeropsKeywords.some((kw) => q.includes(kw));
}

const { Pool } = require('pg');
const Redis = require('ioredis');

/**
 * Daily cron job (run.crontab): picks the featured lesson of the day and
 * recomputes simple stats, storing the result in Valkey for the API.
 *
 * Must close connections and exit(0) so the cron runner completes cleanly.
 */
async function main() {
  const featured = {
    lessonId: ['first-deploy', 'zerops-yml-anatomy', 'env-variables-wiring'][new Date().getDay() % 3],
    computedAt: new Date().toISOString(),
  };

  let stats = { lessonsAnswered: 0, quizSubmissions: 0 };

  const redis = new Redis(process.env.CACHE_URL, { maxRetriesPerRequest: 1 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const lessonCount = await pool.query('SELECT COUNT(*)::int AS c FROM lessons').catch(() => ({ rows: [{ c: 0 }] }));
    const scoreCount = await pool.query('SELECT COUNT(*)::int AS c FROM scores').catch(() => ({ rows: [{ c: 0 }] }));
    stats = {
      lessonsAnswered: lessonCount.rows?.[0]?.c ?? 0,
      quizSubmissions: scoreCount.rows?.[0]?.c ?? 0,
    };
  } finally {
    await pool.end().catch(() => {});
  }

  await redis.set('academy:featured', JSON.stringify(featured), 'EX', 60 * 60 * 26).catch(() => {});
  await redis.set('academy:stats', JSON.stringify(stats), 'EX', 60 * 60 * 26).catch(() => {});
  redis.disconnect();

  console.log('daily cron:', JSON.stringify({ featured, stats }));
  process.exit(0);
}

main().catch((e) => {
  console.error('daily cron failed', e);
  process.exit(1);
});
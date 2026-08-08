import { NextResponse } from 'next/server';
import { db } from '@/db';
import { scores } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import { cacheGet, cacheSet } from '@/lib/cache';

const LEADERBOARD_KEY = 'leaderboard:top10';

export async function GET() {
  // Cache the leaderboard for 30s — the cheap way to survive a refresh storm.
  const cached = await cacheGet<unknown[]>(LEADERBOARD_KEY);
  if (cached) return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });

  try {
    const rows = await db
      .select({
        username: scores.username,
        totalCorrect: sql<number>`sum(${scores.correct})::int`,
        totalAnswered: sql<number>`sum(${scores.total})::int`,
        submissions: sql<number>`count(*)::int`,
      })
      .from(scores)
      .groupBy(scores.username)
      .orderBy(desc(sql`sum(${scores.correct})`));
    const top = rows.slice(0, 10);
    await cacheSet(LEADERBOARD_KEY, top, 30);
    return NextResponse.json(top);
  } catch (e) {
    console.error('DB read error', e);
    return NextResponse.json([]);
  }
}
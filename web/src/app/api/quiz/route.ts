import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scores } from '@/db/schema';
import { curatedLessons } from '@/content/lessons';
import { cacheIncr } from '@/lib/cache';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { username, lessonId, answers } = (body ?? {}) as {
    username?: string;
    lessonId?: string;
    answers?: number[];
  };

  if (!username || !lessonId || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'username, lessonId and answers are required' }, { status: 400 });
  }
  if (username.length > 24) {
    return NextResponse.json({ error: 'username must be 24 characters or fewer' }, { status: 400 });
  }

  const lesson = curatedLessons.find((l) => l.id === lessonId || l.slug === lessonId);
  if (!lesson) {
    return NextResponse.json({ error: 'unknown lessonId' }, { status: 400 });
  }
  if (answers.length !== lesson.quiz.length || answers.some((a) => typeof a !== 'number' || a < 0 || a > 3)) {
    return NextResponse.json({ error: 'answers must match quiz length' }, { status: 400 });
  }

  const correct = lesson.quiz.reduce((acc, q, i) => acc + (q.answerIndex === answers[i] ? 1 : 0), 0);
  const total = lesson.quiz.length;

  await cacheIncr('stats:submissions');

  try {
    const inserted = await db
      .insert(scores)
      .values({
        username: username.trim(),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        correct,
        total,
      })
      .returning();
    return NextResponse.json({ id: inserted[0]?.id, correct, total });
  } catch (e) {
    console.error('DB insert error', e);
    // Even without a DB the quiz still grades (quiz-graded-in-cache-fallback story)
    return NextResponse.json({ id: null, correct, total, persisted: false });
  }
}
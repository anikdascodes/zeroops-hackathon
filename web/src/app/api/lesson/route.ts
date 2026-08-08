import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons } from '@/db/schema';
import { Lesson, LessonScene, QuizQuestion } from '@/types/lesson';
import { curatedLessons, findCuratedLesson } from '@/content/lessons';
import { cacheGet, cacheSet } from '@/lib/cache';
import { eq } from 'drizzle-orm';

function curatedToLesson(cl: (typeof curatedLessons)[number]): Lesson {
  return {
    id: cl.id,
    query: cl.slug,
    title: cl.title,
    scenes: cl.scenes,
    createdAt: new Date(0).toISOString(),
    videoUrl: `/videos/${cl.slug}.mp4`,
  };
}

function attachQuiz(cl: (typeof curatedLessons)[number]): { quiz?: QuizQuestion[] } {
  return { quiz: cl.quiz };
}

async function generateWithGemini(query: string): Promise<Lesson | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'PLACEHOLDER_WILL_UPDATE_LATER') return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an expert on Zerops (zerops.io). A user asks: "${query}". Create a short interactive lesson with 2-4 scenes. Each scene has a title (max 5 words), explanation text (max 40 words), and an optional code/snippet field. Return ONLY valid JSON:
{"title":"...","scenes":[{"title":"...","text":"...","code":"..."}]}
Rules: titles <=5 words, text <=40 words, keep code short (<150 chars), no markdown fences. If not a Zerops/cloud question, return a lesson titled "Not a Zerops topic" explaining we cover Zerops.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const scenes: LessonScene[] = (parsed.scenes || []).map((s: any) => ({
      title: s.title || 'Scene',
      text: s.text || '',
      code: s.code || undefined,
      durationInFrames: 150,
    }));
    if (!scenes.length) return null;
    return {
      id: Date.now().toString(),
      query,
      title: parsed.title || 'Zerops Lesson',
      scenes,
      createdAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error('Gemini error', e);
    return null;
  }
}

function fallbackLesson(query: string): Lesson {
  return {
    id: 'fallback',
    query,
    title: 'Zerops Overview',
    scenes: [
      {
        title: 'What is Zerops?',
        text: 'Zerops is a developer-first platform for deploying, running, and scaling applications. You write code, Zerops runs the infrastructure.',
        durationInFrames: 150,
      },
      {
        title: 'Services talk on a private network',
        text: 'Every project has its own network. Services reach each other by hostname like db:5432 or cache:6379 — wired via environment references.',
        code: 'DATABASE_URL: ${db_connectionString}\nCACHE_URL: ${cache_connectionString}',
        durationInFrames: 150,
      },
    ],
    createdAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (slug === 'list') {
    const items = curatedLessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      tagline: l.tagline,
      minutes: l.minutes,
      questions: l.quiz.length,
    }));
    return NextResponse.json(items);
  }
  const lesson = slug ? curatedLessons.find((l) => l.slug === slug || l.id === slug) : curatedLessons[0];
  if (!lesson) return NextResponse.json({ error: 'lesson not found' }, { status: 404 });
  return NextResponse.json({ ...curatedToLesson(lesson), quiz: lesson.quiz, slug: lesson.slug, tagline: lesson.tagline });
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }
  const q = query.trim();

  // Cache generated lessons for 1h to make repeat queries instant.
  const cacheKey = `lesson:${q.toLowerCase()}`;
  const cached = await cacheGet<Lesson>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const existing = await db.query.lessons.findFirst({
      where: eq(lessons.query, q),
      orderBy: (l, { desc }) => [desc(l.createdAt)],
    });
    if (existing) {
      const lesson: Lesson = {
        id: existing.id,
        query: existing.query,
        title: existing.title,
        scenes: existing.scenes as LessonScene[],
        createdAt: existing.createdAt.toISOString(),
      };
      return NextResponse.json(lesson);
    }
  } catch (e) {
    console.error('DB read error', e);
  }

  // 1) curated content matches common Zerops questions
  const curated = findCuratedLesson(q);
  if (curated) {
    const lesson = curatedToLesson(curated);
    await cacheSet(cacheKey, lesson, 3600);
    return NextResponse.json({ ...lesson, ...attachQuiz(curated), slug: curated.slug });
  }

  // 2) AI generation for anything else Zerops-related
  const generated = await generateWithGemini(q);
  let lesson = generated ?? fallbackLesson(q);

  try {
    const inserted = await db
      .insert(lessons)
      .values({ query: q, title: lesson.title, scenes: lesson.scenes as any })
      .returning();
    if (inserted[0]) lesson.id = inserted[0].id;
  } catch (e) {
    console.error('DB insert error', e);
  }

  await cacheSet(cacheKey, lesson, 3600);
  return NextResponse.json(lesson);
}
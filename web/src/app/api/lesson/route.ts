import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons } from '@/db/schema';
import { Lesson, LessonScene, QuizQuestion } from '@/types/lesson';
import { curatedLessons, findCuratedLesson } from '@/content/lessons';
import { cacheGet, cacheSet } from '@/lib/cache';
import { narrateScenes } from '@/lib/tts';
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

/**
 * Generate a structured lesson via Groq LLM (llama-3.3-70b-versatile).
 * Groq's API is OpenAI-compatible — same chat completions shape.
 */
async function generateWithGroq(query: string): Promise<Lesson | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert on Zerops (zerops.io), a developer-first deployment platform. Create short interactive lessons. Return ONLY valid JSON, no markdown fences, no preamble.',
          },
          {
            role: 'user',
            content: `A user asks: "${query}". Create a lesson with 2-4 scenes. Return JSON:
{"title":"...","scenes":[{"title":"...","text":"...","code":"..."}]}
Rules: titles max 5 words, text max 40 words, code optional and short (<150 chars). If not a Zerops/cloud topic, return title "Not a Zerops topic".`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error('Groq LLM error:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
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
    console.error('Groq LLM error', e);
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

  // 2) AI generation via Groq LLM for anything else
  const generated = await generateWithGroq(q);
  let lesson = generated ?? fallbackLesson(q);

  // 3) Generate TTS narration for each scene via Groq TTS (parallel)
  try {
    lesson.scenes = await narrateScenes(lesson.scenes, lesson.id);
  } catch (e) {
    console.error('TTS error', e);
  }

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

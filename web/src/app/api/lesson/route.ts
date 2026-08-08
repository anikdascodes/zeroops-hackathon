import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons } from '@/db/schema';
import { Lesson, LessonScene, QuizQuestion } from '@/types/lesson';
import { curatedLessons, findCuratedLesson } from '@/content/lessons';
import { cacheGet, cacheSet } from '@/lib/cache';
import { narrateScenes } from '@/lib/tts';
import { retrieveContext, isZeropsRelated } from '@/lib/rag';
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
 * Remotion design guidance injected into the LLM system prompt.
 * This helps the LLM generate scene descriptions that translate well
 * into animated video compositions — even with a less powerful model.
 */
const REMOTION_DESIGN_PROMPT = `VIDEO DESIGN RULES (for Remotion animated composition):
- Each scene has: a short title (max 5 words), narration text (max 35 words, conversational tone), and optional code snippet (max 120 chars).
- Write narration as spoken English — first person, active voice, like a tutor explaining to a student.
- Keep scenes to 2-3 max for a tight, focused lesson.
- Code snippets should be real Zerops YAML or CLI commands, not pseudocode.
- Structure each scene as a self-contained teaching moment with a clear takeaway.`;

/**
 * Generate a structured lesson via Groq LLM with RAG context.
 * Retrieves relevant Zerops documentation chunks and injects them
 * into the prompt so the LLM grounds its answer in real docs.
 */
async function generateWithGroq(query: string): Promise<Lesson | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  // RAG: retrieve relevant documentation chunks
  const contextChunks = retrieveContext(query, 4);
  const contextText = contextChunks
    .map((c) => `--- ${c.title} (${c.url}) ---\n${c.content}`)
    .join('\n\n');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `You are an expert tutor on Zerops (zerops.io), a developer-first deployment platform. You create short, animated video lessons.

Use ONLY the provided documentation context to answer accurately. If the context doesn't cover the question, say so honestly.

${REMOTION_DESIGN_PROMPT}

Return ONLY valid JSON, no markdown fences, no preamble. Format:
{"title":"...","scenes":[{"title":"...","text":"...","code":"..."}]}`,
          },
          {
            role: 'user',
            content: `User question: "${query}"

Relevant Zerops documentation:
${contextText}

Create a lesson answering this question. Ground your answer in the documentation above.`,
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

/**
 * Polite refusal lesson for non-Zerops questions.
 */
function offTopicLesson(query: string): Lesson {
  return {
    id: 'off-topic',
    query,
    title: 'Not a Zerops Topic',
    scenes: [
      {
        title: 'We focus on Zerops',
        text: 'Zerops Academy covers Zerops and cloud deployment topics — zerops.yaml, services, scaling, databases, caching, cron, networking, and the ZCP agent platform. Ask me about any of those and I will create a full animated lesson with narration.',
        durationInFrames: 180,
      },
    ],
    createdAt: new Date().toISOString(),
  };
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

  // 2) Topic guard — politely refuse non-Zerops questions
  if (!isZeropsRelated(q)) {
    const lesson = offTopicLesson(q);
    return NextResponse.json(lesson);
  }

  // 3) AI generation via Groq LLM with RAG context
  const generated = await generateWithGroq(q);
  let lesson = generated ?? fallbackLesson(q);

  // 4) Generate TTS narration for each scene via Groq TTS
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

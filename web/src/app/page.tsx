'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { QuestionForm } from '@/components/QuestionForm';
import { Quiz } from '@/components/Quiz';
import { Leaderboard } from '@/components/Leaderboard';
import { Lesson, QuizQuestion } from '@/types/lesson';

const LessonPlayer = dynamic(() => import('@/remotion/LessonPlayer'), { ssr: false });

interface LessonMeta {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  minutes: number;
  questions: number;
}

interface ActiveLesson extends Lesson {
  quiz?: QuizQuestion[];
  slug?: string;
  tagline?: string;
}

export default function Home() {
  const [library, setLibrary] = useState<LessonMeta[]>([]);
  const [lesson, setLesson] = useState<ActiveLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/lesson?slug=list')
      .then((r) => r.json())
      .then((items: LessonMeta[]) => setLibrary(items))
      .catch(() => {});
  }, []);

  async function handleSubmit(query: string) {
    setLoading(true);
    setError('');
    setLesson(null);
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error();
      const data: ActiveLesson = await res.json();
      setLesson(data);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function openCurated(slug: string) {
    setLoading(true);
    setError('');
    setLesson(null);
    try {
      const res = await fetch(`/api/lesson?slug=${encodeURIComponent(slug)}`);
      const data: ActiveLesson = await res.json();
      setLesson(data);
    } catch {
      setError('Could not load lesson.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.35em] uppercase text-zinc-500 mb-3">Zerops Academy</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Learn Cloud. Deploy Fast.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Ask anything about Zerops — or pick a curated lesson — and get an animated interactive lesson with a quiz.
            Every question is cached in Valkey, every score lands on a Postgres-backed leaderboard.
          </p>
        </div>

        <QuestionForm onSubmit={handleSubmit} loading={loading} />

        {error && <p className="text-red-400 text-center mt-6">{error}</p>}

        {lesson && (
          <section className="mt-14 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-3xl font-semibold text-white">{lesson.title}</h2>
                {lesson.tagline && <p className="text-zinc-500 mt-1">{lesson.tagline}</p>}
              </div>
              <LessonPlayer scenes={lesson.scenes} lessonTitle={lesson.title} />
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h3 className="text-lg font-semibold mb-4 text-zinc-200">Lesson Script</h3>
                <div className="space-y-4">
                  {lesson.scenes.map((scene, i) => (
                    <div key={i} className="border-l-2 border-blue-500 pl-4">
                      <p className="font-semibold text-blue-400">{i + 1}. {scene.title}</p>
                      <p className="text-zinc-300 mt-1">{scene.text}</p>
                      {scene.code && (
                        <pre className="mt-2 bg-zinc-950 p-3 rounded text-sm font-mono text-green-400 overflow-x-auto">
                          {scene.code}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {lesson.quiz && <Quiz questions={lesson.quiz} lessonId={lesson.slug ?? lesson.id} />}
            </div>
            <aside className="space-y-6">
              <Leaderboard />
            </aside>
          </section>
        )}

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Course Library</h2>
            <span className="text-sm text-zinc-500">{library.length} lessons</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {library.map((item) => (
              <button
                key={item.id}
                onClick={() => openCurated(item.slug)}
                className="text-left p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/60 hover:bg-zinc-800/60 transition group"
              >
                <h3 className="font-semibold text-zinc-100 group-hover:text-blue-300 transition">{item.title}</h3>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{item.tagline}</p>
                <div className="flex items-center gap-3 mt-4 text-xs text-zinc-500">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800">{item.minutes} min</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800">{item.questions} quiz questions</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="text-center text-zinc-600 text-sm mt-16 pb-4">
          Built on Zerops — Next.js frontend, PostgreSQL database, Valkey cache, cron worker.{' '}
          <a
            className="text-zinc-400 underline underline-offset-2 hover:text-blue-400"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
        </footer>
      </div>
    </main>
  );
}
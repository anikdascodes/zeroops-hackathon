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
    <main className="min-h-screen px-6 md:px-12 py-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header — asymmetric, no centered blob */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 bg-ember" />
            <span className="font-mono text-xs text-dust uppercase tracking-[0.2em]">zerops academy</span>
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-bone leading-[0.95]">
              Learn cloud.<br />
              <span className="text-ember">Deploy fast.</span>
            </h1>
            <p className="font-body text-dust text-base max-w-xs md:text-right">
              Animated lessons on Zerops, each with a quiz. Scores land on a live Postgres leaderboard, cached in Valkey.
            </p>
          </div>
        </header>

        {/* Terminal-prompt search */}
        <div className="mb-4">
          <QuestionForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {error && <p className="text-rust font-body text-sm mt-4">{error}</p>}

        {/* Active lesson */}
        {lesson && (
          <section className="mt-12 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <button
                onClick={() => {
                  setLesson(null);
                  setError('');
                  document.getElementById('course-library')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-dust hover:text-bone transition-colors text-sm font-mono"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                back
              </button>

              <div>
                <h2 className="font-display text-3xl font-bold text-bone tracking-tight">{lesson.title}</h2>
                {lesson.tagline && <p className="text-dust mt-1 font-body">{lesson.tagline}</p>}
              </div>

              <LessonPlayer
                scenes={lesson.scenes}
                lessonTitle={lesson.title}
                slug={lesson.slug ?? lesson.id}
                videoUrl={lesson.videoUrl}
              />

              <div className="bg-coal border border-ash p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-xs text-dust uppercase tracking-wider">transcript</span>
                  <div className="h-px flex-1 bg-ash/60" />
                </div>
                <div className="space-y-4">
                  {lesson.scenes.map((scene, i) => (
                    <div key={i} className="border-l-2 border-ember/40 pl-4">
                      <p className="font-display font-bold text-sm text-ember mb-1">
                        {String(i + 1).padStart(2, '0')} {scene.title}
                      </p>
                      <p className="text-dust font-body text-sm leading-relaxed">{scene.text}</p>
                      {scene.code && (
                        <pre className="mt-2 bg-ink p-3 border border-ash/60 text-xs font-mono text-moss overflow-x-auto">
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

        {/* Course Library — file/package entry aesthetic */}
        <section id="course-library" className="mt-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-brass" />
                <span className="font-mono text-xs text-dust uppercase tracking-[0.2em]">curated lessons</span>
              </div>
              <h2 className="font-display text-3xl font-bold text-bone tracking-tight">Course Library</h2>
            </div>
            <span className="font-mono text-sm text-dust">{library.length} lessons</span>
          </div>

          <div className="grid gap-px bg-ash/30 border border-ash/30 md:grid-cols-2">
            {library.map((item) => (
              <button
                key={item.id}
                onClick={() => openCurated(item.slug)}
                className="text-left bg-coal hover:bg-slag p-5 transition-colors group flex items-start gap-4"
              >
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 border border-ash group-hover:border-ember transition-colors flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-dust group-hover:text-ember transition-colors">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-dust/60 mb-1">{item.slug}</p>
                  <h3 className="font-display font-bold text-bone group-hover:text-ember transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-dust text-sm mt-1 font-body line-clamp-2">{item.tagline}</p>
                  <div className="flex items-center gap-4 mt-3 font-mono text-xs text-dust/60">
                    <span>{item.minutes}min</span>
                    <span>{item.questions}q</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-ash/40">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="font-mono text-xs text-dust/60">
              next.js · postgresql · valkey · cron — deployed on zerops
            </p>
            <a
              className="font-mono text-xs text-dust hover:text-ember transition-colors"
              href="https://github.com/anikdascodes/zeroops-hackathon"
              target="_blank"
              rel="noreferrer"
            >
              source →
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

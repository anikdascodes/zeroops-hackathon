'use client';

import { useState } from 'react';
import { QuizQuestion } from '@/types/lesson';

interface QuizProps {
  questions: QuizQuestion[];
  lessonId: string;
  onFinish?: (correct: number, total: number) => void;
}

export function Quiz({ questions, lessonId, onFinish }: QuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const correctNow = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
    0
  );

  function select(i: number, opt: number) {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, j) => (j === i ? opt : a)));
  }

  async function submit() {
    if (answers.some((a) => a === null)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name || 'anon', lessonId, answers: answers as number[] }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ correct: data.correct, total: data.total });
        setSubmitted(true);
        onFinish?.(data.correct, data.total);
      } else {
        setResult({ correct: correctNow, total: questions.length });
        setSubmitted(true);
      }
    } catch {
      setResult({ correct: correctNow, total: questions.length });
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Quiz</h3>
        {result && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              result.correct === result.total
                ? 'bg-green-500/20 text-green-400'
                : result.correct / result.total >= 0.5
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
            }`}
          >
            {result.correct}/{result.total}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => {
          const answered = submitted;
          return (
            <div key={i} className="border-b border-zinc-800 last:border-0 pb-6 last:pb-0">
              <p className="text-zinc-200 mb-3 font-medium">
                <span className="text-blue-400 mr-2">{i + 1}.</span>
                {q.q}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => {
                  let cls =
                    answers[i] === oi
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-zinc-700 text-zinc-300 hover:border-zinc-500';
                  if (answered) {
                    if (oi === q.answerIndex) cls = 'border-green-500 bg-green-500/10 text-green-400';
                    else if (answers[i] === oi) cls = 'border-red-500 bg-red-500/10 text-red-400';
                    else cls = 'border-zinc-800 text-zinc-500';
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => select(i, oi)}
                      className={`text-left px-4 py-2.5 rounded-lg border text-sm transition ${cls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className="text-sm text-zinc-400 mt-3 pl-4 border-l-2 border-zinc-700">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-6 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder="name for leaderboard (optional)"
            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={submit}
            disabled={saving || answers.some((a) => a === null)}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-40"
          >
            {saving ? 'Grading...' : 'Submit answers'}
          </button>
        </div>
      )}
    </div>
  );
}
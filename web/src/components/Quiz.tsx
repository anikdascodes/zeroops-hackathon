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
    <div className="bg-coal border border-ash p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold text-bone tracking-tight">Check your knowledge</h3>
        {result && (
          <span
            className={`font-mono text-sm px-2.5 py-1 ${
              result.correct === result.total
                ? 'text-moss'
                : result.correct / result.total >= 0.5
                  ? 'text-brass'
                  : 'text-rust'
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
            <div key={i} className="border-b border-ash/60 last:border-0 pb-6 last:pb-0">
              <p className="text-bone mb-3 font-medium">
                <span className="font-mono text-ember mr-2 text-sm">{String(i + 1).padStart(2, '0')}</span>
                {q.q}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => {
                  let cls = answers[i] === oi
                    ? 'border-ember bg-ember/10 text-bone'
                    : 'border-ash text-dust hover:border-dust/60 hover:text-bone';
                  if (answered) {
                    if (oi === q.answerIndex) cls = 'border-moss bg-moss/10 text-bone';
                    else if (answers[i] === oi) cls = 'border-rust bg-rust/10 text-bone';
                    else cls = 'border-ash/40 text-dust/50';
                  }
                  const letter = String.fromCharCode(97 + oi);
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => select(i, oi)}
                      className={`text-left px-4 py-2.5 border text-sm transition flex items-start gap-3 font-body ${cls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="font-mono text-xs mt-0.5 opacity-60">{letter}.</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className="text-sm text-dust mt-3 pl-4 border-l-2 border-ash font-body">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-6 flex gap-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder="name for leaderboard (optional)"
            className="flex-1 px-4 py-2.5 bg-ink border border-ash text-bone text-sm font-body placeholder-dust/50 focus:outline-none focus:border-ember"
          />
          <button
            onClick={submit}
            disabled={saving || answers.some((a) => a === null)}
            className="px-6 py-2.5 bg-ember text-ink font-display font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ember/90 transition-colors"
          >
            {saving ? '...' : 'SUBMIT'}
          </button>
        </div>
      )}
    </div>
  );
}

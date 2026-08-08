'use client';

import { useEffect, useState } from 'react';

interface Row {
  username: string;
  totalCorrect: number;
  totalAnswered: number;
  submissions: number;
}

export function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  if (!rows.length) return null;

  const medals = ['1st', '2nd', '3rd'];

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">Leaderboard</h3>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.username}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800"
          >
            <span className="flex items-center gap-3">
              <span className="w-6 text-center">{medals[i] ?? <span className="text-zinc-500">{i + 1}</span>}</span>
              <span className="text-zinc-200 font-medium">{r.username}</span>
            </span>
            <span className="text-sm text-zinc-400">
              {r.totalCorrect}/{r.totalAnswered} · {r.submissions}x
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
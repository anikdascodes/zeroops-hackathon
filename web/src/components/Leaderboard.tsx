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

  return (
    <div className="bg-coal border border-ash p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs text-dust uppercase tracking-wider">leaderboard</span>
        <div className="h-px flex-1 bg-ash/60" />
      </div>
      <ol className="space-y-1">
        {rows.map((r, i) => (
          <li
            key={r.username}
            className="flex items-center justify-between px-3 py-2.5 hover:bg-slag/50 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className={`font-mono text-xs w-5 text-right ${i < 3 ? 'text-ember' : 'text-dust/50'}`}>
                {i + 1}
              </span>
              <span className="text-bone font-medium text-sm">{r.username}</span>
            </span>
            <span className="font-mono text-xs text-dust">
              {r.totalCorrect}/{r.totalAnswered}
              <span className="text-dust/40 ml-2">{r.submissions}x</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

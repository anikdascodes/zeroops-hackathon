'use client';

import { useState } from 'react';

export function QuestionForm({ onSubmit, loading }: { onSubmit: (q: string) => void; loading: boolean }) {
  const [query, setQuery] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (query.trim()) onSubmit(query.trim());
      }}
      className="w-full max-w-2xl"
    >
      <div className="flex items-center gap-0 bg-coal border border-ash focus-within:border-ember transition-colors">
        <span className="font-mono text-sm text-ember pl-4 pr-2 select-none shrink-0">zerops&gt;</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="how do I deploy a Node.js app?"
          className="flex-1 px-1 py-3.5 bg-transparent text-bone placeholder-dust/60 font-mono text-sm focus:outline-none"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-3.5 bg-ember text-ink font-display font-bold text-sm tracking-wide hover:bg-ember/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {loading ? '...' : 'RUN'}
        </button>
      </div>
    </form>
  );
}

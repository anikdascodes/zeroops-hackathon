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
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about Zerops: How do I deploy a Node.js app?"
          className="flex-1 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Learn'}
        </button>
      </div>
    </form>
  );
}

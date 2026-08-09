import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/quiz/route';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'score-1' }]),
      }),
    }),
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheIncr: vi.fn().mockResolvedValue(1),
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/quiz', () => {
  it('grades all-correct answers as full score', async () => {
    const res = await POST(
      makeRequest({ username: 'alice', lessonId: 'first-deploy', answers: [1, 1, 1] })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.correct).toBe(3);
    expect(body.total).toBe(3);
  });

  it('grades partially-correct answers correctly', async () => {
    const res = await POST(
      makeRequest({ username: 'bob', lessonId: 'first-deploy', answers: [0, 1, 2] })
    );
    const body = await res.json();
    expect(body.correct).toBe(1);
    expect(body.total).toBe(3);
  });

  it('rejects an unknown lessonId', async () => {
    const res = await POST(makeRequest({ username: 'x', lessonId: 'nope', answers: [1] }));
    expect(res.status).toBe(400);
  });

  it('rejects answer arrays that do not match quiz length', async () => {
    const res = await POST(makeRequest({ username: 'x', lessonId: 'first-deploy', answers: [1] }));
    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const res = await POST(makeRequest({ username: 'x' }));
    expect(res.status).toBe(400);
  });
});
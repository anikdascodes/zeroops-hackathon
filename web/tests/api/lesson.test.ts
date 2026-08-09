import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/lesson/route';

vi.mock('@/db', () => ({
  db: {
    query: {
      lessons: {
        findFirst: vi.fn().mockRejectedValue(new Error('db unavailable')),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
      returning: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/tts', () => ({
  narrateScenes: vi.fn().mockImplementation((scenes: any[]) => Promise.resolve(scenes)),
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/lesson', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/lesson validation', () => {
  it.each([
    ['missing query', makeRequest({})],
    ['empty query', makeRequest({ query: '' })],
    ['non-string query', makeRequest({ query: 123 })],
  ])('returns 400 for %s', async (_, req) => {
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Query is required');
  });
});

describe('POST /api/lesson content', () => {
  it('returns a predefined lesson for a known Zerops topic', async () => {
    const res = await POST(makeRequest({ query: 'How do I deploy a Node.js app?' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Your First Deploy on Zerops');
    expect(Array.isArray(body.scenes)).toBe(true);
    expect(body.scenes.length).toBeGreaterThan(0);
    expect(Array.isArray(body.quiz)).toBe(true);
    expect(body.slug).toBe('first-deploy');
    for (const scene of body.scenes) {
      expect(scene.title).toBeTruthy();
      expect(scene.text).toBeTruthy();
      expect(typeof scene.durationInFrames).toBe('number');
    }
  });

  it('returns the ZCP lesson for a what-is-zcp query', async () => {
    const res = await POST(makeRequest({ query: 'what is zcp' }));
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe('ZCP: AI Agents on Real Infra');
  });

  it('returns an off-topic lesson for a non-Zerops query', async () => {
    const res = await POST(makeRequest({ query: 'how to bake a cake' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Not a Zerops Topic');
    expect(body.id).toBe('off-topic');
  });
});
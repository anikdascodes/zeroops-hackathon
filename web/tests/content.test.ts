import { describe, it, expect } from 'vitest';
import { findCuratedLesson, curatedLessons } from '@/content/lessons';

describe('content library', () => {
  it('has at least 8 lessons and every lesson has a quiz', () => {
    expect(curatedLessons.length).toBeGreaterThanOrEqual(8);
    for (const lesson of curatedLessons) {
      expect(lesson.title).toBeTruthy();
      expect(lesson.scenes.length).toBeGreaterThanOrEqual(2);
      expect(lesson.quiz.length).toBeGreaterThanOrEqual(3);
      for (const q of lesson.quiz) {
        expect(q.options.length).toBe(4);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(4);
        expect(q.explanation).toBeTruthy();
      }
    }
  });

  it('matches natural questions to the right lesson', () => {
    expect(findCuratedLesson('How do I deploy a Node.js app on zerops?')?.id).toBe('first-deploy');
    expect(findCuratedLesson('what is zcp')?.id).toBe('zcp-agents');
    expect(findCuratedLesson('how do environment variables work?')?.id).toBe('env-variables-wiring');
    expect(findCuratedLesson('tell me about postgres migrations')?.id).toBe('postgres-migrations');
    expect(findCuratedLesson('redis caching for sessions')?.id).toBe('valkey-caching');
    expect(findCuratedLesson('how do cron jobs run')?.id).toBe('cron-workers');
    expect(findCuratedLesson('horizontal and vertical scaling')?.id).toBe('scaling');
    expect(findCuratedLesson('public access and domains')?.id).toBe('networking');
  });

  it('returns undefined for unrelated questions', () => {
    expect(findCuratedLesson('how to bake sourdough bread')).toBeUndefined();
  });
});
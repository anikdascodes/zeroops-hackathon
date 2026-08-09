import { pgTable, text, timestamp, json, uuid, integer } from 'drizzle-orm/pg-core';

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  query: text('query').notNull(),
  title: text('title').notNull(),
  scenes: json('scenes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull(),
  lessonId: text('lesson_id').notNull(),
  lessonTitle: text('lesson_title').notNull(),
  correct: integer('correct').notNull(),
  total: integer('total').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const audioAssets = pgTable('audio_assets', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LessonRow = typeof lessons.$inferSelect;
export type LessonInsert = typeof lessons.$inferInsert;
export type ScoreRow = typeof scores.$inferSelect;
export type ScoreInsert = typeof scores.$inferInsert;
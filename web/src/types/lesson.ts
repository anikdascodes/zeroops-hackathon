export interface LessonScene {
  title: string;
  text: string;
  code?: string;
  durationInFrames: number;
}

export interface Lesson {
  id: string;
  query: string;
  title: string;
  scenes: LessonScene[];
  createdAt: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ScoreEntry {
  id: string;
  username: string;
  lessonId: string;
  lessonTitle: string;
  correct: number;
  total: number;
  createdAt: string;
}
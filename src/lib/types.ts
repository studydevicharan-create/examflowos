export interface SyllabusNode {
  id: string;
  parentId: string | null;
  subjectId: string;
  title: string;
  depth: number; // 0=subject, 1=unit, 2=topic, 3+=subtopic
  completed: boolean;
  important: boolean;
  notes: string; // bullet-point markdown
  lastRevised: string | null; // ISO date
  order: number;
  children: string[]; // child node IDs
  tags: ('important' | 'formula' | 'theory')[];
}

export interface Flashcard {
  id: string;
  topicId: string;
  subjectId: string;
  prompt: string; // the question / trigger
  reveal: string; // answer / hint (optional — can be empty)
  // Tracking
  easeCount: number;
  hardCount: number;
  skipCount: number;
  lastSeen: string | null;
  // SM-2 scheduling
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

export interface Subject {
  id: string;
  title: string;
  color: string;
  rootNodeId: string;
  createdAt: string;
  lastStudied: string | null;
}

export interface DailyStats {
  date: string;
  cardsReviewed: number;
  accuracy: number;
  topicsCompleted: number;
  studyStreak: number;
}

export type RecallMode = 'topic' | 'subject' | 'weak' | 'random' | 'exam' | 'important';

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
  front: string;
  back: string;
  // SM-2 fields
  easeFactor: number; // starts at 2.5
  interval: number; // days
  repetitions: number;
  nextReview: string; // ISO date
  lastSeen: string | null;
  accuracy: number; // 0-1
  streak: number;
  hardCount: number;
  totalReviews: number;
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

export type RecallMode = 'topic' | 'subject' | 'weak' | 'random' | 'exam';

export interface SyllabusNode {
  id: string;
  parentId: string | null;
  subjectId: string;
  title: string;
  depth: number;
  completed: boolean;
  important: boolean;
  notes: string;
  lastRevised: string | null;
  order: number;
  children: string[];
  tags: ('important' | 'formula' | 'theory')[];
}

export type CardType = 'text' | 'image';

export interface Flashcard {
  id: string;
  topicId: string;
  subjectId: string;
  type: CardType;
  prompt: string;
  reveal: string;
  image: string; // base64 data URL for image cards, empty for text
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

export type RecallMode = 'topic' | 'subject' | 'weak' | 'random' | 'exam' | 'important' | 'image';

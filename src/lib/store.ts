import { v4 as uuidv4 } from 'uuid';
import type { Subject, SyllabusNode, Flashcard, DailyStats } from './types';

const KEYS = {
  subjects: 'studyapp_subjects',
  nodes: 'studyapp_nodes',
  flashcards: 'studyapp_flashcards',
  stats: 'studyapp_stats',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Subjects ---
export function getSubjects(): Subject[] {
  return load<Subject[]>(KEYS.subjects, []);
}

export function saveSubjects(subjects: Subject[]) {
  save(KEYS.subjects, subjects);
}

export function addSubject(title: string, color: string): Subject {
  const id = uuidv4();
  const rootNodeId = uuidv4();
  const subject: Subject = { id, title, color, rootNodeId, createdAt: new Date().toISOString(), lastStudied: null };
  const rootNode: SyllabusNode = {
    id: rootNodeId, parentId: null, subjectId: id, title, depth: 0,
    completed: false, important: false, notes: '', lastRevised: null,
    order: 0, children: [], tags: [],
  };
  const subjects = getSubjects();
  subjects.push(subject);
  saveSubjects(subjects);
  const nodes = getNodes();
  nodes[rootNodeId] = rootNode;
  saveNodes(nodes);
  return subject;
}

export function deleteSubject(id: string) {
  saveSubjects(getSubjects().filter(s => s.id !== id));
  const nodes = getNodes();
  const toDelete = Object.values(nodes).filter(n => n.subjectId === id).map(n => n.id);
  toDelete.forEach(nid => delete nodes[nid]);
  saveNodes(nodes);
  const cards = getFlashcards().filter(c => c.subjectId !== id);
  saveFlashcards(cards);
}

// --- Nodes ---
export function getNodes(): Record<string, SyllabusNode> {
  return load<Record<string, SyllabusNode>>(KEYS.nodes, {});
}

export function saveNodes(nodes: Record<string, SyllabusNode>) {
  save(KEYS.nodes, nodes);
}

export function getNode(id: string): SyllabusNode | undefined {
  return getNodes()[id];
}

export function addChildNode(parentId: string, title: string): SyllabusNode {
  const nodes = getNodes();
  const parent = nodes[parentId];
  if (!parent) throw new Error('Parent not found');
  const id = uuidv4();
  const child: SyllabusNode = {
    id, parentId, subjectId: parent.subjectId, title,
    depth: parent.depth + 1, completed: false, important: false,
    notes: '', lastRevised: null, order: parent.children.length,
    children: [], tags: [],
  };
  nodes[id] = child;
  parent.children.push(id);
  saveNodes(nodes);
  return child;
}

export function updateNode(id: string, updates: Partial<SyllabusNode>) {
  const nodes = getNodes();
  if (nodes[id]) {
    nodes[id] = { ...nodes[id], ...updates };
    saveNodes(nodes);
  }
}

export function deleteNode(id: string) {
  const nodes = getNodes();
  const node = nodes[id];
  if (!node) return;
  // Remove from parent
  if (node.parentId && nodes[node.parentId]) {
    nodes[node.parentId].children = nodes[node.parentId].children.filter(c => c !== id);
  }
  // Delete recursively
  const deleteRecursive = (nid: string) => {
    const n = nodes[nid];
    if (!n) return;
    n.children.forEach(deleteRecursive);
    delete nodes[nid];
  };
  deleteRecursive(id);
  saveNodes(nodes);
  // Delete associated flashcards
  saveFlashcards(getFlashcards().filter(c => c.topicId !== id));
}

export function getNodeProgress(nodeId: string, nodes: Record<string, SyllabusNode>): number {
  const node = nodes[nodeId];
  if (!node) return 0;
  if (node.children.length === 0) return node.completed ? 100 : 0;
  const childProgresses = node.children.map(cid => getNodeProgress(cid, nodes));
  return Math.round(childProgresses.reduce((a, b) => a + b, 0) / childProgresses.length);
}

// --- Flashcards ---
export function getFlashcards(): Flashcard[] {
  return load<Flashcard[]>(KEYS.flashcards, []);
}

export function saveFlashcards(cards: Flashcard[]) {
  save(KEYS.flashcards, cards);
}

export function addFlashcard(topicId: string, subjectId: string, front: string, back: string): Flashcard {
  const card: Flashcard = {
    id: uuidv4(), topicId, subjectId, front, back,
    easeFactor: 2.5, interval: 1, repetitions: 0,
    nextReview: new Date().toISOString(), lastSeen: null,
    accuracy: 0, streak: 0, hardCount: 0, totalReviews: 0,
  };
  const cards = getFlashcards();
  cards.push(card);
  saveFlashcards(cards);
  return card;
}

export function deleteFlashcard(id: string) {
  saveFlashcards(getFlashcards().filter(c => c.id !== id));
}

// SM-2 algorithm
export function reviewCard(cardId: string, quality: number) {
  // quality: 0=skip, 1=hard, 3=easy
  const cards = getFlashcards();
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  card.totalReviews++;
  card.lastSeen = new Date().toISOString();

  if (quality >= 3) {
    // Easy
    card.streak++;
    card.accuracy = ((card.accuracy * (card.totalReviews - 1)) + 1) / card.totalReviews;
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.easeFactor);
    card.repetitions++;
    card.easeFactor = Math.max(1.3, card.easeFactor + 0.1);
  } else if (quality === 1) {
    // Hard
    card.hardCount++;
    card.streak = 0;
    card.accuracy = ((card.accuracy * (card.totalReviews - 1)) + 0) / card.totalReviews;
    card.repetitions = 0;
    card.interval = 1;
    card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
  }
  // quality 0 = skip, no change to interval

  const next = new Date();
  next.setDate(next.getDate() + card.interval);
  card.nextReview = next.toISOString();

  saveFlashcards(cards);
}

// --- Recall helpers ---
export function getCardsForReview(mode: string, subjectId?: string, topicId?: string): Flashcard[] {
  const cards = getFlashcards();
  const now = new Date().toISOString();

  let pool: Flashcard[];
  switch (mode) {
    case 'topic':
      pool = cards.filter(c => c.topicId === topicId);
      break;
    case 'subject':
      pool = cards.filter(c => c.subjectId === subjectId);
      break;
    case 'weak':
      pool = cards.filter(c => c.accuracy < 0.5 || c.hardCount > 2);
      break;
    case 'exam':
      pool = cards.filter(c => c.accuracy < 0.6 || c.hardCount > 1);
      break;
    default: // random
      pool = [...cards];
  }

  // Prioritize due cards
  pool.sort((a, b) => {
    const aDue = a.nextReview <= now ? 0 : 1;
    const bDue = b.nextReview <= now ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return a.easeFactor - b.easeFactor; // harder first
  });

  return pool;
}

// --- Stats ---
export function getDailyStats(): DailyStats[] {
  return load<DailyStats[]>(KEYS.stats, []);
}

export function updateDailyStats(cardsReviewed: number, correct: boolean) {
  const stats = getDailyStats();
  const today = new Date().toISOString().slice(0, 10);
  let todayStat = stats.find(s => s.date === today);
  if (!todayStat) {
    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStat = stats.find(s => s.date === yesterday.toISOString().slice(0, 10));
    const streak = yesterdayStat ? yesterdayStat.studyStreak + 1 : 1;
    todayStat = { date: today, cardsReviewed: 0, accuracy: 0, topicsCompleted: 0, studyStreak: streak };
    stats.push(todayStat);
  }
  todayStat.cardsReviewed += cardsReviewed;
  if (todayStat.cardsReviewed > 0) {
    const prevCorrect = todayStat.accuracy * (todayStat.cardsReviewed - cardsReviewed);
    todayStat.accuracy = (prevCorrect + (correct ? 1 : 0)) / todayStat.cardsReviewed;
  }
  save(KEYS.stats, stats);
}

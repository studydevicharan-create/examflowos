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
  const subject: Subject = { id, title, color, rootNodeId, createdAt: new Date().toISOString(), lastStudied: null, examDate: null };
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

export function updateSubject(id: string, updates: Partial<Pick<Subject, 'title' | 'color'>>) {
  const subjects = getSubjects();
  const idx = subjects.findIndex(s => s.id === id);
  if (idx !== -1) {
    subjects[idx] = { ...subjects[idx], ...updates };
    saveSubjects(subjects);
    if (updates.title) {
      const nodes = getNodes();
      const rootNodeId = subjects[idx].rootNodeId;
      if (nodes[rootNodeId]) {
        nodes[rootNodeId].title = updates.title;
        saveNodes(nodes);
      }
    }
  }
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
  if (node.parentId && nodes[node.parentId]) {
    nodes[node.parentId].children = nodes[node.parentId].children.filter(c => c !== id);
  }
  const deleteRecursive = (nid: string) => {
    const n = nodes[nid];
    if (!n) return;
    n.children.forEach(deleteRecursive);
    delete nodes[nid];
  };
  deleteRecursive(id);
  saveNodes(nodes);
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

export function addFlashcard(topicId: string, subjectId: string, prompt: string, reveal: string, image: string = '', type: 'text' | 'image' = 'text', hint: string = ''): Flashcard {
  const card: Flashcard = {
    id: uuidv4(), topicId, subjectId, type, prompt, reveal, hint, image,
    easeCount: 0, hardCount: 0, skipCount: 0,
    lastSeen: null, easeFactor: 2.5, interval: 1,
    repetitions: 0, nextReview: new Date().toISOString(),
  };
  const cards = getFlashcards();
  cards.push(card);
  saveFlashcards(cards);
  return card;
}

export function updateFlashcard(id: string, updates: Partial<Flashcard>) {
  const cards = getFlashcards();
  const idx = cards.findIndex(c => c.id === id);
  if (idx !== -1) {
    cards[idx] = { ...cards[idx], ...updates };
    saveFlashcards(cards);
  }
}

export function deleteFlashcard(id: string) {
  saveFlashcards(getFlashcards().filter(c => c.id !== id));
}

// Review: quality 0=skip, 1=hard, 3=easy
// Smart Repeat Timing: easy=longer gaps, hard=much shorter
export function reviewCard(cardId: string, quality: number) {
  const cards = getFlashcards();
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  card.lastSeen = new Date().toISOString();

  if (quality >= 3) {
    card.easeCount++;
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 3;
    else card.interval = Math.round(card.interval * card.easeFactor);
    card.repetitions++;
    card.easeFactor = Math.max(1.3, card.easeFactor + 0.15);
  } else if (quality === 1) {
    card.hardCount++;
    card.repetitions = 0;
    // Hard cards reappear much sooner (hours not days)
    card.interval = 0; // same day
    card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
  } else {
    card.skipCount++;
  }

  const next = new Date();
  if (quality === 1) {
    // Hard: show again in 2 hours
    next.setHours(next.getHours() + 2);
  } else {
    next.setDate(next.getDate() + card.interval);
  }
  card.nextReview = next.toISOString();

  saveFlashcards(cards);
}

// Update subject exam date
export function updateSubjectExamDate(subjectId: string, examDate: string | null) {
  const subjects = getSubjects();
  const idx = subjects.findIndex(s => s.id === subjectId);
  if (idx !== -1) {
    subjects[idx] = { ...subjects[idx], examDate };
    saveSubjects(subjects);
  }
}

// Weak detection: hardCount > easeCount
export function isWeakCard(card: Flashcard): boolean {
  return card.hardCount > card.easeCount;
}

// --- Recall helpers ---
export function getCardsForReview(mode: string, subjectId?: string, topicId?: string): Flashcard[] {
  const cards = getFlashcards();
  const nodes = getNodes();
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
      pool = cards.filter(c => isWeakCard(c));
      break;
    case 'important':
      pool = cards.filter(c => {
        const node = nodes[c.topicId];
        return node?.important;
      });
      break;
    case 'exam':
      pool = cards.filter(c => {
        const node = nodes[c.topicId];
        return isWeakCard(c) || node?.important;
      });
      break;
    case 'image':
      pool = cards.filter(c => c.type === 'image');
      break;
    default: // random — all cards
      pool = [...cards];
  }

  pool.sort((a, b) => {
    const aDue = a.nextReview <= now ? 0 : 1;
    const bDue = b.nextReview <= now ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return a.easeFactor - b.easeFactor;
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

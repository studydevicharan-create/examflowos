import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, ChevronRight, Check, Star, FileText, Brain, Calendar, MoreVertical, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { getSubjects, getNodes, addChildNode, getNodeProgress, getFlashcards, updateSubjectExamDate, updateNode, deleteNode } from '@/lib/store';
import type { SyllabusNode } from '@/lib/types';

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(getNodes);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Edit node state
  const [editNode, setEditNode] = useState<SyllabusNode | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Delete node state
  const [deleteConfirmNode, setDeleteConfirmNode] = useState<SyllabusNode | null>(null);

  // Menu state
  const [nodeMenuOpen, setNodeMenuOpen] = useState<string | null>(null);

  const subject = getSubjects().find(s => s.id === id);
  const rootNode = subject ? nodes[subject.rootNodeId] : undefined;
  const progress = subject ? getNodeProgress(subject.rootNodeId, nodes) : 0;
  const allCards = getFlashcards();

  const refresh = useCallback(() => setNodes(getNodes()), []);

  const handleAddChild = (parentId: string) => {
    if (!newTitle.trim()) return;
    addChildNode(parentId, newTitle.trim());
    setNewTitle('');
    setShowAdd(null);
    refresh();
  };

  const openEditNode = (node: SyllabusNode) => {
    setEditNode(node);
    setEditTitle(node.title);
    setNodeMenuOpen(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleEditNode = () => {
    if (!editNode || !editTitle.trim()) return;
    updateNode(editNode.id, { title: editTitle.trim() });
    setEditNode(null);
    refresh();
  };

  const handleDeleteNode = () => {
    if (!deleteConfirmNode) return;
    deleteNode(deleteConfirmNode.id);
    setDeleteConfirmNode(null);
    setNodeMenuOpen(null);
    refresh();
  };

  if (!subject || !rootNode) return <div className="p-4 text-muted-foreground">Subject not found</div>;

  const units = rootNode.children.map(cid => nodes[cid]).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col pb-28 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/subjects')} className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{subject.title}</h1>
          <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowAdd(subject.rootNodeId)}
          className="rounded-full bg-primary p-2 text-primary-foreground min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Exam date */}
      <div className="mx-4 mt-2 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="date"
          value={subject.examDate || ''}
          onChange={e => {
            updateSubjectExamDate(subject.id, e.target.value || null);
            refresh();
          }}
          className="flex-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        {subject.examDate && (() => {
          const examMs = new Date(subject.examDate + 'T00:00:00').getTime();
          const todayMs = new Date(new Date().toDateString()).getTime();
          const days = Math.ceil((examMs - todayMs) / (1000 * 60 * 60 * 24));
          return (
            <span className={`text-xs font-medium ${days <= 0 ? 'text-destructive' : days <= 3 ? 'text-destructive' : days <= 7 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {days <= 0 ? 'Today!' : `${days}d left`}
            </span>
          );
        })()}
      </div>

      {/* Progress bar */}
      <div className="mx-4 mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Units list */}
      <div className="mt-4 px-4 space-y-4">
        {units.map((unit, i) => {
          const unitProgress = getNodeProgress(unit.id, nodes);
          const topics = unit.children.map(tid => nodes[tid]).filter(Boolean);

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Unit header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${
                  unit.completed ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {unit.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{unit.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {topics.length} topic{topics.length !== 1 ? 's' : ''} • {unitProgress}%
                  </p>
                </div>
                <button
                  onClick={() => setShowAdd(unit.id)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-muted-foreground transition-colors active:bg-secondary"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {/* Unit context menu */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setNodeMenuOpen(nodeMenuOpen === unit.id ? null : unit.id); }}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-muted-foreground transition-colors active:bg-secondary"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {nodeMenuOpen === unit.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-10 z-20 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditNode(unit); }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmNode(unit); setNodeMenuOpen(null); }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-destructive transition-colors hover:bg-secondary"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Unit progress */}
              <div className="mx-4 h-0.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary/60"
                  animate={{ width: `${unitProgress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Topics inside this unit */}
              {topics.length > 0 && (
                <div className="divide-y divide-border/50">
                  {topics.map(topic => {
                    const topicCards = allCards.filter(c => c.topicId === topic.id);
                    const topicProgress = getNodeProgress(topic.id, nodes);
                    const subtopics = topic.children.map(sid => nodes[sid]).filter(Boolean);

                    return (
                      <div key={topic.id} className="flex items-center">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/topic/${topic.id}`)}
                          className="flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors active:bg-secondary/50 min-w-0"
                        >
                          <div className="flex h-2 w-2 flex-shrink-0 rounded-full" style={{
                            backgroundColor: topic.completed
                              ? 'hsl(var(--success))'
                              : topicProgress > 0
                                ? 'hsl(var(--primary))'
                                : 'hsl(var(--muted-foreground))'
                          }} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${topic.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {topic.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {topicCards.length > 0 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Brain className="h-2.5 w-2.5" /> {topicCards.length}
                                </span>
                              )}
                              {topic.notes && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <FileText className="h-2.5 w-2.5" />
                                </span>
                              )}
                              {topic.important && <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />}
                              {subtopics.length > 0 && (
                                <span className="text-[10px] text-muted-foreground">{subtopics.length} sub</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-muted-foreground">{topicProgress}%</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                          </div>
                        </motion.button>

                        {/* Topic context menu */}
                        <div className="relative pr-2 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setNodeMenuOpen(nodeMenuOpen === topic.id ? null : topic.id); }}
                            className="min-h-[44px] min-w-[36px] flex items-center justify-center rounded-md text-muted-foreground transition-colors active:bg-secondary"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <AnimatePresence>
                            {nodeMenuOpen === topic.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 top-10 z-20 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditNode(topic); }}
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmNode(topic); setNodeMenuOpen(null); }}
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-destructive transition-colors hover:bg-secondary"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {topics.length === 0 && (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-muted-foreground/60">No topics yet</p>
                  <button
                    onClick={() => setShowAdd(unit.id)}
                    className="mt-1 text-xs text-primary"
                  >
                    + Add first topic
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {units.length === 0 && (
        <div className="mt-12 text-center px-4">
          <p className="text-sm text-muted-foreground">No units yet</p>
          <p className="mt-1 text-[10px] text-muted-foreground/50">Start your flow. — ExamFlowOS</p>
          <button onClick={() => setShowAdd(subject.rootNodeId)} className="mt-3 text-sm text-primary min-h-[44px]">
            Add first unit
          </button>
        </div>
      )}

      {/* Close menu on background click */}
      {nodeMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setNodeMenuOpen(null)} />
      )}

      {/* Edit Node Modal */}
      <AnimatePresence>
        {editNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setEditNode(null)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[768px] rounded-t-2xl border-t border-border bg-card p-6 safe-bottom"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Edit {editNode.depth === 1 ? 'Unit' : 'Topic'}
                </h2>
                <button onClick={() => setEditNode(null)} className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                ref={editInputRef}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEditNode()}
                placeholder="Name"
                className="w-full min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleEditNode}
                disabled={!editTitle.trim()}
                className="mt-4 w-full min-h-[48px] rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Save
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Node Confirmation */}
      <AnimatePresence>
        {deleteConfirmNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
            onClick={() => setDeleteConfirmNode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  Delete {deleteConfirmNode.depth === 1 ? 'Unit' : 'Topic'}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Delete <strong className="text-foreground">{deleteConfirmNode.title}</strong>? All nested topics and flashcards will be permanently removed. This cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setDeleteConfirmNode(null)}
                  className="flex-1 min-h-[44px] rounded-lg border border-border text-xs text-muted-foreground transition-colors active:bg-secondary"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDeleteNode}
                  className="flex-1 min-h-[44px] rounded-lg bg-destructive text-xs font-medium text-destructive-foreground transition-colors active:opacity-90"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Node Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAdd(null)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[768px] rounded-t-2xl border-t border-border bg-card p-6 safe-bottom"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  {showAdd === subject.rootNodeId ? 'Add Unit' : 'Add Topic'}
                </h2>
                <button onClick={() => setShowAdd(null)} className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddChild(showAdd)}
                placeholder={showAdd === subject.rootNodeId ? 'Unit name (e.g. Chapter 1)' : 'Topic name'}
                className="w-full min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAddChild(showAdd)}
                disabled={!newTitle.trim()}
                className="mt-4 w-full min-h-[48px] rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Add
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

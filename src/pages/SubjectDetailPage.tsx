import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, ChevronRight, Check, Star, FileText, Brain, Calendar } from 'lucide-react';
import { getSubjects, getNodes, addChildNode, getNodeProgress, getFlashcards, updateSubjectExamDate } from '@/lib/store';

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(getNodes);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

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

  if (!subject || !rootNode) return <div className="p-4 text-muted-foreground">Subject not found</div>;

  // Units = direct children of root
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
          whileTap={{ scale: 0.9 }}
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
          }}
          className="flex-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
          placeholder="Set exam date"
        />
        {subject.examDate && (() => {
          const days = Math.ceil((new Date(subject.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <span className={`text-xs font-medium ${days <= 3 ? 'text-destructive' : days <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
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
                    // Check for subtopics
                    const subtopics = topic.children.map(sid => nodes[sid]).filter(Boolean);

                    return (
                      <motion.button
                        key={topic.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (subtopics.length > 0) {
                            // If topic has subtopics, navigate to topic which acts as a mini-unit
                            navigate(`/topic/${topic.id}`);
                          } else {
                            navigate(`/topic/${topic.id}`);
                          }
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-secondary/50"
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
                            {topic.important && <Star className="h-2.5 w-2.5 text-warning fill-warning" />}
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
                  Add to {nodes[showAdd]?.title || 'Node'}
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
              <button
                onClick={() => handleAddChild(showAdd)}
                disabled={!newTitle.trim()}
                className="mt-4 w-full min-h-[48px] rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Add
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

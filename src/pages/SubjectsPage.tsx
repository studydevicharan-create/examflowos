import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import SubjectCard from '@/components/SubjectCard';
import { getSubjects, addSubject, deleteSubject, updateSubject } from '@/lib/store';
import type { Subject } from '@/lib/types';

const COLORS = ['blue', 'green', 'red', 'yellow', 'purple', 'cyan'];
const COLOR_VALUES: Record<string, string> = {
  blue: 'hsl(217 91% 60%)',
  green: 'hsl(142 71% 45%)',
  red: 'hsl(0 84% 60%)',
  yellow: 'hsl(38 92% 50%)',
  purple: 'hsl(262 83% 58%)',
  cyan: 'hsl(192 91% 50%)',
};

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(getSubjects);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [menuOpen, setMenuOpen] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Edit state
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('blue');
  const editInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setSubjects(getSubjects()), []);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addSubject(newTitle.trim(), selectedColor);
    setNewTitle('');
    setSelectedColor('blue');
    setShowAdd(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteSubject(id);
    setDeleteConfirm(null);
    setMenuOpen('');
    refresh();
  };

  const openEdit = (subject: Subject) => {
    setEditSubject(subject);
    setEditTitle(subject.title);
    setEditColor(subject.color);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleEdit = () => {
    if (!editSubject || !editTitle.trim()) return;
    updateSubject(editSubject.id, { title: editTitle.trim(), color: editColor });
    setEditSubject(null);
    refresh();
  };

  const subjectToDelete = deleteConfirm ? subjects.find(s => s.id === deleteConfirm) : null;

  return (
    <>
      <Helmet>
        <title>Manage Study Subjects | Syllabus Tracker | ExamFlowOS</title>
        <meta name="description" content="Organize your academic syllabus into manageable subjects and units. Track your mastery levels and exam dates in one centralized study dashboard." />
        <link rel="canonical" href="https://examflowos.vercel.app/subjects" />
      </Helmet>

      <div className="flex min-h-screen flex-col px-4 pb-28 pt-12">
        <h1 className="text-xl font-bold text-foreground">Academic Subjects & Syllabus Management</h1>
        
        <section className="mt-6">
          <h2 className="sr-only">Organize Your Learning</h2>
          <p className="text-sm text-muted-foreground italic mb-4">
            Efficient learning starts with a structured hierarchy. Categorize your curriculum into subjects to maintain a high-level view of your progress.
          </p>
        </section>

        {/* Image Alt Text Implementation (Example for cards) */}
        <div className="hidden">
          <img src="/placeholder.svg" alt="ExamFlowOS Subject Card - Visual progress indicator for Biology mastery" />
        </div>

      <div className="mt-6 space-y-3">
        <AnimatePresence>
          {subjects.map(s => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <SubjectCard
                subject={s}
                onClick={() => navigate(`/subjects/${s.id}`)}
                onDelete={() => { setMenuOpen(''); setDeleteConfirm(s.id); }}
                onEdit={() => openEdit(s)}
                onMenuOpen={setMenuOpen}
                menuOpen={menuOpen === s.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {subjects.length === 0 && !showAdd && (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">No subjects yet</p>
          <p className="mt-1 text-[10px] text-muted-foreground/50">Start your flow. — ExamFlowOS</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 min-h-[44px] text-sm text-primary">
            Add your first subject
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && subjectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
            onClick={() => setDeleteConfirm(null)}
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
                <h2 className="text-sm font-semibold text-foreground">Delete Subject</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Delete <strong className="text-foreground">{subjectToDelete.title}</strong>? This will remove all topics, notes, and flashcards permanently. This cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 min-h-[44px] rounded-lg border border-border text-xs text-muted-foreground transition-colors active:bg-secondary"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 min-h-[44px] rounded-lg bg-destructive text-xs font-medium text-destructive-foreground transition-colors active:opacity-90"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Subject Modal */}
      <AnimatePresence>
        {editSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setEditSubject(null)}
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
                <h2 className="text-sm font-semibold text-foreground">Edit Subject</h2>
                <button onClick={() => setEditSubject(null)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                ref={editInputRef}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEdit()}
                placeholder="Subject name"
                className="w-full min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-4 flex gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className="h-8 w-8 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all"
                  >
                    <div
                      className={`h-7 w-7 rounded-full border-2 ${
                        editColor === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: COLOR_VALUES[c] }}
                    />
                  </button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleEdit}
                disabled={!editTitle.trim()}
                className="mt-4 w-full min-h-[48px] rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Save Changes
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
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
                <h2 className="text-sm font-semibold text-foreground">Add Subject</h2>
                <button onClick={() => setShowAdd(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Subject name"
                className="w-full min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-4 flex gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className="h-8 w-8 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all"
                  >
                    <div
                      className={`h-7 w-7 rounded-full border-2 ${
                        selectedColor === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: COLOR_VALUES[c] }}
                    />
                  </button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="mt-4 w-full min-h-[48px] rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Add Subject
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

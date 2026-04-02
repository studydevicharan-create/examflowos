import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import SubjectCard from '@/components/SubjectCard';
import { getSubjects, addSubject, deleteSubject } from '@/lib/store';

const COLORS = ['blue', 'green', 'red', 'yellow', 'purple', 'cyan'];

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(getSubjects);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const refresh = useCallback(() => setSubjects(getSubjects()), []);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addSubject(newTitle.trim(), selectedColor);
    setNewTitle('');
    setShowAdd(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteSubject(id);
    refresh();
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-24 pt-12">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Subjects</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(true)}
          className="rounded-full bg-primary p-2 text-primary-foreground"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
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
              <SubjectCard subject={s} onClick={() => navigate(`/subjects/${s.id}`)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {subjects.length === 0 && !showAdd && (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">No subjects yet</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-primary">
            Add your first subject
          </button>
        </div>
      )}

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
              className="w-full max-w-[768px] rounded-t-2xl border-t border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Add Subject</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Subject name"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-4 flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      selectedColor === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: `var(--color-${c}, hsl(217 91% 60%))` }}
                  />
                ))}
              </div>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Add Subject
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

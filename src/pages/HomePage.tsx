import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Brain, TrendingUp } from 'lucide-react';
import { getSubjects, getFlashcards, getNodes, getNodeProgress, getDailyStats } from '@/lib/store';
import FocusWidget from '@/components/FocusWidget';
import HomeTooltip from '@/components/HomeTooltip';

export default function HomePage() {
  const navigate = useNavigate();
  const [subjects] = useState(getSubjects);
  const cards = getFlashcards();
  const nodes = getNodes();
  const stats = getDailyStats();

  const dueCards = cards.filter(c => new Date(c.nextReview) <= new Date()).length;
  const today = stats.find(s => s.date === new Date().toISOString().slice(0, 10));
  const streak = today?.studyStreak ?? 0;

  const totalProgress = subjects.length > 0
    ? Math.round(subjects.reduce((acc, s) => acc + getNodeProgress(s.rootNodeId, nodes), 0) / subjects.length)
    : 0;

  return (
    <div className="flex min-h-screen flex-col px-4 pb-28 pt-12">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold tracking-wide text-foreground">
            Exam<span className="text-primary">Flow</span>OS
          </h1>
          <span className="text-[10px] tracking-wider text-muted-foreground/40">imdvichrn</span>
        </div>
        <p className="text-sm text-muted-foreground">Good {getGreeting()}. Stay focused.</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Due cards" value={dueCards} />
        <StatCard label="Progress" value={`${totalProgress}%`} />
        <StatCard label="Streak" value={`${streak}d`} />
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        {dueCards > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/recall')}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            <Brain className="h-4 w-4" />
            Review {dueCards} cards
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/subjects')}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground"
        >
          <Plus className="h-4 w-4" />
          Study
        </motion.button>
      </div>

      {/* Recent Subjects */}
      {subjects.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Subjects</h2>
          <div className="space-y-2">
            {subjects.slice(0, 3).map(s => {
              const progress = getNodeProgress(s.rootNodeId, nodes);
              return (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/subjects/${s.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <span className="text-sm text-foreground">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {subjects.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">No subjects yet</p>
          <p className="mt-1 text-[10px] text-muted-foreground/50">Start your flow. — ExamFlowOS</p>
          <button
            onClick={() => navigate('/subjects')}
            className="mt-3 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Add Subject
          </button>
        </div>
      )}
      <FocusWidget />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

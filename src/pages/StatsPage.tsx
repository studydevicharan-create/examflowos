import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, Brain, AlertTriangle } from 'lucide-react';
import { getSubjects, getFlashcards, getNodes, getNodeProgress, getDailyStats, isWeakCard } from '@/lib/store';

function ProgressRing({ progress, size, delay = 0 }: { progress: number; size: number; delay?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-primary"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{progress}%</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const subjects = getSubjects();
  const cards = getFlashcards();
  const nodes = getNodes();
  const stats = getDailyStats();

  const today = stats.find(s => s.date === new Date().toISOString().slice(0, 10));
  const totalCards = cards.length;
  const weakCount = cards.filter(c => isWeakCard(c)).length;
  const strongCount = totalCards - weakCount;
  const totalEase = cards.reduce((a, c) => a + c.easeCount, 0);
  const totalReviews = cards.reduce((a, c) => a + c.easeCount + c.hardCount + c.skipCount, 0);
  const avgAccuracy = totalReviews > 0 ? Math.round((totalEase / totalReviews) * 100) : 0;
  const streak = today?.studyStreak ?? 0;

  // Find weakest subject for focus card
  const subjectWeakness = subjects.map(s => {
    const subjectCards = cards.filter(c => c.subjectId === s.id);
    const weak = subjectCards.filter(c => isWeakCard(c)).length;
    return { subject: s, weak, total: subjectCards.length };
  }).sort((a, b) => b.weak - a.weak);
  const focusSubject = subjectWeakness.find(sw => sw.weak > 0);

  return (
    <div className="flex min-h-screen flex-col px-4 pb-28 pt-12">
      <h1 className="text-xl font-bold text-foreground">Stats</h1>

      {/* Streak + Accuracy row */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Streak</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{streak}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
        </motion.div>

        {/* Today */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{avgAccuracy}<span className="text-sm font-normal text-muted-foreground ml-1">%</span></p>
        </motion.div>
      </div>

      {/* Subject Progress */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Subject Progress</h2>
        <div className="space-y-3">
          {subjects.map(s => {
            const progress = getNodeProgress(s.rootNodeId, nodes);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <ProgressRing progress={progress} size={60} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {focusSubject && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-xl border border-warning/20 bg-warning/5 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-foreground">Focus Area</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {focusSubject.subject.title} has {focusSubject.weak} weak card{focusSubject.weak !== 1 ? 's' : ''} that need attention
          </p>
        </motion.div>
      )}

      {totalCards === 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
          <p className="mt-1 text-[10px] text-muted-foreground/50">Start studying to see stats. — ExamFlowOS</p>
        </div>
      )}
    </div>
  );
}
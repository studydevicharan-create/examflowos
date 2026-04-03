import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, Brain } from 'lucide-react';
import { getSubjects, getFlashcards, getNodes, getNodeProgress, getDailyStats, isWeakCard } from '@/lib/store';

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
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Today</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{today?.cardsReviewed ?? 0}<span className="text-sm font-normal text-muted-foreground ml-1">cards</span></p>
        </motion.div>
      </div>

      {/* Progress Rings */}
      {subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject Progress</span>
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            {subjects.map((s, i) => {
              const progress = getNodeProgress(s.rootNodeId, nodes);
              return (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <ProgressRing progress={progress} size={64} delay={i * 0.08} />
                  <p className="text-[10px] text-muted-foreground truncate max-w-[72px] text-center">{s.title}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Heat Bars */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Card Health</span>
        </div>
        <div className="space-y-3">
          <HeatBar label="Strong" value={strongCount} max={totalCards || 1} color="var(--success)" />
          <HeatBar label="Weak" value={weakCount} max={totalCards || 1} color="var(--destructive)" />
          <HeatBar label="Accuracy" value={avgAccuracy} max={100} color="var(--primary)" suffix="%" />
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{totalCards} total cards</span>
          <span>{totalReviews} total reviews</span>
        </div>
      </motion.div>

      {/* Focus Card */}
      {focusSubject && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-[10px] uppercase tracking-wider text-primary mb-2">Focus Today</p>
          <p className="text-sm font-semibold text-foreground">{focusSubject.subject.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {focusSubject.weak} weak card{focusSubject.weak !== 1 ? 's' : ''} need attention
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

function ProgressRing({ progress, size, delay = 0 }: { progress: number; size: number; delay?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{progress}%</span>
      </div>
    </div>
  );
}

function HeatBar({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground">{value}{suffix}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: `hsl(${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

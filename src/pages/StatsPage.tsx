import { getSubjects, getFlashcards, getNodes, getNodeProgress, getDailyStats, isWeakCard } from '@/lib/store';

export default function StatsPage() {
  const subjects = getSubjects();
  const cards = getFlashcards();
  const nodes = getNodes();
  const stats = getDailyStats();

  const today = stats.find(s => s.date === new Date().toISOString().slice(0, 10));
  const totalCards = cards.length;
  const weakCount = cards.filter(c => isWeakCard(c)).length;
  const totalEase = cards.reduce((a, c) => a + c.easeCount, 0);
  const totalReviews = cards.reduce((a, c) => a + c.easeCount + c.hardCount + c.skipCount, 0);
  const avgAccuracy = totalReviews > 0 ? Math.round((totalEase / totalReviews) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col px-4 pb-24 pt-12">
      <h1 className="text-xl font-bold text-foreground">Stats</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatBox label="Total Cards" value={totalCards} />
        <StatBox label="Avg Accuracy" value={`${avgAccuracy}%`} />
        <StatBox label="Weak Cards" value={weakCount} />
        <StatBox label="Streak" value={`${today?.studyStreak ?? 0}d`} />
        <StatBox label="Reviewed Today" value={today?.cardsReviewed ?? 0} />
        <StatBox label="Subjects" value={subjects.length} />
      </div>

      {subjects.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Subject Progress</h2>
          <div className="space-y-3">
            {subjects.map(s => {
              const progress = getNodeProgress(s.rootNodeId, nodes);
              return (
                <div key={s.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{s.title}</span>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {weakCount > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Focus Topics</h2>
          <div className="space-y-2">
            {cards.filter(c => isWeakCard(c)).slice(0, 5).map(c => {
              const topicNode = nodes[c.topicId];
              const total = c.easeCount + c.hardCount + c.skipCount;
              const acc = total > 0 ? Math.round((c.easeCount / total) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">{c.prompt}</p>
                    {topicNode && <p className="text-[10px] text-muted-foreground">{topicNode.title}</p>}
                  </div>
                  <span className="text-xs text-destructive">{acc}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

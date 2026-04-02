import { motion } from 'framer-motion';
import type { Subject } from '@/lib/types';
import { getNodes, getNodeProgress } from '@/lib/store';

interface Props {
  subject: Subject;
  onClick: () => void;
}

const COLORS: Record<string, string> = {
  blue: 'hsl(217 91% 60%)',
  green: 'hsl(142 71% 45%)',
  red: 'hsl(0 84% 60%)',
  yellow: 'hsl(38 92% 50%)',
  purple: 'hsl(262 83% 58%)',
  cyan: 'hsl(192 91% 50%)',
};

export default function SubjectCard({ subject, onClick }: Props) {
  const nodes = getNodes();
  const progress = getNodeProgress(subject.rootNodeId, nodes);
  const rootNode = nodes[subject.rootNodeId];
  const unitCount = rootNode?.children.length ?? 0;
  const accent = COLORS[subject.color] || COLORS.blue;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors duration-150 hover:bg-secondary"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{subject.title}</h3>
            <p className="text-xs text-muted-foreground">{unitCount} unit{unitCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: accent }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {subject.lastStudied && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Last studied {new Date(subject.lastStudied).toLocaleDateString()}
        </p>
      )}
    </motion.button>
  );
}

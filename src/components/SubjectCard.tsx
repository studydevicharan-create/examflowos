import { motion } from 'framer-motion';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Subject } from '@/lib/types';
import { getNodes, getNodeProgress } from '@/lib/store';

interface Props {
  subject: Subject;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMenuOpen: (id: string) => void;
  menuOpen: boolean;
}

const COLORS: Record<string, string> = {
  blue: 'hsl(217 91% 60%)',
  green: 'hsl(142 71% 45%)',
  red: 'hsl(0 84% 60%)',
  yellow: 'hsl(38 92% 50%)',
  purple: 'hsl(262 83% 58%)',
  cyan: 'hsl(192 91% 50%)',
};

export default function SubjectCard({ subject, onClick, onDelete, onEdit, onMenuOpen, menuOpen }: Props) {
  const nodes = getNodes();
  const progress = getNodeProgress(subject.rootNodeId, nodes);
  const rootNode = nodes[subject.rootNodeId];
  const unitCount = rootNode?.children.length ?? 0;
  const accent = COLORS[subject.color] || COLORS.blue;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="w-full min-h-[72px] rounded-lg border border-border bg-card p-4 text-left transition-colors duration-150 active:bg-secondary"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{subject.title}</h3>
              <p className="text-xs text-muted-foreground">{unitCount} unit{unitCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
            <button
              onClick={(e) => { e.stopPropagation(); onMenuOpen(subject.id); }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 text-muted-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
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

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onMenuOpen(''); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-2 top-12 z-50 w-48 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onMenuOpen(''); onEdit(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-xs text-foreground transition-colors active:bg-secondary"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              Edit Subject
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-xs text-destructive transition-colors active:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Subject
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}

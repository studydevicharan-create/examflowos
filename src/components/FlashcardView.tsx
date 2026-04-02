import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { Flashcard } from '@/lib/types';

interface Props {
  card: Flashcard;
  onEasy: () => void;
  onHard: () => void;
  onSkip: () => void;
  current: number;
  total: number;
}

export default function FlashcardView({ card, onEasy, onHard, onSkip, current, total }: Props) {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const bgOpacity = useTransform(x, [-150, 0, 150], [0.3, 0, 0.3]);

  const [swipeColor, setSwipeColor] = useState<string | null>(null);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number; y: number } }) => {
    if (info.offset.x > 80) {
      setSwipeColor('hsl(142 71% 45%)');
      setTimeout(() => { setSwipeColor(null); onEasy(); setFlipped(false); }, 200);
    } else if (info.offset.x < -80) {
      setSwipeColor(null);
      onSkip();
      setFlipped(false);
    } else if (info.offset.y < -60) {
      setSwipeColor('hsl(0 84% 60%)');
      setTimeout(() => { setSwipeColor(null); onHard(); setFlipped(false); }, 200);
    }
  }, [onEasy, onHard, onSkip]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="mb-6 flex w-full items-center justify-between px-2">
        <span className="text-xs text-muted-foreground">{current} / {total}</span>
        <div className="h-1 flex-1 mx-4 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="relative w-full max-w-sm" style={{ perspective: 1000 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + (flipped ? '-back' : '-front')}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{ x, y, rotate }}
            onClick={() => setFlipped(f => !f)}
            className="relative flex min-h-[320px] cursor-pointer items-center justify-center rounded-xl border border-border bg-card p-8 shadow-lg select-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {swipeColor && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{ backgroundColor: swipeColor, opacity: bgOpacity }}
              />
            )}
            <div className="text-center">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                {flipped ? 'Answer' : 'Question'}
              </p>
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {flipped ? card.back : card.front}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-6 text-[10px] text-muted-foreground">
        Tap to flip • Swipe right: Easy • Up: Hard • Left: Skip
      </p>

      <div className="mt-4 flex gap-3">
        <button onClick={() => { onSkip(); setFlipped(false); }} className="rounded-lg border border-border px-5 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary">
          Skip
        </button>
        <button onClick={() => { onHard(); setFlipped(false); }} className="rounded-lg border border-destructive/30 px-5 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10">
          Hard
        </button>
        <button onClick={() => { onEasy(); setFlipped(false); }} className="rounded-lg border border-success/30 px-5 py-2 text-xs text-success transition-colors hover:bg-success/10">
          Easy
        </button>
      </div>
    </div>
  );
}

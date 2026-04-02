import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { FileText, ZoomIn, ZoomOut } from 'lucide-react';
import type { Flashcard } from '@/lib/types';

interface Props {
  card: Flashcard;
  onEasy: () => void;
  onHard: () => void;
  onSkip: () => void;
  onOpenNotes?: () => void;
  current: number;
  total: number;
}

export default function FlashcardView({ card, onEasy, onHard, onSkip, onOpenNotes, current, total }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  const [flash, setFlash] = useState<'easy' | 'hard' | 'skip' | null>(null);

  const isImage = card.type === 'image' && card.image;
  const hasReveal = card.reveal && card.reveal.trim().length > 0;
  const hasPrompt = card.prompt && card.prompt.trim().length > 0;

  const resetAndAdvance = useCallback((action: () => void) => {
    setRevealed(false);
    setZoomed(false);
    action();
  }, []);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number; y: number } }) => {
    if (zoomed) return; // Don't swipe while zoomed
    if (info.offset.x > 80) {
      setFlash('easy');
      setTimeout(() => { setFlash(null); resetAndAdvance(onEasy); }, 200);
    } else if (info.offset.x < -80) {
      setFlash('skip');
      setTimeout(() => { setFlash(null); resetAndAdvance(onSkip); }, 200);
    } else if (info.offset.y < -60) {
      setFlash('hard');
      setTimeout(() => { setFlash(null); resetAndAdvance(onHard); }, 200);
    }
  }, [onEasy, onHard, onSkip, resetAndAdvance, zoomed]);

  const flashColors = {
    easy: 'bg-success/20',
    hard: 'bg-destructive/20',
    skip: 'bg-muted/30',
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      {/* Progress bar */}
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

      {/* Card */}
      <div className="relative w-full max-w-sm">
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`pointer-events-none absolute inset-0 z-10 rounded-xl ${flashColors[flash]}`}
            />
          )}
        </AnimatePresence>

        <motion.div
          key={card.id}
          drag={!zoomed}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          style={{ x: zoomed ? undefined : x, y: zoomed ? undefined : y, rotate: zoomed ? undefined : rotate }}
          className="relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-card p-6 shadow-lg select-none overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* IMAGE CARD */}
          {isImage && (
            <div className="w-full">
              <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                {hasPrompt ? 'Visual' : 'Diagram'}
              </p>
              <div className="relative w-full">
                <img
                  src={card.image}
                  alt="Flashcard visual"
                  className={`w-full rounded-lg object-contain transition-all duration-200 ${
                    zoomed ? 'max-h-[60vh]' : 'max-h-48'
                  }`}
                  onClick={(e) => { e.stopPropagation(); setZoomed(z => !z); }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setZoomed(z => !z); }}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm"
                >
                  {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                </button>
              </div>
              {hasPrompt && (
                <p className="mt-3 text-sm font-medium text-foreground text-center leading-relaxed">
                  {card.prompt}
                </p>
              )}
            </div>
          )}

          {/* TEXT CARD */}
          {!isImage && (
            <div className="text-center">
              <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                Prompt
              </p>
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {card.prompt}
              </p>
            </div>
          )}

          {/* Reveal section */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-6 w-full border-t border-border pt-4 text-center"
              >
                <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Reveal
                </p>
                {hasReveal ? (
                  <p className="text-base text-foreground/90 leading-relaxed">
                    {card.reveal}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Try recalling from memory or open notes.
                    </p>
                    {onOpenNotes && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenNotes(); }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs text-primary transition-colors hover:bg-secondary"
                      >
                        <FileText className="h-3 w-3" /> Open Notes
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap to reveal */}
          {!revealed && (
            <button
              onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
              className="mt-6 text-xs text-primary/70 transition-colors hover:text-primary"
            >
              Tap to reveal
            </button>
          )}
        </motion.div>
      </div>

      <p className="mt-6 text-[10px] text-muted-foreground text-center leading-relaxed">
        Swipe right: Easy • Up: Hard • Left: Skip
      </p>
      <p className="mt-1 text-[8px] text-muted-foreground/30 tracking-widest">Flow</p>

      <div className="mt-4 flex gap-3">
        <button onClick={() => resetAndAdvance(onSkip)} className="rounded-lg border border-border px-5 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary">
          Skip
        </button>
        <button onClick={() => resetAndAdvance(onHard)} className="rounded-lg border border-destructive/30 px-5 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10">
          Hard
        </button>
        <button onClick={() => resetAndAdvance(onEasy)} className="rounded-lg border border-success/30 px-5 py-2 text-xs text-success transition-colors hover:bg-success/10">
          Easy
        </button>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2 } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import FocusBackground from '@/components/focus/FocusBackgrounds';
import FocusOverlay from '@/components/focus/FocusOverlay';
import { useFocus } from '@/lib/focusContext';

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function FocusWidget() {
  const {
    phase, timeLeft, expanded, breakAction, progress,
    duration, breakDuration, sound,
    startFocus, pauseFocus, resumeFocus, resetAll, setExpanded,
  } = useFocus();

  const settings = getSettings();

  // Compact idle
  if (!expanded && phase === 'idle') {
    return (
      <motion.button
        layout
        onClick={() => setExpanded(true)}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        <span className="text-lg font-bold tabular-nums text-foreground">{duration}:00</span>
        <span className="text-xs text-primary font-medium">Start Focus</span>
      </motion.button>
    );
  }

  // Running/paused mini pill
  if (!expanded && (phase === 'focus' || phase === 'paused' || phase === 'break')) {
    return (
      <>
        {settings.focusLockIn && phase === 'focus' && <FocusOverlay active />}
        <motion.button
          layout
          onClick={() => setExpanded(true)}
          whileTap={{ scale: 0.96 }}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-3 rounded-2xl border border-primary/30 bg-card px-4 py-3 shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
            <circle cx="14" cy="14" r="11" fill="none" strokeWidth="2.5" className="stroke-muted" />
            <circle cx="14" cy="14" r="11" fill="none" strokeWidth="2.5" className="stroke-primary"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-base font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
          {phase === 'paused' && <span className="text-[10px] text-muted-foreground">Paused</span>}
          {phase === 'break' && <span className="text-[10px] text-primary">Break</span>}
        </motion.button>
      </>
    );
  }

  // Expanded state
  return (
    <AnimatePresence>
      {settings.focusLockIn && phase === 'focus' && <FocusOverlay active />}
      <motion.div
        layout
        className="fixed bottom-24 right-4 z-40 w-64 rounded-2xl border border-border bg-card overflow-hidden shadow-xl"
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        {/* Living background */}
        {(phase === 'focus' || phase === 'paused') && (
          <FocusBackground
            type={settings.focusBackground}
            intensity={settings.focusIntensity}
            progress={progress}
            sound={sound}
          />
        )}

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {phase === 'break' ? 'Break' : phase === 'paused' ? 'Paused' : phase === 'done' ? 'Done' : 'Focus'}
            </span>
            {settings.focusLockIn && phase === 'focus' && (
              <span className="text-[9px] text-primary/70 font-medium tracking-wider uppercase">Lock-in Active</span>
            )}
            <button onClick={() => { if (phase === 'idle') { setExpanded(false); } else { resetAll(); setExpanded(false); } }} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Break state */}
          {phase === 'break' && (
            <div className="text-center py-3">
              <span className="text-2xl font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
              {breakAction && (
                <div className="mt-3 rounded-lg bg-secondary/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-1">Reset Action</p>
                  <p className="text-xs text-foreground leading-relaxed">{breakAction.text}</p>
                </div>
              )}
              <motion.button whileTap={{ scale: 0.96 }} onClick={startFocus}
                className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground">
                Back to Focus
              </motion.button>
            </div>
          )}

          {/* Done state */}
          {phase === 'done' && (
            <div className="text-center py-4">
              <p className="text-sm font-medium text-foreground">✔ {duration} min done</p>
              <p className="text-xs text-muted-foreground mt-1">Stayed consistent.</p>
              <div className="flex gap-2 mt-3 justify-center">
                <motion.button whileTap={{ scale: 0.96 }} onClick={startFocus}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                  Continue
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { resetAll(); setExpanded(false); }}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground">
                  Done
                </motion.button>
              </div>
            </div>
          )}

          {/* Focus / Paused / Idle timer */}
          {(phase === 'idle' || phase === 'focus' || phase === 'paused') && (
            <>
              <div className="text-center mb-4">
                <span className="text-4xl font-bold tabular-nums text-foreground">
                  {phase === 'idle' ? formatTime(duration * 60) : formatTime(timeLeft)}
                </span>
              </div>

              {/* Sound indicator */}
              {(phase === 'focus' || phase === 'paused') && sound !== 'None' && (
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Volume2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{sound}</span>
                </div>
              )}

              {/* Progress bar */}
              {(phase === 'focus' || phase === 'paused') && (
                <div className="h-1 rounded-full bg-muted mb-4 overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
                </div>
              )}

              {/* Action */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (phase === 'idle') startFocus();
                  else if (phase === 'focus') pauseFocus();
                  else if (phase === 'paused') resumeFocus();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
              >
                {phase === 'focus' ? <><Pause className="h-4 w-4" /> Pause</> :
                 phase === 'paused' ? <><Play className="h-4 w-4" /> Resume</> :
                 <><Play className="h-4 w-4" /> Start</>}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

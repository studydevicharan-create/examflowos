import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getSettings } from '@/lib/settings';
import FocusBackground from '@/components/focus/FocusBackgrounds';
import FocusOverlay from '@/components/focus/FocusOverlay';
import { useFocus } from '@/lib/focusContext';

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Full widget — only rendered on Home
export function FocusHome() {
  const {
    phase, timeLeft, breakAction, progress,
    duration, sound,
    startFocus, pauseFocus, resumeFocus, resetAll, setExpanded,
  } = useFocus();
  const settings = getSettings();

  const handlePause = () => {
    pauseFocus();
    // Auto-minimize on pause
    setExpanded(false);
  };

  // Idle compact card
  if (phase === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="relative p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Focus starts here</p>
          <div className="text-center my-4">
            <span className="text-4xl font-bold tabular-nums text-foreground">{formatTime(duration * 60)}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={startFocus}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
          >
            <Play className="h-4 w-4" /> Start Focus
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Active / Paused / Break / Done — expanded home view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-6 rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Background */}
      {(phase === 'focus' || phase === 'paused') && (
        <FocusBackground
          type={settings.focusBackground}
          intensity={settings.focusIntensity}
          progress={progress}
          sound={sound}
        />
      )}

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {phase === 'break' ? 'Break' : phase === 'paused' ? 'Paused' : phase === 'done' ? 'Done' : 'Focus'}
          </span>
          <div className="flex items-center gap-2">
            {settings.focusLockIn && phase === 'focus' && (
              <span className="text-[9px] text-primary/70 font-medium tracking-wider uppercase">Lock-in Active</span>
            )}
            <button onClick={resetAll} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Break */}
        {phase === 'break' && (
          <div className="text-center py-3">
            <span className="text-3xl font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
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

        {/* Done */}
        {phase === 'done' && (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-foreground">✔ {duration} min done</p>
            <p className="text-xs text-muted-foreground mt-1">Stayed consistent.</p>
            <div className="flex gap-2 mt-3 justify-center">
              <motion.button whileTap={{ scale: 0.96 }} onClick={startFocus}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                Continue
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={resetAll}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground">
                Done
              </motion.button>
            </div>
          </div>
        )}

        {/* Focus / Paused */}
        {(phase === 'focus' || phase === 'paused') && (
          <>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
            </div>

            {sound !== 'None' && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Volume2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{sound}</span>
              </div>
            )}

            <div className="h-1 rounded-full bg-muted mb-4 overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={phase === 'focus' ? handlePause : resumeFocus}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
            >
              {phase === 'focus' ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Floating mini pill — shown on ALL non-home screens when timer is active
export function FocusMiniPill() {
  const location = useLocation();
  const { phase, timeLeft, progress, expanded, setExpanded, pauseFocus, resumeFocus, startFocus, resetAll, breakAction, sound } = useFocus();
  const settings = getSettings();
  const isHome = location.pathname === '/';

  // On home, the full widget handles everything
  // Show pill on non-home pages when running, or on home when minimized (paused)
  const isActive = phase === 'focus' || phase === 'paused' || phase === 'break' || phase === 'done';
  
  if (!isActive) return null;
  // On home page, only show pill when paused+minimized
  if (isHome && expanded) return null;
  // On home page when not expanded (paused auto-minimized), show pill
  // On non-home pages, always show pill when active

  const handlePause = () => {
    pauseFocus();
  };

  // Expanded overlay (tap pill → expand anywhere)
  if (expanded && !isHome) {
    return (
      <>
        {settings.focusLockIn && phase === 'focus' && <FocusOverlay active />}
        <motion.div
          layout
          className="fixed bottom-24 right-4 left-4 z-40 max-w-[340px] ml-auto rounded-2xl border border-border bg-card overflow-hidden shadow-xl"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {(phase === 'focus' || phase === 'paused') && (
            <FocusBackground
              type={settings.focusBackground}
              intensity={settings.focusIntensity}
              progress={progress}
              sound={sound}
            />
          )}
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {phase === 'break' ? 'Break' : phase === 'paused' ? 'Paused' : phase === 'done' ? 'Done' : 'Focus'}
              </span>
              <button onClick={() => setExpanded(false)} className="p-1 text-muted-foreground">
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {phase === 'break' && (
              <div className="text-center py-2">
                <span className="text-2xl font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
                {breakAction && (
                  <div className="mt-2 rounded-lg bg-secondary/60 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-0.5">Reset Action</p>
                    <p className="text-xs text-foreground">{breakAction.text}</p>
                  </div>
                )}
                <motion.button whileTap={{ scale: 0.96 }} onClick={startFocus}
                  className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground">
                  Back to Focus
                </motion.button>
              </div>
            )}

            {phase === 'done' && (
              <div className="text-center py-3">
                <p className="text-sm font-medium text-foreground">Session complete</p>
                <div className="flex gap-2 mt-2 justify-center">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={startFocus}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Continue</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => { resetAll(); setExpanded(false); }}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground">Done</motion.button>
                </div>
              </div>
            )}

            {(phase === 'focus' || phase === 'paused') && (
              <>
                <div className="text-center mb-3">
                  <span className="text-3xl font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
                </div>
                <div className="h-1 rounded-full bg-muted mb-3 overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={phase === 'focus' ? handlePause : resumeFocus}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
                >
                  {phase === 'focus' ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </>
    );
  }

  // Collapsed pill
  return (
    <>
      {settings.focusLockIn && phase === 'focus' && <FocusOverlay active />}
      <motion.button
        layout
        onClick={() => setExpanded(true)}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-3 rounded-full border border-primary/30 bg-card px-4 py-2.5 shadow-lg"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
          <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" className="stroke-muted" />
          <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" className="stroke-primary"
            strokeDasharray={`${2 * Math.PI * 9}`}
            strokeDashoffset={`${2 * Math.PI * 9 * (1 - progress)}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
        <span className="text-[10px] text-muted-foreground">
          {phase === 'paused' ? '⏸ Paused' : phase === 'break' ? 'Break' : phase === 'done' ? 'Done' : 'Running'}
        </span>
      </motion.button>
    </>
  );
}

// Legacy default export for backward compat
export default function FocusWidget() {
  return <FocusMiniPill />;
}

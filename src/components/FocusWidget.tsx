import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2 } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import FocusBackground from '@/components/focus/FocusBackgrounds';
import FocusOverlay from '@/components/focus/FocusOverlay';
import { notifyFocusStart, notifyFocusEnd, notifyStreak } from '@/lib/focusNotifications';
import { getBreakAction, type BreakAction } from '@/lib/breakActions';

type Phase = 'idle' | 'focus' | 'paused' | 'done' | 'break';

function createNoise(ctx: AudioContext, type: string): { source: AudioBufferSourceNode; gain: GainNode } | null {
  if (type === 'None') return null;
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'White') {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'Brown') {
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else if (type === 'Rain') {
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = white * (0.3 + Math.random() * 0.15);
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  // Fade in over 2s
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
  return { source, gain };
}

export default function FocusWidget() {
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [breakAction, setBreakAction] = useState<BreakAction | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);

  const settings = getSettings();
  const duration = settings.focusDuration;
  const breakDuration = settings.focusBreakDuration;
  const sound = settings.focusSound;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const stopAudio = useCallback((fade = false) => {
    if (audioRef.current) {
      const { source, gain } = audioRef.current;
      if (fade && audioCtxRef.current) {
        gain.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 2);
        setTimeout(() => { try { source.stop(); } catch {} }, 2100);
      } else {
        try { source.stop(); } catch {}
      }
      audioRef.current = null;
    }
  }, []);

  const startAudio = useCallback(() => {
    stopAudio();
    if (sound === 'None') return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    audioRef.current = createNoise(audioCtxRef.current, sound);
  }, [stopAudio, sound]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startFocus = useCallback(() => {
    setTimeLeft(duration * 60);
    setPhase('focus');
    setBreakAction(null);
    startAudio();
    if (settings.notifyReminders) notifyFocusStart();
  }, [duration, startAudio, settings.notifyReminders]);

  const pauseFocus = useCallback(() => {
    clearTimer();
    stopAudio(true);
    setPhase('paused');
  }, [clearTimer, stopAudio]);

  const resumeFocus = useCallback(() => {
    setPhase('focus');
    startAudio();
  }, [startAudio]);

  const startBreak = useCallback(() => {
    clearTimer();
    stopAudio(true);
    setBreakAction(getBreakAction(duration));
    setTimeLeft(breakDuration * 60);
    setPhase('break');
    setSessionCount(c => {
      const next = c + 1;
      if (settings.notifyStreak && next > 1 && next % 2 === 0) notifyStreak(next);
      return next;
    });
    if (settings.notifyReminders) notifyFocusEnd();
  }, [clearTimer, stopAudio, duration, breakDuration, settings.notifyStreak, settings.notifyReminders]);

  const resetAll = useCallback(() => {
    clearTimer();
    stopAudio();
    setPhase('idle');
    setTimeLeft(0);
    setBreakAction(null);
  }, [clearTimer, stopAudio]);

  // Timer tick
  useEffect(() => {
    if (phase !== 'focus' && phase !== 'break') return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          if (phase === 'focus') {
            startBreak();
          } else if (phase === 'break') {
            if (settings.focusAutoNext) {
              startFocus();
            } else {
              setPhase('done');
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, clearTimer, startBreak, startFocus, settings.focusAutoNext]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const progress = phase === 'focus' || phase === 'paused'
    ? 1 - timeLeft / (duration * 60)
    : phase === 'break'
    ? 1 - timeLeft / (breakDuration * 60)
    : 0;

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

  // Running/paused mini-bar
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
              {phase === 'break' ? 'Break' : phase === 'paused' ? 'Paused' : 'Focus'}
            </span>
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

              {/* Sound indicator when running */}
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

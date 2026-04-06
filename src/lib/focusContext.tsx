import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { getSettings } from '@/lib/settings';
import { notifyFocusStart, notifyFocusEnd, notifyStreak } from '@/lib/focusNotifications';
import { getBreakAction, type BreakAction } from '@/lib/breakActions';

export type FocusPhase = 'idle' | 'focus' | 'paused' | 'done' | 'break';

interface FocusState {
  phase: FocusPhase;
  timeLeft: number;
  expanded: boolean;
  sessionCount: number;
  breakAction: BreakAction | null;
  progress: number;
  duration: number;
  breakDuration: number;
  sound: string;
  startFocus: () => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  resetAll: () => void;
  setExpanded: (v: boolean) => void;
}

const FocusContext = createContext<FocusState | null>(null);

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}

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
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
  return { source, gain };
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<FocusPhase>('idle');
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

  return (
    <FocusContext.Provider value={{
      phase, timeLeft, expanded, sessionCount, breakAction, progress,
      duration, breakDuration, sound,
      startFocus, pauseFocus, resumeFocus, resetAll, setExpanded,
    }}>
      {children}
    </FocusContext.Provider>
  );
}

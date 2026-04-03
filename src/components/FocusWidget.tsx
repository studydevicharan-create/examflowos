import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2 } from 'lucide-react';

const PRESETS = [25, 45, 60] as const;
const SOUNDS = ['None', 'White', 'Brown', 'Rain'] as const;
type Sound = typeof SOUNDS[number];

// Simple noise generators using Web Audio API
function createNoise(ctx: AudioContext, type: Sound): AudioNode | null {
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
  gain.gain.value = 0.15;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return source;
}

export default function FocusWidget() {
  const [expanded, setExpanded] = useState(false);
  const [duration, setDuration] = useState(25);
  const [sound, setSound] = useState<Sound>('None');
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const [done, setDone] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const stopAudio = useCallback(() => {
    if (sourceRef.current && 'stop' in sourceRef.current) {
      (sourceRef.current as AudioBufferSourceNode).stop();
    }
    sourceRef.current = null;
  }, []);

  const startAudio = useCallback((s: Sound) => {
    stopAudio();
    if (s === 'None') return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    sourceRef.current = createNoise(audioCtxRef.current, s);
  }, [stopAudio]);

  const startSession = () => {
    setTimeLeft(duration * 60);
    setRunning(true);
    setDone(false);
    startAudio(sound);
  };

  const stopSession = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    stopAudio();
  }, [stopAudio]);

  const resetSession = useCallback(() => {
    stopSession();
    setTimeLeft(duration * 60);
    setDone(false);
  }, [stopSession, duration]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setRunning(false);
          setDone(true);
          stopAudio();
          // Haptic
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, stopAudio]);

  // Update timeLeft when duration changes (only when not running)
  useEffect(() => {
    if (!running && !done) setTimeLeft(duration * 60);
  }, [duration, running, done]);

  // Cleanup audio on unmount
  useEffect(() => () => stopAudio(), [stopAudio]);

  // Sound change while running
  useEffect(() => {
    if (running) {
      startAudio(sound);
    }
  }, [sound, running, startAudio]);

  const progress = 1 - timeLeft / (duration * 60);

  // Compact state
  if (!expanded && !running) {
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

  // Running mini-bar (collapsed while running)
  if (!expanded && running) {
    return (
      <motion.button
        layout
        onClick={() => setExpanded(true)}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-3 rounded-2xl border border-primary/30 bg-card px-4 py-3 shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* Mini progress ring */}
        <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
          <circle cx="14" cy="14" r="11" fill="none" strokeWidth="2.5" className="stroke-muted" />
          <circle cx="14" cy="14" r="11" fill="none" strokeWidth="2.5" className="stroke-primary"
            strokeDasharray={`${2 * Math.PI * 11}`}
            strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress)}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-base font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
      </motion.button>
    );
  }

  // Expanded state
  return (
    <AnimatePresence>
      <motion.div
        layout
        className="fixed bottom-24 right-4 z-40 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl"
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Focus</span>
          <button onClick={() => { if (!running) resetSession(); setExpanded(false); }} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Done state */}
        {done && (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-foreground mb-1">Good. Continue or break?</p>
            <div className="flex gap-2 mt-3 justify-center">
              <motion.button whileTap={{ scale: 0.96 }} onClick={startSession}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                Continue
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => { resetSession(); setExpanded(false); }}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground">
                Break
              </motion.button>
            </div>
          </div>
        )}

        {/* Timer display */}
        {!done && (
          <>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold tabular-nums text-foreground">{formatTime(timeLeft)}</span>
            </div>

            {/* Presets (only when not running) */}
            {!running && (
              <div className="flex justify-center gap-2 mb-4">
                {PRESETS.map(p => (
                  <motion.button key={p} whileTap={{ scale: 0.96 }}
                    onClick={() => setDuration(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      duration === p
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p}m
                  </motion.button>
                ))}
              </div>
            )}

            {/* Sound selector */}
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex gap-1.5 flex-1">
                {SOUNDS.map(s => (
                  <button key={s}
                    onClick={() => setSound(s)}
                    className={`flex-1 rounded-md px-1 py-1 text-[10px] font-medium transition-colors ${
                      sound === s
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar (when running) */}
            {running && (
              <div className="h-1 rounded-full bg-muted mb-4 overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
              </div>
            )}

            {/* Action button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => running ? stopSession() : startSession()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
            >
              {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
            </motion.button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

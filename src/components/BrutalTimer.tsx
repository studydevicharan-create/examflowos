import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { type Subject } from '@/lib/types';
import { getSettings } from '@/lib/settings';

interface Props {
  subjects: Subject[];
}

function getTimeLeft(examDate: string) {
  const examMs = new Date(examDate + 'T00:00:00').getTime();
  const diff = examMs - Date.now();
  if (diff <= 0) return null;
  const totalSecs = Math.floor(diff / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const ms = Math.floor((diff % 1000) / 10);
  return { d, h, m, s, ms, totalSecs };
}

function pad(n: number, digits = 2) {
  return String(n).padStart(digits, '0');
}

function urgencyAccent(d: number) {
  if (d < 3) return 'text-destructive';
  if (d < 7) return 'text-yellow-500';
  return 'text-emerald-500';
}

function urgencyBorder(d: number) {
  if (d < 3) return 'border-destructive/40';
  if (d < 7) return 'border-yellow-500/30';
  return 'border-emerald-500/20';
}

function urgencyLabel(d: number) {
  if (d < 3) return 'URGENT';
  if (d < 7) return 'SOON';
  return 'AHEAD';
}

function microText(d: number) {
  return d < 3 ? 'No delay.' : 'Time is running.';
}

export default function BrutalTimer({ subjects }: Props) {
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const brutalMode = getSettings().brutalMode;

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const exams = subjects
    .filter(s => s.examDate)
    .map(s => ({ ...s, tl: getTimeLeft(s.examDate!) }))
    .filter(s => s.tl !== null)
    .sort((a, b) => a.tl!.totalSecs - b.tl!.totalSecs);

  if (exams.length === 0) return null;

  const primary = exams[0];
  const { d, h, m, s, ms } = primary.tl!;
  const accent = urgencyAccent(d);
  const bc = urgencyBorder(d);

  return (
    <div className="mb-6">
      <button
        onClick={() => navigate(`/subjects/${primary.id}`)}
        className={`w-full rounded-xl border ${bc} bg-card p-4 text-left active:opacity-90 transition-opacity`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className={`h-3.5 w-3.5 ${accent}`} />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Next Exam</span>
          </div>
          <span className={`text-[9px] uppercase tracking-widest font-bold ${accent}`}>
            {urgencyLabel(d)}
          </span>
        </div>

        {/* Subject name */}
        <p className={`text-base font-bold text-foreground mb-3 ${brutalMode ? 'tracking-wide' : ''}`}>
          {primary.title}
        </p>

        {/* Countdown — digits always text-foreground */}
        <div className="flex items-end gap-0.5">
          <TimeBlock value={pad(d)} label="d" brutal={brutalMode} />
          <Colon brutal={brutalMode} />
          <TimeBlock value={pad(h)} label="h" brutal={brutalMode} />
          <Colon brutal={brutalMode} />
          <TimeBlock value={pad(m)} label="m" brutal={brutalMode} />
          {brutalMode && (
            <>
              <Colon brutal />
              <TimeBlock value={pad(s)} label="s" brutal />
              <Dot brutal />
              <TimeBlock value={pad(ms)} label="ms" brutal small />
            </>
          )}
        </div>

        {/* Micro psychology */}
        <p className="mt-3 text-[9px] tracking-widest uppercase text-muted-foreground/40">
          {microText(d)}
        </p>
      </button>

      {/* Second exam preview + expand */}
      {exams.length > 1 && (
        <div className="mt-1.5">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-[11px] text-muted-foreground active:bg-secondary transition-colors"
          >
            <span>
              Next:{' '}
              <span className="text-foreground font-medium">{exams[1].title}</span>
              {' '}→ {exams[1].tl!.d}d {pad(exams[1].tl!.h)}h
            </span>
            {expanded
              ? <ChevronUp className="h-3 w-3 flex-shrink-0" />
              : <ChevronDown className="h-3 w-3 flex-shrink-0" />
            }
          </button>

          {expanded && (
            <div className="mt-1 space-y-1.5">
              {exams.slice(1).map(exam => {
                const ec = urgencyAccent(exam.tl!.d);
                return (
                  <button
                    key={exam.id}
                    onClick={() => navigate(`/subjects/${exam.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 active:opacity-80"
                  >
                    <span className="text-sm text-foreground truncate text-left">{exam.title}</span>
                    <span className={`text-xs font-medium ml-2 flex-shrink-0 font-mono ${ec}`}>
                      {exam.tl!.d}d {pad(exam.tl!.h)}h
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TimeBlock({
  value,
  label,
  brutal,
  small = false,
}: {
  value: string;
  label: string;
  brutal: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[28px]">
      <span
        className={`font-mono leading-none text-foreground ${
          brutal
            ? small
              ? 'text-lg font-black tracking-tight'
              : 'text-[28px] font-black tracking-tight'
            : 'text-2xl font-bold'
        }`}
      >
        {value}
      </span>
      <span className="text-[8px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

function Colon({ brutal }: { brutal: boolean }) {
  return (
    <span
      className={`font-mono text-foreground/20 mb-4 mx-0.5 ${
        brutal ? 'text-2xl font-black' : 'text-xl font-bold'
      }`}
    >
      :
    </span>
  );
}

function Dot({ brutal }: { brutal: boolean }) {
  return (
    <span
      className={`font-mono text-foreground/20 mb-4 mx-0.5 ${
        brutal ? 'text-xl font-black' : 'text-lg font-bold'
      }`}
    >
      .
    </span>
  );
}

import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import FlashcardView from '@/components/FlashcardView';
import { getCardsForReview, reviewCard, updateDailyStats } from '@/lib/store';
import type { RecallMode } from '@/lib/types';

export default function RecallSessionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mode = (params.get('mode') || 'random') as RecallMode;
  const subjectId = params.get('subjectId') || undefined;
  const topicId = params.get('topic') || undefined;

  const [cards] = useState(() => getCardsForReview(mode, subjectId, topicId));
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ easy: 0, hard: 0, skip: 0 });

  const advance = useCallback(() => {
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
    }
  }, [index, cards.length]);

  const handleEasy = useCallback(() => {
    reviewCard(cards[index].id, 3);
    updateDailyStats(1, true);
    setSessionStats(s => ({ ...s, easy: s.easy + 1 }));
    advance();
  }, [cards, index, advance]);

  const handleHard = useCallback(() => {
    reviewCard(cards[index].id, 1);
    updateDailyStats(1, false);
    setSessionStats(s => ({ ...s, hard: s.hard + 1 }));
    advance();
  }, [cards, index, advance]);

  const handleSkip = useCallback(() => {
    reviewCard(cards[index].id, 0);
    setSessionStats(s => ({ ...s, skip: s.skip + 1 }));
    advance();
  }, [cards, index, advance]);

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">No cards available</p>
        <button onClick={() => navigate('/recall')} className="mt-4 text-sm text-primary">Go back</button>
      </div>
    );
  }

  if (done) {
    const total = sessionStats.easy + sessionStats.hard + sessionStats.skip;
    const accuracy = total > 0 ? Math.round((sessionStats.easy / total) * 100) : 0;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">Session Complete!</h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-success">{sessionStats.easy}</p>
              <p className="text-[10px] text-muted-foreground">Easy</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">{sessionStats.hard}</p>
              <p className="text-[10px] text-muted-foreground">Hard</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-muted-foreground">{sessionStats.skip}</p>
              <p className="text-[10px] text-muted-foreground">Skipped</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Accuracy: {accuracy}%</p>
          <button onClick={() => navigate('/recall')} className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pt-4">
      <div className="flex items-center gap-3 px-4 py-2">
        <button onClick={() => navigate('/recall')} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground capitalize">{mode} mode</span>
      </div>
      <FlashcardView
        card={cards[index]}
        onEasy={handleEasy}
        onHard={handleHard}
        onSkip={handleSkip}
        current={index + 1}
        total={cards.length}
      />
    </div>
  );
}

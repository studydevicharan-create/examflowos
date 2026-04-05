import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Brain, RotateCcw } from 'lucide-react';
import FlashcardView from '@/components/FlashcardView';
import { getCardsForReview, reviewCard, updateDailyStats } from '@/lib/store';
import type { RecallMode, Flashcard } from '@/lib/types';

export default function RecallSessionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mode = (params.get('mode') || 'random') as RecallMode;
  const subjectId = params.get('subjectId') || undefined;
  const topicId = params.get('topic') || undefined;

  const [cards] = useState(() => getCardsForReview(mode, subjectId, topicId));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'prerecall' | 'active' | 'done' | 'mistakes'>('prerecall');
  const [sessionStats, setSessionStats] = useState({ easy: 0, hard: 0, skip: 0 });
  const [mistakeCards, setMistakeCards] = useState<Flashcard[]>([]);
  const [mistakeIndex, setMistakeIndex] = useState(0);

  const advance = useCallback(() => {
    if (index + 1 >= cards.length) {
      setPhase('done');
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
    setMistakeCards(prev => [...prev, cards[index]]);
    advance();
  }, [cards, index, advance]);

  const handleSkip = useCallback(() => {
    reviewCard(cards[index].id, 0);
    setSessionStats(s => ({ ...s, skip: s.skip + 1 }));
    setMistakeCards(prev => [...prev, cards[index]]);
    advance();
  }, [cards, index, advance]);

  const handleOpenNotes = useCallback(() => {
    const card = cards[index];
    if (card) navigate(`/topic/${card.topicId}`);
  }, [cards, index, navigate]);

  // Mistake replay handlers
  const handleMistakeEasy = useCallback(() => {
    reviewCard(mistakeCards[mistakeIndex].id, 3);
    if (mistakeIndex + 1 >= mistakeCards.length) {
      setPhase('done');
      setMistakeCards([]);
    } else {
      setMistakeIndex(i => i + 1);
    }
  }, [mistakeCards, mistakeIndex]);

  const handleMistakeHard = useCallback(() => {
    reviewCard(mistakeCards[mistakeIndex].id, 1);
    if (mistakeIndex + 1 >= mistakeCards.length) {
      setPhase('done');
      setMistakeCards([]);
    } else {
      setMistakeIndex(i => i + 1);
    }
  }, [mistakeCards, mistakeIndex]);

  const handleMistakeSkip = useCallback(() => {
    if (mistakeIndex + 1 >= mistakeCards.length) {
      setPhase('done');
      setMistakeCards([]);
    } else {
      setMistakeIndex(i => i + 1);
    }
  }, [mistakeCards, mistakeIndex]);

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">No cards available</p>
        <button onClick={() => navigate('/recall')} className="mt-4 text-sm text-primary">Go back</button>
      </div>
    );
  }

  // Pre-recall screen
  if (phase === 'prerecall') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xs text-center"
        >
          <Brain className="mx-auto h-12 w-12 text-primary/60" />
          <h2 className="mt-6 text-lg font-bold text-foreground">Ready to recall?</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Try to recall before revealing.{'\n'}
            Struggle = memory building.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {cards.length} card{cards.length !== 1 ? 's' : ''} in this session
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('active')}
            className="mt-8 w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Start
          </motion.button>
          <button
            onClick={() => navigate('/recall')}
            className="mt-3 text-xs text-muted-foreground"
          >
            Go back
          </button>
        </motion.div>
      </div>
    );
  }

  // Mistake replay phase
  if (phase === 'mistakes') {
    return (
      <div className="flex min-h-screen flex-col pt-4">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => { setPhase('done'); setMistakeCards([]); }} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-muted-foreground">Reviewing mistakes</span>
        </div>
        <FlashcardView
          card={mistakeCards[mistakeIndex]}
          onEasy={handleMistakeEasy}
          onHard={handleMistakeHard}
          onSkip={handleMistakeSkip}
          current={mistakeIndex + 1}
          total={mistakeCards.length}
        />
      </div>
    );
  }

  // Done screen
  if (phase === 'done') {
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

          {/* Session Memory Boost */}
          {total > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-xs text-primary/70"
            >
              ✔ {total} cards reviewed{sessionStats.easy > 0 && ` • ${sessionStats.easy} nailed`}
            </motion.p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {/* Last Mistake Replay */}
            {mistakeCards.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => { setMistakeIndex(0); setPhase('mistakes'); }}
                className="flex items-center justify-center gap-2 rounded-lg border border-destructive/30 px-6 py-3 text-sm font-medium text-destructive"
              >
                <RotateCcw className="h-4 w-4" />
                Review {mistakeCards.length} mistake{mistakeCards.length !== 1 ? 's' : ''}
              </motion.button>
            )}
            <button onClick={() => navigate('/recall')} className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
              Done
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active session
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
        onOpenNotes={handleOpenNotes}
        current={index + 1}
        total={cards.length}
      />
    </div>
  );
}

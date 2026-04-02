import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Shuffle, GraduationCap, Star, Image } from 'lucide-react';
import { getSubjects, getFlashcards, getCardsForReview, isWeakCard } from '@/lib/store';

export default function RecallPage() {
  const navigate = useNavigate();
  const subjects = getSubjects();
  const allCards = getFlashcards();
  const weakCards = allCards.filter(c => isWeakCard(c));
  const imageCards = allCards.filter(c => c.type === 'image');

  const modes = [
    { id: 'random', label: 'All Cards', icon: Shuffle, count: allCards.length, desc: 'Every card in your deck' },
    { id: 'important', label: 'Important Only', icon: Star, count: getCardsForReview('important').length, desc: 'Cards from starred topics' },
    { id: 'weak', label: 'Weak Only', icon: AlertTriangle, count: weakCards.length, desc: 'Cards you struggle with' },
    { id: 'image', label: 'Image Only', icon: Image, count: imageCards.length, desc: 'Visual recall — diagrams & formulas' },
    { id: 'exam', label: 'Exam Mode', icon: GraduationCap, count: getCardsForReview('exam').length, desc: 'Weak + important combined' },
  ];

  return (
    <div className="flex min-h-screen flex-col px-4 pb-28 pt-12">
      <h1 className="text-xl font-bold text-foreground">Recall</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {allCards.length} total card{allCards.length !== 1 ? 's' : ''} • {weakCards.length} weak
        {imageCards.length > 0 && ` • ${imageCards.length} visual`}
      </p>

      <div className="mt-6 space-y-3">
        {modes.map(m => (
          <motion.button
            key={m.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => m.count > 0 && navigate(`/recall/session?mode=${m.id}`)}
            disabled={m.count === 0}
            className="flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left disabled:opacity-40"
          >
            <m.icon className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{m.count}</span>
          </motion.button>
        ))}
      </div>

      {subjects.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">By Subject</h2>
          <div className="space-y-2">
            {subjects.map(s => {
              const count = allCards.filter(c => c.subjectId === s.id).length;
              return (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => count > 0 && navigate(`/recall/session?mode=subject&subjectId=${s.id}`)}
                  disabled={count === 0}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 disabled:opacity-40"
                >
                  <span className="text-sm text-foreground">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{count} cards</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {allCards.length === 0 && (
        <div className="mt-16 text-center">
          <Brain className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">No flashcards yet</p>
          <p className="text-xs text-muted-foreground">Add cards from topic detail pages</p>
        </div>
      )}
    </div>
  );
}

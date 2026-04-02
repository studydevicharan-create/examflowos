import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Star, Plus, X, Save } from 'lucide-react';
import { getNodes, updateNode, getFlashcards, addFlashcard } from '@/lib/store';

export default function TopicDetailPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(getNodes);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');

  const node = nodes[nodeId || ''];
  const cards = getFlashcards().filter(c => c.topicId === nodeId);
  const [notes, setNotes] = useState(node?.notes || '');

  const refresh = useCallback(() => setNodes(getNodes()), []);

  const saveNotes = useCallback(() => {
    if (!node) return;
    updateNode(node.id, { notes });
    refresh();
  }, [node, notes, refresh]);

  const handleAddCard = () => {
    if (!cardFront.trim() || !cardBack.trim() || !nodeId || !node) return;
    addFlashcard(nodeId, node.subjectId, cardFront.trim(), cardBack.trim());
    setCardFront('');
    setCardBack('');
    setShowAddCard(false);
  };

  const toggleImportant = () => {
    if (!node) return;
    updateNode(node.id, { important: !node.important });
    refresh();
  };

  const toggleComplete = () => {
    if (!node) return;
    updateNode(node.id, { completed: !node.completed, lastRevised: new Date().toISOString() });
    refresh();
  };

  if (!node) return <div className="p-4 text-muted-foreground">Topic not found</div>;

  return (
    <div className="flex min-h-screen flex-col pb-24 pt-4">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate text-lg font-bold text-foreground">{node.title}</h1>
        <button onClick={toggleImportant} className="p-1">
          <Star className={`h-5 w-5 ${node.important ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
        </button>
      </div>

      <div className="space-y-6 px-4 mt-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <button
            onClick={toggleComplete}
            className={`rounded-full px-3 py-1 border ${node.completed ? 'border-success text-success' : 'border-border'}`}
          >
            {node.completed ? 'Completed ✓' : 'Mark complete'}
          </button>
          {node.lastRevised && (
            <span>Last revised: {new Date(node.lastRevised).toLocaleDateString()}</span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Notes</h2>
            <button onClick={saveNotes} className="flex items-center gap-1 text-xs text-primary">
              <Save className="h-3 w-3" /> Save
            </button>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="• Key point 1&#10;• Key point 2&#10;• Keep it concise"
            rows={6}
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => cards.length > 0 && navigate(`/recall/session?topic=${nodeId}`)}
            disabled={cards.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            <Brain className="h-4 w-4" />
            Recall ({cards.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddCard(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground"
          >
            <Plus className="h-4 w-4" /> Card
          </motion.button>
        </div>

        {cards.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Flashcards</h2>
            <div className="space-y-2">
              {cards.map(c => (
                <div key={c.id} className="rounded-lg border border-border bg-secondary p-3">
                  <p className="text-xs font-medium text-foreground">{c.front}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.back}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddCard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowAddCard(false)}
        >
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[768px] rounded-t-2xl border-t border-border bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Add Flashcard</h2>
              <button onClick={() => setShowAddCard(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <input
              autoFocus
              value={cardFront}
              onChange={e => setCardFront(e.target.value)}
              placeholder="Question"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary mb-3"
            />
            <textarea
              value={cardBack}
              onChange={e => setCardBack(e.target.value)}
              placeholder="Answer"
              rows={3}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <button
              onClick={handleAddCard}
              disabled={!cardFront.trim() || !cardBack.trim()}
              className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Add Card
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

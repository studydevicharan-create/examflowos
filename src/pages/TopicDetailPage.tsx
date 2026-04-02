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
  const [cardPrompt, setCardPrompt] = useState('');
  const [cardReveal, setCardReveal] = useState('');

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
    if (!cardPrompt.trim() || !nodeId || !node) return;
    addFlashcard(nodeId, node.subjectId, cardPrompt.trim(), cardReveal.trim());
    setCardPrompt('');
    setCardReveal('');
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
            onClick={() => cards.length > 0 && navigate(`/recall/session?mode=topic&topic=${nodeId}`)}
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
            <Plus className="h-4 w-4" /> Add Card
          </motion.button>
        </div>

        {/* Card count + list */}
        {cards.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">{cards.length} Card{cards.length !== 1 ? 's' : ''}</h2>
            <div className="space-y-2">
              {cards.map(c => (
                <div key={c.id} className="rounded-lg border border-border bg-secondary p-3">
                  <p className="text-xs font-medium text-foreground">{c.prompt}</p>
                  {c.reveal && <p className="mt-1 text-xs text-muted-foreground">{c.reveal}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {cards.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No cards yet. Add your first question.</p>
          </div>
        )}
      </div>

      {/* Add Card Modal */}
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
              <h2 className="text-sm font-semibold text-foreground">Add Card</h2>
              <button onClick={() => setShowAddCard(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Prompt *</label>
                <input
                  autoFocus
                  value={cardPrompt}
                  onChange={e => setCardPrompt(e.target.value)}
                  placeholder="Ask your future self something… (e.g., What is EMF?)"
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Reveal (optional)</label>
                <textarea
                  value={cardReveal}
                  onChange={e => setCardReveal(e.target.value)}
                  placeholder="Short answer, formula, or hint (optional)"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
              Keep it short. One idea per card.{'\n'}If you can't recall, check Reveal or open your notes.
            </p>

            <button
              onClick={handleAddCard}
              disabled={!cardPrompt.trim()}
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

import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Star, Plus, X, Save, Image, Type, MoreVertical, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { getNodes, updateNode, getFlashcards, addFlashcard, updateFlashcard, deleteFlashcard } from '@/lib/store';
import type { CardType, Flashcard } from '@/lib/types';

export default function TopicDetailPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(getNodes);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardType, setCardType] = useState<CardType>('text');
  const [cardPrompt, setCardPrompt] = useState('');
  const [cardReveal, setCardReveal] = useState('');
  const [cardImage, setCardImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit/delete state
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cardMenuOpen, setCardMenuOpen] = useState<string | null>(null);

  const node = nodes[nodeId || ''];
  const [cards, setCards] = useState(() => getFlashcards().filter(c => c.topicId === nodeId));
  const [notes, setNotes] = useState(node?.notes || '');
  const imageCards = cards.filter(c => c.type === 'image');

  const refresh = useCallback(() => {
    setNodes(getNodes());
    setCards(getFlashcards().filter(c => c.topicId === nodeId));
  }, [nodeId]);

  const saveNotes = useCallback(() => {
    if (!node) return;
    updateNode(node.id, { notes });
    refresh();
  }, [node, notes, refresh]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCardImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCard = () => {
    if (!nodeId || !node) return;
    if (cardType === 'text' && !cardPrompt.trim()) return;
    if (cardType === 'image' && !cardImage) return;

    addFlashcard(nodeId, node.subjectId, cardPrompt.trim(), cardReveal.trim(), cardImage, cardType);
    resetCardForm();
    refresh();
  };

  const handleEditCard = () => {
    if (!editingCard) return;
    if (editingCard.type === 'text' && !cardPrompt.trim()) return;
    if (editingCard.type === 'image' && !cardImage && !editingCard.image) return;

    updateFlashcard(editingCard.id, {
      prompt: cardPrompt.trim(),
      reveal: cardReveal.trim(),
      image: cardImage || editingCard.image,
      type: cardType,
    });
    resetCardForm();
    refresh();
  };

  const handleDeleteCard = (id: string) => {
    deleteFlashcard(id);
    setDeleteConfirmId(null);
    setCardMenuOpen(null);
    refresh();
  };

  const openEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setCardType(card.type);
    setCardPrompt(card.prompt);
    setCardReveal(card.reveal);
    setCardImage(card.image);
    setCardMenuOpen(null);
    setShowAddCard(true);
  };

  const resetCardForm = () => {
    setCardPrompt('');
    setCardReveal('');
    setCardImage('');
    setCardType('text');
    setShowAddCard(false);
    setEditingCard(null);
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

  const isEditing = !!editingCard;

  return (
    <div className="flex min-h-screen flex-col pb-28 pt-4">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate text-lg font-bold text-foreground">{node.title}</h1>
        <button onClick={toggleImportant} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Star className={`h-5 w-5 ${node.important ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
        </button>
      </div>

      <div className="space-y-6 px-4 mt-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <button
            onClick={toggleComplete}
            className={`rounded-full px-3 py-1 min-h-[44px] border ${node.completed ? 'border-success text-success' : 'border-border'}`}
          >
            {node.completed ? 'Completed ✓' : 'Mark complete'}
          </button>
          {node.lastRevised && (
            <span>Last revised: {new Date(node.lastRevised).toLocaleDateString()}</span>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Notes</h2>
            <button onClick={saveNotes} className="flex items-center gap-1 text-xs text-primary min-h-[44px]">
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

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => cards.length > 0 && navigate(`/recall/session?mode=topic&topic=${nodeId}`)}
            disabled={cards.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 min-h-[48px] text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            <Brain className="h-4 w-4" />
            Recall ({cards.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { resetCardForm(); setShowAddCard(true); }}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 min-h-[48px] text-sm text-foreground"
          >
            <Plus className="h-4 w-4" /> Add Card
          </motion.button>
        </div>

        {/* Cards list */}
        {cards.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              {cards.length} Card{cards.length !== 1 ? 's' : ''}
              {imageCards.length > 0 && <span className="text-muted-foreground font-normal"> • {imageCards.length} visual</span>}
            </h2>
            <div className="space-y-2">
              {cards.map(c => (
                <div key={c.id} className="relative rounded-lg border border-border bg-secondary p-3">
                  {/* Card menu button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setCardMenuOpen(cardMenuOpen === c.id ? null : c.id); }}
                    className="absolute top-2 right-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Card menu dropdown */}
                  <AnimatePresence>
                    {cardMenuOpen === c.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-10 right-2 z-20 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditCard(c); }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit Card
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(c.id); setCardMenuOpen(null); }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-destructive transition-colors hover:bg-secondary"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete Card
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pr-8">
                    {c.type === 'image' && c.image && (
                      <img src={c.image} alt="" className="mb-2 h-20 w-full rounded object-cover" />
                    )}
                    {c.prompt && <p className="text-xs font-medium text-foreground">{c.prompt}</p>}
                    {c.reveal && <p className="mt-1 text-xs text-muted-foreground">{c.reveal}</p>}
                    {c.type === 'image' && !c.prompt && (
                      <p className="text-[10px] text-muted-foreground">Image card</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cards.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No cards yet. Add your first question.</p>
            <p className="mt-1 text-[10px] text-muted-foreground/60">Start your flow. — ExamFlowOS</p>
          </div>
        )}
      </div>

      {/* Close menu on background click */}
      {cardMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setCardMenuOpen(null)} />
      )}

      {/* Delete Card Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Delete Card</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This flashcard will be permanently deleted. This action cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 min-h-[44px] rounded-lg border border-border text-xs text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCard(deleteConfirmId)}
                  className="flex-1 min-h-[44px] rounded-lg bg-destructive text-xs font-medium text-destructive-foreground"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Card Modal */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={resetCardForm}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[768px] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  {isEditing ? 'Edit Card' : 'Add Card'}
                </h2>
                <button onClick={resetCardForm} className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Card type selector (only for new cards) */}
              {!isEditing && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setCardType('text')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 min-h-[44px] text-xs font-medium transition-colors ${
                      cardType === 'text'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Type className="h-4 w-4" /> Text Card
                  </button>
                  <button
                    onClick={() => setCardType('image')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 min-h-[44px] text-xs font-medium transition-colors ${
                      cardType === 'image'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Image className="h-4 w-4" /> Image Card
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {/* Image upload for image cards */}
                {cardType === 'image' && (
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Image *
                    </label>
                    {cardImage ? (
                      <div className="relative">
                        <img src={cardImage} alt="Preview" className="w-full rounded-lg object-contain max-h-48 bg-secondary" />
                        <button
                          onClick={() => { setCardImage(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="absolute top-2 right-2 rounded-full bg-background/80 p-1 text-muted-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary py-8 text-muted-foreground transition-colors hover:border-primary/40"
                      >
                        <Image className="h-8 w-8 text-muted-foreground/50" />
                        <span className="text-xs">Upload diagram, screenshot, or photo</span>
                        <span className="text-[10px] text-muted-foreground/60">Max 5MB • JPG, PNG, WebP</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Prompt {cardType === 'text' ? '*' : '(optional)'}
                  </label>
                  <input
                    autoFocus={cardType === 'text'}
                    value={cardPrompt}
                    onChange={e => setCardPrompt(e.target.value)}
                    placeholder={cardType === 'image'
                      ? "What is happening in this diagram?"
                      : "Ask your future self something… (e.g., What is EMF?)"
                    }
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 min-h-[44px] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Reveal */}
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Reveal (optional)
                  </label>
                  <textarea
                    value={cardReveal}
                    onChange={e => setCardReveal(e.target.value)}
                    placeholder="Short explanation or key points"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
                Keep it short. One idea per card.{'\n'}If you can't recall, check Reveal or open your notes.
              </p>

              <button
                onClick={isEditing ? handleEditCard : handleAddCard}
                disabled={cardType === 'text' ? !cardPrompt.trim() : (!cardImage && (!editingCard || !editingCard.image))}
                className="mt-4 w-full rounded-lg bg-primary py-3 min-h-[48px] text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                {isEditing ? 'Save Changes' : 'Add Card'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

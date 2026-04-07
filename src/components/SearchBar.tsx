import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNodes, getFlashcards, getSubjects } from '@/lib/store';

interface SearchResult {
  type: 'topic' | 'card';
  id: string;
  title: string;
  subtitle: string;
  navigateTo: string;
}

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const nodes = getNodes();
    const cards = getFlashcards();
    const subjects = getSubjects();
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.title]));
    const results: SearchResult[] = [];

    // Search topics (non-root nodes)
    Object.values(nodes)
      .filter(n => n.depth > 0 && n.title.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(n => {
        results.push({
          type: 'topic',
          id: n.id,
          title: n.title,
          subtitle: subjectMap[n.subjectId] || '',
          navigateTo: `/topic/${n.id}`,
        });
      });

    // Search flashcards
    cards
      .filter(c => c.prompt.toLowerCase().includes(q) || c.reveal.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(c => {
        results.push({
          type: 'card',
          id: c.id,
          title: c.prompt.length > 50 ? c.prompt.slice(0, 50) + '…' : c.prompt,
          subtitle: subjectMap[c.subjectId] || '',
          navigateTo: `/topic/${c.topicId}`,
        });
      });

    return results.slice(0, 8);
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(r.navigateTo);
  };

  if (!open) {
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search topics & cards…</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 relative z-20"
    >
      <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-3 py-2.5">
        <Search className="h-4 w-4 text-primary" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search topics & cards…"
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button onClick={() => { setOpen(false); setQuery(''); }} className="p-0.5 text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-xl overflow-hidden"
          >
            {results.map(r => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors"
              >
                {r.type === 'topic'
                  ? <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  : <Brain className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {query.length >= 2 && results.length === 0 && (
        <div className="absolute left-0 right-0 mt-1 rounded-lg border border-border bg-card px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground">No results found</p>
        </div>
      )}
    </motion.div>
  );
}

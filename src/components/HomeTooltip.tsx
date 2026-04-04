import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const TOOLTIP_KEY = 'examflowos_home_tooltip_seen';

export default function HomeTooltip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(TOOLTIP_KEY) !== 'true') {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(TOOLTIP_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
        >
          <p className="flex-1 text-xs text-foreground">
            Tap <span className="font-medium text-primary">'Start Focus'</span> → begin with weak topics
          </p>
          <button onClick={dismiss} className="min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

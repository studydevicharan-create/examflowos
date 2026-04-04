import { motion, AnimatePresence } from 'framer-motion';

// Lock-in overlay that dims everything except the focus widget
export default function FocusOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-[2px] pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Brain, Focus } from 'lucide-react';

const ONBOARDING_KEY = 'examflowos_onboarded';

const SCREENS = [
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Study without thinking',
    text: 'Track syllabus. Recall actively. Focus deeply.',
    cta: 'Get Started',
  },
  {
    icon: null,
    title: 'Simple structure',
    text: 'Break subjects into small topics. Work one at a time.',
    visual: true,
    cta: 'Next',
  },
  {
    icon: <Brain className="h-8 w-8 text-primary" />,
    title: "Don't read. Recall.",
    text: 'Ask yourself questions. Try before revealing.',
    subtext: 'Struggle builds memory.',
    cta: 'Next',
  },
  {
    icon: <Focus className="h-8 w-8 text-primary" />,
    title: 'Enter flow',
    text: 'Start a session. Stay locked. Finish one task.',
    cta: 'Start Now',
  },
];

export function hasSeenOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function markOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

export default function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  const next = useCallback(() => {
    if (step === SCREENS.length - 1) {
      markOnboardingDone();
      onDone();
    } else {
      setStep(s => s + 1);
    }
  }, [step, onDone]);

  const skip = useCallback(() => {
    markOnboardingDone();
    onDone();
  }, [onDone]);

  const screen = SCREENS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background px-6"
    >
      {/* Skip */}
      <button
        onClick={skip}
        className="absolute top-6 right-6 text-xs text-muted-foreground/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        Skip
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          {screen.icon && <div className="mb-6">{screen.icon}</div>}

          {screen.visual && (
            <div className="mb-6 flex flex-col items-start gap-1 text-xs text-muted-foreground">
              {['Subject', 'Unit', 'Topic', 'Cards'].map((label, i) => (
                <div key={label} className="flex items-center gap-2" style={{ paddingLeft: i * 16 }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className={i === 2 ? 'text-foreground font-medium' : ''}>{label}</span>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-bold text-foreground">{screen.title}</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{screen.text}</p>
          {screen.subtext && (
            <p className="mt-2 text-[11px] text-muted-foreground/60 italic">{screen.subtext}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="mt-10 flex gap-2">
        {SCREENS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={next}
        className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 min-h-[48px] text-sm font-medium text-primary-foreground"
      >
        {screen.cta}
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

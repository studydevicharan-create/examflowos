import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Brain, TrendingUp, BookOpen, BarChart3, Instagram, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getSubjects, getFlashcards, getNodes, getNodeProgress, getDailyStats } from '@/lib/store';

import HomeTooltip from '@/components/HomeTooltip';
import SearchBar from '@/components/SearchBar';
import { FocusHome } from '@/components/FocusWidget';
import BrutalTimer from '@/components/BrutalTimer';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [subjects, setSubjects] = useState(getSubjects);

  // Refresh subjects every time the user navigates to Home
  useEffect(() => {
    setSubjects(getSubjects());
  }, [location.key]);
  const cards = getFlashcards();
  const nodes = getNodes();
  const stats = getDailyStats();

  const dueCards = cards.filter(c => new Date(c.nextReview) <= new Date()).length;
  const today = stats.find(s => s.date === new Date().toISOString().slice(0, 10));
  const streak = today?.studyStreak ?? 0;

  const totalProgress = subjects.length > 0
    ? Math.round(subjects.reduce((acc, s) => acc + getNodeProgress(s.rootNodeId, nodes), 0) / subjects.length)
    : 0;

  return (
    <>
      <Helmet>
        <title>ExamFlowOS | The Ultimate Study OS for Active Recall</title>
        <meta name="description" content="Transform your learning with ExamFlowOS. Use our integrated study planner, active recall tools, and focus timer to master any syllabus efficiently." />
        <link rel="canonical" href="https://examflowos.vercel.app/" />
      </Helmet>

      <div className="flex min-h-screen flex-col px-4 pb-28 pt-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center justify-between mb-1">
            <motion.h1 
              className="text-lg font-bold tracking-wide text-foreground bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Exam<span className="text-primary">Flow</span>OS: AI-Powered Study Platform and Active Recall Tracker
            </motion.h1>
            <motion.a 
              href="https://geddadadevicharan.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] tracking-wider text-muted-foreground/40 hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              imdvichrn
            </motion.a>
          </div>
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Good {getGreeting()}. Stay focused.
          </motion.p>
        </motion.div>

      {/* SEO Rich Content Section */}
      <section className="mt-8 prose prose-invert max-w-none">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-widest">Master Your Syllabus with Precision</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ExamFlowOS is a production-ready <strong>study operating system</strong> built for high-stakes exam preparation. By combining <strong>syllabus tracking</strong> with integrated <strong>active recall flashcards</strong>, we provide a seamless workflow for students to move from curriculum overview to deep memorization. Our <strong>offline-first</strong> architecture ensures your study sessions are never interrupted by connectivity issues.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-4">
          Leverage <strong>spaced repetition algorithms</strong> to prioritize your review sessions. The platform analyzes your mastery levels across different subjects and identifies weak areas, allowing you to focus your energy where it matters most. With built-in <strong>focus timers</strong> and productivity stats, ExamFlowOS is designed to minimize distractions and maximize memory retention.
        </p>
      </section>

      {/* Internal Linking Navigation */}
      <nav aria-label="Quick Access" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <motion.a
          href="/subjects"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-secondary to-secondary/80 text-xs rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300"
        >
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-medium">Browse Subjects</span>
        </motion.a>
        <motion.a
          href="/recall"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-secondary to-secondary/80 text-xs rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300"
        >
          <Brain className="h-4 w-4 text-primary" />
          <span className="font-medium">Start Recall Session</span>
        </motion.a>
        <motion.a
          href="/stats"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-secondary to-secondary/80 text-xs rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300"
        >
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-medium">View Learning Stats</span>
        </motion.a>
      </nav>

      {/* Portfolio & Social Links */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Connect & Explore</h2>
        <div className="flex gap-3">
          <motion.a
            href="https://geddadadevicharan.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 text-xs rounded-lg border border-primary/20 hover:border-primary hover:shadow-md transition-all duration-300"
          >
            <ExternalLink className="h-4 w-4 text-primary" />
            <span className="font-medium">Portfolio</span>
          </motion.a>
          <motion.a
            href="https://instagram.com/imdvichrn" // Assuming Instagram handle
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-xs rounded-lg border border-pink-500/20 hover:border-pink-500 hover:shadow-md transition-all duration-300"
          >
            <Instagram className="h-4 w-4 text-pink-500" />
            <span className="font-medium">Instagram</span>
          </motion.a>
        </div>
      </section>
      <FocusHome />

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Due cards" value={dueCards} />
        <StatCard label="Progress" value={`${totalProgress}%`} />
        <StatCard label="Streak" value={`${streak}d`} />
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        {dueCards > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/recall')}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            <Brain className="h-4 w-4" />
            Review {dueCards} cards
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/subjects')}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground"
        >
          <Plus className="h-4 w-4" />
          Study
        </motion.button>
      </div>

      {/* Recent Subjects */}
      {subjects.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Subjects</h2>
          <div className="space-y-2">
            {subjects.slice(0, 3).map(s => {
              const progress = getNodeProgress(s.rootNodeId, nodes);
              return (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/subjects/${s.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <span className="text-sm text-foreground">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {subjects.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">No subjects yet</p>
          <p className="mt-1 text-[10px] text-muted-foreground/50">Start your flow. — ExamFlowOS</p>
          <button
            onClick={() => navigate('/subjects')}
            className="mt-3 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Add Subject
          </button>
        </div>
      )}
      
    </div>

    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "ExamFlowOS Home",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://examflowos.vercel.app/"
          }]
        }
      })}
    </script>

    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Active Recall?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Active recall is a learning strategy that involves testing yourself on material rather than just re-reading it. ExamFlowOS automates this through flashcards."
            }
          },
          {
            "@type": "Question",
            "name": "Can I use ExamFlowOS offline?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, ExamFlowOS is built as an offline-first application, allowing you to study your syllabus and flashcards without an internet connection."
            }
          }
        ]
      })}
    </script>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

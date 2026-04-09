import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Download, Upload, AlertTriangle, ChevronDown, BookOpen, Palette, Zap, Database, Brain, Focus, Bell, GraduationCap, BellRing, BellOff, Shield, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { getSettings, saveSettings, type AppSettings } from '@/lib/settings';
import { getSubjects, getNodes, getFlashcards, saveSubjects, saveNodes, saveFlashcards } from '@/lib/store';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
  type NotificationPermissionState,
} from '@/lib/notifications';

// ---- Export/Import helpers ----
function buildExportPayload() {
  const subjects = getSubjects();
  const nodes = getNodes();
  const cards = getFlashcards();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    subjects: subjects.map(subject => {
      const rootNode = nodes[subject.rootNodeId];
      const buildUnit = (unitId: string) => {
        const unit = nodes[unitId];
        if (!unit) return null;
        return {
          id: unit.id,
          name: unit.title,
          topics: unit.children.map(topicId => {
            const topic = nodes[topicId];
            if (!topic) return null;
            return {
              id: topic.id,
              name: topic.title,
              notes: topic.notes || '',
              important: topic.important,
              completed: topic.completed,
              cards: cards
                .filter(c => c.topicId === topic.id)
                .map(c => ({
                  id: c.id,
                  type: c.type,
                  prompt: c.prompt,
                  reveal: c.reveal,
                  hint: c.hint,
                  image: c.image,
                  stats: {
                    easy: c.easeCount,
                    hard: c.hardCount,
                    skip: c.skipCount,
                    lastSeen: c.lastSeen,
                  },
                })),
            };
          }).filter(Boolean),
        };
      };

      return {
        id: subject.id,
        name: subject.title,
        color: subject.color,
        examDate: subject.examDate,
        units: (rootNode?.children || []).map(buildUnit).filter(Boolean),
      };
    }),
  };
}

type ExportStatus = 'idle' | 'preparing' | 'ready' | 'done' | 'error';
type ImportStatus = 'idle' | 'checking' | 'confirm' | 'importing' | 'done' | 'error';

type SectionKey = 'study' | 'flashcard' | 'appearance' | 'performance' | 'focus' | 'notifications' | 'data' | 'studysystem' | null;

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [openSection, setOpenSection] = useState<SectionKey>(null);

  // Export state
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const exportBlobRef = useRef<{ url: string; filename: string } | null>(null);

  // Import state
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importError, setImportError] = useState('');
  const [pendingImportData, setPendingImportData] = useState<unknown>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const update = useCallback((patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }, [settings]);

  const toggle = (key: SectionKey) => setOpenSection(prev => prev === key ? null : key);

  const clearData = () => {
    const s = getSettings();
    localStorage.clear();
    saveSettings(s);
    window.location.reload();
  };

  // ---- Export flow ----
  const startExport = async () => {
    setExportStatus('preparing');
    try {
      await new Promise(r => setTimeout(r, 600));
      const payload = buildExportPayload();
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `examflowos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      exportBlobRef.current = { url, filename };
      setExportStatus('ready');
    } catch {
      setExportStatus('error');
    }
  };

  const downloadExport = () => {
    if (!exportBlobRef.current) return;
    const a = document.createElement('a');
    a.href = exportBlobRef.current.url;
    a.download = exportBlobRef.current.filename;
    a.click();
    setExportStatus('done');
    setTimeout(() => {
      if (exportBlobRef.current) URL.revokeObjectURL(exportBlobRef.current.url);
      exportBlobRef.current = null;
      setExportStatus('idle');
    }, 3000);
  };

  const resetExport = () => {
    if (exportBlobRef.current) URL.revokeObjectURL(exportBlobRef.current.url);
    exportBlobRef.current = null;
    setExportStatus('idle');
  };

  // ---- Import flow ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('checking');
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.version || !Array.isArray(parsed.subjects)) {
          setImportStatus('error');
          setImportError('Invalid file. Import failed.');
          return;
        }
        setPendingImportData(parsed);
        setImportStatus('confirm');
      } catch {
        setImportStatus('error');
        setImportError('Invalid file. Import failed.');
      }
      if (importFileRef.current) importFileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!pendingImportData) return;
    setImportStatus('importing');
    try {
      await new Promise(r => setTimeout(r, 700));
      const data = pendingImportData as ReturnType<typeof buildExportPayload>;
      // Rebuild localStorage from structured format
      const { v4: uuidv4 } = await import('uuid');
      const newSubjects: ReturnType<typeof getSubjects> = [];
      const newNodes: ReturnType<typeof getNodes> = {};
      const newCards: ReturnType<typeof getFlashcards> = [];

      for (const sub of data.subjects) {
        const rootNodeId = uuidv4();
        newSubjects.push({
          id: sub.id,
          title: sub.name,
          color: sub.color || 'blue',
          rootNodeId,
          createdAt: new Date().toISOString(),
          lastStudied: null,
          examDate: sub.examDate || null,
        });
        newNodes[rootNodeId] = {
          id: rootNodeId, parentId: null, subjectId: sub.id,
          title: sub.name, depth: 0, completed: false, important: false,
          notes: '', lastRevised: null, order: 0, children: [], tags: [],
        };
        for (const unit of (sub.units || [])) {
          if (!unit) continue;
          newNodes[unit.id] = {
            id: unit.id, parentId: rootNodeId, subjectId: sub.id,
            title: unit.name, depth: 1, completed: false, important: false,
            notes: '', lastRevised: null, order: 0, children: [], tags: [],
          };
          newNodes[rootNodeId].children.push(unit.id);
          for (const topic of (unit.topics || [])) {
            if (!topic) continue;
            newNodes[topic.id] = {
              id: topic.id, parentId: unit.id, subjectId: sub.id,
              title: topic.name, depth: 2,
              completed: topic.completed ?? false,
              important: topic.important ?? false,
              notes: topic.notes || '', lastRevised: null,
              order: 0, children: [], tags: [],
            };
            newNodes[unit.id].children.push(topic.id);
            for (const card of (topic.cards || [])) {
              if (!card) continue;
              newCards.push({
                id: card.id, topicId: topic.id, subjectId: sub.id,
                type: card.type || 'text', prompt: card.prompt || '',
                reveal: card.reveal || '', hint: card.hint || '',
                image: card.image || '',
                easeCount: card.stats?.easy ?? 0,
                hardCount: card.stats?.hard ?? 0,
                skipCount: card.stats?.skip ?? 0,
                lastSeen: card.stats?.lastSeen || null,
                easeFactor: 2.5, interval: 1, repetitions: 0,
                nextReview: new Date().toISOString(),
              });
            }
          }
        }
      }

      saveSubjects(newSubjects);
      saveNodes(newNodes);
      saveFlashcards(newCards);
      setPendingImportData(null);
      setImportStatus('done');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setImportStatus('error');
      setImportError('Import failed. Please try again.');
    }
  };

  const resetImport = () => {
    setImportStatus('idle');
    setImportError('');
    setPendingImportData(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-28 pt-12 overflow-y-auto">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      <div className="mt-6 space-y-3">
        {/* STUDY */}
        <AccordionSection
          icon={<BookOpen className="h-4 w-4" />}
          title="Study"
          open={openSection === 'study'}
          onToggle={() => toggle('study')}
        >
          <Row label="Daily Goal" description={`${settings.dailyGoalMinutes} minutes`}>
            <select
              value={settings.dailyGoalMinutes}
              onChange={e => update({ dailyGoalMinutes: Number(e.target.value) })}
              className="min-h-[44px] rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground outline-none"
            >
              {[15, 30, 45, 60, 90, 120].map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </Row>
          <Row label="Default Recall Mode">
            <select
              value={settings.defaultRecallMode}
              onChange={e => update({ defaultRecallMode: e.target.value as AppSettings['defaultRecallMode'] })}
              className="min-h-[44px] rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground outline-none"
            >
              <option value="random">All cards</option>
              <option value="weak">Weak only</option>
              <option value="important">Important only</option>
            </select>
          </Row>
          <ToggleRow label="Auto-reveal answer" checked={settings.autoReveal} onChange={v => update({ autoReveal: v })} />
          <ToggleRow label="Shuffle cards" checked={settings.shuffleCards} onChange={v => update({ shuffleCards: v })} />
        </AccordionSection>

        {/* FLASHCARD */}
        <AccordionSection
          icon={<Brain className="h-4 w-4" />}
          title="Flashcard"
          open={openSection === 'flashcard'}
          onToggle={() => toggle('flashcard')}
        >
          <Row label="Swipe Sensitivity">
            <SegmentedControl
              options={['low', 'medium', 'high']}
              value={settings.swipeSensitivity}
              onChange={v => update({ swipeSensitivity: v as AppSettings['swipeSensitivity'] })}
            />
          </Row>
          <Row label="Flip Speed">
            <SegmentedControl
              options={['fast', 'normal']}
              value={settings.flipSpeed}
              onChange={v => update({ flipSpeed: v as AppSettings['flipSpeed'] })}
            />
          </Row>
        </AccordionSection>

        {/* APPEARANCE */}
        <AccordionSection
          icon={<Palette className="h-4 w-4" />}
          title="Appearance"
          open={openSection === 'appearance'}
          onToggle={() => toggle('appearance')}
        >
          <Row label="Theme">
            <SegmentedControl
              options={['dark', 'light']}
              value={settings.theme}
              onChange={v => update({ theme: v as AppSettings['theme'] })}
            />
          </Row>
          <Row label="Accent Color">
            <div className="flex gap-2">
              {(['blue', 'green', 'orange'] as const).map(c => {
                const colors = { blue: 'hsl(217 91% 60%)', green: 'hsl(142 71% 45%)', orange: 'hsl(25 95% 53%)' };
                return (
                  <button
                    key={c}
                    onClick={() => update({ accentColor: c })}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <div
                      className={`h-6 w-6 rounded-full border-2 transition-all ${
                        settings.accentColor === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: colors[c] }}
                    />
                  </button>
                );
              })}
            </div>
          </Row>
          <Row label="Font Size">
            <SegmentedControl
              options={['small', 'medium', 'large']}
              value={settings.fontSize}
              onChange={v => update({ fontSize: v as AppSettings['fontSize'] })}
            />
          </Row>
          <ToggleRow
            label="Brutal Mode"
            description="Exam timer shows seconds + bold display"
            checked={settings.brutalMode}
            onChange={v => update({ brutalMode: v })}
          />
        </AccordionSection>

        {/* FOCUS */}
        <AccordionSection
          icon={<Focus className="h-4 w-4" />}
          title="Focus"
          open={openSection === 'focus'}
          onToggle={() => toggle('focus')}
        >
          <Row label="Focus Duration" description={`${settings.focusDuration} min`}>
            <ScrollPicker
              values={Array.from({ length: 17 }, (_, i) => 10 + i * 5)}
              value={settings.focusDuration}
              onChange={v => update({ focusDuration: v })}
              suffix="min"
            />
          </Row>
          <Row label="Break Duration" description={`${settings.focusBreakDuration} min`}>
            <ScrollPicker
              values={Array.from({ length: 15 }, (_, i) => i + 1)}
              value={settings.focusBreakDuration}
              onChange={v => update({ focusBreakDuration: v })}
              suffix="min"
            />
          </Row>
          <Row label="Sound">
            <SegmentedControl
              options={['None', 'White', 'Brown', 'Rain']}
              value={settings.focusSound}
              onChange={v => update({ focusSound: v as AppSettings['focusSound'] })}
            />
          </Row>
          <Row label="Background">
            <SegmentedControl
              options={['breathing', 'particles', 'waves']}
              value={settings.focusBackground}
              onChange={v => update({ focusBackground: v as AppSettings['focusBackground'] })}
            />
          </Row>
          <Row label="Intensity">
            <SegmentedControl
              options={['low', 'medium']}
              value={settings.focusIntensity}
              onChange={v => update({ focusIntensity: v as AppSettings['focusIntensity'] })}
            />
          </Row>
          <ToggleRow label="Lock-in mode" checked={settings.focusLockIn} onChange={v => update({ focusLockIn: v })} />
          <ToggleRow label="Auto-start next session" checked={settings.focusAutoNext} onChange={v => update({ focusAutoNext: v })} />
        </AccordionSection>

        {/* NOTIFICATIONS */}
        <AccordionSection
          icon={<Bell className="h-4 w-4" />}
          title="Notifications"
          open={openSection === 'notifications'}
          onToggle={() => toggle('notifications')}
        >
          <NotificationPermissionRow />
          <ToggleRow label="Focus reminders" checked={settings.notifyReminders} onChange={v => update({ notifyReminders: v })} />
          <ToggleRow label="Streak notifications" checked={settings.notifyStreak} onChange={v => update({ notifyStreak: v })} />
          <ToggleRow label="Exam mode alerts" checked={settings.notifyExamMode} onChange={v => update({ notifyExamMode: v })} />
        </AccordionSection>

        {/* PERFORMANCE */}
        <AccordionSection
          icon={<Zap className="h-4 w-4" />}
          title="Performance"
          open={openSection === 'performance'}
          onToggle={() => toggle('performance')}
        >
          <ToggleRow label="Reduce animations" checked={settings.reduceAnimations} onChange={v => update({ reduceAnimations: v })} />
        </AccordionSection>

        {/* DATA */}
        <AccordionSection
          icon={<Database className="h-4 w-4" />}
          title="Data"
          open={openSection === 'data'}
          onToggle={() => toggle('data')}
        >
          {/* Trust element */}
          <div className="flex items-center gap-2 py-3 border-b border-border/50">
            <Shield className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">Your data stays on your device.</p>
          </div>

          {/* Export section */}
          <div className="py-3 space-y-2">
            <p className="text-xs font-medium text-foreground">Export Data</p>
            {exportStatus === 'idle' && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={startExport}
                className="flex w-full items-center gap-3 min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors active:opacity-80"
              >
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>Export Data (JSON)</span>
              </motion.button>
            )}
            {exportStatus === 'preparing' && (
              <div className="flex items-center gap-3 min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Preparing your data...</span>
              </div>
            )}
            {exportStatus === 'ready' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 min-h-[44px] rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">Export ready</span>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={downloadExport}
                    className="flex-1 min-h-[44px] rounded-lg bg-primary text-sm font-medium text-primary-foreground"
                  >
                    Download File
                  </motion.button>
                  <button
                    onClick={resetExport}
                    className="min-h-[44px] px-4 rounded-lg border border-border text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {exportStatus === 'done' && (
              <div className="flex items-center gap-3 min-h-[44px] rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-primary">Data exported successfully</span>
              </div>
            )}
            {exportStatus === 'error' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 min-h-[44px] rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">Export failed. Try again.</span>
                </div>
                <button onClick={resetExport} className="text-xs text-primary">Retry</button>
              </div>
            )}
          </div>

          {/* Import section */}
          <div className="py-3 space-y-2 border-t border-border/50">
            <p className="text-xs font-medium text-foreground">Import Data</p>
            {importStatus === 'idle' && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => importFileRef.current?.click()}
                className="flex w-full items-center gap-3 min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors active:opacity-80"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span>Import Data</span>
              </motion.button>
            )}
            {importStatus === 'checking' && (
              <div className="flex items-center gap-3 min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Checking file...</span>
              </div>
            )}
            {importStatus === 'confirm' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 min-h-[44px] rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">File ready to import</span>
                </div>
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Import will replace current data.</strong> All existing subjects and flashcards will be overwritten.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={resetImport}
                    className="flex-1 min-h-[44px] rounded-lg border border-border text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={confirmImport}
                    className="flex-1 min-h-[44px] rounded-lg bg-primary text-sm font-medium text-primary-foreground"
                  >
                    Import
                  </motion.button>
                </div>
              </div>
            )}
            {importStatus === 'importing' && (
              <div className="flex items-center gap-3 min-h-[48px] rounded-lg border border-border bg-secondary px-4 py-3">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Importing...</span>
              </div>
            )}
            {importStatus === 'done' && (
              <div className="flex items-center gap-3 min-h-[44px] rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-primary">Import successful</span>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 min-h-[44px] rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">{importError}</span>
                </div>
                <button onClick={resetImport} className="text-xs text-primary">Try again</button>
              </div>
            )}
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex w-full items-center gap-3 min-h-[48px] py-3 text-sm text-destructive border-t border-border/50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All Data</span>
          </button>
        </AccordionSection>

        {/* STUDY SYSTEM */}
        <AccordionSection
          icon={<GraduationCap className="h-4 w-4" />}
          title="Study System"
          open={openSection === 'studysystem'}
          onToggle={() => toggle('studysystem')}
        >
          <StudySystemContent />
        </AccordionSection>

        {/* About + Social */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5 flex flex-col items-center">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            dv
          </div>
          <p className="mt-3 text-sm font-bold tracking-wide text-foreground">
            Exam<span className="text-primary">Flow</span>OS
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Created by imdvichrn</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/40 italic">Built for focus.</p>

          {/* Social Links */}
          <div className="mt-4 flex gap-2">
            <SocialButton label="X" href="https://x.com/imdvichrn" icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            } />
            <SocialButton label="Instagram" href="https://instagram.com/imdvichrn" icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            } />
            <SocialButton label="Portfolio" href="https://geddadadevicharan.netlify.app" icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            } />
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/50">v1.0 • Offline-first • All data stored locally</p>
        </div>
      </div>

      {/* Clear Confirmation */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
            onClick={() => setShowClearConfirm(false)}
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
                <h2 className="text-sm font-semibold text-foreground">Clear All Data</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will permanently delete all subjects, topics, flashcards, and stats. Settings will be preserved.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 min-h-[44px] rounded-lg border border-border text-xs text-muted-foreground transition-colors active:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={clearData}
                  className="flex-1 min-h-[44px] rounded-lg bg-destructive text-xs font-medium text-destructive-foreground transition-colors active:opacity-90"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function NotificationPermissionRow() {
  const [permState, setPermState] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const supported = isNotificationSupported();

  const handleRequest = async () => {
    const result = await requestNotificationPermission();
    setPermState(result);
    if (result === 'granted') {
      sendNotification('Notifications enabled ✔', {
        body: 'You\'ll get focus & study alerts.',
        tag: 'test',
      });
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-3 min-h-[48px] py-3">
        <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Not supported</p>
          <p className="text-[10px] text-muted-foreground/60">Your browser doesn't support notifications.</p>
        </div>
      </div>
    );
  }

  if (permState === 'granted') {
    return (
      <div className="flex items-center gap-3 min-h-[48px] py-3">
        <BellRing className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-foreground">Browser notifications</p>
          <p className="text-[10px] text-primary/80">Enabled — you'll get real-time alerts</p>
        </div>
        <Shield className="h-3.5 w-3.5 text-primary/50" />
      </div>
    );
  }

  if (permState === 'denied') {
    return (
      <div className="flex items-center gap-3 min-h-[48px] py-3">
        <BellOff className="h-4 w-4 text-destructive/70 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-foreground">Browser notifications</p>
          <p className="text-[10px] text-muted-foreground/60">Blocked — enable in browser settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-h-[48px] py-3">
      <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">Browser notifications</p>
        <p className="text-[10px] text-muted-foreground/60">Get alerts even when minimized</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleRequest}
        className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground"
      >
        Enable
      </motion.button>
    </div>
  );
}

function AccordionSection({ icon, title, open, onToggle, children }: {
  icon: React.ReactNode; title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 min-h-[52px] text-left transition-colors active:bg-secondary/50"
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border/50 px-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between min-h-[48px] py-3 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between min-h-[48px] py-3">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <motion.div
          className="absolute top-1 h-5 w-5 rounded-full bg-foreground"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`min-h-[36px] px-3 py-1.5 text-[11px] capitalize transition-colors ${
            value === opt
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ScrollPicker({ values, value, onChange, suffix = '' }: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 min-h-[36px] rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground"
      >
        <span className="tabular-nums font-medium">{value}</span>
        <span className="text-muted-foreground">{suffix}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-50 max-h-40 w-24 overflow-y-auto rounded-lg border border-border bg-card shadow-xl scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {values.map(v => (
              <button
                key={v}
                onClick={() => { onChange(v); setOpen(false); }}
                className={`flex w-full items-center justify-center py-2 text-xs transition-colors ${
                  v === value
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {v} {suffix}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StudySystemContent() {
  const sections = [
    {
      title: 'Why most studying fails',
      points: [
        'Reading ≠ remembering',
        'Re-reading gives false confidence',
        'No testing = no real memory',
      ],
    },
    {
      title: 'What actually works',
      points: [
        'Active Recall — Ask → think → answer',
        'Spaced Repetition — Review at the right time',
        'Focus Sessions — Deep work in timed blocks',
        'Retrieval Practice — Test yourself before checking',
        'Interleaving — Mix different topics in one session',
        'Elaboration — Explain concepts in your own words',
        'Dual Coding — Combine words with visuals',
        'Concrete Examples — Link abstract ideas to real cases',
        'The Feynman Technique — Teach it to simplify it',
        "Metacognition — Monitor what you know vs. what you don\u2019t",
      ],
    },
    {
      title: 'Why this method is powerful',
      points: [
        'Brain strengthens pathways when retrieving',
        'Struggle = memory formation',
        'Fast recall under pressure = exam success',
        'Spacing prevents forgetting curves',
      ],
    },
    {
      title: 'How to use ExamFlowOS',
      points: [
        '1. Add a subject → break into topics',
        '2. Add 3–5 cards per topic',
        '3. Tap Recall → test yourself',
        '4. Mark weak cards honestly',
        '5. Repeat weak cards until strong',
      ],
    },
    {
      title: 'Does this actually work?',
      points: [
        'Used by top students worldwide',
        'Based on 50+ years of memory science',
        'Same method behind Anki, SuperMemo, Leitner',
        'Proven in peer-reviewed cognitive research',
      ],
    },
    {
      title: 'Follow this',
      points: [
        "Don't read — recall",
        'Keep cards short and specific',
        'Focus on weak, not what you already know',
        'Repeat daily, even 10 minutes',
      ],
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="py-2 space-y-1">
      {sections.map((s, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="flex w-full items-center justify-between py-2.5 min-h-[40px] text-left"
          >
            <span className="text-xs font-medium text-foreground">{s.title}</span>
            <motion.div animate={{ rotate: openIdx === i ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {openIdx === i && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden space-y-1.5 pb-2"
              >
                {s.points.map((p, j) => (
                  <li key={j} className="text-[11px] text-muted-foreground leading-relaxed pl-2 flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function SocialButton({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  return (
    <motion.a
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.04 }}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-border bg-secondary/80 px-4 py-2.5 min-h-[44px] text-xs font-medium text-foreground transition-all hover:border-primary/30 hover:bg-secondary"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </motion.a>
  );
}

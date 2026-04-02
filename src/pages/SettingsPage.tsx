import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Download, Upload, AlertTriangle, ChevronRight } from 'lucide-react';
import { getSettings, saveSettings, type AppSettings } from '@/lib/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const update = useCallback((patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }, [settings]);

  const clearData = () => {
    const s = getSettings();
    localStorage.clear();
    saveSettings(s); // preserve settings
    window.location.reload();
  };

  const exportData = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyrecall-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'string') localStorage.setItem(key, value);
        });
        setImportMessage('Data imported! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setImportMessage('Invalid file format');
        setTimeout(() => setImportMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-28 pt-12 overflow-y-auto">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      <div className="mt-6 space-y-6">
        {/* STUDY SETTINGS */}
        <Section title="Study">
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
        </Section>

        {/* FLASHCARD SETTINGS */}
        <Section title="Flashcard">
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
        </Section>

        {/* APPEARANCE */}
        <Section title="Appearance">
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
        </Section>

        {/* PERFORMANCE */}
        <Section title="Performance">
          <ToggleRow label="Reduce animations" checked={settings.reduceAnimations} onChange={v => update({ reduceAnimations: v })} />
        </Section>

        {/* DATA MANAGEMENT */}
        <Section title="Data">
          <button
            onClick={exportData}
            className="flex w-full items-center justify-between min-h-[48px] px-1 py-3 text-sm text-foreground"
          >
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>Export Data (JSON)</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <label className="flex w-full cursor-pointer items-center justify-between min-h-[48px] px-1 py-3 text-sm text-foreground">
            <div className="flex items-center gap-3">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span>Import Data</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>

          {importMessage && (
            <p className="text-xs text-primary px-1">{importMessage}</p>
          )}

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex w-full items-center gap-3 min-h-[48px] px-1 py-3 text-sm text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All Data</span>
          </button>
        </Section>

        {/* About */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            StudyRecall v1.0 • Offline-first • All data stored locally
          </p>
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
                  className="flex-1 min-h-[44px] rounded-lg border border-border text-xs text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={clearData}
                  className="flex-1 min-h-[44px] rounded-lg bg-destructive text-xs font-medium text-destructive-foreground"
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border px-4">{children}</div>
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between min-h-[48px] py-3">
      <p className="text-sm text-foreground">{label}</p>
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

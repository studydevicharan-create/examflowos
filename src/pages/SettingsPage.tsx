import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [showConfirm, setShowConfirm] = useState(false);

  const clearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-24 pt-12">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">About</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            StudyRecall — Offline-first study app combining syllabus tracking with active recall.
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">v1.0.0 • All data stored locally</p>
        </div>

        <div className="rounded-lg border border-destructive/20 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Danger Zone</h2>
          <p className="mt-1 text-xs text-muted-foreground">Clear all data including subjects, flashcards, and stats.</p>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-xs text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Clear All Data
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <button onClick={clearData} className="rounded-lg bg-destructive px-4 py-2 text-xs text-destructive-foreground">
                Confirm Delete
              </button>
              <button onClick={() => setShowConfirm(false)} className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// App-wide settings persisted in localStorage
export interface AppSettings {
  // Study
  dailyGoalMinutes: number;
  defaultRecallMode: 'random' | 'weak' | 'important';
  autoReveal: boolean;
  shuffleCards: boolean;
  // Flashcard
  swipeSensitivity: 'low' | 'medium' | 'high';
  flipSpeed: 'fast' | 'normal';
  // Appearance
  theme: 'dark' | 'light';
  accentColor: 'blue' | 'green' | 'orange';
  fontSize: 'small' | 'medium' | 'large';
  // Performance
  reduceAnimations: boolean;
  // Focus
  focusBackground: 'breathing' | 'particles' | 'waves';
  focusIntensity: 'low' | 'medium';
  focusLockIn: boolean;
  // Notifications
  notifyReminders: boolean;
  notifyStreak: boolean;
  notifyExamMode: boolean;
}

const SETTINGS_KEY = 'studyapp_settings';

const DEFAULTS: AppSettings = {
  dailyGoalMinutes: 30,
  defaultRecallMode: 'random',
  autoReveal: false,
  shuffleCards: true,
  swipeSensitivity: 'medium',
  flipSpeed: 'normal',
  theme: 'dark',
  accentColor: 'blue',
  fontSize: 'medium',
  reduceAnimations: false,
  focusBackground: 'breathing',
  focusIntensity: 'low',
  focusLockIn: true,
  notifyReminders: true,
  notifyStreak: true,
  notifyExamMode: false,
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applySettings(settings);
}

export function applySettings(settings: AppSettings) {
  const root = document.documentElement;

  // Theme
  if (settings.theme === 'light') {
    root.style.setProperty('--background', '0 0% 98%');
    root.style.setProperty('--foreground', '222 84% 5%');
    root.style.setProperty('--card', '0 0% 100%');
    root.style.setProperty('--card-foreground', '222 84% 5%');
    root.style.setProperty('--secondary', '210 40% 96%');
    root.style.setProperty('--secondary-foreground', '222 47% 11%');
    root.style.setProperty('--muted', '210 40% 96%');
    root.style.setProperty('--muted-foreground', '215 16% 47%');
    root.style.setProperty('--border', '214 32% 91%');
    root.style.setProperty('--input', '214 32% 91%');
    root.style.setProperty('--popover', '0 0% 100%');
    root.style.setProperty('--popover-foreground', '222 84% 5%');
    root.style.setProperty('--accent', '210 40% 96%');
    root.style.setProperty('--accent-foreground', '222 47% 11%');
  } else {
    root.style.setProperty('--background', '216 28% 7%');
    root.style.setProperty('--foreground', '210 25% 92%');
    root.style.setProperty('--card', '215 25% 13%');
    root.style.setProperty('--card-foreground', '210 25% 92%');
    root.style.setProperty('--secondary', '216 20% 16%');
    root.style.setProperty('--secondary-foreground', '210 25% 92%');
    root.style.setProperty('--muted', '216 15% 20%');
    root.style.setProperty('--muted-foreground', '212 18% 56%');
    root.style.setProperty('--border', '215 15% 22%');
    root.style.setProperty('--input', '215 15% 22%');
    root.style.setProperty('--popover', '215 25% 13%');
    root.style.setProperty('--popover-foreground', '210 25% 92%');
    root.style.setProperty('--accent', '216 20% 16%');
    root.style.setProperty('--accent-foreground', '210 25% 92%');
  }

  // Accent color
  const accents: Record<string, string> = {
    blue: '217 91% 60%',
    green: '142 71% 45%',
    orange: '25 95% 53%',
  };
  root.style.setProperty('--primary', accents[settings.accentColor] || accents.blue);
  root.style.setProperty('--ring', accents[settings.accentColor] || accents.blue);

  // Font size
  const sizes: Record<string, string> = { small: '14px', medium: '16px', large: '18px' };
  root.style.fontSize = sizes[settings.fontSize] || '16px';
}

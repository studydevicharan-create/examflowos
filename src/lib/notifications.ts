// Browser Notification System — Web Notifications API
// Works on desktop & mobile (where supported)

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/** Check if Web Notifications are supported */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/** Get current permission state */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Request permission — returns the new state */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

/** Send a browser notification */
export function sendNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    silent?: boolean;
    requireInteraction?: boolean;
  }
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return null;
  
  try {
    const notif = new Notification(title, {
      icon: '/placeholder.svg',
      badge: '/placeholder.svg',
      ...options,
    });

    // Auto-close after 5s unless requireInteraction
    if (!options?.requireInteraction) {
      setTimeout(() => notif.close(), 5000);
    }

    return notif;
  } catch {
    return null;
  }
}

// --- Focus Notifications ---

const FOCUS_START_MESSAGES = [
  'Focus started. Stay locked.',
  'Session active. Deep work time.',
  'Flow mode activated.',
];

const FOCUS_END_MESSAGES = [
  'Session complete! Take a break.',
  'Great work. Time to reset.',
  "Time's up. You earned a break.",
];

const BREAK_END_MESSAGES = [
  'Break over. Back to focus?',
  'Ready to continue?',
  'Break done. One more session?',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function notifyFocusStartBrowser() {
  sendNotification('ExamFlowOS', {
    body: pick(FOCUS_START_MESSAGES),
    tag: 'focus-start',
    silent: false,
  });
}

export function notifyFocusEndBrowser(breakAction?: string) {
  sendNotification('Session Done ✔', {
    body: breakAction
      ? `Break: ${breakAction}`
      : pick(FOCUS_END_MESSAGES),
    tag: 'focus-end',
    requireInteraction: true,
  });
}

export function notifyBreakEndBrowser() {
  sendNotification('Break Over', {
    body: pick(BREAK_END_MESSAGES),
    tag: 'break-end',
    requireInteraction: true,
  });
}

export function notifyStreakBrowser(count: number) {
  sendNotification(`🔥 ${count} sessions`, {
    body: 'Keep the momentum going.',
    tag: 'streak',
  });
}

// --- Study Reminders ---

export function notifyStudyReminder() {
  sendNotification('Time to study', {
    body: 'Just 10 minutes. Start now.',
    tag: 'study-reminder',
  });
}

export function notifyExamReminder(subjectName: string, daysLeft: number) {
  sendNotification(`Exam in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, {
    body: `${subjectName} — review weak cards today.`,
    tag: 'exam-reminder',
    requireInteraction: true,
  });
}

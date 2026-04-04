import { toast } from 'sonner';

const MESSAGES = {
  start: [
    'Focus started. Stay locked.',
    'Session active. No distractions.',
    'Flow mode. Let\'s go.',
  ],
  end: [
    'Session done. Continue or break?',
    'Good work. Keep momentum?',
    'Time\'s up. One more?',
  ],
  nudge: [
    'Back to flow?',
    'Just 25 min. Start now.',
    'One session. That\'s it.',
  ],
  streak: [
    'sessions done. Keep momentum.',
    'in a row. Stay in flow.',
  ],
};

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function notifyFocusStart() {
  if (navigator.vibrate) navigator.vibrate(50);
  toast(pick(MESSAGES.start), {
    duration: 2000,
    className: 'focus-toast',
  });
}

export function notifyFocusEnd() {
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  toast(pick(MESSAGES.end), {
    duration: 4000,
    className: 'focus-toast',
  });
}

export function notifyStreak(count: number) {
  toast(`${count} ${pick(MESSAGES.streak)}`, {
    duration: 3000,
    className: 'focus-toast',
  });
}

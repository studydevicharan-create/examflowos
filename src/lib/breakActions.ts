// Micro reset actions shown during focus breaks
// Categorized for smart selection based on session length

export interface BreakAction {
  text: string;
  category: 'body' | 'brain' | 'focus' | 'energy';
  intensity: 'light' | 'active';
}

const ACTIONS: BreakAction[] = [
  // Body Reset
  { text: 'Walk for 1 minute', category: 'body', intensity: 'light' },
  { text: 'Stand and stretch arms overhead', category: 'body', intensity: 'light' },
  { text: '10 slow squats', category: 'body', intensity: 'active' },
  { text: 'Roll your neck gently', category: 'body', intensity: 'light' },
  { text: 'Shake your hands and arms', category: 'body', intensity: 'light' },
  { text: 'Stretch your spine — twist left, then right', category: 'body', intensity: 'light' },
  { text: 'Touch your toes and hold 10 sec', category: 'body', intensity: 'light' },
  { text: '10 calf raises', category: 'body', intensity: 'active' },
  { text: 'Roll your shoulders 10 times', category: 'body', intensity: 'light' },
  { text: '10 push-ups (optional)', category: 'body', intensity: 'active' },
  { text: 'Stretch your wrists — flex and extend', category: 'body', intensity: 'light' },
  { text: 'Stand on one leg for 20 sec each', category: 'body', intensity: 'light' },
  { text: 'Walk to another room and back', category: 'body', intensity: 'light' },
  { text: '10 jumping jacks', category: 'body', intensity: 'active' },
  { text: 'Hip circles — 5 each direction', category: 'body', intensity: 'light' },
  { text: 'Plank for 20 seconds', category: 'body', intensity: 'active' },
  { text: 'Stretch your hip flexors', category: 'body', intensity: 'light' },
  { text: 'March in place for 30 sec', category: 'body', intensity: 'light' },
  { text: 'Doorway chest stretch — 15 sec each side', category: 'body', intensity: 'light' },
  { text: 'Cat-cow stretch — 5 reps', category: 'body', intensity: 'light' },

  // Brain Reset
  { text: '5 deep breaths — slow inhale, slow exhale', category: 'brain', intensity: 'light' },
  { text: 'Close eyes for 20 seconds', category: 'brain', intensity: 'light' },
  { text: 'Look at something far away for 20 sec', category: 'brain', intensity: 'light' },
  { text: 'Slow inhale 4s → hold 4s → exhale 6s', category: 'brain', intensity: 'light' },
  { text: 'Hum for 10 seconds — vagus nerve reset', category: 'brain', intensity: 'light' },
  { text: 'Focus on one sound around you for 15 sec', category: 'brain', intensity: 'light' },
  { text: 'Count backwards from 50 by 3s', category: 'brain', intensity: 'light' },
  { text: 'Name 5 things you can see right now', category: 'brain', intensity: 'light' },
  { text: 'Yawn deliberately — it resets your brain', category: 'brain', intensity: 'light' },
  { text: 'Rub your palms together, place over eyes', category: 'brain', intensity: 'light' },
  { text: 'Box breathing: in 4s, hold 4s, out 4s, hold 4s', category: 'brain', intensity: 'light' },
  { text: 'Massage your temples for 15 seconds', category: 'brain', intensity: 'light' },
  { text: 'Stare at a single point for 20 sec — refocus', category: 'brain', intensity: 'light' },
  { text: 'Alternate nostril breathing — 5 cycles', category: 'brain', intensity: 'light' },
  { text: 'Clench fists tight 5 sec, then release', category: 'brain', intensity: 'light' },

  // Focus Reset
  { text: 'Recall the last topic you studied', category: 'focus', intensity: 'light' },
  { text: 'Recall one formula from memory', category: 'focus', intensity: 'light' },
  { text: 'Visualize a diagram you just learned', category: 'focus', intensity: 'light' },
  { text: 'Say one key concept out loud', category: 'focus', intensity: 'light' },
  { text: 'Summarize last session in one sentence', category: 'focus', intensity: 'light' },
  { text: 'Think of one question you still have', category: 'focus', intensity: 'light' },
  { text: 'Mentally connect two ideas from today', category: 'focus', intensity: 'light' },
  { text: 'Write down one thing you learned', category: 'focus', intensity: 'light' },
  { text: 'Explain the last concept to yourself', category: 'focus', intensity: 'light' },
  { text: 'What was the hardest card? Why?', category: 'focus', intensity: 'light' },
  { text: 'Plan which topic to tackle next', category: 'focus', intensity: 'light' },
  { text: 'Think of a real-world example for what you learned', category: 'focus', intensity: 'light' },

  // Energy Reset
  { text: 'Drink a glass of water', category: 'energy', intensity: 'light' },
  { text: 'Splash cold water on your face', category: 'energy', intensity: 'active' },
  { text: 'Stand up straight — fix your posture', category: 'energy', intensity: 'light' },
  { text: 'Open a window — fresh air resets energy', category: 'energy', intensity: 'light' },
  { text: 'Eat a small snack — nuts or fruit', category: 'energy', intensity: 'light' },
  { text: 'Step outside for 30 seconds', category: 'energy', intensity: 'light' },
  { text: 'Tidy your desk for 30 sec', category: 'energy', intensity: 'light' },
  { text: 'Smile for 10 seconds — it changes your state', category: 'energy', intensity: 'light' },
  { text: 'Look at natural light or greenery', category: 'energy', intensity: 'light' },
  { text: 'Put your phone in another room', category: 'energy', intensity: 'light' },
  { text: 'Adjust your chair height or angle', category: 'energy', intensity: 'light' },
  { text: 'Wash your hands with cold water', category: 'energy', intensity: 'light' },
  { text: 'Take 3 sips of water slowly', category: 'energy', intensity: 'light' },
  { text: 'Chew gum for 1 minute', category: 'energy', intensity: 'light' },
  { text: 'Listen to 30 sec of your favorite song', category: 'energy', intensity: 'light' },
];

let recentIndices: number[] = [];

export function getBreakAction(sessionMinutes: number): BreakAction {
  const preferActive = sessionMinutes >= 45;
  const pool = ACTIONS.filter(a => preferActive ? true : a.intensity === 'light');
  
  // Avoid last 5 actions
  let available = pool.filter((_, i) => !recentIndices.includes(i));
  if (available.length < 3) {
    recentIndices = [];
    available = pool;
  }
  
  const pick = available[Math.floor(Math.random() * available.length)];
  const idx = ACTIONS.indexOf(pick);
  recentIndices.push(idx);
  if (recentIndices.length > 5) recentIndices.shift();
  
  return pick;
}

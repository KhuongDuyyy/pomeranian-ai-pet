import type { Stats } from './stats.js';
export type Mood = 'hungry' | 'sleepy' | 'nervous' | 'excited' | 'playful' | 'happy' | 'neutral';
export function getMood(s: Stats): Mood {
  if (s.hunger > 75) return 'hungry';
  if (s.sleepiness > 75) return 'sleepy';
  if (s.stress > 60) return 'nervous';
  if (s.happiness > 75 && s.energy > 60) return 'excited';
  if (s.boredom > 65 && s.energy > 50) return 'playful';
  return s.happiness > 60 ? 'happy' : 'neutral';
}

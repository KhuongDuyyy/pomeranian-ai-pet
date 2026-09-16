import type { Memory } from './memory.js';
import { actionPresentation } from './presentation.js';

export function currentActivity(memory: Memory, now = Date.now()) {
  const episode = memory.recent.at(-1);
  if (!episode || !(['eat', 'play', 'sleep', 'rest'] as string[]).includes(episode.action)) return null;
  const action = episode.action as 'eat' | 'play' | 'sleep' | 'rest';
  const startedAt = Date.parse(episode.at);
  const durationMs = actionPresentation[action].durationMs;
  const elapsed = now - startedAt;
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= durationMs) return null;
  return { action, startedAt, endsAt: startedAt + durationMs, progress: elapsed / durationMs };
}

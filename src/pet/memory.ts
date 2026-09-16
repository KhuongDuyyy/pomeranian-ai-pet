export interface Episode { action: string; at: string; mood: string; importance?: number | undefined }
export interface Memory {
  profile: { ownerName: string | null; petName: string; birthday: string | null; firstMet: string };
  preferences: { favoriteToy: string; favoriteFood: string; dislikes: string[]; learned: Record<string, number> };
  episodic: Episode[];
  recent: Episode[];
}
export function createMemory(now: string): Memory {
  return { profile: { ownerName: null, petName: 'Bôngg', birthday: null, firstMet: now }, preferences: { favoriteToy: 'blue_ball', favoriteFood: 'kibble', dislikes: ['loud noises'], learned: {} }, episodic: [], recent: [] };
}
export function learnPreference(memory: Memory, category: 'food' | 'toy' | 'action', item: string): void {
  const key = `${category}:${item}`;
  memory.preferences.learned[key] = Math.min(100, (memory.preferences.learned[key] ?? 0) + 1);
  const best = Object.entries(memory.preferences.learned).filter(([name, count]) => name.startsWith(category + ':') && count >= 3).sort((a, b) => b[1] - a[1])[0];
  if (best && category === 'food') memory.preferences.favoriteFood = best[0].slice(5);
  if (best && category === 'toy') memory.preferences.favoriteToy = best[0].slice(4);
}
export function remember(memory: Memory, episode: Episode): void {
  memory.recent.push({ ...episode });
  memory.recent = memory.recent.slice(-20);
  memory.episodic.push({ ...episode });
  memory.episodic = memory.episodic.slice(-200);
}

export interface Episode { action: string; at: string; mood: string; importance?: number | undefined }
export interface Keepsake { key: string; title: string; at: string; importance: number }
export const firstKeepsakeTitles: Record<string, string> = { eat: 'Bữa ăn sớm nhất còn được ghi nhớ', play: 'Lần chơi sớm nhất còn được ghi nhớ', headScratch: 'Lần vuốt đầu sớm nhất còn được ghi nhớ', greetOwner: 'Lần đón bạn sớm nhất còn được ghi nhớ' };
export function recoverKeepsakes(episodes: Episode[]): Keepsake[] {
  const seen = new Set<string>();
  return [...episodes].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).flatMap(episode => {
    const title = firstKeepsakeTitles[episode.action];
    if (!title || seen.has(episode.action)) return [];
    seen.add(episode.action);
    return [{ key: `first:${episode.action}`, title, at: episode.at, importance: 95 }];
  });
}
export interface Memory {
  profile: { ownerName: string | null; petName: string; birthday: string | null; firstMet: string };
  preferences: { favoriteToy: string; favoriteFood: string; dislikes: string[]; learned: Record<string, number> };
  episodic: Episode[];
  recent: Episode[];
  keepsakes: Keepsake[];
}
export function createMemory(now: string): Memory {
  return { profile: { ownerName: null, petName: 'Bôngg', birthday: null, firstMet: now }, preferences: { favoriteToy: 'blue_ball', favoriteFood: 'kibble', dislikes: ['loud noises'], learned: {} }, episodic: [], recent: [], keepsakes: [] };
}
export function keepMemory(memory: Memory, keepsake: Keepsake): void {
  if (memory.keepsakes.some(item => item.key === keepsake.key)) return;
  memory.keepsakes.push({ ...keepsake });
  if (memory.keepsakes.length > 50) {
    // Milestones outrank ordinary keepsakes; evict the oldest least-important one.
    const minimum = Math.min(...memory.keepsakes.map(item => item.importance));
    const index = memory.keepsakes.findIndex(item => item.importance === minimum);
    memory.keepsakes.splice(index, 1);
  }
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
  if (memory.episodic.length > 200) {
    const lowest = Math.min(...memory.episodic.map(item => item.importance ?? 30));
    memory.episodic.splice(memory.episodic.findIndex(item => (item.importance ?? 30) === lowest), 1);
  }
}

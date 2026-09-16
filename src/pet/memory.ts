export interface Episode { action: string; at: string; mood: string }
export interface Memory {
  profile: { ownerName: string | null; petName: string; birthday: string | null; firstMet: string };
  preferences: { favoriteToy: string; favoriteFood: string; dislikes: string[] };
  episodic: Episode[];
  recent: Episode[];
}
export function createMemory(now: string): Memory {
  return { profile: { ownerName: null, petName: 'Bong', birthday: null, firstMet: now }, preferences: { favoriteToy: 'ball', favoriteFood: 'kibble', dislikes: ['loud noises'] }, episodic: [], recent: [] };
}
export function remember(memory: Memory, episode: Episode): void {
  memory.recent.push({ ...episode });
  memory.recent = memory.recent.slice(-20);
  memory.episodic.push({ ...episode });
  memory.episodic = memory.episodic.slice(-200);
}

export const initialStats = { hunger: 25, energy: 85, happiness: 80, boredom: 15, stress: 5, sleepiness: 10, health: 100 };
export type Stats = typeof initialStats;
export const clamp = (value: number): number => Math.max(0, Math.min(100, value));
export function changeStats(stats: Stats, delta: Partial<Stats>): void {
  for (const key of Object.keys(delta) as (keyof Stats)[]) stats[key] = clamp(stats[key] + (delta[key] ?? 0));
}
export function advanceStats(stats: Stats, minutes: number): void {
  if (!Number.isFinite(minutes) || minutes < 0) throw new Error('Minutes must be finite and non-negative.');
  const ticks = minutes / 10;
  changeStats(stats, { hunger: ticks, energy: -0.3 * ticks, boredom: 0.5 * ticks, sleepiness: 0.2 * ticks });
}

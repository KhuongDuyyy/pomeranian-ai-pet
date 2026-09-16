import type { Context } from './context.js';
import type { PetState } from './state.js';
import { changeStats, type Stats } from './stats.js';
import { bond } from './relationship.js';

export const actionNames = ['sleep', 'rest', 'explore', 'askFood', 'eat', 'bringToy', 'play', 'seekOwner', 'sitNearOwner', 'requestAttention', 'greetOwner', 'barkAlert', 'lookAround', 'wander', 'headScratch'] as const;
export type Action = typeof actionNames[number];
/** Simulated minutes; actions finish synchronously without a real-world wait. */
export const actionDurations: Record<Action, number> = {
  sleep: 60, rest: 15, explore: 10, askFood: 1, eat: 5, bringToy: 2,
  play: 10, seekOwner: 3, sitNearOwner: 10, requestAttention: 1,
  greetOwner: 1, barkAlert: 1, lookAround: 2, wander: 5, headScratch: 1,
};
export const actionCooldowns: Partial<Record<Action, number>> = {
  askFood: 45, bringToy: 20, requestAttention: 20, seekOwner: 20,
};
const effects: Record<Action, Partial<Stats>> = {
  headScratch: { happiness: 8, stress: -5 },
  sleep: { energy: 50, sleepiness: -60, stress: -10 },
  rest: { energy: 12, sleepiness: -8, stress: -5 },
  explore: { energy: -5, boredom: -12, happiness: 4 },
  askFood: {}, eat: { hunger: -40, happiness: 8 },
  bringToy: { energy: -2, boredom: -4 },
  play: { energy: -12, boredom: -25, happiness: 15 },
  seekOwner: { energy: -2 }, sitNearOwner: { stress: -8, happiness: 5 },
  requestAttention: {}, greetOwner: { happiness: 12, stress: -5 },
  barkAlert: { energy: -1 }, lookAround: { boredom: -3 },
  wander: { energy: -3, boredom: -6 },
};
export function canAct(action: Action, state: PetState, context: Context): boolean {
  if ((state.cooldowns[action] ?? 0) > state.simulationMinutes) return false;
  switch (action) {
    case 'sleep': return state.stats.energy <= 30 || state.stats.sleepiness >= 65 || (context.isNight && state.stats.sleepiness >= 40);
    case 'rest': return state.stats.energy < 75 || state.stats.stress > 30;
    case 'eat': return context.foodAvailable && state.stats.hunger > 10;
    case 'askFood': return context.ownerPresent && !context.foodAvailable && state.stats.hunger >= 60;
    case 'play': case 'bringToy': return context.ownerPresent && context.toyAvailable && state.stats.energy >= 20;
    case 'greetOwner': return context.ownerPresent && context.ownerJustArrived;
    case 'headScratch': return context.ownerPresent && context.ownerActive;
    case 'sitNearOwner': case 'requestAttention': return context.ownerPresent;
    case 'seekOwner': return !context.ownerPresent;
    case 'barkAlert': return context.loudNoise;
    case 'explore': case 'wander': return state.stats.energy >= 15;
    default: return true;
  }
}
export function applyAction(action: Action, state: PetState, context: Context): void {
  if (!canAct(action, state, context)) throw new Error(`Action ${action} is unavailable in this context.`);
  changeStats(state.stats, effects[action]);
  if (action === 'headScratch') bond(state.relationship, 2, 0, 1);
  if (action === 'play') bond(state.relationship, 2, 0, 3);
  if (action === 'eat' && context.ownerPresent) bond(state.relationship, 0, 1, 1);
  if (action === 'sitNearOwner' || action === 'greetOwner') bond(state.relationship, 1, 1, 2);
  if (action === 'eat') context.foodAvailable = false;
  if (action === 'greetOwner') context.ownerJustArrived = false;
}

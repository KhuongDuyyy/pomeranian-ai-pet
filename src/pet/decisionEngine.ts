import { actionNames, canAct, type Action } from './actions.js';
import type { Context } from './context.js';
import { personality, type Personality } from './personality.js';
import type { PetState } from './state.js';
import { bondLevelForXp } from './relationship.js';
import { currentHabitActions } from './habits.js';
export interface ScoredAction { action: Action; score: number }
export function rankActions(state: PetState, context: Context, random: () => number = Math.random, traits: Personality = personality, now = new Date().toISOString()): ScoredAction[] {
  const s = state.stats;
  const r = state.relationship;
  const scores: Record<Action, number> = {
    headScratch: 0,
    sleep: s.sleepiness * 1.1 + (100 - s.energy) * 0.9 + (context.isNight ? 20 : 0),
    rest: (100 - s.energy) * 0.9 + s.stress * 0.3,
    explore: s.boredom * 0.55 + traits.curious * 0.3 + traits.intelligent * 0.05,
    askFood: s.hunger * 1.3 + traits.foodMotivated * 0.2,
    eat: s.hunger * 1.6 + traits.foodMotivated * 0.2,
    bringToy: s.boredom * 0.65 + traits.playful * 0.35,
    play: s.boredom * 0.8 + traits.playful * 0.25 + s.energy * 0.1 + traits.energetic * 0.05,
    seekOwner: traits.affectionate * 0.45 + r.affection * 0.2 + s.stress * 0.2,
    sitNearOwner: traits.affectionate * 0.2 + r.trust * 0.2 + s.stress * 0.7,
    requestAttention: traits.social * 0.3 + (100 - s.happiness) * 0.4,
    greetOwner: 100 + r.familiarity * 0.2,
    barkAlert: traits.alert * 0.7 + traits.brave * 0.15 + s.stress * 0.2,
    lookAround: traits.curious * 0.2 + traits.sensitivity * 0.1,
    wander: s.boredom * 0.3 + traits.energetic * 0.1,
  };
  // Critical physical needs take priority over greetings or repetitive requests.
  if (s.energy < 15 || s.sleepiness > 90) scores.sleep += 200;
  if (s.hunger > 85) { scores.eat += 200; scores.askFood += 100; }
  if (context.foodKind === state.memory.preferences.favoriteFood) scores.eat += 5;
  if (context.toyKind === state.memory.preferences.favoriteToy) scores.play += 5;
  const level = bondLevelForXp(r.bondXp);
  if (level >= 2) scores.greetOwner += 5;
  if (level >= 4) scores.sitNearOwner += 12;
  if (level >= 6 && context.toyKind === state.memory.preferences.favoriteToy) scores.bringToy += 10;
  if (level >= 7) scores.greetOwner += 10;
  // Invitations only: never synthesize care, award XP, or bypass availability.
  if (context.ownerPresent && !context.isNight && !context.loudNoise && s.hunger < 60 && s.energy >= 40 && s.sleepiness < 65 && s.stress < 60) {
    for (const action of currentHabitActions(state.memory, now)) scores[action] += 12;
  }
  return actionNames.filter(action => action !== 'headScratch' && canAct(action, state, context)).map(action => {
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error('Random source must return a value in [0, 1).');
    const repetitions = state.memory.recent.slice(-3).filter(event => event.action === action).length;
    return { action, score: scores[action] - repetitions * (20 - traits.stubborn * 0.1) + draw * 8 };
  }).sort((a, b) => b.score - a.score);
}
export function decide(state: PetState, context: Context, random: () => number = Math.random, now = new Date().toISOString()): Action {
  const best = rankActions(state, context, random, personality, now)[0];
  if (!best) throw new Error('No available action.');
  return best.action;
}

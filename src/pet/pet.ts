import { actionCooldowns, actionDurations, applyAction, type Action } from './actions.js';
import { defaultContext, type Context } from './context.js';
import { decide } from './decisionEngine.js';
import { learnPreference, remember } from './memory.js';
import { getMood } from './mood.js';
import { createState, type PetState } from './state.js';
import { advanceStats, changeStats } from './stats.js';
export class Pet {
  readonly context: Context;
  constructor(public readonly state: PetState = createState(), context: Partial<Context> = {}, private readonly random: () => number = Math.random) {
    this.context = { ...defaultContext, ...context };
  }
  get mood() { return getMood(this.state.stats); }
  act(action: Action, now = new Date().toISOString()): Action {
    applyAction(action, this.state, this.context);
    const duration = actionDurations[action];
    advanceStats(this.state.stats, duration);
    this.state.simulationMinutes += duration;
    const cooldown = actionCooldowns[action];
    if (cooldown !== undefined) this.state.cooldowns[action] = this.state.simulationMinutes + cooldown;
    if (action === 'eat') learnPreference(this.state.memory, 'food', this.context.foodKind);
    if (action === 'play') learnPreference(this.state.memory, 'toy', this.context.toyKind);
    if (action === 'headScratch') learnPreference(this.state.memory, 'action', 'head_scratch');
    remember(this.state.memory, { action, at: now, mood: this.mood, importance: ['headScratch', 'play', 'greetOwner'].includes(action) ? 70 : 30 });
    this.state.updatedAt = now;
    return action;
  }
  tick(minutes = 10, now = new Date().toISOString()): Action {
    advanceStats(this.state.stats, minutes);
    this.state.simulationMinutes += minutes;
    if (this.context.loudNoise) changeStats(this.state.stats, { stress: 12 });
    const action = this.act(decide(this.state, this.context, this.random), now);
    this.context.ownerJustArrived = false;
    this.context.loudNoise = false;
    return action;
  }
}

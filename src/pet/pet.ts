import { applyAction, type Action } from './actions.js';
import { defaultContext, type Context } from './context.js';
import { decide } from './decisionEngine.js';
import { remember } from './memory.js';
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
    remember(this.state.memory, { action, at: now, mood: this.mood });
    this.state.updatedAt = now;
    return action;
  }
  tick(minutes = 10, now = new Date().toISOString()): Action {
    advanceStats(this.state.stats, minutes);
    if (this.context.loudNoise) changeStats(this.state.stats, { stress: 12 });
    const action = this.act(decide(this.state, this.context, this.random), now);
    this.context.ownerJustArrived = false;
    this.context.loudNoise = false;
    return action;
  }
}

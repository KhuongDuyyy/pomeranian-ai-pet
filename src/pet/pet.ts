import { actionCooldowns, actionDurations, applyAction, type Action } from './actions.js';
import { defaultContext, type Context } from './context.js';
import { decide } from './decisionEngine.js';
import { firstKeepsakeTitles, keepMemory, learnPreference, remember } from './memory.js';
import { bondLevelForXp, bondStages } from './relationship.js';
import { getMood } from './mood.js';
import { recordCalendarMemories } from './habits.js';
import { createState, type PetState } from './state.js';
import { advanceStats, changeStats } from './stats.js';
export class Pet {
  readonly context: Context;
  constructor(public readonly state: PetState = createState(), context: Partial<Context> = {}, private readonly random: () => number = Math.random) {
    this.context = { ...defaultContext, ...context };
  }
  get mood() { return getMood(this.state.stats); }
  act(action: Action, now = new Date().toISOString()): Action {
    const previousLevel = bondLevelForXp(this.state.relationship.bondXp);
    const previousFood = this.state.memory.preferences.favoriteFood;
    const previousToy = this.state.memory.preferences.favoriteToy;
    applyAction(action, this.state, this.context);
    const level = bondLevelForXp(this.state.relationship.bondXp);
    if (action === 'headScratch' && previousLevel >= 3) changeStats(this.state.stats, { stress: -3 });
    if (action === 'sitNearOwner' && previousLevel >= 5) changeStats(this.state.stats, { stress: -5 });
    const duration = actionDurations[action];
    advanceStats(this.state.stats, duration);
    this.state.simulationMinutes += duration;
    const cooldown = actionCooldowns[action];
    if (cooldown !== undefined) this.state.cooldowns[action] = this.state.simulationMinutes + cooldown;
    if (action === 'eat') learnPreference(this.state.memory, 'food', this.context.foodKind);
    if (action === 'play') learnPreference(this.state.memory, 'toy', this.context.toyKind);
    if (action === 'headScratch') learnPreference(this.state.memory, 'action', 'head_scratch');
    const title = firstKeepsakeTitles[action];
    if (title) keepMemory(this.state.memory, { key: `first:${action}`, title, at: now, importance: 95 });
    for (let milestone = previousLevel + 1; milestone <= level; milestone++) {
      keepMemory(this.state.memory, { key: `bond:${milestone}`, title: `Gắn bó mới: ${bondStages[milestone - 1]}`, at: now, importance: 100 });
    }
    if (previousFood !== this.state.memory.preferences.favoriteFood) keepMemory(this.state.memory, { key: `favorite:food:${this.state.memory.preferences.favoriteFood}`, title: `Đã quen món ${this.state.memory.preferences.favoriteFood === 'chicken' ? 'gà' : 'hạt'}`, at: now, importance: 85 });
    if (previousToy !== this.state.memory.preferences.favoriteToy) keepMemory(this.state.memory, { key: `favorite:toy:${this.state.memory.preferences.favoriteToy}`, title: `Đã quen chơi ${this.state.memory.preferences.favoriteToy === 'rope' ? 'dây kéo' : 'bóng xanh'}`, at: now, importance: 85 });
    remember(this.state.memory, { action, at: now, mood: this.mood, importance: ['headScratch', 'play', 'greetOwner'].includes(action) ? 70 : 30 });
    this.state.updatedAt = now;
    if (this.context.ownerPresent) recordCalendarMemories(this.state.memory, now);
    return action;
  }
  tick(minutes = 10, now = new Date().toISOString()): Action {
    advanceStats(this.state.stats, minutes);
    this.state.simulationMinutes += minutes;
    if (this.context.loudNoise) changeStats(this.state.stats, { stress: 12 });
    const action = this.act(decide(this.state, this.context, this.random, now), now);
    this.context.ownerJustArrived = false;
    this.context.loudNoise = false;
    return action;
  }
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemory } from '../src/pet/memory.js';
import { learnedHabits, recordCalendarMemories } from '../src/pet/habits.js';
import { Pet } from '../src/pet/pet.js';
import { rankActions, decide } from '../src/pet/decisionEngine.js';
import { personality } from '../src/pet/personality.js';

test('habit invitations use the supplied clock, respect needs and cooldowns, and never teach themselves', () => {
  const pet = new Pet();
  for (const day of [14, 15, 16]) for (const action of ['play', 'headScratch']) pet.state.memory.episodic.push({ action, at: `2026-09-${day}T01:00:00Z`, mood: 'happy' });
  const now = '2026-09-17T01:00:00Z';
  const ranks = (time = now) => rankActions(pet.state, pet.context, () => 0, personality, time);
  const score = (action: string, time: string) => ranks(time).find(item => item.action === action)!.score;
  assert.equal(score('bringToy', now) - score('bringToy', '2026-09-17T10:00:00Z'), 12);
  assert.equal(score('requestAttention', now) - score('requestAttention', '2026-09-17T10:00:00Z'), 12);
  pet.context.isNight = true;
  assert.equal(score('bringToy', now), score('bringToy', '2026-09-17T10:00:00Z'));
  pet.context.isNight = false;
  pet.state.stats.hunger = 99; pet.context.foodAvailable = true;
  assert.equal(decide(pet.state, pet.context, () => 0, now), 'eat');
  pet.state.stats.hunger = 20; pet.state.stats.energy = 5;
  assert.equal(decide(pet.state, pet.context, () => 0, now), 'sleep');
  pet.state.stats.energy = 80;
  pet.state.cooldowns.bringToy = 100;
  assert.ok(!ranks().some(item => item.action === 'bringToy'));
  pet.context.ownerPresent = false;
  assert.ok(!ranks().some(item => item.action === 'requestAttention'));
  pet.context.ownerPresent = true;
  const xp = pet.state.relationship.bondXp;
  pet.act('requestAttention', now);
  assert.equal(pet.state.relationship.bondXp, xp);
  assert.equal(learnedHabits(pet.state.memory, now)[0]!.days, 3);
});

test('habits require distinct local days, exclude stale/future events and use Vietnam time', () => {
  const memory = createMemory('2026-09-01T00:00:00Z');
  const add = (at: string) => memory.episodic.push({ action: 'headScratch', at, mood: 'happy' });
  for (let i = 0; i < 20; i++) add('2026-09-14T01:00:00Z');
  assert.equal(learnedHabits(memory, '2026-09-17T00:00:00Z').length, 0);
  add('2026-09-15T01:00:00Z'); add('2026-09-16T01:00:00Z');
  add('2026-08-01T01:00:00Z'); add('2026-09-18T01:00:00Z');
  const habits = learnedHabits(memory, '2026-09-17T00:00:00Z');
  assert.equal(habits.length, 1); assert.equal(habits[0]!.days, 3);
  assert.match(habits[0]!.description, /buổi sáng/);
});

test('calendar keepsakes record only observed milestone dates once without XP rewards', () => {
  const memory = createMemory('2026-09-01T18:00:00Z');
  recordCalendarMemories(memory, '2026-09-08T18:00:00Z');
  recordCalendarMemories(memory, '2026-09-09T01:00:00Z');
  assert.equal(memory.keepsakes.length, 1);
  recordCalendarMemories(memory, '2026-10-03T01:00:00Z');
  assert.equal(memory.keepsakes.length, 1);
  const pet = new Pet();
  pet.state.memory.profile.firstMet = '2026-09-01T00:00:00Z';
  pet.context.ownerPresent = false;
  pet.act('lookAround', '2026-09-08T00:00:00Z');
  assert.equal(pet.state.memory.keepsakes.length, 0);
  pet.context.ownerPresent = true;
  pet.act('lookAround', '2026-09-08T00:00:00Z');
  assert.equal(pet.state.memory.keepsakes.length, 1);
  assert.equal(pet.state.relationship.bondXp, 0);
});

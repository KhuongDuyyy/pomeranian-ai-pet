import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pet } from '../src/pet/pet.js';
import { createState } from '../src/pet/state.js';
import { advanceStats, changeStats } from '../src/pet/stats.js';
import { getMood } from '../src/pet/mood.js';
import { decide, rankActions } from '../src/pet/decisionEngine.js';
import { defaultContext } from '../src/pet/context.js';
import { loadState, saveState } from '../src/pet/persistence.js';

test('time scales linearly, clamps values, and rejects invalid duration before mutation', () => {
  const s = createState().stats;
  advanceStats(s, 20);
  assert.equal(s.hunger, 27);
  assert.equal(s.energy, 84.4);
  const before = { ...s };
  for (const n of [-1, NaN, Infinity]) assert.throws(() => advanceStats(s, n));
  assert.deepEqual(s, before);
  changeStats(s, { hunger: 1000, energy: -1000 });
  assert.equal(s.hunger, 100);
  assert.equal(s.energy, 0);
});
test('mood thresholds and priorities', () => {
  const s = createState().stats;
  assert.equal(getMood(s), 'excited');
  s.hunger = 90; s.sleepiness = 90; s.stress = 90;
  assert.equal(getMood(s), 'hungry');
  s.hunger = 75; assert.equal(getMood(s), 'sleepy');
  s.sleepiness = 75; assert.equal(getMood(s), 'nervous');
  s.stress = 0; s.happiness = 65; s.boredom = 70;
  assert.equal(getMood(s), 'playful');
  s.boredom = 0; assert.equal(getMood(s), 'happy');
  s.happiness = 60; assert.equal(getMood(s), 'neutral');
});
test('urgent needs win and unavailable actions never enter rankings', () => {
  const state = createState();
  state.stats.hunger = 95;
  assert.equal(decide(state, { ...defaultContext, foodAvailable: true }, () => 0), 'eat');
  assert.equal(decide(state, { ...defaultContext }, () => 0), 'askFood');
  state.stats.hunger = 20; state.stats.energy = 5;
  assert.equal(decide(state, { ...defaultContext, ownerJustArrived: true }, () => 0), 'sleep');
  const actions = rankActions(state, { ...defaultContext, ownerPresent: false, toyAvailable: false }, () => 0).map(x => x.action);
  for (const action of ['eat', 'play', 'askFood', 'greetOwner', 'sitNearOwner', 'bringToy']) assert.ok(!actions.includes(action as typeof actions[number]));
});
test('actions consume food, build relationship, and reject absent-owner play', () => {
  const pet = new Pet();
  pet.act('play');
  assert.equal(pet.state.stats.energy, 73);
  assert.equal(pet.state.relationship.bondXp, 3);
  pet.context.foodAvailable = true; pet.act('eat');
  assert.equal(pet.context.foodAvailable, false);
  assert.equal(pet.state.stats.hunger, 0);
  pet.context.ownerPresent = false;
  const before = structuredClone(pet.state);
  assert.throws(() => pet.act('play'));
  assert.deepEqual(pet.state, before);
});
test('memory is bounded, instances are isolated, events expire, repetition lowers score', () => {
  const pet = new Pet(createState(), {}, () => 0);
  const initial = rankActions(pet.state, pet.context, () => 0).find(x => x.action === 'lookAround')!.score;
  for (let i = 0; i < 250; i++) pet.act('lookAround');
  assert.equal(pet.state.memory.recent.length, 20);
  assert.equal(pet.state.memory.episodic.length, 200);
  assert.ok(rankActions(pet.state, pet.context, () => 0).find(x => x.action === 'lookAround')!.score < initial);
  assert.equal(new Pet().state.memory.recent.length, 0);
  pet.context.ownerJustArrived = true; pet.context.loudNoise = true; pet.tick();
  assert.equal(pet.context.ownerJustArrived, false);
  assert.equal(pet.context.loudNoise, false);
});
test('persistence roundtrip, overwrite, missing file, and corrupt data preservation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pet-test-'));
  const path = join(dir, 'pet.json');
  try {
    const state = await loadState(path);
    await saveState(path, state);
    state.memory.profile.petName = 'Snow';
    await saveState(path, state);
    assert.deepEqual(await loadState(path), state);
    await writeFile(path, '{broken');
    await assert.rejects(loadState(path), /Original file was preserved/);
    assert.equal(await readFile(path, 'utf8'), '{broken');
    await writeFile(path, JSON.stringify({ ...state, stats: { ...state.stats, hunger: 101 } }));
    await assert.rejects(loadState(path));
    state.stats.energy = NaN;
    await assert.rejects(saveState(path, state));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

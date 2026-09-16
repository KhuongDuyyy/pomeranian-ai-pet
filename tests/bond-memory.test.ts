import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pet } from '../src/pet/pet.js';
import { createState } from '../src/pet/state.js';
import { bondLevelForXp, bondProfile, bondReaction } from '../src/pet/relationship.js';
import { createMemory, keepMemory, remember } from '../src/pet/memory.js';
import { loadState, saveState, stateSchema } from '../src/pet/persistence.js';
import { rankActions, decide } from '../src/pet/decisionEngine.js';

const now = '2026-09-17T01:00:00.000Z';
test('seven bond milestones have stable thresholds and no progress wrap at maximum', () => {
  for (let level = 1; level <= 7; level++) assert.equal(bondLevelForXp((level - 1) * 25), level);
  assert.equal(bondLevelForXp(24), 1);
  assert.equal(bondLevelForXp(149), 6);
  const pet = new Pet();
  pet.state.relationship.bondXp = 149; pet.state.relationship.bondLevel = 6;
  pet.act('headScratch', now);
  assert.equal(pet.state.relationship.bondLevel, 7);
  assert.equal(pet.state.memory.keepsakes.filter(item => item.key === 'bond:7').length, 1);
  pet.act('headScratch', now);
  const profile = bondProfile(pet.state.relationship);
  assert.equal(profile.name, 'Tri kỷ'); assert.equal(profile.progress, 25); assert.equal(profile.nextXp, null);
  assert.equal(pet.state.relationship.bondXp, 151);
  assert.equal(pet.state.memory.keepsakes.filter(item => item.key === 'bond:7').length, 1);
});

test('keepsakes and important episodes survive routine events without duplicating first memories', () => {
  const pet = new Pet();
  pet.act('headScratch', now); pet.act('headScratch', now);
  for (let i = 0; i < 500; i++) pet.act('lookAround', new Date(Date.parse(now) + (i + 1) * 1000).toISOString());
  assert.equal(pet.state.memory.keepsakes.filter(item => item.key === 'first:headScratch').length, 1);
  assert.ok(pet.state.memory.episodic.some(item => item.action === 'headScratch'));
  assert.equal(pet.state.memory.episodic.length, 200);
  assert.equal(pet.state.memory.recent.length, 20);
  assert.ok(pet.state.memory.recent.every(item => item.action === 'lookAround'));
  const memory = createMemory(now);
  keepMemory(memory, { key: 'bond:2', title: 'Milestone', importance: 100, at: now });
  for (let i = 0; i < 100; i++) keepMemory(memory, { key: `ordinary:${i}`, title: 'Ordinary', importance: 30, at: now });
  assert.equal(memory.keepsakes.length, 50);
  assert.ok(memory.keepsakes.some(item => item.key === 'bond:2'));
});

test('higher bond makes comfort effective without bypassing urgent needs or context', () => {
  const stranger = new Pet(); const friend = new Pet();
  friend.state.relationship.bondXp = 50; friend.state.relationship.bondLevel = 3;
  stranger.state.stats.stress = 40; friend.state.stats.stress = 40;
  stranger.act('headScratch', now); friend.act('headScratch', now);
  assert.equal(stranger.state.stats.stress - friend.state.stats.stress, 3);
  assert.equal(bondReaction('headScratch', 1), null);
  assert.ok(bondReaction('headScratch', 3));
  const family = new Pet(); family.state.relationship.bondXp = 150; family.state.relationship.bondLevel = 7;
  const score = (pet: Pet) => rankActions(pet.state, pet.context, () => 0).find(item => item.action === 'sitNearOwner')!.score;
  const neutral = new Pet();
  assert.ok(score(family) > score(neutral));
  family.state.stats.hunger = 99; family.context.foodAvailable = true;
  assert.equal(decide(family.state, family.context, () => 0), 'eat');
  family.context.ownerPresent = false;
  assert.ok(!rankActions(family.state, family.context, () => 0).some(item => item.action === 'sitNearOwner'));
});

test('legacy save migration preserves identity, XP, stats and events, reconstructing only known memories', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bongg-memory-'));
  const path = join(dir, 'state.json');
  try {
    const old = createState(now);
    old.relationship.bondXp = 250; old.relationship.bondLevel = 11;
    remember(old.memory, { action: 'play', at: now, mood: 'happy', importance: 70 });
    const raw = JSON.parse(JSON.stringify(old)); delete raw.memory.keepsakes;
    await writeFile(path, JSON.stringify(raw));
    const before = await readFile(path, 'utf8');
    const migrated = await loadState(path);
    assert.equal(migrated.relationship.bondXp, 250); assert.equal(migrated.relationship.bondLevel, 7);
    assert.deepEqual(migrated.stats, old.stats); assert.deepEqual(migrated.memory.profile, old.memory.profile);
    assert.deepEqual(migrated.memory.episodic, old.memory.episodic);
    assert.deepEqual(migrated.memory.preferences, old.memory.preferences);
    assert.equal(migrated.memory.keepsakes.length, 1);
    assert.equal(migrated.memory.keepsakes[0]?.at, now);
    assert.equal(migrated.memory.keepsakes[0]?.key, 'first:play');
    assert.equal(await readFile(path, 'utf8'), before);
    await saveState(path, migrated);
    assert.deepEqual(await loadState(path), migrated);
    assert.throws(() => stateSchema.parse({ ...migrated, relationship: { ...migrated.relationship, bondLevel: 4 } }));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

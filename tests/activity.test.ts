import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pet } from '../src/pet/pet.js';
import { currentActivity } from '../src/pet/activity.js';
import { PetService } from '../src/webApi.js';

test('activity progress expires without replaying rewards, ignores future and invalid dates', () => {
  const pet = new Pet();
  const at = '2026-09-17T01:00:00Z';
  pet.act('play', at);
  assert.equal(currentActivity(pet.state.memory, Date.parse(at))?.progress, 0);
  assert.equal(currentActivity(pet.state.memory, Date.parse(at) + 6000)?.progress, 0.5);
  assert.equal(currentActivity(pet.state.memory, Date.parse(at) + 12000), null);
  assert.equal(currentActivity(pet.state.memory, Date.parse(at) - 1), null);
  assert.equal(pet.state.relationship.bondXp, 3);
  pet.state.memory.recent.at(-1)!.at = 'bad';
  assert.equal(currentActivity(pet.state.memory), null);
});

test('concurrent care cannot restart an ongoing activity or award twice; failed save starts nothing', async () => {
  const service = new PetService(new Pet(), 'unused', async () => {});
  const results = await Promise.allSettled([service.command({ type: 'act', action: 'play' }), service.command({ type: 'act', action: 'play' })]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(service.read().state.relationship.bondXp, 3);
  await assert.rejects(service.command({ type: 'tick', minutes: 10 }));
  await service.command({ type: 'rename', name: 'Bôngg' });
  assert.equal(service.read().activity?.action, 'play');
  const failing = new PetService(new Pet(), 'unused', async () => { throw new Error('disk'); });
  await assert.rejects(failing.command({ type: 'act', action: 'play' }));
  assert.equal(failing.read().activity, null);
  assert.equal(failing.read().state.relationship.bondXp, 0);
});

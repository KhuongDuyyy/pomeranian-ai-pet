import { test } from "node:test";
import assert from "node:assert/strict";
import { Pet } from "../src/pet/pet.js";
import { PetService } from "../src/webApi.js";
import { stateSchema } from "../src/pet/persistence.js";

test("head scratches are an owner interaction with distinct effects and learned preference", () => {
  const pet = new Pet();
  pet.act("headScratch");
  assert.equal(pet.state.relationship.affection, 22);
  assert.equal(pet.state.relationship.bondXp, 1);
  assert.equal(pet.state.stats.happiness, 88);
  assert.equal(pet.state.stats.stress, 0);
  assert.equal(pet.state.memory.preferences.learned["action:head_scratch"], 1);
  pet.context.ownerPresent = false;
  assert.throws(() => pet.act("headScratch"));
});
test("repeated meals and play learn preferences and survive schema validation", () => {
  const pet = new Pet();
  for (let i = 0; i < 3; i++) {
    pet.state.stats.hunger = 70;
    pet.context.foodAvailable = true;
    pet.context.foodKind = "chicken";
    pet.act("eat");
    pet.state.stats.energy = 90;
    pet.context.toyKind = "rope";
    pet.act("play");
  }
  const state = stateSchema.parse(pet.state);
  assert.equal(state.memory.preferences.favoriteFood, "chicken");
  assert.equal(state.memory.preferences.favoriteToy, "rope");
  assert.equal(state.memory.episodic.at(-1)?.importance, 70);
  const old = structuredClone(state) as unknown as {
    memory: { preferences: { learned?: unknown } };
  };
  delete old.memory.preferences.learned;
  assert.deepEqual(stateSchema.parse(old).memory.preferences.learned, {});
});
test("one server clock, active viewers only, no offline catch-up or bond penalty", async () => {
  const service = new PetService(new Pet(), "unused", async () => {});
  service.observe(0);
  await service.pulse(19000);
  assert.equal(service.read().state.simulationMinutes, 0);
  // Regular presence updates keep the lease alive without postponing the tick.
  for (let now = 3000; now <= 18000; now += 3000) service.observe(now);
  service.observe(20000);
  await Promise.all([service.pulse(20000), service.pulse(20000)]);
  const after = service.read().state;
  assert.ok(after.simulationMinutes > 0);
  assert.equal(after.memory.recent.length, 1);
  await service.pulse(100000);
  assert.deepEqual(service.read().state, after);
  service.observe(100000);
  await service.pulse(100000);
  assert.deepEqual(service.read().state, after);
  await service.command({ type: "autonomy", enabled: false });
  service.observe(120000);
  await service.pulse(140000);
  assert.deepEqual(service.read().state, after);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Pet } from "../src/pet/pet.js";
import { PetService } from "../src/webApi.js";
import { loadState } from "../src/pet/persistence.js";
import { createPetServer } from "../src/server.js";

test("web commands save to disk and serialize concurrent interactions", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pet-web-"));
  const path = join(dir, "state.json");
  try {
    const service = new PetService(new Pet(), path);
    await Promise.all([
      service.command({ type: "act", action: "sitNearOwner" }),
      service.command({ type: "act", action: "sitNearOwner" }),
    ]);
    assert.equal(service.read().state.relationship.bondXp, 4);
    await service.command({ type: "rename", name: "Mây" });
    assert.equal((await loadState(path)).memory.profile.petName, "Mây");
    await service.command({
      type: "context",
      key: "ownerPresent",
      value: false,
    });
    const before = service.read();
    await assert.rejects(service.command({ type: "act", action: "play" }));
    assert.deepEqual(service.read(), before);
    await service.command({
      type: "context",
      key: "ownerPresent",
      value: true,
    });
    assert.equal(
      service.read().state.memory.recent.at(-1)?.action,
      "greetOwner",
    );
    assert.equal(service.read().context.ownerJustArrived, false);
    await service.command({ type: "feed" });
    assert.equal(service.read().context.foodAvailable, true);
    await service.command({ type: 'tick', minutes: 1 });
    assert.equal(service.read().state.memory.recent.at(-1)?.action, "eat");
    assert.deepEqual(await loadState(path), service.read().state);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("failed disk writes do not publish changed state and queue recovers", async () => {
  let fail = true;
  const service = new PetService(new Pet(), "unused", async () => {
    if (fail) throw new Error("disk full");
  });
  const before = service.read();
  await assert.rejects(service.command({ type: "rename", name: "New name" }));
  assert.deepEqual(service.read(), before);
  fail = false;
  await service.command({ type: "rename", name: "Mây" });
  assert.equal(service.read().state.memory.profile.petName, "Mây");
});

test("HTTP API rejects invalid commands and foreign origins and serves snapshots", async () => {
  const service = new PetService(new Pet(), "unused", async () => {});
  const server = createPetServer(service, resolve("dist/ui"));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const post = (body: unknown, origin = base) =>
    fetch(base + "/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(body),
    });
  try {
    assert.equal((await fetch(base + "/api/pet")).status, 200);
    assert.equal((await post({ type: "tick", minutes: -1 })).status, 400);
    assert.equal((await post({ type: "rename", name: "" })).status, 400);
    assert.equal(
      (await post({ type: "feed" }, "http://evil.example")).status,
      403,
    );
    assert.equal((await post({ type: "act", action: "sleep" })).status, 409);
    assert.equal(
      (await post({ type: "act", action: "sitNearOwner" })).status,
      200,
    );
    assert.equal(service.read().state.relationship.bondXp, 2);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

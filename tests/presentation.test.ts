import { test } from "node:test";
import assert from "node:assert/strict";
import { actionNames } from "../src/pet/actions.js";
import {
  actionPresentation,
  getPresentation,
  posePositions,
} from "../src/pet/presentation.js";

const now = Date.parse("2026-09-17T01:00:00Z");
test("all actions have a pose and duration and deliberate user actions override mood", () => {
  for (const action of actionNames) {
    const presentation = getPresentation(
      { action, at: new Date(now).toISOString(), mood: "happy" },
      "happy",
      now,
    );
    assert.equal(presentation.active, true);
    assert.ok(presentation.durationMs >= 6000);
    assert.ok(posePositions[presentation.pose]);
  }
  assert.equal(
    getPresentation(
      { action: "sleep", at: new Date(now).toISOString(), mood: "excited" },
      "excited",
      now,
    ).pose,
    "sleep",
  );
  assert.equal(
    getPresentation(
      { action: "headScratch", at: new Date(now).toISOString(), mood: "happy" },
      "happy",
      now,
    ).pose,
    "affection",
  );
});
test("finished, corrupt or future events do not replay indefinitely", () => {
  for (const at of [
    new Date(now - 60000).toISOString(),
    "bad date",
    new Date(now + 60000).toISOString(),
  ]) {
    assert.equal(
      getPresentation({ action: "eat", at, mood: "happy" }, "happy", now)
        .active,
      false,
    );
  }
  const episode = {
    action: "eat",
    at: new Date(now).toISOString(),
    mood: "happy",
  };
  assert.equal(
    getPresentation(episode, "happy", now + actionPresentation.eat.durationMs)
      .pose,
    "idle",
  );
  assert.equal(getPresentation(undefined, "sleepy", now).pose, "sleep");
  assert.equal(
    getPresentation(
      { action: "unknown", at: new Date(now).toISOString(), mood: "happy" },
      "neutral",
      now,
    ).pose,
    "idle",
  );
});

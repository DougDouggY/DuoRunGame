import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ANIMATION, animationFrames } from "../src/animation.js";
const manifest = (name) =>
  JSON.parse(
    readFileSync(
      new URL(`../assets/characters/v42/${name}-frames.json`, import.meta.url),
    ),
  );
const png = (name) =>
  readFileSync(
    new URL(`../assets/characters/v42/${name}.png`, import.meta.url),
  );
test("12-frame run preserves all ten accepted frames and inserts two genuine new poses per actor", () => {
  for (const name of ["neon", "inda"]) {
    const m = manifest(name);
    assert.equal(m.runFrames, 12);
    assert.deepEqual(
      m.runSources.filter((f) => f.source === "v41").map((f) => f.index),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
    assert.equal(
      m.runSources.filter((f) => f.source === "new-passing-pose").length,
      2,
    );
    const bytes = png(name + "-run");
    assert.equal(bytes.readUInt32BE(16), 384 * 12);
    assert.equal(bytes.readUInt32BE(20), 240 * 2);
  }
});
test("held weapon atlases include inspected source rectangles; disconnected bow pose excluded", () => {
  for (const [name, count] of [
    ["neon", 16],
    ["inda", 18],
  ]) {
    const m = manifest(name);
    assert.equal(m.weapon.frames, count);
    assert.equal(m.weapon.rects.length, count);
    assert.equal(m.weapon.heldInSameDrawing, true);
    assert.equal(png(name + "-weapon").readUInt32BE(16), 384 * count);
  }
  assert.deepEqual(manifest("neon").weapon.rejectedSourceFrames, [12]);
  assert.equal(manifest("inda").shield.frames, 16);
  assert.equal(manifest("inda").shield.heldInSameDrawing, true);
});
test("release, sword impact and shield impact select their corresponding illustrated poses", () => {
  assert.equal(
    animationFrames({ id: 0, weaponAge: 0.56, power: 0 }, 0, 180).weapon,
    11,
  );
  assert.equal(
    animationFrames({ id: 1, weaponAge: 0.4, power: 0 }, 0, 180).weapon,
    9,
  );
  assert.equal(
    animationFrames({ id: 1, weaponAge: 0, power: 0.3 }, 0, 180).shield,
    10,
  );
});
test("legs continue cycling independently of upper-body attack and never address missing frames", () => {
  const phases = new Set();
  for (let i = 0; i < 120; i++) {
    const f = animationFrames(
      { id: 0, weaponAge: 0.4, power: 0 },
      i / 120,
      800,
    );
    phases.add(f.gait);
    assert.equal(f.weapon, 8);
    assert.ok(f.gait >= 0 && f.gait < 12);
  }
  assert.equal(phases.size, 12);
  assert.equal(ANIMATION.anchor.y, 228);
});

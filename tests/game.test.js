import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { CONFIG, SPEEDS } from "../src/config.js";
import { buildLevel, validateLevel } from "../src/sequences.js";
const run = () => {
  const g = new Game();
  g.status = "running";
  g.ai = [false, false];
  g.schedule = [];
  return g;
};
const step = (g, t) => g.update(t);
test("five fixed speeds, authored schedules validate", () => {
  assert.deepEqual(
    SPEEDS.map((s) => s.value),
    [100, 180, 280, 400, 560],
  );
  for (const s of SPEEDS)
    assert.deepEqual(validateLevel(buildLevel(), s.value), []);
});
test("successful switch is exactly 5 active seconds and cannot renew", () => {
  const g = run();
  g.action(0, "switch");
  step(g, 0.22);
  g.action(1, "switch");
  const start = g.time;
  assert.deepEqual(
    g.players.map((p) => p.lane),
    [1, 0],
  );
  assert.equal(g.action(0, "switch"), false);
  step(g, 4.999);
  assert.deepEqual(
    g.players.map((p) => p.lane),
    [1, 0],
  );
  step(g, 0.001);
  assert.deepEqual(
    g.players.map((p) => p.lane),
    [0, 1],
  );
  assert.ok(Math.abs(g.switchLog[1].time - start - 5) < 1e-9);
  assert.equal(g.switchState.phase, "cooldown");
  step(g, 3);
  assert.equal(g.switchState.phase, "idle");
});
test("pause freezes switch and request countdown", () => {
  const g = run();
  g.action(0, "switch");
  g.status = "paused";
  step(g, 20);
  assert.equal(g.time, 0);
  g.status = "running";
  g.action(1, "switch");
  step(g, 2);
  g.status = "paused";
  step(g, 100);
  assert.equal(g.switchState.phase, "active");
  g.status = "running";
  step(g, 3);
  assert.deepEqual(
    g.players.map((p) => p.lane),
    [0, 1],
  );
});
test("request expires at 2s, repeated confirmation by same player rejected; cooldown 3s", () => {
  const g = run();
  assert.ok(g.action(0, "switch"));
  assert.equal(g.action(0, "switch"), false);
  step(g, 2);
  assert.equal(g.switchState.phase, "cooldown");
  assert.equal(g.action(1, "switch"), false);
  step(g, 3);
  assert.ok(g.action(1, "switch"));
});
test("dash owns only electric; shield owns only armored; expires with visual power", () => {
  for (const [id, type] of [
    [0, "electric"],
    [1, "armored"],
  ]) {
    const g = run();
    g.action(id, "power");
    g.objects.push({ id: 1, type, lane: id, x: 300 });
    step(g, 0.01);
    assert.equal(g.players[id].hp, 3);
    assert.ok(g.objects[0].hit);
    const h = run();
    h.action(1 - id, "power");
    h.objects.push({ id: 1, type, lane: 1 - id, x: 300 });
    step(h, 0.01);
    assert.equal(h.players[1 - id].hp, 2);
  }
  const g = run();
  g.action(0, "power");
  step(g, 1);
  assert.equal(g.players[0].power, 0);
  g.objects.push({ id: 1, type: "electric", lane: 0, x: 300 });
  step(g, 0.01);
  assert.equal(g.players[0].hp, 2);
});
test("bow picks valid target, projectile disables giant protection before sword", () => {
  const g = run();
  g.objects.push({ id: 7, type: "giant", lane: -1, x: 600, protected: true });
  assert.ok(g.action(0, "weapon"));
  step(g, 0.3);
  assert.equal(g.objects[0].protected, false);
  g.objects[0].x = 390;
  assert.ok(g.action(1, "weapon"));
  step(g, 0.1);
  assert.ok(g.objects[0].hit);
  assert.equal(g.score, 500);
});
test("sword cannot destroy protected giant, Neon cannot kill plant with dash", () => {
  const g = run();
  g.objects.push({ id: 1, type: "giant", lane: -1, x: 390, protected: true });
  g.action(1, "weapon");
  step(g, 0.2);
  assert.ok(!g.objects[0].hit);
  const h = run();
  h.objects.push({ id: 1, type: "plant", lane: 0, x: 300 });
  h.action(0, "power");
  step(h, 0.01);
  assert.equal(h.players[0].hp, 2);
});
test("sword timing: distant swing fails; valid window destroys maw", () => {
  const g = run();
  g.objects.push({ id: 1, type: "plant", lane: 1, x: 600 });
  g.action(1, "weapon");
  step(g, 3);
  assert.equal(g.players[1].hp, 2);
  const h = run();
  h.objects.push({ id: 1, type: "plant", lane: 1, x: 390 });
  h.action(1, "weapon");
  step(h, 0.1);
  assert.ok(h.objects[0].hit);
});
test("target activates linked mechanism across lanes", () => {
  const g = run();
  g.objects.push(
    { id: 1, type: "target", lane: 0, x: 500, links: [2] },
    { id: 2, type: "crate", lane: 1, x: 650 },
  );
  g.action(0, "weapon");
  step(g, 0.2);
  assert.ok(g.objects.every((o) => o.hit));
});
test("short invulnerability, bonus, KO, reset", () => {
  const g = run();
  g.objects.push({ id: 1, type: "crate", lane: 0, x: 300 });
  step(g, 0.2);
  assert.equal(g.players[0].hp, 2);
  g.objects = [];
  g.players[0].y = 0;
  g.objects.push({ id: 2, type: "heart", lane: 0, x: 300, y: 45 });
  step(g, 0.01);
  assert.equal(g.players[0].hp, 3);
  g.players[0].hp = 0;
  step(g, 0.01);
  assert.equal(g.status, "over");
  g.reset();
  assert.equal(g.players[0].hp, 3);
  assert.equal(g.time, 0);
});
test("perfect AI uses real actions, completes entire level at ALL five speeds with no damage", () => {
  for (const speed of SPEEDS) {
    const g = new Game();
    g.status = "running";
    g.speed = speed.value;
    g.ai = [true, true];
    while (g.status === "running") g.update(1 / 60);
    assert.equal(g.status, "win", `${speed.name}: ${g.message} t=${g.time}`);
    assert.equal(g.stats.damage, 0, `${speed.name} damage ${g.stats.damage}`);
    assert.equal(
      g.stats.impacts,
      0,
      `${speed.name}: shield could mask an impact`,
    );
    assert.ok(g.stats.arrows >= 4);
    assert.ok(g.stats.swords >= 4);
    assert.equal(g.switchLog.filter((e) => e.event === "start").length, 4);
    for (let i = 0; i < g.switchLog.length; i += 2)
      assert.ok(
        Math.abs(g.switchLog[i + 1].time - g.switchLog[i].time - 5) < 1e-8,
      );
    assert.deepEqual(
      g.players.map((p) => p.lane),
      [0, 1],
    );
  }
});
test("switch cannot schedule an unsafe automatic return; obstacles preserved", () => {
  const g = run();
  g.schedule = [{ id: 1, type: "electric", lane: 0, at: 5.2 }];
  assert.equal(g.action(0, "switch"), false);
  assert.equal(g.schedule.length, 1);
  assert.equal(g.switchState.phase, "idle");
});

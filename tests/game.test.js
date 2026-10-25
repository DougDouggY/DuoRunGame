import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
const run = () => {
  const g = new Game();
  g.status = "running";
  g.next = 1e6;
  return g;
};
const tick = (g, n = 1) => {
  for (let i = 0; i < n; i++) g.update(0.016);
};
const obstacle = (g, type, lane = 0) => g.objects.push({ type, lane, x: 260 });
test("fixed Discovery speed and scroll", () => {
  const g = run();
  tick(g, 100);
  assert.equal(g.speed, 135);
  assert.ok(g.distance > 10);
});
test("jump and landing state", () => {
  const g = run();
  g.action(0, "jump");
  tick(g, 20);
  assert.ok(g.players[0].y > 70);
  tick(g, 60);
  assert.equal(g.players[0].y, 0);
});
test("jump clears crate; grounded character takes one damage", () => {
  const g = run();
  g.players[0].y = 80;
  obstacle(g, "crate");
  tick(g);
  assert.equal(g.players[0].hp, 3);
  const h = run();
  obstacle(h, "crate");
  tick(h, 20);
  assert.equal(h.players[0].hp, 2);
});
test("slide clears barrier and laser", () => {
  for (const type of ["barrier", "laser"]) {
    const g = run();
    g.action(0, "slide");
    obstacle(g, type);
    tick(g);
    assert.equal(g.players[0].hp, 3);
  }
});
test("each power only breaks assigned obstacle", () => {
  for (const [id, type] of [
    [0, "electric"],
    [1, "armored"],
  ]) {
    const g = run();
    g.action(id, "power");
    obstacle(g, type, id);
    tick(g);
    assert.equal(g.players[id].hp, 3);
    assert.equal(g.score, 100);
    const h = run();
    h.action(1 - id, "power");
    obstacle(h, type, 1 - id);
    tick(h);
    assert.equal(h.players[1 - id].hp, 2);
  }
});
test("cooldown prevents repeat power", () => {
  const g = run();
  g.action(0, "power");
  tick(g, 60);
  g.action(0, "power");
  assert.equal(g.players[0].power, 0);
  tick(g, 200);
  g.action(0, "power");
  assert.ok(g.players[0].power > 0);
});
test("switch within window swaps once and protects transition", () => {
  const g = run();
  g.action(0, "switch");
  tick(g, 40);
  g.action(1, "switch");
  assert.deepEqual(
    g.players.map((p) => p.lane),
    [1, 0],
  );
  obstacle(g, "crate", 1);
  tick(g);
  assert.equal(g.players[0].hp, 3);
});
test("expired switch consent does not swap", () => {
  const g = run();
  g.action(0, "switch");
  tick(g, 90);
  g.action(1, "switch");
  assert.equal(g.players[0].lane, 0);
});
test("notes, hearts, shield, energy", () => {
  for (const type of ["note", "heart", "shield", "energy"]) {
    const g = run();
    g.players[0].hp = 2;
    g.players[0].energy = 2;
    g.objects.push({ type, lane: 0, x: 260, y: 45 });
    tick(g);
    assert.ok(g.objects[0].hit);
    if (type === "note") assert.equal(g.score, 25);
    if (type === "heart") assert.equal(g.players[0].hp, 3);
    if (type === "shield") assert.equal(g.players[0].shield, 1);
    if (type === "energy") assert.equal(g.players[0].energy, 0);
  }
});
test("pause freezes and reset restores all state", () => {
  const g = run();
  g.status = "paused";
  tick(g, 20);
  assert.equal(g.time, 0);
  g.reset();
  assert.equal(g.players[0].hp, 3);
  assert.equal(g.score, 0);
  assert.equal(g.objects.length, 0);
});
test("level completes and KO ends run", () => {
  const g = run();
  g.distance = 2400;
  tick(g);
  assert.equal(g.status, "win");
  const h = run();
  h.players[0].hp = 1;
  obstacle(h, "crate");
  tick(h);
  assert.equal(h.status, "over");
});
test("authored full level is survivable with timed coop actions at each speed", () => {
  for (const speed of [135, 165, 215, 280, 360]) {
    const g = run();
    g.next = 420;
    g.speed = speed;
    for (let n = 0; n < 60000 && g.status === "running"; n++) {
      const r = Math.max(1, speed / 135);
      for (const p of g.players) {
        const o = g.objects.find(
          (o) =>
            o.lane === p.lane &&
            !o.hit &&
            [
              "crate",
              "spikes",
              "gap",
              "barrier",
              "laser",
              "electric",
              "armored",
            ].includes(o.type) &&
            o.x > 220 &&
            o.x < 330,
        );
        if (!o) continue;
        const need =
          o.type === "electric" ? 0 : o.type === "armored" ? 1 : undefined;
        if (need !== undefined) {
          if (need !== p.id && g.switching === 0) {
            g.action(0, "switch");
            g.action(1, "switch");
          } else if (o.x < 305 && p.energy === 0) g.action(p.id, "power");
        } else if (["barrier", "laser"].includes(o.type)) {
          if (!p.slide && o.x < 310) g.action(p.id, "slide");
        } else if (p.y === 0 && o.x < (o.type === "gap" ? 290 : 310))
          g.action(p.id, "jump");
      }
      g.update(0.008);
      assert.equal(
        g.players[0].hp,
        3,
        `P1 speed ${speed} distance ${g.distance}`,
      );
      assert.equal(
        g.players[1].hp,
        3,
        `P2 speed ${speed} distance ${g.distance}`,
      );
    }
    assert.equal(g.status, "win", `speed ${speed}`);
  }
});

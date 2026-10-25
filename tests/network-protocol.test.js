import { test } from "node:test";
import assert from "node:assert/strict";
import { PeerSession } from "../src/network.js";
import { Game } from "../src/game.js";
function pair() {
  const g = new Game(),
    h = new PeerSession(g),
    remote = new Game(),
    r = new PeerSession(remote);
  g.status = "running";
  g.ai = [false, false];
  g.schedule = [];
  h.role = "host";
  r.role = "guest";
  const a = {
      readyState: "open",
      bufferedAmount: 0,
      send: (data) => b.onmessage({ data }),
    },
    b = {
      readyState: "open",
      bufferedAmount: 0,
      send: (data) => a.onmessage({ data }),
    };
  h.bind(a);
  r.bind(b);
  a.onopen();
  b.onopen();
  return { g, h, remote, r, a, b };
}
test("remote action controls guest character only through host simulation", () => {
  const { g, r } = pair();
  r.action("jump");
  assert.ok(g.players[1].vy > 0);
  assert.equal(g.players[0].vy, 0);
});
test("state snapshot includes switch clock and lane ownership", () => {
  const { g, h, remote, r } = pair();
  h.action("switch");
  r.action("switch");
  g.update(0.1);
  h.tick(100);
  assert.deepEqual(
    remote.players.map((p) => p.lane),
    [1, 0],
  );
  assert.equal(remote.switchState.endsAt, g.switchState.endsAt);
  assert.equal(remote.time, g.time);
});
test("malformed/unauthorized packets ignored; remote pause works", () => {
  const { g, r, a } = pair();
  a.onmessage({ data: "{no json" });
  a.onmessage({
    data: JSON.stringify({ type: "state", state: { score: 99999 } }),
  });
  r.send({ type: "action", action: "invincible" });
  assert.equal(g.score, 0);
  r.send({ type: "pause" });
  assert.equal(g.status, "paused");
  r.send({ type: "pause" });
  assert.equal(g.status, "running");
});
test("invalid signalling codes rejected and closed channel pauses", () => {
  const { g, h, a } = pair();
  assert.throws(() => h.parse("junk", "offer"));
  assert.throws(() =>
    h.parse(JSON.stringify({ type: "answer", sdp: "x" }), "offer"),
  );
  a.onclose();
  assert.equal(g.status, "paused");
  assert.equal(h.connected, false);
});

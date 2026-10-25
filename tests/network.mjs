import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-background-timer-throttling"],
});
try {
  const context = await browser.newContext();
  const host = await context.newPage(),
    guest = await context.newPage();
  const errors = [];
  for (const p of [host, guest])
    p.on("pageerror", (e) => errors.push(e.message));
  await Promise.all([
    host.goto("http://127.0.0.1:8080"),
    guest.goto("http://127.0.0.1:8080"),
  ]);
  await Promise.all([
    host.waitForFunction(() => window.duoRush),
    guest.waitForFunction(() => window.duoRush),
  ]);
  const offer = await host.evaluate(() => duoRush.network.offer([]));
  const answer = await guest.evaluate(
    (code) => duoRush.network.answer(code, []),
    offer,
  );
  console.log(
    "ICE candidates",
    (JSON.parse(offer).sdp.match(/a=candidate/g) || []).length,
    (JSON.parse(answer).sdp.match(/a=candidate/g) || []).length,
  );
  await host.evaluate((code) => duoRush.network.accept(code), answer);
  await Promise.all([
    host.waitForFunction(() => duoRush.network.connected),
    guest.waitForFunction(() => duoRush.network.connected),
  ]);
  console.log("WebRTC channel connected");
  await host.click("#play");
  await host.evaluate(() => {
    duoRush.game.schedule = [];
    duoRush.game.objects = [];
  });
  console.log(
    "Host start",
    await host.evaluate(() => ({
      status: duoRush.game.status,
      role: duoRush.network.role,
      connected: duoRush.network.connected,
    })),
  );
  await guest.waitForFunction(() => duoRush.game.status === "running");
  console.log("Guest state synchronized");
  assert.deepEqual(await host.evaluate(() => duoRush.game.ai), [false, false]);
  await guest.evaluate(() =>
    dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true })),
  );
  console.log("Guest action sent");
  await host.waitForFunction(() => duoRush.game.players[1].y > 0);
  console.log("Host executed jump");
  await guest.waitForFunction(() => duoRush.game.players[1].y > 0);
  await host.evaluate(() => {
    const g = duoRush.game;
    g.schedule = [];
    g.switchState = { phase: "idle", confirmed: [false, false] };
    dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  });
  await guest.evaluate(() =>
    dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true })),
  );
  await host.waitForFunction(() => duoRush.game.switchState.phase === "active");
  await guest.waitForFunction(
    () => duoRush.game.switchState.phase === "active",
  );
  assert.deepEqual(
    await guest.evaluate(() => duoRush.game.players.map((p) => p.lane)),
    [1, 0],
  );
  await guest.evaluate(() => duoRush.network.send({ type: "pause" }));
  await host.waitForFunction(() => duoRush.game.status === "paused");
  await guest.waitForFunction(() => duoRush.game.status === "paused");
  await guest.evaluate(() => duoRush.network.close());
  await host.waitForFunction(() => !duoRush.network.connected);
  assert.deepEqual(errors, []);
  console.log(
    "WebRTC PASS: two Chromium pages, offer/answer exchange, real data channel, shared state, guest A input, dual Space SWITCH, remote pause, disconnect. Internet/NAT traversal not verified.",
  );
} catch (error) {
  if (error.message.includes("Aucune route réseau WebRTC"))
    console.log(
      "SKIP: no ICE route; managed Chromium disables non-proxied UDP. Real WebRTC connection and Internet multiplayer remain UNVERIFIED.",
    );
  else throw error;
} finally {
  await browser.close();
}

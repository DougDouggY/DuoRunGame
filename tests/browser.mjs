import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://127.0.0.1:8080");
await page.waitForFunction(() => window.neonRush);
assert.equal(
  await page.evaluate(() => Object.keys(neonRush.renderer.assets).length),
  6,
);
await page.click("#play");
await page.keyboard.press("z");
await page.waitForTimeout(180);
assert.ok(await page.evaluate(() => neonRush.game.players[0].y > 0));
await page.keyboard.press("ArrowUp");
await page.keyboard.press("e");
await page.keyboard.press("Enter");
assert.deepEqual(
  await page.evaluate(() => neonRush.game.players.map((p) => p.lane)),
  [1, 0],
);
await page.waitForFunction(() => neonRush.game.players.every(p => p.y === 0) && neonRush.game.switching === 0);
await page.keyboard.press("s");
await page.keyboard.press("ArrowDown");
assert.ok(
  await page.evaluate(() => neonRush.game.players.every((p) => p.slide > 0)),
);
await page.keyboard.press("a");
await page.keyboard.press("ArrowRight");
assert.ok(
  await page.evaluate(() => neonRush.game.players.every((p) => p.power > 0)),
);
await page.click("#pause");
assert.equal(await page.evaluate(() => neonRush.game.status), "paused");
await page.click("#pause");
await page.click("#reset");
await page.evaluate(() => {
  const g = neonRush.game;
  g.time = 8;
  g.distance = 427;
  g.score = 126;
  g.objects = [
    { type: "crate", lane: 0, x: 680 },
    { type: "barrier", lane: 0, x: 990 },
    { type: "electric", lane: 1, x: 1100 },
    { type: "spikes", lane: 1, x: 760 },
    { type: "note", lane: 0, x: 520, y: 60 },
    { type: "shield", lane: 1, x: 560, y: 50 },
  ];
});
await page.screenshot({ path: "assets/screenshot-landscape.png" });
await page.setViewportSize({ width: 430, height: 932 });
await page.waitForTimeout(100);
await page.screenshot({ path: "assets/screenshot-portrait.png" });
assert.ok(
  await page.evaluate(() => neonRush.renderer.floor(1) < neonRush.renderer.h),
);
assert.deepEqual(errors, []);
console.log(
  "Browser: assets, keyboard controls, switch, slide, powers, pause/reset, landscape + portrait: PASS. No console errors.",
);
await browser.close();

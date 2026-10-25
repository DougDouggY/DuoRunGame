import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("http://127.0.0.1:8080");
  await page.waitForFunction(() => window.duoRush);
  assert.equal(
    await page.evaluate(() => Object.keys(duoRush.renderer.assets).length),
    9,
  );
  assert.ok(!(await page.locator("body").innerText()).includes("SWONNI"));
  assert.ok(!(await page.title()).includes("NEON RUSH"));
  await page.uncheck("#ai1");
  await page.selectOption("#pre-speed", "180");
  await page.click("#play");
  await page.evaluate(() => {
    duoRush.game.schedule = [];
    duoRush.game.objects = [];
  });
  assert.equal(await page.evaluate(() => duoRush.game.speed), 180);
  await page.keyboard.press("a");
  await page.waitForFunction(() => duoRush.game.players[0].y > 0);
  await page.waitForFunction(() => duoRush.game.players[0].y === 0);
  await page.keyboard.press("z");
  assert.ok(await page.evaluate(() => duoRush.game.players[0].slide > 0));
  await page.waitForFunction(() => duoRush.game.players[0].slide === 0);
  await page.keyboard.press("e");
  assert.ok(await page.evaluate(() => duoRush.game.players[0].power > 0));
  await page.keyboard.press("Space");
  assert.equal(
    await page.evaluate(() => duoRush.game.switchState.phase),
    "request",
  );
  await page.keyboard.press("Enter");
  assert.deepEqual(
    await page.evaluate(() => duoRush.game.players.map((p) => p.lane)),
    [1, 0],
  );
  await page.click("#pause");
  const time = await page.evaluate(() => duoRush.game.time);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => duoRush.game.time), time);
  await page.click("#pause");
  await page.evaluate(() => duoRush.game.update(5.01));
  assert.deepEqual(
    await page.evaluate(() => duoRush.game.players.map((p) => p.lane)),
    [0, 1],
  );
  await page.click("#reset");
  await page.evaluate(() => {
    const g = duoRush.game;
    g.schedule = [];
    g.objects = [{ id: 100, type: "drone", lane: 0, x: 650 }];
  });
  await page.keyboard.press("r");
  assert.ok(await page.evaluate(() => duoRush.game.projectiles.length > 0));
  await page.waitForFunction(() => duoRush.game.objects[0]?.hit);
  await page.keyboard.press("/");
  assert.ok(await page.evaluate(() => duoRush.game.players[1].weapon > 0));
  // All four authored situations and real AI actions, sampled through full browser simulation.
  for (const speed of [100, 180, 280, 400, 560]) {
    const result = await page.evaluate((speed) => {
      const g = duoRush.game;
      g.reset();
      g.speed = speed;
      g.status = "running";
      g.ai = [true, true];
      g.update(224.01);
      return {
        status: g.status,
        damage: g.stats.damage,
        log: g.switchLog,
        stats: g.stats,
      };
    }, speed);
    assert.equal(result.status, "win");
    assert.equal(result.damage, 0);
    assert.equal(result.stats.impacts, 0);
    assert.equal(result.log.length, 8);
  }
  await page.evaluate(() => {
    const g = duoRush.game;
    g.reset();
    g.speed = 180;
    g.ai = [true, true];
    g.status = "running";
    g.update(104.3);
    document.querySelector("#overlay").classList.add("hidden");
  });
  await page.screenshot({ path: "assets/screenshot-v4-landscape.png" });
  await page.evaluate(() => {
    const g = duoRush.game;
    g.reset();
    g.speed = 180;
    g.ai = [true, true];
    g.status = "running";
    g.update(89.95);
    document.querySelector("#overlay").classList.add("hidden");
  });
  await page.screenshot({ path: "assets/screenshot-v4-switch.png" });
  await page.setViewportSize({ width: 430, height: 932 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: "assets/screenshot-v4-portrait.png" });
  assert.ok(
    await page.evaluate(() => duoRush.renderer.floor(1) < duoRush.renderer.h),
  );
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.click("#help");
  await page.click("#demo");
  assert.deepEqual(await page.evaluate(() => duoRush.game.ai), [true, true]);
  assert.deepEqual(errors, []);
  console.log(
    "Chromium PASS: 9 images, V4 keys, weapons/projectile, 2s request, 5s return/pause, 5 full AI levels, demo, landscape/switch/portrait. No console or HTTP errors.",
  );
} finally {
  await browser.close();
}

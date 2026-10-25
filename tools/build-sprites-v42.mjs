import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080");
  for (let id = 0; id < 2; id++) {
    const r = await page.evaluate(async (id) => {
      const { compileV42 } = await import("/src/sprite-compiler-v42.js");
      return compileV42(id);
    }, id);
    const prefix = `assets/characters/v42/${id ? "inda" : "neon"}`;
    for (const field of ["run", "weapon", "shield"])
      if (r[field])
        await writeFile(
          `${prefix}-${field}.png`,
          Buffer.from(r[field].split(",")[1], "base64"),
        );
    await writeFile(
      `${prefix}-frames.json`,
      JSON.stringify(r.manifest, null, 2) + "\n",
    );
    console.log(
      `${r.manifest.actor}: 12 run, ${r.manifest.weapon.frames} held-weapon, ${id ? 16 : 0} held-shield frames`,
    );
  }
} finally {
  await browser.close();
}

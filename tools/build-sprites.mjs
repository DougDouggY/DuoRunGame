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
    const result = await page.evaluate(async (id) => {
      const { compileCharacter } = await import("/src/sprite-compiler.js");
      return compileCharacter(id);
    }, id);
    const name = id ? "inda" : "neon";
    await writeFile(
      `assets/characters/v41/${name}-compiled.png`,
      Buffer.from(result.png.split(",")[1], "base64"),
    );
    await writeFile(
      `assets/characters/v41/${name}-frames.json`,
      JSON.stringify(result.manifest, null, 2) + "\n",
    );
    console.log(
      `${name}: 10 alternating run sprites + 10 armed running sprites compiled`,
    );
  }
} finally {
  await browser.close();
}

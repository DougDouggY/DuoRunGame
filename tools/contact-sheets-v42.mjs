import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:8080");
  await p.waitForFunction(() => window.duoRush);
  for (const kind of [
    "neon-bow",
    "inda-sword",
    "inda-shield",
    "neon-run",
    "inda-run",
  ]) {
    const data = await p.evaluate((kind) => {
      const a = duoRush.renderer.assets,
        W = 384,
        H = 240,
        count = kind.endsWith("run")
          ? 12
          : kind.endsWith("bow")
            ? 16
            : kind.endsWith("sword")
              ? 18
              : 16;
      const canvas = document.createElement("canvas");
      canvas.width = W * 4;
      canvas.height = H * Math.ceil(count / 4);
      const c = canvas.getContext("2d");
      c.fillStyle = "#0a1225";
      c.fillRect(0, 0, canvas.width, canvas.height);
      const run = a[kind.startsWith("inda") ? "indaRun" : "neonRun"];
      for (let f = 0; f < count; f++) {
        const x = (f % 4) * W,
          y = Math.floor(f / 4) * H;
        const draw = (img, frame, row = 0) =>
          c.drawImage(img, frame * W, row * H, W, H, x, y, W, H);
        if (kind.endsWith("run")) draw(run, f);
        else {
          draw(run, Math.floor((f / count) * 12) % 12, 1);
          draw(
            a[
              kind.endsWith("bow")
                ? "neonBow"
                : kind.endsWith("sword")
                  ? "indaSword"
                  : "indaShield"
            ],
            f,
          );
        }
        c.fillStyle = "#b4d4fa";
        c.font = "12px sans-serif";
        c.fillText(`${kind} · ${f + 1}/${count}`, x + 12, y + 20);
      }
      return canvas.toDataURL("image/png");
    }, kind);
    await writeFile(
      `assets/characters/v42/${kind}-contact.png`,
      Buffer.from(data.split(",")[1], "base64"),
    );
  }
  console.log("5 contact sheets saved from actual runtime frames.");
} finally {
  await b.close();
}

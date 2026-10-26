import { ANIMATION } from "./animation.js?v=4.5.1";
const load = async (path) => {
  const img = new Image();
  img.src = path;
  await img.decode();
  return img;
};
const surface = (count, rows = 1) => {
  const canvas = document.createElement("canvas");
  canvas.width = count * ANIMATION.width;
  canvas.height = rows * ANIMATION.height;
  return { canvas, c: canvas.getContext("2d") };
};
// Source sheets have irregular rows. All rectangles and belt anchors were
// inspected, rather than treating a concept image as an evenly spaced sheet.
export const BOW_RECTS = [
  [0, 0, 384, 235, 196, 181],
  [384, 0, 384, 235, 202, 182],
  [768, 0, 384, 235, 195, 184],
  [1152, 0, 384, 235, 192, 182],
  [0, 235, 384, 235, 175, 189],
  [384, 235, 384, 235, 169, 186],
  [768, 235, 384, 235, 162, 194],
  [1152, 235, 384, 235, 142, 188],
  [0, 470, 512, 228, 143, 190],
  [512, 470, 512, 228, 135, 198],
  [1024, 470, 512, 228, 145, 199],
  [0, 698, 512, 191, 132, 176],
  /* source frame 12 rejected: disconnected grip */ [
    1024, 698, 512, 191, 134, 177,
  ],
  [0, 889, 512, 135, 210, 123],
  [512, 889, 512, 135, 210, 123],
  [1024, 889, 512, 135, 210, 124],
];
const swordAnchors = [
  [310, 168],
  [278, 168],
  [176, 169],
  [300, 163],
  [248, 160],
  [186, 165],
  [260, 155],
  [288, 156],
  [256, 160],
  [170, 160],
  [178, 155],
  [156, 158],
  [180, 155],
  [238, 155],
  [186, 157],
  [220, 160],
  [268, 165],
  [226, 165],
];
const swordY = [0, 180, 350, 515, 680, 845, 1024];
const shieldY = [0, 264, 510, 742, 1024],
  shieldHipY = [236, 218, 207, 216],
  shieldHipX = [
    185, 208, 205, 202, 180, 200, 200, 180, 135, 140, 142, 145, 170, 180, 198,
    185,
  ];
// Remove disconnected pieces from neighbouring source cells. Keep the actual
// connected actor + held weapon, plus a narrow antialiased fringe.
function cleanHeldFrame(img, r, seed = null) {
  const canvas = document.createElement("canvas");
  canvas.width = r[2];
  canvas.height = r[3];
  const c = canvas.getContext("2d");
  c.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  const pixels = c.getImageData(0, 0, canvas.width, canvas.height),
    d = pixels.data,
    w = canvas.width,
    h = canvas.height,
    n = w * h,
    visited = new Uint8Array(n),
    queue = new Int32Array(n);
  let largest = [],
    seeded = [];
  for (let p = 0; p < n; p++) {
    if (visited[p] || d[p * 4 + 3] < 64) continue;
    let head = 0,
      tail = 1;
    queue[0] = p;
    visited[p] = 1;
    const part = [];
    while (head < tail) {
      const q = queue[head++];
      part.push(q);
      const x = q % w,
        y = Math.floor(q / w);
      for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++)
        for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) {
          const k = yy * w + xx;
          if (!visited[k] && d[k * 4 + 3] >= 64) {
            visited[k] = 1;
            queue[tail++] = k;
          }
        }
    }
    if (part.length > largest.length) largest = part;
    if (
      seed &&
      part.some((p) => {
        const x = p % w,
          y = Math.floor(p / w);
        return x >= seed[0] && x <= seed[2] && y >= seed[1] && y <= seed[3];
      })
    )
      seeded.push(...part);
  }
  if (seed && seeded.length) largest = seeded;
  const mask = new Uint8Array(n);
  for (const p of largest) {
    const x = p % w,
      y = Math.floor(p / w);
    for (let yy = Math.max(0, y - 3); yy <= Math.min(h - 1, y + 3); yy++)
      for (let xx = Math.max(0, x - 3); xx <= Math.min(w - 1, x + 3); xx++)
        mask[yy * w + xx] = 1;
  }
  for (let p = 0; p < n; p++) if (!mask[p]) d[p * 4 + 3] = 0;
  c.putImageData(pixels, 0, 0);
  return canvas;
}
export async function compileV42(id) {
  const W = ANIMATION.width,
    H = ANIMATION.height,
    A = ANIMATION.anchor;
  const old = await load(
      `assets/characters/v41/${id ? "inda" : "neon"}-compiled.png`,
    ),
    extra = await load("assets/characters/v42/run-extra-source.png");
  const run = surface(12, 2),
    runSources = [];
  let extraIndex = 0;
  for (let f = 0; f < 12; f++) {
    const oldFrame = ANIMATION.legacyRun[f];
    if (oldFrame !== null) {
      for (let row = 0; row < 2; row++)
        run.c.drawImage(
          old,
          oldFrame * 320,
          row ? 660 : 0,
          320,
          220,
          f * W + A.x - 130,
          row * H + A.y - 210,
          320,
          220,
        );
      runSources.push({ frame: f, source: "v41", index: oldFrame });
    } else {
      const x = extraIndex++ * 768,
        y = id * 512,
        sw = 768,
        sh = 512,
        hipX = id ? 430 : 430,
        hipY = id ? 225 : 245,
        ground = 500;
      const topScale = 78 / hipY,
        lowerScale = 61 / (ground - hipY),
        hip = A.y - 61;
      run.c.drawImage(
        extra,
        x,
        y,
        sw,
        hipY + 3,
        f * W + A.x - hipX * topScale,
        hip - 78,
        sw * topScale,
        (hipY + 3) * topScale,
      );
      for (let row = 0; row < 2; row++)
        run.c.drawImage(
          extra,
          x,
          y + hipY - 6,
          sw,
          ground - hipY + 6,
          f * W + A.x - hipX * lowerScale,
          row * H + hip - 6 * lowerScale,
          sw * lowerScale,
          (ground - hipY + 6) * lowerScale,
        );
      runSources.push({
        frame: f,
        source: "new-passing-pose",
        index: extraIndex - 1,
      });
    }
  }
  // Keep the accepted gait anatomy, removing only detached neighbour pieces
  // that cannot be traced back to the belt/hip area of this actor.
  for (let f = 0; f < 12; f++)
    for (let row = 0; row < 2; row++) {
      const clean = cleanHeldFrame(
        run.canvas,
        [f * W, row * H, W, H, 0, 0],
        [A.x - 45, A.y - 71, A.x + 45, A.y - 47],
      );
      run.c.clearRect(f * W, row * H, W, H);
      run.c.drawImage(clean, f * W, row * H);
    }
  const weaponImage = await load(
    `assets/characters/v42/${id ? "sword" : "bow"}-source.png`,
  );
  const rects = id
    ? swordAnchors.map(([ax, ay], f) => {
        const row = Math.floor(f / 3);
        return [
          (f % 3) * 512,
          swordY[row],
          512,
          swordY[row + 1] - swordY[row],
          ax,
          ay,
        ];
      })
    : BOW_RECTS;
  const weapon = surface(rects.length);
  const register = (ctx, img, r, f, height = 78) => {
    const [x, y, w, h, hx, hy] = r,
      scale = height / hy,
      clean = cleanHeldFrame(img, r);
    ctx.drawImage(
      clean,
      0,
      0,
      w,
      h,
      f * W + A.x - hx * scale,
      A.y - 61 - height,
      w * scale,
      h * scale,
    );
  };
  rects.forEach((r, f) => register(weapon.c, weaponImage, r, f, id ? 78 : 82));
  let shield = null;
  if (id) {
    const img = await load("assets/characters/v42/shield-source.png");
    shield = surface(16);
    for (let f = 0; f < 16; f++) {
      const row = Math.floor(f / 4);
      register(
        shield.c,
        img,
        [
          (f % 4) * 384,
          shieldY[row],
          384,
          shieldY[row + 1] - shieldY[row],
          shieldHipX[f],
          shieldHipY[row],
        ],
        f,
        86,
      );
    }
  }
  return {
    run: run.canvas.toDataURL("image/png"),
    weapon: weapon.canvas.toDataURL("image/png"),
    shield: shield?.canvas.toDataURL("image/png"),
    manifest: {
      ...ANIMATION,
      actor: id ? "INDAFRENCH" : "NÉON IV",
      runSources,
      weapon: {
        frames: rects.length,
        heldInSameDrawing: true,
        rects,
        rejectedSourceFrames: id ? [] : [12],
        releaseFrame: id ? null : 11,
      },
      shield: id
        ? {
            frames: 16,
            heldInSameDrawing: true,
            attachment: "illustrated forearm straps and handle",
          }
        : null,
    },
  };
}

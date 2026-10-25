// Offline atlas baker: registered illustrated torso/weapon frames and painted
// lower-body key poses. The opposite contact pose is explicitly illustrated;
// no mirrored whole character and no stretched pose substitutes for walking.
export async function compileCharacter(id) {
  const load = async (path) => {
    const img = new Image();
    img.src = path;
    await img.decode();
    return img;
  };
  const source = await load(
    `assets/characters/v41/${id ? "inda" : "neon"}-source.png`,
  );
  const opposite = await load("assets/characters/v41/left-contact-source.png");
  const bow = id ? null : await load("assets/characters/v41/parts/3.png");
  const W = 320,
    H = 220,
    anchor = { x: 130, y: 210 },
    cells = [];
  const canvas = document.createElement("canvas");
  canvas.width = W * 10;
  canvas.height = H * 4;
  const c = canvas.getContext("2d");
  const rows = id ? [0, 275, 540, 795, 1024] : [0, 220, 443, 625, 793];
  // Full painted legs retain their anatomy, folds and boots. Mid-cycle is the
  // opposite anatomical contact: near (cyan-seamed) leg back, far leg forward.
  const gait = [0, 1, 2, 9, "left", "left", "left", 9, 2, 6];
  for (let attack = 0; attack < 2; attack++)
    for (let frame = 0; frame < 10; frame++) {
      c.save();
      c.translate(frame * W, attack * H);
      const legFrame = gait[frame];
      let hipY;
      if (legFrame === "left") {
        const a = id
          ? { x: 1020, w: 963, hipX: 520, hipY: 355, ground: 770 }
          : { x: 0, w: 1020, hipX: 620, hipY: 365, ground: 740 };
        const scale = 61 / (a.ground - a.hipY);
        hipY = anchor.y - 61;
        c.drawImage(
          opposite,
          a.x,
          a.hipY - 8,
          a.w,
          a.ground - a.hipY + 8,
          anchor.x - a.hipX * scale,
          hipY - 8 * scale,
          a.w * scale,
          (a.ground - a.hipY + 8) * scale,
        );
      } else {
        const row = Math.floor(legFrame / 5),
          sw = source.width / 5,
          sh = rows[row + 1] - rows[row],
          sy = sh * (id ? 0.53 : 0.57),
          scale = 61 / (sh - sy);
        hipY = anchor.y - 61;
        c.drawImage(
          source,
          (legFrame % 5) * sw,
          rows[row] + sy - 7,
          sw,
          sh - sy + 7,
          anchor.x - sw * 0.5 * scale,
          hipY - 7 * scale,
          sw * scale,
          (sh - sy + 7) * scale,
        );
      }
      const lower = c.getImageData(frame * W, attack * H, W, H);
      if (!attack) c.putImageData(lower, frame * W, H * 3);
      if (attack) c.clearRect(0, 0, W, H);
      const f = frame + (attack ? 10 : 0),
        row = Math.floor(f / 5),
        sw = source.width / 5,
        sh = rows[row + 1] - rows[row];
      const hipSX = sw * 0.5,
        hipSY = sh * (attack ? (id ? 0.54 : 0.63) : id ? 0.53 : 0.57),
        scale = 78 / hipSY;
      const torsoWidth = attack && !id ? sw * 0.8 : sw;
      c.drawImage(
        source,
        (f % 5) * sw,
        rows[row],
        torsoWidth,
        hipSY + 3,
        anchor.x - hipSX * scale,
        hipY - 78,
        torsoWidth * scale,
        (hipSY + 3) * scale,
      );
      if (attack && !id) {
        c.save();
        c.translate(anchor.x + 37, hipY - 41);
        if (frame >= 1) c.drawImage(bow, 26, -67, 43, 119);
        if (frame >= 3 && frame <= 6) {
          c.strokeStyle = "#cefaff";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(52, -60);
          c.lineTo(4 - (frame - 3) * 5, -12);
          c.lineTo(52, 48);
          c.stroke();
        }
        c.restore();
      }
      if (attack) {
        c.putImageData(c.getImageData(frame * W, H, W, H), frame * W, H * 2);
        const layer = document.createElement("canvas");
        layer.width = W;
        layer.height = H;
        layer.getContext("2d").putImageData(lower, 0, 0);
        c.save();
        c.globalCompositeOperation = "destination-over";
        c.drawImage(layer, 0, 0);
        c.restore();
      }
      cells.push({
        action: attack ? "weapon" : "run",
        frame,
        legSource: legFrame,
        lead: legFrame === "left" ? "left" : "right",
        contact: frame === 0 || frame === 5,
      });
      c.restore();
    }
  return {
    png: canvas.toDataURL("image/png"),
    manifest: {
      width: W,
      height: H,
      columns: 10,
      rows: 4,
      layers: { weaponUpper: 2, gaitLower: 3 },
      anchor,
      frames: cells,
      weaponDuration: 0.8,
      releaseFrame: 7,
      sourceNote:
        "Registered illustrated torso frames and painted lower-body poses. Explicit opposite-leg contact image. Some intermediate leg poses are reused, all full weapon frames are separately composed.",
    },
  };
}

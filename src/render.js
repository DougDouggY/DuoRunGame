import { CONFIG, CHARACTER_ASSETS, OBSTACLES, SPRITES } from "./config.js";
export class Renderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.assets = assets;
    this.w = 1440;
    this.h = 810;
    this.rain = Array.from({ length: 110 }, (_, i) => ({
      x: (i * 173) % 1440,
      y: (i * 137) % 810,
      s: 70 + (i % 70),
    }));
  }
  resize() {
    const portrait = innerWidth < 700;
    this.w = portrait ? 850 : 1440;
    this.h = portrait ? 1133 : 810;
    this.canvas.width = this.w;
    this.canvas.height = this.h;
  }
  floor(l) {
    return this.h * (l === 0 ? 0.48 : 0.88);
  }
  glow(color, blur = 12) {
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = blur;
  }
  text(s, x, y, size = 14, color = "#dceaff", align = "left") {
    const c = this.ctx;
    c.font = `${size >= 20 ? "800" : "600"} ${size}px "Segoe UI",sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.fillText(s, x, y);
    c.textAlign = "left";
  }
  draw(g) {
    const c = this.ctx,
      w = this.w,
      h = this.h,
      t = g.time,
      scroll = t * g.speed;
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#060c20";
    c.fillRect(0, 0, w, h);
    // Independently scrolling illustrated skyline layers, behind both routes.
    for (let lane = 0; lane < 2; lane++) {
      const floor = this.floor(lane),
        top = lane ? this.floor(0) + 28 : 0;
      c.save();
      c.beginPath();
      c.rect(0, top, w, floor - top);
      c.clip();
      const img = this.assets.city;
      if (img) {
        const ih = floor - top + 70,
          iw = (ih * img.width) / img.height;
        for (let x = (-(scroll * 0.17) % iw) - iw; x < w; x += iw)
          c.drawImage(img, x, top - 35, iw, ih);
      } else {
        for (let i = 0; i < 35; i++) {
          let x =
            (((i * 67 - scroll * 0.18) % (w + 100)) + w + 100) % (w + 100);
          c.fillStyle = i % 2 ? "#101335" : "#101b38";
          c.fillRect(x, floor - 80 - (i % 6) * 35, 55, 280);
          for (let j = 0; j < 7; j++) {
            c.fillStyle = j % 2 ? "#22749d" : "#8b267c";
            c.fillRect(x + 12, floor - 70 - (i % 6) * 35 + j * 23, 5, 9);
          }
        }
      }
      let grad = c.createLinearGradient(0, top, 0, floor);
      grad.addColorStop(0, "#03091b66");
      grad.addColorStop(0.65, "#030b1a00");
      grad.addColorStop(1, "#080a2344");
      c.fillStyle = grad;
      c.fillRect(0, top, w, floor - top);
      // Parallax near buildings and illuminated advertising.
      for (let i = 0; i < 8; i++) {
        const x =
          ((((i * 293 - scroll * 0.42) % (w + 350)) + w + 350) % (w + 350)) -
          120;
        if (i % 2 === 0) {
          c.fillStyle = "#070d20cc";
          c.fillRect(x, top + 60, 53, floor - top);
          c.strokeStyle = "#244a6e";
          c.strokeRect(x, top + 60, 53, floor - top);
          this.glow(i % 3 ? "#f32ec8" : "#32dfff", 14);
          c.fillStyle = i % 3 ? "#c42b9d" : "#208cc4";
          c.fillRect(x + 12, top + 92, 23, 94);
          this.text(
            ["夜", "夢", "光", "雨"][i % 4],
            x + 23,
            top + 125,
            20,
            "#fbceff",
            "center",
          );
          this.text("24H", x + 24, top + 161, 10, "#f8e9ff", "center");
          c.shadowBlur = 0;
        }
      }
      c.restore();
      this.ground(floor, scroll, lane);
    }
    const scale = w / 1440;
    c.save();
    c.scale(scale, 1); // Same collision coordinate system in portrait; only horizontal geometry adapts.
    for (const o of g.objects) this.obstacle(o, g);
    for (const p of g.players) {
      let y = this.floor(p.lane) - p.y;
      if (g.switching) {
        const f = 1 - g.switching / CONFIG.switchDuration;
        const ease = f * f * (3 - 2 * f);
        y =
          this.floor(g.from[p.id]) +
          (this.floor(p.lane) - this.floor(g.from[p.id])) * ease -
          p.y;
        this.glow("#70eaff", 30);
        c.strokeStyle = p.id ? "#43dfff" : "#fd42cd";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(CONFIG.playerX - 90, this.floor(g.from[p.id]) - 55);
        c.quadraticCurveTo(
          CONFIG.playerX + 120,
          (this.floor(0) + this.floor(1)) / 2,
          CONFIG.playerX,
          y - 55,
        );
        c.stroke();
        c.shadowBlur = 0;
      }
      this.character(p, CONFIG.playerX, y, t);
    }
    c.restore();
    c.save();
    c.strokeStyle = "#81beed44";
    c.lineWidth = 1;
    for (const r of this.rain) {
      let x = (r.x - t * 80) % w;
      if (x < 0) x += w;
      let y = (r.y + t * r.s * 2) % h;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 7, y + 21);
      c.stroke();
    }
    c.restore();
    this.hud(g);
    if (g.messageTime > 0) {
      const yy = this.floor(0) + 37;
      c.fillStyle = "#071123df";
      c.fillRect(w * 0.18, yy - 20, w * 0.64, 30);
      this.text(g.message, w / 2, yy, w < 1000 ? 12 : 14, "#cbe8ff", "center");
    }
    if (g.status === "paused") {
      c.fillStyle = "#020615aa";
      c.fillRect(0, 0, w, h);
      this.text("SIGNAL EN PAUSE", w / 2, h / 2, 34, "#fff", "center");
    }
  }
  ground(y, scroll, lane) {
    const c = this.ctx,
      w = this.w,
      img = this.assets.ground;
    c.fillStyle = "#10172a";
    c.fillRect(0, y, w, 32);
    if (img) {
      const iw = 520;
      for (let x = -(scroll % iw) - iw; x < w; x += iw)
        c.drawImage(img, x, y - 5, iw, 45);
    }
    this.glow(lane ? "#26dfff" : "#f235ce", 8);
    c.fillStyle = lane ? "#2ac6e7" : "#dc3aac";
    c.fillRect(0, y, w, 2);
    c.shadowBlur = 0;
    c.fillStyle = "#040917";
    c.fillRect(0, y + 28, w, 10);
    for (let i = 0; i < 22; i++) {
      let x = (((i * 91 - scroll) % (w + 100)) + w + 100) % (w + 100);
      c.fillStyle = i % 2 ? "#227482" : "#913271";
      c.fillRect(x, y + 5, 35 + (i % 4) * 9, 2);
      c.strokeStyle = "#294158";
      c.beginPath();
      c.moveTo(x, y + 22);
      c.lineTo(x + 30, y + 40);
      c.stroke();
    }
  }
  character(p, x, y, t) {
    const c = this.ctx,
      col = CHARACTER_ASSETS[p.id].color;
    c.save();
    if (p.inv > 0 && Math.floor(t * 15) % 2) c.globalAlpha = 0.45;
    if (p.hp <= 0) c.globalAlpha = 0.5;
    const state = p.pose;
    let bounce = state === "run" ? Math.sin(t * 17) * 3 : 0;
    c.translate(x, y + bounce);
    c.scale(1 / (this.w / 1440), 1);
    if (p.shield) {
      this.glow("#39dcff", 18);
      c.strokeStyle = "#4feeff";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, -59, 56, 76, 0, 0, Math.PI * 2);
      c.stroke();
      c.shadowBlur = 0;
    }
    if (p.power || state === "switch") {
      this.glow(p.id ? "#ff3ada" : "#38bfff", 22);
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = p.id ? "#fa58dc" : "#63eaff";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-90 - i * 12, -20 - i * 13);
        c.lineTo(45 + i * 8, -26 - i * 13);
        c.lineTo(20 + i * 8, -36 - i * 13);
        c.stroke();
      }
      c.shadowBlur = 0;
    }
    const img = p.id === 0 ? this.assets.neonActions : this.assets.actions;
    if (img) {
      const choices = SPRITES.frames[state] || SPRITES.frames.run;
      const frame = choices[Math.floor(t * 10) % choices.length] + (p.id === 0 ? 0 : 10);
      const col = frame % SPRITES.columns, row = Math.floor(frame / SPRITES.columns);
      const grid = p.id === 0 ? SPRITES.neonGrid : null;
      const sx = grid ? grid.x[col] : col * img.width / SPRITES.columns;
      const sy = grid ? grid.y[row] : row * img.height / SPRITES.rows;
      const sw = grid ? grid.x[col + 1] - sx : img.width / SPRITES.columns;
      const sh = grid ? grid.y[row + 1] - sy : img.height / SPRITES.rows;
      const inset = grid ? grid.inset : 0;
      const dh = this.w < 1000 ? 112 : 140, dw = (sw / sh) * dh;
      this.glow(p.id ? "#30c5ff" : "#326aff", 5);
      c.drawImage(img, sx + inset, sy + inset, sw - inset * 2, sh - inset * 2, -dw * 0.5, -dh, dw, dh);
      c.shadowBlur = 0;
    } else {
      this.text("ASSET EN CHARGEMENT", 0, -60, 10, col);
    }
    if (p.power) {
      c.strokeStyle = p.id ? "#ff61db" : "#61eaff";
      this.glow(c.strokeStyle, 25);
      c.lineWidth = 3;
      c.beginPath();
      c.arc(30, -65, 50, -1.4, 1.3);
      c.stroke();
      c.shadowBlur = 0;
    }
    c.restore();
  }
  obstacle(o, g) {
    if (o.hit) return;
    const c = this.ctx,
      y = this.floor(o.lane),
      d = OBSTACLES[o.type];
    c.save();
    c.translate(o.x, y);
    if (!d) {
      const col = {
        note: "#ffd75d",
        heart: "#ff54bb",
        shield: "#46dfff",
        energy: "#bafa69",
      }[o.type];
      const yy = -(o.y || 45) + Math.sin(g.time * 3 + o.x) * 5;
      this.glow(col, 18);
      c.fillStyle = "#0e1830";
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, yy, 17, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      this.text(
        { note: "♪", heart: "♥", shield: "◇", energy: "ϟ" }[o.type],
        0,
        yy + 8,
        25,
        col,
        "center",
      );
      c.restore();
      return;
    }
    if (o.type === "crate" || o.type === "armored") {
      let armored = o.type === "armored";
      c.fillStyle = armored ? "#21243c" : "#3c2931";
      c.fillRect(0, -d.h, d.w, d.h);
      c.strokeStyle = armored ? "#f447c7" : "#986c6d";
      c.lineWidth = 3;
      c.strokeRect(0, -d.h, d.w, d.h);
      c.strokeStyle = armored ? "#725379" : "#78504b";
      for (let i = 8; i < d.w; i += 13) {
        c.beginPath();
        c.moveTo(i, -d.h);
        c.lineTo(i, 0);
        c.stroke();
      }
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(4, -5);
      c.lineTo(d.w - 4, -d.h + 5);
      c.stroke();
      if (armored) {
        this.glow("#ff3ed5", 12);
        this.text("✕", d.w / 2, -d.h / 2 + 9, 26, "#ff5ed8", "center");
        c.shadowBlur = 0;
        this.text("SWONNI", d.w / 2, -d.h - 12, 11, "#ff70db", "center");
      }
    } else if (o.type === "spikes") {
      for (let i = 0; i < d.w; i += 22) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i + 10, -d.h);
        c.lineTo(i + 20, 0);
        c.fillStyle = "#942a65";
        c.fill();
        this.glow("#ff3e91", 9);
        c.strokeStyle = "#ff7fbc";
        c.stroke();
        c.shadowBlur = 0;
      }
    } else if (o.type === "gap") {
      c.fillStyle = "#02030b";
      c.fillRect(0, -3, d.w, 32);
      c.strokeStyle = "#58b4e0";
      c.strokeRect(0, -3, d.w, 32);
      this.text("▼", d.w / 2, 20, 18, "#fa55bc", "center");
    } else if (o.type === "electric") {
      this.glow("#26bfff", 18);
      c.fillStyle = "#08578166";
      c.fillRect(0, -d.h, d.w, d.h);
      c.strokeStyle = "#50eaff";
      c.lineWidth = 3;
      c.strokeRect(0, -d.h, d.w, d.h);
      for (let j = 0; j < 3; j++) {
        c.beginPath();
        c.moveTo(10 + j * 12, -d.h);
        for (let i = 0; i < 8; i++)
          c.lineTo(
            8 + j * 12 + Math.sin(i * 4 + g.time * 25) * 10,
            -d.h + i * 16,
          );
        c.stroke();
      }
      this.text("NÉON IV", d.w / 2, -d.h - 12, 11, "#78edff", "center");
    } else {
      c.fillStyle = "#17293b";
      c.fillRect(0, -d.h, 7, d.h);
      c.fillRect(d.w - 7, -d.h, 7, d.h);
      if (o.type === "laser") {
        this.glow("#ff47a6", 13);
        c.strokeStyle = "#ff4c9e";
        c.lineWidth = 4;
        for (let j = 0; j < 3; j++) {
          c.beginPath();
          c.moveTo(0, -d.h + j * 14);
          c.lineTo(d.w, -d.h + j * 14);
          c.stroke();
        }
      } else {
        c.fillStyle = "#ac8135";
        c.fillRect(0, -d.h, d.w, 34);
        c.fillStyle = "#141c2c";
        for (let j = 0; j < d.w; j += 22) {
          c.beginPath();
          c.moveTo(j, -d.h);
          c.lineTo(j + 13, -d.h);
          c.lineTo(j - 4, -d.h + 34);
          c.lineTo(j - 17, -d.h + 34);
          c.fill();
        }
      }
      this.text("↓", d.w / 2, -d.h - 12, 22, "#ffe28d", "center");
    }
    c.restore();
  }
  hud(g) {
    const c = this.ctx,
      ui = this.w < 1000 ? 1.2 : 1,
      w = this.w / ui;
    c.save();
    c.scale(ui, ui);
    for (const p of g.players) {
      let y = p.lane ? (this.floor(0) + 58) / ui : 25;
      let col = CHARACTER_ASSETS[p.id].color;
      c.fillStyle = "#060e20df";
      c.fillRect(16, y, 214, 78);
      c.strokeStyle = col;
      c.lineWidth = 1;
      c.strokeRect(16, y, 214, 78);
      const img = this.assets[p.id ? "swonni" : "neon"];
      if (img) {
        c.save();
        c.beginPath();
        c.rect(20, y + 5, 47, 65);
        c.clip();
        c.drawImage(
          img,
          img.width * 0.55,
          0,
          img.width * 0.43,
          img.height * 0.43,
          20,
          y + 3,
          48,
          70,
        );
        c.restore();
      }
      this.text(CHARACTER_ASSETS[p.id].name, 78, y + 23, 16, col);
      this.text("♥".repeat(p.hp) + "♡".repeat(3 - p.hp), 78, y + 47, 21, col);
      c.fillStyle = "#26314a";
      c.fillRect(79, y + 58, 133, 4);
      this.glow(col, 5);
      c.fillStyle = col;
      c.fillRect(79, y + 58, 133 * (1 - p.energy / CONFIG.cooldown), 4);
      c.shadowBlur = 0;
      this.text(
        p.energy ? `${p.energy.toFixed(1)}s` : "POUVOIR PRÊT",
        210,
        y + 73,
        9,
        "#94a7c3",
        "right",
      );
      if (g.time - p.request < 1.4)
        this.text(
          `SWITCH 1/2 · ${(1.4 - g.time + p.request).toFixed(1)}s`,
          w / 2,
          y + 25,
          16,
          col,
          "center",
        );
    }
    c.fillStyle = "#060c1cdd";
    c.fillRect(w / 2 - 96, 16, 192, 63);
    c.strokeStyle = "#394f70";
    c.strokeRect(w / 2 - 96, 16, 192, 63);
    this.text(
      `${Math.floor(g.distance)} m`,
      w / 2,
      44,
      25,
      "#eff5ff",
      "center",
    );
    this.text(
      `♪ ${g.score.toString().padStart(5, "0")}`,
      w / 2,
      66,
      14,
      "#ffdb79",
      "center",
    );
    this.text(
      `${{ 135: "DÉCOUVERTE", 165: "LENTE", 215: "MOYENNE", 280: "RAPIDE", 360: "CAUCHEMARDESQUE" }[g.speed]} / NIGHT DISTRICT`,
      w - 20,
      32,
      10,
      "#a1bbd4",
      "right",
    );
    this.text("E + ENTRÉE  ⇄", w - 20, 55, 13, "#6addfa", "right");
    c.restore();
  }
}

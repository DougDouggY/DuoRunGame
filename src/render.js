import {ambientMotion} from "./motion.js?v=4.3.0";
import { ANIMATION, animationFrames } from "./animation.js?v=4.3.0";
import {
  CONFIG,
  CHARACTER_ASSETS,
  OBSTACLES,
  SPRITES,
  SPEEDS,
  RUN_SPRITES,
  WEAPON,
  DRONE,
  CEILING_SWITCH,
  DASH,
} from "./config.js?v=4.3.0";
export class Renderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.assets = assets;
    this.w = 1440;
    this.h = 810;
    this.poseBuffers=Array.from({length:2},()=>{const canvas=document.createElement('canvas');canvas.width=ANIMATION.width;canvas.height=ANIMATION.height;return canvas;});
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
      scroll = g.scroll;
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
    this.mechanismLinks(g);
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
      this.character(p, CONFIG.playerX, y, t, g.speed);
    }
    this.combatFX(g);
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
    this.switchHUD(g);
    if (g.messageTime > 0) {
      const yy = this.h - 28;
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
  character(p, x, y, t, speed = 100) {
    const c = this.ctx,
      col = CHARACTER_ASSETS[p.id].color;
    c.save();
    if (p.inv > 0 && Math.floor(t * 15) % 2) c.globalAlpha = 0.45;
    if (p.hp <= 0) c.globalAlpha = 0.5;
    const state = p.pose;
    c.translate(x, y);
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
    if ((p.power && p.id) || state === "switch") {
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
    const compiled =
      ["run", "weapon", "power"].includes(state) &&
      this.assets[p.id ? "indaRun" : "neonRun"];
    const running = state === "run" && this.assets.run;
    if (compiled) {
      const f = animationFrames(p, t, speed),
        scale = this.w < 1000 ? 0.8 : 1;
      const { width: sw, height: sh, anchor: A } = ANIMATION;
      this.glow(p.id ? "#38dbff" : "#4c74ff", p.power ? 14 : 3);
      const draw = (img, frame, row = 0) => {
        if (img)
          c.drawImage(
            img,
            frame * sw,
            row * sh,
            sw,
            sh,
            -A.x * scale,
            -A.y * scale,
            sw * scale,
            sh * scale,
          );
      };
      const drawGait = (row = 0) => {
        if (f.gaitMix <= .001) { draw(compiled, f.gait, row); return; }
        const buffer = this.poseBuffers[p.id], bc = buffer.getContext('2d');
        bc.clearRect(0, 0, sw, sh);
        bc.globalCompositeOperation = 'source-over';
        bc.globalAlpha = 1 - f.gaitMix;
        bc.drawImage(compiled, f.gait * sw, row * sh, sw, sh, 0, 0, sw, sh);
        // Add weighted images in an isolated buffer to preserve opacity.
        bc.globalCompositeOperation = 'lighter';
        bc.globalAlpha = f.gaitMix;
        bc.drawImage(compiled, f.nextGait * sw, row * sh, sw, sh, 0, 0, sw, sh);
        bc.globalAlpha = 1;
        bc.globalCompositeOperation = 'source-over';
        c.drawImage(buffer, -A.x * scale, -A.y * scale, sw * scale, sh * scale);
      };
      if (p.weapon) {
        drawGait(1);
        draw(this.assets[p.id ? "indaSword" : "neonBow"], f.weapon);
      } else if (p.id && p.power) {
        drawGait(1);
        draw(this.assets.indaShield, f.shield);
      } else if (!p.id && p.power && this.assets.neonDash) {
        const age=Math.max(0,DASH.duration-p.power), frame=Math.min(DASH.frames-1,Math.floor(age/DASH.duration*DASH.frames));
        // Ghosts stay behind the opaque actor; no random offset or camera jitter.
        for(let i=3;i>0;i--){c.save();c.translate(-i*19*scale,0);c.globalAlpha*=.09*(4-i);c.globalCompositeOperation='screen';draw(this.assets.neonDash,Math.max(0,frame-i));c.restore();}
        draw(this.assets.neonDash,frame);
        c.save();c.globalCompositeOperation='screen';c.strokeStyle='#a4efff';c.lineWidth=1.5;this.glow('#4c8eff',16);
        for(let j=0;j<3;j++){c.beginPath();for(let k=0;k<9;k++){const px=-80+k*17,py=-45-j*35+Math.sin(age*22+k*1.7+j)*6;if(!k)c.moveTo(px,py);else c.lineTo(px,py);}c.stroke();}c.restore();
      } else drawGait();
      c.globalCompositeOperation = "source-over";
      c.shadowBlur = 0;
    }

    const img = running
      ? this.assets.run
      : p.id === 0
        ? this.assets.neonActions
        : this.assets.actions;
    if (img && !compiled) {
      let sx,
        sy,
        sw,
        sh,
        inset = 0;
      if (running) {
        const frames = RUN_SPRITES.frames[p.id];
        const f =
            frames[Math.floor(t * 18 * Math.sqrt(speed / 100)) % frames.length],
          row = Math.floor(f / 6);
        sw = img.width / 6;
        sx = (f % 6) * sw;
        sy = RUN_SPRITES.y[row];
        sh = RUN_SPRITES.y[row + 1] - sy;
      } else {
        const choices = SPRITES.frames[state] || SPRITES.frames.run;
        const frame =
          choices[Math.min(choices.length - 1, Math.floor(p.poseTime * 12))] +
          (p.id === 0 ? 0 : 10);
        const col = frame % 5,
          row = Math.floor(frame / 5),
          grid = p.id === 0 ? SPRITES.neonGrid : null;
        sx = grid ? grid.x[col] : (col * img.width) / 5;
        sy = grid ? grid.y[row] : (row * img.height) / 4;
        sw = grid ? grid.x[col + 1] - sx : img.width / 5;
        sh = grid ? grid.y[row + 1] - sy : img.height / 4;
        inset = grid ? grid.inset : 0;
      }
      const dh = this.w < 1000 ? 112 : 140,
        dw = (sw / sh) * dh;
      this.glow(p.id ? "#30c5ff" : "#326aff", p.power ? 20 : 5);
      if (state === "damage") c.translate(-Math.sin(p.poseTime * 14) * 9, 0);
      if (state === "ko") c.rotate(-Math.min(0.25, p.poseTime * 0.5));
      if (p.power && p.id === 0) {
        c.globalAlpha *= 0.65;
        c.globalCompositeOperation = "screen";
      }
      c.drawImage(
        img,
        sx + inset,
        sy + inset,
        sw - inset * 2,
        sh - inset * 2,
        -dw * 0.5,
        -dh,
        dw,
        dh,
      );
      c.globalCompositeOperation = "source-over";
      c.shadowBlur = 0;
    } else if (!compiled) {
      this.text("ASSET EN CHARGEMENT", 0, -60, 10, col);
    }
    if (p.power && p.id) {
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
    if (o.type === "plant" || o.type === "giant") {
      this.monster(o, g);
      return;
    }
    if (
      ["crate", "door", "target", "drone", "armored", "vine"].includes(o.type)
    ) {
      this.newObstacle(o, g);
      return;
    }
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
      const yy=-(o.y||45)+ambientMotion(o,g.time).pickupBob;
      this.glow(col, 18);
      c.fillStyle = "#0e1830";
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, yy, 21, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      this.text(
        { note: "♪", heart: "♥", shield: "◇", energy: "ϟ" }[o.type],
        0,
        yy + 8,
        29,
        col,
        "center",
      );
      c.restore();
      return;
    }
    const tile = {
      crate: 0,
      armored: 1,
      electric: 2,
      barrier: 3,
      spikes: 4,
      drone: 5,
      target: 6,
      laser: 7,
    }[o.type];
    if (tile !== undefined && this.assets.industrial) {
      const img = this.assets.industrial,
        sw = img.width / 4,
        sh = img.height / 2;
      const width = Math.max(d.w, o.type === "electric" ? 66 : d.w + 12);
      const lift = o.type === "drone" ? 22 : 0;
      this.glow(
        o.type === "armored" ? "#ef43cb" : "#39bbff",
        o.type === "electric" ? 18 : 5,
      );
      c.drawImage(
        img,
        (tile % 4) * sw,
        Math.floor(tile / 4) * sh,
        sw,
        sh,
        -6,
        -d.h - lift,
        width,
        d.h,
      );
      c.shadowBlur = 0;
      if (o.type === "electric") {
        c.strokeStyle = "#9ef6ff";
        c.lineWidth = 2;
        for (let j = 0; j < 3; j++) {
          c.beginPath();
          c.moveTo(8, -d.h + 20 + j * 27);
          for (let k = 1; k < 7; k++)
            c.lineTo(
              k * 7,
              -d.h + 20 + j * 27 + Math.sin(k * 5 + g.time * 30) * 8,
            );
          c.stroke();
        }
      }
      if (["electric", "armored", "plant", "drone", "target"].includes(o.type))
        this.text(
          {
            electric: "E · NÉON IV",
            armored: "E · INDAFRENCH",
            drone: "R · ARC",
            target: "R · INTERRUPTEUR",
          }[o.type],
          d.w / 2,
          -d.h - 14,
          11,
          o.type === "armored" ? "#ff72dd" : "#90eeff",
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
        this.text("INDAFRENCH", d.w / 2, -d.h - 12, 11, "#ff70db", "center");
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
      c.fillRect(16, y, 214, 96);
      c.strokeStyle = col;
      c.lineWidth = 1;
      c.strokeRect(16, y, 214, 96);
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
      c.fillStyle = "#26314a";
      c.fillRect(79, y + 80, 133, 3);
      c.fillStyle = "#f4b7ff";
      c.fillRect(79, y + 80, 133 * (1 - p.weaponCD / CONFIG.weaponCooldown), 3);
      this.text(
        `R · ${p.weaponCD ? p.weaponCD.toFixed(1) + "s" : p.id ? "ÉPÉE PRÊTE" : "ARC PRÊT"}`,
        210,
        y + 93,
        9,
        "#c7aada",
        "right",
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
      `${SPEEDS.find((s) => s.value === g.speed)?.name.toUpperCase()} / ${g.ai.every(Boolean) ? "DÉMO IA" : g.ai[1] ? "IA INDAFRENCH" : "COOP LOCALE"}`,
      w - 20,
      32,
      10,
      "#a1bbd4",
      "right",
    );
    this.text("ESPACE · SWITCH  ⇄", w - 20, 55, 13, "#6addfa", "right");
    c.restore();
  }
  newObstacle(o, g) {
    const c = this.ctx,
      floor = this.floor(o.lane),
      d = OBSTACLES[o.type];
    if (
      o.hit &&
      (!o.deathLife || o.deathLife <= 0) &&
      !["target", "door"].includes(o.type)
    )
      return;
    c.save();
    c.translate(o.x, floor);
    if (o.hit && !["target", "door"].includes(o.type))
      c.globalAlpha = Math.max(0, o.deathLife / 0.6);
    if (o.type === "crate") {
      const img = this.assets.crateBright;
      if (img) {
        this.glow("#ffbd45", 11);
        c.drawImage(img, -4, -d.h - 3, d.w + 8, d.h + 3);
        c.shadowBlur = 0;
      }
      c.strokeStyle = "#ffc34b";
      c.lineWidth = 2;
      c.strokeRect(-4, -d.h - 3, d.w + 8, d.h + 3);
      this.text("A / ↑ · SAUT", d.w / 2, -d.h - 13, 11, "#ffe1a0", "center");
    }
    if (o.type === "door") {
      const img = this.assets.door,
        retract = o.hit
          ? Math.min(1, Math.max(0, (g.time - o.deathAt) / 0.6))
          : 0;
      if (img) {
        const h = d.h,
          w = (h * img.width) / img.height,
          x = (d.w - w) / 2,
          y = -h;
        c.save();
        c.beginPath();
        c.rect(x, y, 12, h);
        c.rect(x + w - 12, y, 12, h);
        c.rect(x, y, w, 10);
        c.clip();
        c.drawImage(img, x, y, w, h);
        c.restore();
        c.save();
        c.beginPath();
        c.rect(x + 12, y + 10, w - 24, h - 14);
        c.clip();
        c.drawImage(img, x, y - retract * h, w, h);
        c.restore();
        this.glow(o.hit ? "#71ffbb" : "#ffbd60", 10);
        c.fillStyle = o.hit ? "#71ffbb" : "#ffbd60";
        c.fillRect(x + w - 10, -h + 35, 7, 15);
        c.shadowBlur = 0;
      }
      this.text(
        `${this.linkTag(o, g)} · ${o.hit ? "OUVERTE" : "PORTE VERROUILLÉE"}`,
        d.w / 2,
        -d.h - 14,
        11,
        o.hit ? "#81ffc2" : "#ffd798",
        "center",
      );
    }
    if (o.type === "target") {
      const img = this.assets[o.hit ? "ceilingSwitchOn" : "ceilingSwitch"];
      const h = CEILING_SWITCH.height,
        w = img ? (h * img.width) / img.height : 60;
      const y = -CEILING_SWITCH.top;
      this.glow(o.hit ? "#6cffaa" : "#50ddff", 15);
      if (img) c.drawImage(img, d.w / 2 - w / 2, y, w, h);
      c.shadowBlur = 0;
      c.strokeStyle = "#293c5c";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-30, y);
      c.lineTo(85, y);
      c.stroke();
      this.text(
        o.hit ? "ACTIVÉ" : "R · INTERRUPTEUR",
        d.w / 2,
        y - 10,
        11,
        o.hit ? "#8affb5" : "#a4eeff",
        "center",
      );
      this.text(
        this.linkTag(o, g),
        d.w / 2,
        y + 102,
        12,
        o.hit ? "#88ffb7" : "#ffd08c",
        "center",
      );
    }
    if (o.type === "drone") {
      const img = this.assets[o.hit ? "laserDroneDead" : "laserDrone"];
      if (img) {
        const w = DRONE.width,
          h = (w * img.height) / img.width;
        this.glow(o.hit ? "#ff914f" : "#ff4269", 12);
        c.drawImage(
          img,
          d.w / 2 - w / 2,
          -DRONE.bodyY + ambientMotion(o,g.time).droneBob,
          w,
          h,
        );
        c.shadowBlur = 0;
      }
      if (!o.hit) {
        const x = d.w / 2,
          y = -DRONE.beamY + ambientMotion(o,g.time).droneBob;
        this.glow("#ff235c", 19);
        c.fillStyle = "#ff425c";
        c.beginPath();
        c.arc(x, y, 6, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ef245d39";
        c.fillRect(0, y, d.w, -y);
        c.strokeStyle = "#ff667e";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, 0);
        c.stroke();
        c.strokeStyle = "#ffbdd1";
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = "#ff688e";
        c.fillRect(4, -2, d.w - 8, 3);
        c.shadowBlur = 0;
        this.text("R · ARC — DRONE", x + 85, -DRONE.aimY + 5, 11, "#a4deff");
      }
    }
    if (o.type === "armored") {
      const img = this.assets[o.hit ? "armoredBroken" : "armoredDetailed"];
      if (img) {
        this.glow(o.hit ? "#ffbb64" : "#f54ac6", 9);
        c.drawImage(img,-10,-d.h-6,d.w+20,d.h+6);
        c.shadowBlur = 0;
      }
      this.text(
        "E · BOUCLIER · BRISER",
        d.w / 2,
        -d.h-20,
        11,
        "#ffb3e9",
        "center",
      );
    }
    if (o.type === "vine") {
      const img = this.assets.organic;
      if (img) {
        if (!o.hit) c.drawImage(img,-16,-d.h-14,d.w+32,d.h+14);
        else {
          const k = Math.min(1, (g.time - o.deathAt) / 0.6);
          c.drawImage(
            img,
            0,
            img.height * 0.65,
            img.width,
            img.height * 0.35,
            -16,
            -(d.h+14)*.35,
            d.w+32,
            (d.h+14)*.35,
          );
          c.save();
          c.translate(d.w/2, -(d.h+14)*.35 + k*k*85);
          c.rotate(k * 0.8);
          c.drawImage(
            img,
            0,
            0,
            img.width,
            img.height * 0.65,
            -(d.w+32)/2,
            -(d.h+14)*.65,
            d.w+32,
            (d.h+14)*.65,
          );
          c.restore();
        }
      }
      this.text("R · ÉPÉE · TRANCHER", d.w / 2, -d.h-28, 11, "#ffa2e0", "center");
    }
    c.restore();
  }
  linkTag(o, g) {
    const target =
      o.type === "target"
        ? o
        : g.objects.find((n) => n.type === "target" && n.links?.includes(o.id));
    return target ? "C" + target.id : "PORTE";
  }
  mechanismLinks(g) {
    const c = this.ctx;
    for (const sensor of g.objects.filter(
      (o) => o.type === "target" && o.links,
    )) {
      for (const id of sensor.links) {
        const door = g.objects.find((o) => o.id === id);
        if (!door) continue;
        const sx = sensor.x + OBSTACLES.target.w/2,
          sy = this.floor(sensor.lane) - CEILING_SWITCH.top,
          dx = door.x + OBSTACLES.door.w - 8,
          dy = this.floor(door.lane) - OBSTACLES.door.h + 8,
          ceiling = Math.min(sy - 16, dy - 22),
          on = sensor.hit;
        const path = () => {
          c.beginPath();
          c.moveTo(sx, sy + 12);
          c.lineTo(sx, ceiling);
          c.lineTo(dx, ceiling);
          c.lineTo(dx, dy);
        };
        c.save();
        c.lineJoin = "round";
        c.lineCap = "round";
        path();
        c.strokeStyle = "#020611";
        c.lineWidth = 12;
        c.stroke();
        path();
        c.strokeStyle = "#48536a";
        c.lineWidth = 8;
        c.stroke();
        path();
        this.glow(on ? "#67ffc1" : "#dca458", on ? 12 : 3);
        c.strokeStyle = on ? "#67ffc1" : "#dca458";
        c.lineWidth = 2;
        c.stroke();
        c.shadowBlur = 0;
        for (const x of [sx, dx]) {
          c.fillStyle = "#263b53";
          c.fillRect(x - 6, ceiling - 6, 12, 12);
          c.strokeStyle = "#94a6bd";
          c.strokeRect(x - 6, ceiling - 6, 12, 12);
        }
        const pulse = (g.time * 140) % Math.max(1, dx - sx);
        c.fillStyle = on ? "#e8fff5" : "#ffe2a6";
        c.fillRect(sx + pulse - 6, ceiling - 2, 12, 4);
        this.text(
          this.linkTag(sensor, g),
          (sx + dx) / 2,
          ceiling - 8,
          10,
          on ? "#97ffd3" : "#ffcf8d",
          "center",
        );
        c.restore();
      }
    }
  }
  monster(o, g) {
    if (o.hit && !o.deathLife) return;
    const c = this.ctx,
      img = this.assets.maw;
    if (!img) return;
    const dx = o.x - CONFIG.playerX;
    let frame;
    if (o.hit) frame = 6 + Math.min(3, Math.floor((0.6 - o.deathLife) / 0.15));
    else if (o.type === "giant") frame = o.protected ? 10 : 11;
    else if (dx < 30 && dx > -70) frame = 5;
    else if (dx / g.speed < 0.8 && dx > 0)
      frame = [2, 3, 4][Math.min(2, Math.floor((0.8 - dx / g.speed) / 0.27))];
    else frame = Math.floor(g.time * 2) % 2;
    const sw = img.width / 4,
      sh = img.height / 3;
    const giant = o.type === "giant",
      dh = giant ? this.floor(1) - this.floor(0) + 165 : 174,
      dw = giant ? dh : 174,
      y = this.floor(giant ? 1 : o.lane);
    c.save();
    if (o.hit) c.globalAlpha = Math.max(0, o.deathLife / 0.6);
    this.glow(o.protected ? "#4dbdff" : "#dd48c5", 10);
    c.drawImage(
      img,
      (frame % 4) * sw,
      Math.floor(frame / 4) * sh,
      sw,
      sh,
      o.x - 28,
      y - dh,
      dw,
      dh,
    );
    c.shadowBlur = 0;
    this.text(
      giant
        ? o.protected
          ? "R · ARC → PROTECTION"
          : "R · ÉPÉE → MÂCHOIRE"
        : "R · ÉPÉE",
      o.x + dw / 2 - 28,
      y - dh - 10,
      12,
      o.protected ? "#80dcff" : "#ff97df",
      "center",
    );
    c.restore();
  }
  combatFX(g) {
    const c = this.ctx;
    for (const a of g.projectiles) {
      const base = this.floor(a.fromLane ?? a.lane),
        destination = this.floor(a.toLane ?? a.lane),
        y = base + (destination - base) * (a.progress || 0) - (a.y ?? 75);
      c.save();
      c.translate(a.x, y);
      if (a.target)
        c.rotate(
          Math.atan2(
            destination - base - (a.targetHeight ?? 75) + (a.fromY ?? 75),
            Math.max(1, (a.targetX ?? a.x) - a.originX),
          ),
        );
      const img = this.assets.arrow;
      if (img) {
        const w = 100,
          h = (w * img.height) / img.width;
        this.glow("#5abaff", 6);
        c.drawImage(img, -w, -h / 2, w, h);
        c.shadowBlur = 0;
      }
      c.strokeStyle = "#5caaff66";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-125, 0);
      c.lineTo(-82, 0);
      c.stroke();
      c.restore();
    }
    for (const fx of g.effects) {
      const k = 1 - fx.life / fx.max,
        y = this.floor(fx.lane < 0 ? 1 : fx.lane) - 45;
      const col = ["damage", "slash", "sword"].includes(fx.type)
        ? "#ff53c8"
        : "#55cfff";
      c.save();
      c.globalAlpha = 1 - k;
      this.glow(col, 12);
      if (["switch", "return"].includes(fx.type)) {
        const x = CONFIG.playerX;
        c.strokeStyle = fx.type === "return" ? "#ffffff" : "#fb62e4";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x, this.floor(0) - 100);
        for (let j = 1; j < 16; j++)
          c.lineTo(
            x + Math.sin(j * 14 + g.time * 35) * 32,
            this.floor(0) -
              100 +
              (j * (this.floor(1) - this.floor(0) + 100)) / 15,
          );
        c.stroke();
        for (let lane = 0; lane < 2; lane++) {
          c.beginPath();
          c.ellipse(
            x,
            this.floor(lane),
            30 + k * 110,
            8 + k * 10,
            0,
            0,
            Math.PI * 2,
          );
          c.stroke();
        }
      } else if (!["note", "jump", "request"].includes(fx.type)) {
        c.strokeStyle = col;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(fx.x + 20, y, 10 + k * 70, 0, Math.PI * 2);
        c.stroke();
        for (let i = 0; i < 13; i++) {
          const a = i * 2.4 + fx.seed;
          c.fillStyle = i % 2 ? col : "#d5f6ff";
          c.fillRect(
            fx.x + Math.cos(a) * k * 110,
            y + Math.sin(a) * k * 75 + k * k * 30,
            3 + (i % 3),
            2 + (i % 4),
          );
        }
      }
      c.restore();
    }
  }
  switchHUD(g) {
    const c = this.ctx,
      w = this.w,
      s = g.switchState;
    const flash = g.effects.find((f) => f.type === "return" && f.life > 0.64);
    if (flash) {
      c.fillStyle = `rgba(225,245,255,${(flash.life - 0.64) * 2.5})`;
      c.fillRect(0, 0, w, this.h);
    }
    let title = "",
      sub = "",
      color = "#80ddff";
    if (s.phase === "request") {
      title = "SWITCH !";
      sub = `CONFIRMEZ · ${Math.max(0, s.deadline - g.time).toFixed(1)} s · ${s.confirmed.map((v, i) => (i ? "INDAFRENCH" : "NÉON IV") + (v ? " ✓" : " …")).join(" / ")}`;
      color = "#ff6dd8";
    }
    if (s.phase === "active") {
      title = `RETOUR AUTOMATIQUE — ${Math.ceil(Math.max(0, s.endsAt - g.time))}`;
      sub = "PARCOURS INVERSÉS · CAPACITÉS INCHANGÉES";
    }
    if (s.phase === "cooldown") {
      title = `SWITCH · RECHARGE ${Math.max(0, s.cooldownUntil - g.time).toFixed(1)} s`;
      sub = "";
    }
    if (!title) return;
    const y = this.floor(0) + 24;
    c.save();
    c.fillStyle = "#050d20ef";
    c.fillRect(w * 0.12, y - 23, w * 0.76, 52);
    this.glow(color, 14);
    this.text(
      title,
      w / 2 + Math.sin(g.time * 40) * (s.phase === "request" ? 1 : 0),
      y,
      s.phase === "request" ? 32 : 20,
      color,
      "center",
    );
    c.shadowBlur = 0;
    this.text(sub, w / 2, y + 19, this.w < 1000 ? 10 : 12, "#d6e7f5", "center");
    c.restore();
  }
}

import { CONFIG, OBSTACLES, PATTERNS } from "./config.js";
export class Game {
  constructor() {
    this.reset();
  }
  reset() {
    this.players = [0, 1].map((id) => ({
      id,
      lane: id,
      y: 0,
      vy: 0,
      hp: 3,
      energy: 0,
      power: 0,
      slide: 0,
      inv: 0,
      shield: 0,
      pose: "run",
      land: 0,
      impulse: 0,
      request: -99,
    }));
    this.objects = [];
    this.distance = 0;
    this.score = 0;
    this.time = 0;
    this.next = 420;
    this.pattern = 0;
    this.switching = 0;
    this.from = [0, 1];
    this.message = "RESTEZ SUR LA MÊME FRÉQUENCE";
    this.messageTime = 4;
    this.status = "menu";
    this.speed = CONFIG.speed;
    this.events = [];
  }
  say(s) {
    this.message = s;
    this.messageTime = 2.5;
  }
  action(id, key) {
    if (this.status !== "running") return;
    const p = this.players[id];
    if (p.hp <= 0) return;
    if (key === "jump" && p.y === 0) {
      p.vy = CONFIG.jump * Math.max(1, this.speed / 135);
      p.slide = 0;
      p.pose = "impulse";
      p.impulse = 0.09;
      this.events.push("jump");
    }
    if (key === "slide" && p.y === 0) {
      p.slide = 1.15 / Math.max(1, this.speed / 135);
      p.pose = "slide";
    }
    if (key === "power" && p.energy <= 0) {
      p.power = 0.85;
      p.energy = CONFIG.cooldown;
      p.pose = "power";
      this.events.push("power");
    }
    if (key === "switch") {
      p.request = this.time;
      this.events.push("request");
      const other = this.players[1 - id];
      if (
        this.time - other.request <= CONFIG.switchWindow &&
        !this.switching &&
        other.hp > 0
      ) {
        this.from = this.players.map((p) => p.lane);
        this.players.forEach((p) => {
          p.lane = 1 - p.lane;
          p.request = -99;
          p.inv = Math.max(p.inv, 1);
          p.pose = "switch";
        });
        this.switching = CONFIG.switchDuration;
        this.events.push("switch");
        this.say("FRÉQUENCES SYNCHRONISÉES · SWITCH !");
      }
    }
  }
  spawn() {
    let pair = PATTERNS[this.pattern % PATTERNS.length];
    const index = this.pattern++;
    for (let lane = 0; lane < 2; lane++) {
      this.objects.push({ type: pair[lane], lane, x: 1460, hit: false });
      this.objects.push({ type: "note", lane, x: 1260, y: lane ? 65 : 90 });
      if (index % 3 === 1)
        this.objects.push({
          type: ["heart", "shield", "energy"][Math.floor(index / 3) % 3],
          lane,
          x: 1660,
          y: 45,
        });
    }
    if (pair.includes("electric") && index % 2 === 0)
      this.say(
        index % 3 === 2
          ? "INVERSION · PRÉPAREZ VOTRE SWITCH"
          : "MUR BLEU : NÉON IV / BLINDAGE ROSE : SWONNI",
      );
  }
  update(dt) {
    if (this.status !== "running") return;
    dt = Math.min(dt, 0.04);
    this.time += dt;
    this.distance += (this.speed * dt) / 20;
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.switching = Math.max(0, this.switching - dt);
    this.next -= this.speed * dt;
    if (this.next <= 0) {
      this.spawn();
      this.next = 570 * Math.max(1, this.speed / 165);
    }
    for (const p of this.players) {
      p.energy = Math.max(0, p.energy - dt);
      p.power = Math.max(0, p.power - dt);
      p.slide = Math.max(0, p.slide - dt);
      p.inv = Math.max(0, p.inv - dt);
      p.land = Math.max(0, p.land - dt);
      p.impulse = Math.max(0, p.impulse - dt);
      if (p.y > 0 || p.vy > 0) {
        p.y += p.vy * dt;
        p.vy -= CONFIG.gravity * Math.max(1, this.speed / 135) ** 2 * dt;
        if (p.y <= 0) {
          p.y = 0;
          p.vy = 0;
          p.land = 0.16;
        }
      }
      p.pose =
        p.hp <= 0
          ? "ko"
          : this.switching
            ? "switch"
            : p.inv > 1
              ? "damage"
              : p.power
                ? "power"
                : p.slide
                  ? "slide"
                  : p.impulse
                    ? "impulse"
                    : p.y > 0
                      ? p.vy > 0
                        ? "jump"
                        : "fall"
                      : p.land
                        ? "land"
                        : "run";
    }
    for (const o of this.objects) {
      o.x -= this.speed * dt;
      if (o.hit) continue;
      const p = this.players.find((p) => p.lane === o.lane);
      if (p.hp <= 0) continue;
      const d = OBSTACLES[o.type];
      if (!d) {
        if (
          Math.abs(o.x - CONFIG.playerX) < 37 &&
          Math.abs(p.y + 38 - (o.y || 45)) < 63
        ) {
          o.hit = true;
          if (o.type === "note") {
            this.score += 25;
            this.events.push("note");
          }
          if (o.type === "heart") p.hp = Math.min(3, p.hp + 1);
          if (o.type === "shield") p.shield = 1;
          if (o.type === "energy") p.energy = 0;
        }
        continue;
      }
      if (o.x < CONFIG.playerX + 12 && o.x + d.w > CONFIG.playerX - 12) {
        if (this.switching || p.inv > 0) continue;
        let safe = false;
        if (d.owner !== undefined) {
          safe = p.power > 0 && p.id === d.owner;
          if (safe) {
            o.hit = true;
            this.score += 100;
            this.say(
              p.id === 0
                ? "DASH SPECTRAL · MUR NEUTRALISÉ"
                : "FRAPPE GLITCH · BLINDAGE BRISÉ",
            );
            this.events.push("break");
          }
        } else if (d.action === "slide") safe = p.slide > 0 || p.y > d.h + 15;
        else safe = p.y > d.h + 5;
        if (!safe) {
          o.hit = true;
          if (p.shield) {
            p.shield = 0;
            this.say("BOUCLIER ABSORBÉ");
          } else {
            p.hp--;
            this.say(
              d.owner !== undefined
                ? "MAUVAISE FRÉQUENCE · SWITCH + POUVOIR !"
                : "IMPACT · GARDEZ LE RYTHME",
            );
          }
          p.inv = 1.8;
          this.events.push("damage");
        }
      }
    }
    this.objects = this.objects.filter((o) => o.x > -180);
    if (this.players.some((p) => p.hp <= 0)) {
      this.status = "over";
      this.say("SIGNAL PERDU");
    }
    if (this.distance >= CONFIG.length) {
      this.status = "win";
      this.say("DISTRICT TRAVERSÉ");
    }
  }
}

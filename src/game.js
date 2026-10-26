import {bowTiming, paceFactor, worldDistance} from "./pace.js?v=4.4.1";
import {
  CONFIG,
  OBSTACLES,
  SEQUENCES,
  WEAPON,
  DRONE,
  CEILING_SWITCH,
} from "./config.js?v=4.4.1";
import { buildLevel } from "./sequences.js?v=4.4.1";
import { driveAI } from "./ai.js?v=4.4.1";
const EPS = 1e-8;
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
      weapon: 0,
      weaponCD: 0,
      weaponAge: 0,
      weaponReleased: false,
      weaponTarget: null,
      slide: 0,
      inv: 0,
      shield: 0,
      pose: "run",
      land: 0,
      impulse: 0,
      damage: 0,
      poseTime: 0,
    }));
    this.time = 0;
    this.scroll = 0;
    this.distance = 0;
    this.score = 0;
    this.speed = CONFIG.speed;
    this.baseSpeed = null;
    this.status = "menu";
    this.events = [];
    this.effects = [];
    this.projectiles = [];
    this.objects = [];
    this.schedule = buildLevel();
    this.spawned = new Set();
    this.ai = [false, true];
    this.switchState = {
      phase: "idle",
      confirmed: [false, false],
      cooldownUntil: 0,
    };
    this.switching = 0;
    this.from = [0, 1];
    this.switchLog = [];
    this.stats = {
      impacts: 0,
      damage: 0,
      breaks: 0,
      arrows: 0,
      swords: 0,
      requests: 0,
    };
    this.message = "DUO RUSH · DEUX DESTINS, UNE FRÉQUENCE";
    this.messageTime = 4;
    this.sequenceIndex = -1;
  }
  say(s) {
    this.message = s;
    this.messageTime = 3;
  }
  emit(type, x = CONFIG.playerX, lane = 0) {
    this.events.push(type);
    this.effects.push({ type, x, lane, life: 0.7, max: 0.7, seed: this.time });
  }
  action(id, key) {
    if (this.status !== "running") return false;
    const p = this.players[id];
    if (!p || p.hp <= 0) return false;
    const r = 1;
    if (key === "switch") return this.requestSwitch(id);
    if (key === "jump" && p.y === 0) {
      p.vy = CONFIG.jump * r;
      p.slide = 0;
      p.impulse = 0.07;
      p.pose = "impulse";
      this.emit("jump", CONFIG.playerX, p.lane);
      return true;
    }
    if (key === "slide" && p.y === 0) {
      p.slide = 1.1;
      return true;
    }
    if (key === "power" && p.energy <= 0) {
      p.power = 0.8;
      p.energy = CONFIG.cooldown;
      p.slide = 0;
      this.emit(id === 0 ? "electric" : "shieldHit", CONFIG.playerX, p.lane);
      return true;
    }
    if (key === "weapon" && p.weaponCD <= 0) {
      if (id === 0) p.weaponTarget = this.findBowTarget(p)?.id ?? null;
      else this.stats.swords++;
      const timing = id === 0 ? bowTiming(this.speed) : WEAPON;
      p.weaponDuration = timing.duration;
      p.weaponRelease = timing.release;
      p.weapon = timing.duration;
      p.weaponReleased = false;
      p.weaponAge = 0;
      p.weaponCD = id === 0 ? timing.cooldown : CONFIG.weaponCooldown;
      p.weaponCooldownTotal = p.weaponCD;
      this.emit(id === 0 ? "draw" : "sword", CONFIG.playerX, p.lane);
      return true;
    }
    return false;
  }
  findBowTarget(p) {
    return this.objects
      .filter(
        (o) =>
          !o.hit &&
          o.x > CONFIG.playerX + 10 &&
          o.x < CONFIG.playerX + WEAPON.bowRange &&
          (o.type === "target" ||
            (o.type === "giant" && o.protected) ||
            (o.type === "drone" && o.lane === p.lane)),
      )
      .sort((a, b) => a.x - b.x)[0];
  }
  requestSwitch(id) {
    const s = this.switchState;
    if (s.phase === "cooldown" || s.phase === "active" || this.switching)
      return false;
    if (s.phase === "idle") {
      if (!this.returnCorridorSafe(this.time, 2)) {
        this.say("SWITCH EN ATTENTE · RETOUR NON SÉCURISÉ");
        return false;
      }
      this.switchState = {
        phase: "request",
        requestedAt: this.time,
        deadline: this.time + 2,
        confirmed: [id === 0, id === 1],
        requester: id,
      };
      this.stats.requests++;
      this.emit("request");
      return true;
    }
    if (
      s.phase === "request" &&
      this.time < s.deadline - EPS &&
      !s.confirmed[id]
    ) {
      s.confirmed[id] = true;
      this.activateSwitch();
      return true;
    }
    return false;
  }
  returnCorridorSafe(now, confirmationWindow = 0) {
    const lo = now + CONFIG.switchHold,
      hi = lo + confirmationWindow;
    return !this.schedule.some((o) => {
      const d = OBSTACLES[o.type];
      return (
        d &&
        !d.mechanism &&
        o.at - 0.8 <= hi &&
        o.at + (d.w + 12) / this.speed + 0.8 >= lo
      );
    });
  }
  activateSwitch() {
    const end = this.time + 5;
    this.switchState = {
      phase: "active",
      startedAt: this.time,
      endsAt: end,
      confirmed: [true, true],
    };
    this.swap(false);
    this.switchLog.push({ event: "start", time: this.time, endsAt: end });
  }
  swap(returning) {
    this.from = this.players.map((p) => p.lane);
    this.players.forEach((p) => {
      p.lane = returning ? p.id : 1 - p.id;
      p.inv = Math.max(p.inv, 0.45);
      p.pose = "switch";
    });
    this.switching = CONFIG.switchDuration;
    this.emit(returning ? "return" : "switch");
    this.say(
      returning
        ? "RETOUR SYNCHRONISÉ · PARCOURS D’ORIGINE"
        : "PARCOURS INVERSÉS · 5 SECONDES",
    );
  }
  timers() {
    const s = this.switchState;
    if (s.phase === "request" && this.time + EPS >= s.deadline) {
      this.switchState = {
        phase: "cooldown",
        cooldownUntil: s.deadline + 3,
        confirmed: [false, false],
      };
      this.emit("cancel");
      this.say("SWITCH ANNULÉ · SYNCHRONISEZ-VOUS");
    } else if (s.phase === "active" && this.time + EPS >= s.endsAt) {
      const end = s.endsAt;
      this.swap(true);
      this.switchLog.push({ event: "return", time: end });
      this.switchState = {
        phase: "cooldown",
        cooldownUntil: end + 3,
        confirmed: [false, false],
      };
    } else if (s.phase === "cooldown" && this.time + EPS >= s.cooldownUntil)
      this.switchState = {
        phase: "idle",
        confirmed: [false, false],
        cooldownUntil: 0,
      };
  }
  destroy(o, source = "break") {
    if (o.hit) return;
    o.hit = true;
    o.deathAt = this.time;
    if (o.type === "target") o.activatedAt = this.time;
    o.deathLife = 0.6;
    this.score += o.type === "giant" ? 500 : 100;
    this.stats.breaks++;
    this.emit(source, o.x, o.lane);
    if (["plant", "vine", "giant"].includes(o.type)) this.events.push("monsterDeath");
  }
  hurt(p, o) {
    if (p.inv > 0 || this.switching) return;
    this.stats.impacts++;
    if (p.shield) p.shield = 0;
    else {
      p.hp--;
      this.stats.damage++;
    }
    p.inv = 1.5;
    p.damage = 0.42;
    p.deathCause = o.type;
    this.emit("damage", CONFIG.playerX, p.lane);
    this.say(
      o.type === "plant" || o.type === "giant"
        ? "LA MÂCHOIRE VOUS A MORDU !"
        : "IMPACT · GARDEZ LA FRÉQUENCE",
    );
  }
  update(dt) {
    if (this.status !== "running" || !Number.isFinite(dt) || dt <= 0) return;
    let left = dt;
    while (left > EPS && this.status === "running") {
      let step = Math.min(left, 1 / 120);
      const s = this.switchState;
      const boundary =
        s.phase === "active"
          ? s.endsAt
          : s.phase === "request"
            ? s.deadline
            : s.phase === "cooldown"
              ? s.cooldownUntil
              : Infinity;
      if (boundary > this.time + EPS)
        step = Math.min(step, boundary - this.time);
      this.step(step);
      left -= step;
    }
  }
  step(dt) {
    this.baseSpeed ??= this.speed;
    this.time += dt;
    this.speed = this.baseSpeed * paceFactor(this.time);
    this.scroll = worldDistance(this.time, this.baseSpeed);
    this.distance = this.scroll / 20;
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.switching = Math.max(0, this.switching - dt);
    this.timers();
    const current = this.schedule
      .filter(
        (o) => o.segmentStart !== undefined && o.segmentStart <= this.time,
      )
      .sort((a, b) => b.segmentStart - a.segmentStart)[0];
    if (current && current.segmentStart !== this.sequenceIndex) {
      this.sequenceIndex = current.segmentStart;
      this.say(current.label);
    }
    for (const item of this.schedule) {
      if (
        !this.spawned.has(item.id) &&
        item.at - this.time < Math.max(7, 1300 / this.speed)
      ) {
        this.objects.push({
          ...item,
          x:
            CONFIG.playerX +
            (worldDistance(item.at, this.baseSpeed) - this.scroll) +
            (item.offsetX || 0),
          hit: false,
        });
        this.spawned.add(item.id);
      }
    }
    for (const o of this.objects) {
      if (o.at !== undefined)
        o.x =
          CONFIG.playerX + (worldDistance(o.at, this.baseSpeed) - this.scroll) + (o.offsetX || 0);
      else o.x -= this.speed * dt;
      if (o.deathLife) o.deathLife -= dt;
    }
    for (const p of this.players) {
      for (const key of [
        "energy",
        "power",
        "weapon",
        "weaponCD",
        "slide",
        "inv",
        "land",
        "impulse",
        "damage",
      ])
        p[key] = Math.max(0, p[key] - dt);
      if (p.weapon) p.weaponAge += dt;
      if (
        p.id === 0 &&
        p.weaponAge + EPS >= (p.weaponRelease ?? bowTiming(this.speed).release) &&
        !p.weaponReleased &&
        p.weapon > 0
      ) {
        p.weaponReleased = true;
        const target =
          this.objects.find((o) => o.id === p.weaponTarget && !o.hit) ||
          this.findBowTarget(p);
        this.projectiles.push({
          x: CONFIG.playerX + WEAPON.muzzleX,
          lane: p.lane,
          fromLane: p.lane,
          fromY: p.y + WEAPON.muzzleHeight,
          y: p.y + WEAPON.muzzleHeight,
          originX: CONFIG.playerX + WEAPON.muzzleX,
          target: target?.id ?? null,
          life: 1.4,
        });
        this.stats.arrows++;
        this.emit("arrow", CONFIG.playerX, p.lane);
      }

      const r = 1;
      if (p.y > 0 || p.vy > 0) {
        p.y += p.vy * dt;
        p.vy -= CONFIG.gravity * r * r * dt;
        if (p.y <= 0) {
          p.y = 0;
          p.vy = 0;
          p.land = 0.12;
        }
      }
    }
    for (let id = 0; id < 2; id++) if (this.ai[id]) driveAI(this, id);
    for (const arrow of this.projectiles) {
      arrow.life -= dt;
      arrow.x += bowTiming(this.speed).arrowSpeed * dt;
      const target = this.objects.find((o) => o.id === arrow.target && !o.hit);
      if (!target) {
        arrow.target = null;
        continue;
      }
      const targetY =
        target.type === "target"
          ? CEILING_SWITCH.aimHeight
          : target.type === "drone"
            ? DRONE.aimY
            : 75;
      arrow.toLane = target.lane < 0 ? 0 : target.lane;
      arrow.targetHeight = targetY;
      arrow.targetX = target.x;
      const progress = Math.min(
        1,
        (arrow.x - arrow.originX) / Math.max(1, target.x - arrow.originX),
      );
      arrow.progress = progress;
      arrow.y = arrow.fromY + (targetY - arrow.fromY) * progress;
      if (arrow.x >= target.x) {
        arrow.life = 0;
        if (target.type === "giant") {
          target.protected = false;
          this.emit("unshield", target.x, -1);
          this.say("PROTECTION DÉSACTIVÉE · INDAFRENCH : ÉPÉE !");
        } else {
          if (target.links)
            for (const id of target.links) {
              const linked = this.objects.find((o) => o.id === id);
              if (linked) this.destroy(linked, "unshield");
            }
          this.destroy(target, "arrowHit");
        }
      }
    }
    this.projectiles = this.projectiles.filter((a) => a.life > 0);
    for (const o of this.objects) {
      if (o.hit) continue;
      const d = OBSTACLES[o.type];
      if (!d) {
        const p = this.players.find((p) => p.lane === o.lane);
        if (
          Math.abs(o.x - CONFIG.playerX) < 32 &&
          Math.abs(p.y + 38 - (o.y || 45)) < 63
        ) {
          o.hit = true;
          if (o.type === "note") {
            this.score += 25;
            this.emit("note", o.x, o.lane);
          }
          if (o.type === "heart") p.hp = Math.min(3, p.hp + 1);
          if (o.type === "shield") p.shield = 1;
          if (o.type === "energy") {
            p.energy = 0;
            p.weaponCD = 0;
          }
        }
        continue;
      }
      if (d.mechanism) continue;
      const dx = o.x - CONFIG.playerX;
      const sword = this.players[1];
      if (
        d.weapon === 1 &&
        !o.protected &&
        sword.weapon > 0 &&
        sword.weaponAge + EPS >= WEAPON.swordStart &&
        sword.weaponAge <= WEAPON.swordEnd &&
        (o.lane < 0 || o.lane === sword.lane) &&
        dx < 125 &&
        dx > -20
      ) {
        this.destroy(o, "slash");
        continue;
      }
      if (dx < 12 && dx + d.w > -12) {
        for (const p of this.players.filter(
          (p) => o.lane < 0 || p.lane === o.lane,
        )) {
          if (p.hp <= 0) continue;
          let safe = false;
          if (d.owner !== undefined) {
            safe = p.id === d.owner && p.power > 0;
            if (safe) {
              this.destroy(o, p.id === 0 ? "zap" : "break");
              break;
            }
          } else if (d.action === "jump") safe = p.y > d.h + 5;
          else if (d.action === "slide") safe = p.slide > 0 || p.y > d.h + 15;
          else if (d.weapon !== undefined) safe = false;
          if (!safe) this.hurt(p, o);
        }
      }
    }
    for (const p of this.players) {
      const pose =
        p.hp <= 0
          ? "ko"
          : this.switching
            ? "switch"
            : p.damage
              ? "damage"
              : p.weapon
                ? "weapon"
                : p.power
                  ? "power"
                  : p.slide
                    ? "slide"
                    : p.impulse
                      ? "impulse"
                      : p.y > 0
                        ? Math.abs(p.vy) < 80
                          ? "apex"
                          : p.vy > 0
                            ? "jump"
                            : "fall"
                        : p.land
                          ? "land"
                          : "run";
      p.poseTime = pose === p.pose ? p.poseTime + dt : 0;
      p.pose = pose;
    }
    for (const fx of this.effects) {
      fx.life -= dt;
      fx.x -= this.speed * dt * 0.5;
    }
    this.effects = this.effects.filter((f) => f.life > 0);
    this.objects = this.objects.filter((o) => o.x > -220 || o.deathLife > 0);
    if (this.players.some((p) => p.hp <= 0)) this.status = "over";
    else if (this.time >= CONFIG.levelSeconds) this.status = "win";
  }
}

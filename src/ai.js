import { CONFIG, OBSTACLES, WEAPON } from "./config.js?v=4.4.1";
export function driveAI(g, id) {
  if (g.status !== "running") return;
  const p = g.players[id],
    sw = g.switchState;
  if (p.hp <= 0) return;
  if (
    sw.phase === "request" &&
    !sw.confirmed[id] &&
    g.time >= sw.requestedAt + 0.22
  ) {
    g.action(id, "switch");
  }
  const hazards = g.objects.filter((o) => !o.hit && OBSTACLES[o.type]);
  // Plan against actual lane assignments, and only request near the authored encounter.
  if (sw.phase === "idle") {
    const bad = hazards.find((o) => {
      const d = OBSTACLES[o.type];
      if (o.lane < 0 || (d.owner === undefined && d.weapon === undefined))
        return false;
      const owner = d.owner ?? d.weapon;
      return (
        g.players.find((p) => p.lane === o.lane).id !== owner &&
        (o.x - CONFIG.playerX) / g.speed < 2.3 &&
        (o.x - CONFIG.playerX) / g.speed > 1.1
      );
    });
    if (bad) g.action(id, "switch");
  }
  const target = hazards
    .filter((o) => o.lane === p.lane || o.lane === -1)
    .sort((a, b) => a.x - b.x)
    .find((o) => o.x + (OBSTACLES[o.type]?.w || 0) > CONFIG.playerX - 12);
  if (!target) return;
  const d = OBSTACLES[target.type],
    dx = target.x - CONFIG.playerX;
  if (id === 0 && p.weaponCD <= 0) {
    const bow = g.findBowTarget(p);
    if (bow) g.action(id, "weapon");
  }
  if (
    d.action === "jump" &&
    p.y === 0 &&
    dx < 12 + g.speed * (target.type === "gap" ? 0.2 : 0.27) &&
    dx > 0
  )
    g.action(id, "jump");
  if (d.action === "slide" && p.y === 0 && !p.slide && dx < 48 && dx > 0)
    g.action(id, "slide");
  if (
    d.owner === id &&
    dx < 12 + g.speed * CONFIG.powerAnticipation &&
    dx > 0 &&
    p.energy <= 0
  )
    g.action(id, "power");
  if (
    id === 1 &&
    d.weapon === 1 &&
    !target.protected &&
    dx < 90 + g.speed * WEAPON.swordStart &&
    dx > 0 &&
    p.weaponCD <= 0
  )
    g.action(id, "weapon");
}

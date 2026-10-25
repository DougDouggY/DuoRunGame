import { CONFIG, SEQUENCES, OBSTACLES } from "./config.js?v=4.0.0";
// Authored encounter times, not random obstacle spawning. Every 14 s segment has
// one encounter cluster and a guaranteed empty return corridor (last 4 seconds).
export function buildLevel(rounds = 2) {
  const out = [];
  let uid = 0;
  for (let round = 0; round < rounds; round++)
    for (let i = 0; i < SEQUENCES.length; i++) {
      const s = SEQUENCES[i],
        start = (round * SEQUENCES.length + i) * CONFIG.segmentSeconds,
        at = start + 8;
      const common = { sequence: s.id, kind: s.kind, at, swap: !!s.swap };
      if (s.giant)
        out.push({
          ...common,
          id: ++uid,
          type: "giant",
          lane: -1,
          protected: true,
        });
      else
        s.pair.forEach((type, lane) =>
          out.push({ ...common, id: ++uid, type, lane }),
        );
      for (let lane = 0; lane < 2; lane++)
        out.push({ id: ++uid, type: "note", lane, at: at - 2, y: 50 });
      if (s.extra)
        out.push({
          ...common,
          id: ++uid,
          type: "target",
          lane: 0,
          at: at - 3,
          links: out
            .filter(
              (o) => o.sequence === s.id && o.at === at && o.type === "crate",
            )
            .map((o) => o.id),
        });
      if (i % 3 === 1)
        out.push({
          id: ++uid,
          type: ["heart", "shield", "energy"][Math.floor(i / 3) % 3],
          lane: i % 2,
          at: at + 2,
          y: 45,
        });
    }
  return out;
}
export function validateLevel(level, speed) {
  const errors = [];
  for (const o of level) {
    if (!OBSTACLES[o.type]) continue;
    if (o.at < 4) errors.push("Pas de préparation");
    if (o.swap) {
      const end = o.at + 3.5;
      const conflict = level.find(
        (n) =>
          OBSTACLES[n.type] && n.id !== o.id && Math.abs(n.at - end) < 1.25,
      );
      if (conflict) errors.push(`Retour encombré ${o.sequence}`);
    }
    const next = level.find(
      (n) => n.lane === o.lane && n.at > o.at && OBSTACLES[n.type],
    );
    if (next && (next.at - o.at) * speed < OBSTACLES[o.type].w + speed * 2)
      errors.push("Espacement insuffisant");
  }
  return errors;
}

import { CONFIG, SEQUENCES, OBSTACLES } from "./config.js?v=4.5.0";
// Authored 6.8 s classic clusters; coop clusters reserve a safe return corridor
// and append a classic exit pair. Actual encounter gaps are all <= 6.8 s.
export function buildLevel(rounds = 2) {
  const out = [];
  let uid = 0,
    cursor = 0;
  for (let round = 0; round < rounds; round++)
    for (let i = 0; i < SEQUENCES.length; i++) {
      const s = SEQUENCES[i],
        start = cursor,
        at = start + (s.swap ? 4.8 : 5);
      cursor += s.swap ? 10.6 : CONFIG.segmentSeconds;
      const common = {
        sequence: s.id,
        kind: s.kind,
        at,
        swap: !!s.swap,
        segmentStart: start,
        label: s.label,
      };
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
          out.push({
            ...common,
            id: ++uid,
            type: round % 2 && type === "plant" ? "vine" : type,
            lane,
          }),
        );
      for (let lane = 0; lane < 2; lane++)
        out.push({ id: ++uid, type: "note", lane, at: at - 2, y: 50 });
      if (s.extra)
        out.push({
          ...common,
          id: ++uid,
          type: "target",
          lane: 0,
          at,
          offsetX: -260,
          links: out
            .filter(
              (o) => o.sequence === s.id && o.at === at && o.type === "door",
            )
            .map((o) => o.id),
        });
      if (s.swap) {
        for (let lane = 0; lane < 2; lane++)
          out.push({
            id: ++uid,
            type: lane ? "barrier" : "crate",
            lane,
            at: start + 10.6,
            sequence: s.id + "-exit",
            kind: "A",
          });
      }
      if (i % 3 === 1)
        out.push({
          id: ++uid,
          type: ["heart", "shield", "energy"][Math.floor(i / 3) % 3],
          lane: i % 2,
          at: at + 2,
          y: 45,
        });
    }
  const encounters = [...new Set(out.filter(o => OBSTACLES[o.type] && !OBSTACLES[o.type].mechanism).map(o => o.at))].sort((a,b)=>a-b);
  const safeReturns = out.filter(o=>o.swap).map(o=>[o.at+.9,o.at+5.7]);
  for(let i=0;i<encounters.length-1;i++) {
    const at=encounters[i], end=encounters[i+1], progress=Math.min(1,at/70);
    const desired=3.2-1.65*progress;
    const pieces=Math.floor((end-at)/desired);
    for(let j=1;j<pieces;j++) {
      const t=at+(end-at)*j/pieces;
      if(t<14 || safeReturns.some(([lo,hi])=>t>=lo&&t<=hi)) continue;
      for(let lane=0;lane<2;lane++)out.push({id:++uid,at:t,lane,type:(j+lane+i)%2?'barrier':'crate',sequence:'flow',kind:'A',flow:true});
    }
  }
  return out.sort((a,b)=>a.at-b.at || a.id-b.id);
}
export function validateLevel(level, speed) {
  const errors = [];
  for (const o of level) {
    if (!OBSTACLES[o.type] || OBSTACLES[o.type].mechanism) continue;
    if (o.at < 4) errors.push("Pas de préparation");
    if (o.swap) {
      const end = o.at + 2.92;
      const conflict = level.find(
        (n) => OBSTACLES[n.type] && n.id !== o.id && Math.abs(n.at - end) < 0.7,
      );
      if (conflict) errors.push(`Retour encombré ${o.sequence}`);
    }
    const next = level.find(
      (n) => n.lane === o.lane && n.at > o.at && OBSTACLES[n.type] && !OBSTACLES[n.type].mechanism,
    );
    if (next && next.at - o.at < Math.max(1.45, (OBSTACLES[o.type].w + 24) / speed + .35))
      errors.push("Espacement insuffisant");
  }
  return errors;
}

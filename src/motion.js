// Ambient motion uses active time and stable identity, never scrolling position.
export function ambientMotion(object, time) {
  const fallback = { note: 3, heart: 5, shield: 7, energy: 11, drone: 13 };
  const id = Number.isFinite(object.id) ? object.id : fallback[object.type] || 17;
  const phase = (id * 2.399963229728653) % (Math.PI * 2);
  return {
    pickupBob: Math.sin(time * 2.6 + phase) * 4,
    droneBob: Math.sin(time * 2.2 + phase) * 3,
    glow: .8 + .2 * Math.sin(time * 3.1 + phase),
  };
}
export function runCadence(speed) {
  return Math.min(22, Math.max(14, 14 + (speed - 180) / 80));
}
export function frameBlend(position, count, fraction = .32) {
  const base = Math.floor(position);
  const t = Math.max(0, Math.min(1, (position - base - (1 - fraction)) / fraction));
  return {
    current: ((base % count) + count) % count,
    next: (((base + 1) % count) + count) % count,
    mix: t * t * (3 - 2 * t),
  };
}
// One windup, one forward strike, one recovery. Source poses 5/6 and 13/14
// reversed the blade a second time and made the original swing look broken.
export const SWORD_SEQUENCE = [0, 1, 2, 3, 4, 7, 8, 8, 8, 9, 10, 11, 12, 12, 15, 15, 16, 17];
export function swordFrame(age, duration = .8) {
  const index = Math.min(SWORD_SEQUENCE.length - 1, Math.max(0, Math.floor(age / duration * SWORD_SEQUENCE.length)));
  return SWORD_SEQUENCE[index];
}

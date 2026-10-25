import { WEAPON } from "./config.js?v=4.2.0";
export const ANIMATION = {
  width: 384,
  height: 240,
  anchor: { x: 154, y: 228 },
  runFrames: 12,
  weaponFrames: [16, 18],
  shieldFrames: 16,
  legacyRun: [0, 1, 2, null, 3, 4, 5, 6, 7, null, 8, 9],
};
export function animationFrames(p, time, speed) {
  const gait =
    Math.floor(time * Math.min(72, (speed * ANIMATION.runFrames) / 160)) %
    ANIMATION.runFrames;
  return {
    gait,
    weapon: Math.min(
      ANIMATION.weaponFrames[p.id] - 1,
      Math.max(
        0,
        Math.floor(
          (p.weaponAge / WEAPON.duration) * ANIMATION.weaponFrames[p.id],
        ),
      ),
    ),
    shield: Math.min(15, Math.max(0, Math.floor(((0.8 - p.power) / 0.8) * 16))),
  };
}

// One continuous world-distance function keeps scheduled objects from teleporting
// as speed rises. The first 12 seconds stay gentle, then +25% over 78 seconds.
export function paceFactor(time) {
  return 1 + .25 * Math.max(0, Math.min(1, (time - 12) / 78));
}
export function worldDistance(time, baseSpeed) {
  const ramp = Math.max(0, Math.min(78, time - 12));
  return baseSpeed * (time + .25 * ramp * ramp / 156 + .25 * Math.max(0, time - 90));
}
export function bowTiming(speed) {
  const factor = Math.max(1, Math.min(2.55, speed / 300));
  return { duration: .64 / factor, release: .448 / factor, cooldown: .9 / factor,
    arrowSpeed: Math.max(1800, speed * 2.5), factor };
}

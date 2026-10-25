export const CONFIG = {
  speed: 135,
  gravity: 1120,
  jump: 590,
  playerX: 260,
  length: 2400,
  switchWindow: 1.4,
  switchDuration: 0.65,
  cooldown: 4,
};
export const OBSTACLES = {
  crate: { w: 46, h: 48, action: "jump" },
  spikes: { w: 66, h: 30, action: "jump" },
  gap: { w: 90, h: 8, action: "jump" },
  barrier: { w: 72, h: 124, action: "slide" },
  laser: { w: 55, h: 132, action: "slide" },
  electric: { w: 48, h: 114, owner: 0 },
  armored: { w: 58, h: 84, owner: 1 },
};
// Distance-based authored patterns: at least 3.4 seconds between obstacles at Discovery speed.
export const PATTERNS = [
  ["crate", "crate"],
  ["barrier", "spikes"],
  ["electric", "armored"],
  ["gap", "laser"],
  ["spikes", "crate"],
  ["armored", "electric"],
  ["laser", "barrier"],
  ["crate", "gap"],
  ["electric", "armored"],
  ["barrier", "spikes"],
  ["armored", "electric"],
  ["gap", "crate"],
];
export const CHARACTER_ASSETS = [
  { name: "NÉON IV", color: "#4677ff", sprite: "assets/characters/neon.png" },
  { name: "SWONNI", color: "#40ddff", sprite: "assets/characters/swonni.png" },
];

export const SPRITES = {
  sheet: "assets/characters/actions.png",
  neonGrid: { x: [0, 414, 794, 1190, 1577, 1983], y: [0, 398, 793], inset: 12 },
  columns: 5,
  rows: 4,
  frames: {
    run: [0, 1],
    impulse: [2],
    jump: [3],
    fall: [4],
    land: [5],
    slide: [6],
    power: [7],
    switch: [8],
    damage: [9],
    ko: [9],
  },
};

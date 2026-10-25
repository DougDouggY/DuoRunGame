export const SPEEDS = [
  { value: 100, name: "Découverte" },
  { value: 180, name: "Lente" },
  { value: 280, name: "Moyenne" },
  { value: 400, name: "Rapide" },
  { value: 560, name: "Cauchemardesque" },
];
export const CONFIG = {
  speed: 100,
  gravity: 1120,
  jump: 590,
  playerX: 300,
  levelSeconds: 224,
  switchWindow: 2,
  switchHold: 5,
  switchDuration: 0.35,
  switchCooldown: 3,
  cooldown: 4,
  weaponCooldown: 1.5,
  segmentSeconds: 14,
};
export const OBSTACLES = {
  crate: { w: 40, h: 44, action: "jump" },
  spikes: { w: 48, h: 28, action: "jump" },
  gap: { w: 58, h: 8, action: "jump" },
  barrier: { w: 65, h: 124, action: "slide" },
  laser: { w: 50, h: 132, action: "slide" },
  electric: { w: 48, h: 120, owner: 0 },
  armored: { w: 54, h: 84, owner: 1 },
  drone: { w: 54, h: 90, weapon: 0 },
  target: { w: 36, h: 80, weapon: 0 },
  plant: { w: 64, h: 105, weapon: 1 },
  giant: { w: 100, h: 180, weapon: 1 },
};
export const SEQUENCES = [
  {
    id: "tutorial-jump",
    kind: "A",
    label: "A · PRENEZ VOTRE ÉLAN",
    pair: ["crate", "spikes"],
  },
  {
    id: "tutorial-slide",
    kind: "A",
    label: "A · BAISSEZ LA TÊTE",
    pair: ["barrier", "laser"],
  },
  {
    id: "own-powers",
    kind: "A",
    label: "A · E : DASH / BOUCLIER",
    pair: ["electric", "armored"],
  },
  {
    id: "bow-drone",
    kind: "A",
    label: "R · ARC : DRONE / INTERRUPTEUR",
    pair: ["drone", "crate"],
    extra: "target",
  },
  {
    id: "sword-plant",
    kind: "A",
    label: "R · ÉPÉE : LA MÂCHOIRE DE NÉON",
    pair: ["crate", "plant"],
  },
  {
    id: "single-swap",
    kind: "B",
    label: "B · SWITCH : BLINDAGE SUR LA PISTE HAUTE",
    pair: ["armored", "crate"],
    swap: true,
  },
  {
    id: "double-swap",
    kind: "C",
    label: "C · DOUBLE INCOMPATIBILITÉ · SWITCH !",
    pair: ["armored", "electric"],
    swap: true,
  },
  {
    id: "giant-coop",
    kind: "D",
    label: "D · ARC SUR LA PROTECTION, PUIS ÉPÉE",
    pair: ["giant"],
    giant: true,
  },
];
export const CHARACTER_ASSETS = [
  { name: "NÉON IV", color: "#6286ff", sprite: "assets/characters/neon.png" },
  {
    name: "INDAFRENCH",
    color: "#40ddff",
    sprite: "assets/characters/swonni.png",
  },
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
    apex: [3],
    fall: [4],
    land: [5],
    slide: [6],
    power: [7],
    weapon: [7],
    switch: [8],
    damage: [9],
    ko: [9],
  },
};

export const RUN_SPRITES = {
  columns: 6,
  y: [0, 280, 525, 770, 1024],
  frames: [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23],
  ],
};

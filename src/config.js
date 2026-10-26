export const SPEEDS = [
  { value: 180, name: "Découverte" },
  { value: 350, name: "Lente" },
  { value: 600, name: "Moyenne" },
  { value: 800, name: "Rapide" },
  { value: 1000, name: "Cauchemardesque" },
];
export const CONFIG = {
  speed: 180,
  gravity: 800,
  jump: 520,
  playerX: 300,
  levelSeconds: 137.6,
  switchWindow: 2,
  switchHold: 5,
  switchDuration: 0.35,
  switchCooldown: 3,
  cooldown: 4,
  powerAnticipation: 0.45,
  weaponCooldown: 1.5,
  segmentSeconds: 6.8,
};
export const OBSTACLES = {
  crate: { w: 84, h: 88, action: "jump" },
  spikes: { w: 70, h: 42, action: "jump" },
  gap: { w: 82, h: 8, action: "jump" },
  barrier: { w: 92, h: 140, action: "slide" },
  laser: { w: 82, h: 148, action: "slide" },
  electric: { w: 78, h: 152, owner: 0 },
  armored: { w: 96, h: 132, owner: 1 },
  drone: { w: 70, h: 110, weapon: 0 },
  target: { w: 60, h: 80, mechanism: true },
  door: { w: 98, h: 178, locked: true },
  vine: { w: 92, h: 122, weapon: 1 },
  plant: { w: 86, h: 128, weapon: 1 },
  giant: { w: 124, h: 200, weapon: 1 },
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
    pair: ["door", "crate"],
    extra: "target",
  },
  {
    id: "laser-drone",
    kind: "A",
    label: "R · DÉTRUISEZ LE DRONE ET SON LASER",
    pair: ["drone", "barrier"],
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

export const WEAPON = {
  duration: 0.8,
  release: 0.56,
  swordStart: 0.4,
  swordEnd: 0.64,
  arrowSpeed: 1600,
  bowRange: 1100,
  muzzleX: 100,
  muzzleHeight: 96,
};

export const DRONE = { bodyY: 290, aimY: 230, beamY: 185, width: 166 };

export const CEILING_SWITCH={top:282,height:106,aimHeight:200};
export const DASH={duration:.8,frames:12};

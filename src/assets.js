import { CHARACTER_ASSETS } from "./config.js?v=4.4.0";
export async function loadAssets() {
  const paths = {
    neonRun: "assets/characters/v43/neon-run.png",
    indaRun: "assets/characters/v43/inda-run.png",
    neonDash: "assets/characters/v43/neon-dash.png",
    neonBow: "assets/characters/v42/neon-weapon.png",
    indaSword: "assets/characters/v43/inda-weapon.png",
    indaShield: "assets/characters/v42/inda-shield.png",
    arrow: "assets/obstacles/v42/5.png",
    armoredDetailed: "assets/obstacles/v42/2.png",
    armoredBroken: "assets/obstacles/v42/3.png",
    organic: "assets/obstacles/v42/4.png",
    crateBright: "assets/obstacles/v41/2.png",
    door: "assets/obstacles/v41/3.png",
    ceilingSwitch: "assets/obstacles/v41/4.png",
    ceilingSwitchOn: "assets/obstacles/v41/5.png",
    laserDrone: "assets/obstacles/v42/0.png",
    laserDroneDead: "assets/obstacles/v42/1.png",
    maw: "assets/monsters/maw.png",
    industrial: "assets/obstacles/industrial.png",
    city: "assets/backgrounds/city.png",
    canal: "assets/backgrounds/canal.png",
    ground: "assets/backgrounds/ground.png",
    actions: "assets/characters/actions.png",
    neonActions: "assets/characters/neon-actions.png",
    neon: CHARACTER_ASSETS[0].sprite,
    swonni: CHARACTER_ASSETS[1].sprite,
  };
  const assets = {};
  await Promise.all(
    Object.entries(paths).map(async ([key, path]) => {
      const img = new Image();
      img.src = path;
      try {
        await img.decode();
        assets[key] = img;
      } catch {
        console.warn("Asset indisponible", path);
      }
    }),
  );
  return assets;
}

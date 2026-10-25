import { CHARACTER_ASSETS } from "./config.js?v=4.1.0";
export async function loadAssets() {
  const paths = {
    neonCompiled: "assets/characters/v41/neon-compiled.png",
    indaCompiled: "assets/characters/v41/inda-compiled.png",
    knight: "assets/obstacles/v41/0.png",
    knightImpact: "assets/obstacles/v41/1.png",
    crateBright: "assets/obstacles/v41/2.png",
    door: "assets/obstacles/v41/3.png",
    ceilingSwitch: "assets/obstacles/v41/4.png",
    ceilingSwitchOn: "assets/obstacles/v41/5.png",
    laserDrone: "assets/obstacles/v41/6.png",
    laserDroneDead: "assets/obstacles/v41/7.png",
    maw: "assets/monsters/maw.png",
    industrial: "assets/obstacles/industrial.png",
    city: "assets/backgrounds/city.png",
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

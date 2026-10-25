import { CHARACTER_ASSETS } from "./config.js?v=4.0.0";
export async function loadAssets() {
  const paths = {
    run: "assets/characters/run-v4.png",
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

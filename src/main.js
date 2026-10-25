import { Game } from "./game.js";
import { Renderer } from "./render.js";
import { loadAssets } from "./assets.js";
const canvas = document.querySelector("canvas"),
  overlay = document.querySelector("#overlay");
const game = new Game();
const renderer = new Renderer(canvas, await loadAssets());
renderer.resize();
addEventListener("resize", () => renderer.resize());
window.neonRush = { game, renderer };
let muted = true,
  audio = new Audio(),
  context;
audio.volume = 0.4;
function beep(event) {
  if (muted) return;
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume();
  const o = context.createOscillator(),
    v = context.createGain();
  o.type = event === "damage" ? "sawtooth" : "sine";
  o.frequency.value =
    {
      jump: 430,
      power: 160,
      switch: 740,
      note: 940,
      damage: 95,
      break: 220,
      request: 600,
    }[event] || 400;
  v.gain.setValueAtTime(
    0.09 * +document.querySelector("#volume").value,
    context.currentTime,
  );
  v.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
  o.connect(v).connect(context.destination);
  o.start();
  o.stop(context.currentTime + 0.16);
}
function start() {
  overlay.querySelector("h1").innerHTML = "NEON <i>RUSH</i>";
  overlay.querySelector(".eyebrow").textContent =
    "DEUX DESTINS. UNE MÊME FRÉQUENCE.";
  game.reset();
  game.speed = +document.querySelector("#speed").value;
  game.status = "running";
  overlay.classList.add("hidden");
  document.querySelector("#pause").textContent = "Ⅱ PAUSE";
  if (!muted && audio.src) audio.play().catch(() => {});
}
function pause() {
  if (!["running", "paused"].includes(game.status)) return;
  game.status = game.status === "paused" ? "running" : "paused";
  document.querySelector("#pause").textContent =
    game.status === "paused" ? "▶ REPRENDRE" : "Ⅱ PAUSE";
  if (game.status === "paused") audio.pause();
  else if (!muted && audio.src) audio.play().catch(() => {});
}
const keys = {
  z: [0, "jump"],
  s: [0, "slide"],
  a: [0, "power"],
  e: [0, "switch"],
  ArrowUp: [1, "jump"],
  ArrowDown: [1, "slide"],
  ArrowRight: [1, "power"],
  Enter: [1, "switch"],
};
addEventListener("keydown", (e) => {
  if (keys[e.key] || [" ", "Escape"].includes(e.key)) e.preventDefault();
  if (e.repeat) return;
  if (e.key === "Escape" || e.key === " ") {
    pause();
    return;
  }
  const action = keys[e.key] || keys[e.key.toLowerCase()];
  if (action) game.action(...action);
});
document.querySelector("#play").onclick = start;
document.querySelector("#reset").onclick = start;
document.querySelector("#pause").onclick = pause;
document.querySelector("#help").onclick = () => {
  if (game.status === "running") pause();
  overlay.classList.toggle("hidden");
  document.querySelector("#play").textContent = "NOUVELLE PARTIE →";
};
document.querySelector("#sound").onclick = () => {
  muted = !muted;
  document.querySelector("#sound").textContent = muted ? "SON OFF" : "SON ON";
  if (muted) audio.pause();
  else {
    beep("note");
    if (audio.src && game.status === "running") audio.play().catch(() => {});
  }
};
let localURL;
document.querySelector("#audio").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (localURL) URL.revokeObjectURL(localURL);
  localURL = URL.createObjectURL(file);
  audio.src = localURL;
  audio.loop = true;
  if (!muted && game.status === "running") audio.play().catch(() => {});
};
document.querySelector("#volume").oninput = (e) =>
  (audio.volume = +e.target.value);
document.querySelector("#speed").onchange = (e) => {
  game.speed = +e.target.value;
  game.say(
    "VITESSE FIXE · " + e.target.selectedOptions[0].textContent.toUpperCase(),
  );
};
addEventListener("blur", () => {
  if (game.status === "running") pause();
});
let last = performance.now();
function frame(now) {
  game.update((now - last) / 1000);
  last = now;
  for (const event of game.events.splice(0)) beep(event);
  renderer.draw(game);
  if (["over", "win"].includes(game.status)) {
    overlay.classList.remove("hidden");
    overlay.querySelector("h1").textContent =
      game.status === "win" ? "SIGNAL REÇU" : "SIGNAL PERDU";
    overlay.querySelector(".eyebrow").textContent =
      `${Math.floor(game.distance)} MÈTRES · ${game.score} POINTS`;
    document.querySelector("#play").textContent = "RECOMMENCER →";
    audio.pause();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

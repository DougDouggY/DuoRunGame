import { AnimationPreview } from "./preview.js?v=4.2.0";
import { PeerSession } from "./network.js?v=4.2.0";
import { Game } from "./game.js?v=4.2.0";
import { Renderer } from "./render.js?v=4.2.0";
import { loadAssets } from "./assets.js?v=4.2.0";
const canvas = document.querySelector("canvas"),
  overlay = document.querySelector("#overlay");
const game = new Game();
const renderer = new Renderer(canvas, await loadAssets());
renderer.resize();
const preview = new AnimationPreview(renderer.assets);
addEventListener("resize", () => renderer.resize());
const network = new PeerSession(game, (status) => {
  document.querySelector("#network-status").textContent = status;
  document.querySelector(".live").textContent = network.connected
    ? "● DUO CONNECTÉ · " + (network.role === "host" ? "NÉON IV" : "INDAFRENCH")
    : "● COOP LOCALE";
  document.querySelector("#ai1").disabled = network.connected;
  document.querySelector("#demo").disabled = network.connected;
  if (network.connected) {
    document.querySelector("#ai1").checked = false;
  }
});
window.duoRush = { game, renderer, network, preview };
window.neonRush = window.duoRush; // Existing developer tooling compatibility.
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
      return: 880,
      arrow: 1100,
      sword: 310,
      slash: 170,
      unshield: 1300,
      cancel: 100,
      arrowHit: 700,
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
function start(demo = false) {
  if (network.role === "guest") return;
  overlay.querySelector("h1").innerHTML = "DUO <i>RUSH</i>";
  overlay.querySelector(".eyebrow").textContent =
    "DEUX DESTINS. UNE MÊME FRÉQUENCE.";
  game.reset();
  game.speed = +document.querySelector("#pre-speed").value;
  game.ai = network.connected
    ? [false, false]
    : [demo, demo || document.querySelector("#ai1").checked];
  document.querySelector("#speed").disabled = true;
  document.querySelector("#pre-speed").disabled = false;
  game.status = "running";
  overlay.classList.add("hidden");
  document.querySelector("#pause").textContent = "Ⅱ PAUSE";
  if (!muted && audio.src) audio.play().catch(() => {});
}
function pause() {
  if (network.role === "guest") {
    network.send({ type: "pause" });
    return;
  }
  if (!["running", "paused"].includes(game.status)) return;
  game.status = game.status === "paused" ? "running" : "paused";
  document.querySelector("#pause").textContent =
    game.status === "paused" ? "▶ REPRENDRE" : "Ⅱ PAUSE";
  if (game.status === "paused") audio.pause();
  else if (!muted && audio.src) audio.play().catch(() => {});
}
const keys = {
  a: [0, "jump"],
  z: [0, "slide"],
  e: [0, "power"],
  r: [0, "weapon"],
  " ": [0, "switch"],
  ArrowUp: [1, "jump"],
  ArrowDown: [1, "slide"],
  ArrowRight: [1, "power"],
  "/": [1, "weapon"],
};
addEventListener("keydown", (e) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement
  )
    return;
  if (document.querySelector("dialog[open]")) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (keys[key] || key === "Escape") e.preventDefault();
  if (e.repeat) return;
  if (key === "Escape") {
    pause();
    return;
  }
  if (key === " " && !network.connected) {
    const id =
      game.switchState.phase === "request"
        ? game.switchState.confirmed.findIndex((v) => !v)
        : 0;
    if (id >= 0 && !game.ai[id]) game.action(id, "switch");
    return;
  }
  if (key === "Enter") return;
  const action = keys[key];
  if (action) {
    if (network.connected) {
      if (action[0] === 0) network.action(action[1]);
    } else if (!game.ai[action[0]]) game.action(...action);
  }
});
document.querySelector("#play").onclick = () => start(false);
document.querySelector("#demo").onclick = () => start(true);
document.querySelector("#reset").onclick = () => start(false);
document.querySelector("#pause").onclick = pause;
document.querySelector("#ai1").onchange = (e) => {
  game.ai[1] = e.target.checked;
};
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
document.querySelector("#pre-speed").onchange = (e) => {
  document.querySelector("#speed").value = e.target.value;
};
document.querySelector("#speed").onchange = (e) => {
  document.querySelector("#pre-speed").value = e.target.value;
};
addEventListener("blur", () => {
  if (game.status === "running" && network.role !== "guest") pause();
});
let last = performance.now();
function frame(now) {
  if (network.role !== "guest") game.update(Math.min((now - last) / 1000, 0.2));
  network.tick(now);
  if (network.role === "guest" && game.status === "running")
    overlay.classList.add("hidden");
  last = now;
  for (const event of game.events.splice(0)) beep(event);
  renderer.draw(game);
  preview.draw(now);
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

const panel = document.querySelector("#network-panel");
document.querySelector("#online").onclick = () => {
  if (game.status === "running") pause();
  panel.showModal();
};
document.querySelector("#network-close").onclick = () => panel.close();
async function connectUI(work) {
  try {
    document.querySelector("#network-status").textContent =
      "Préparation de la connexion…";
    const code = await work();
    if (code) document.querySelector("#signal-out").value = code;
    document.querySelector("#network-status").textContent = network.connected
      ? "Connecté. L’hôte peut lancer la partie."
      : "Code prêt : transmettez-le à l’autre joueur.";
  } catch (error) {
    document.querySelector("#network-status").textContent = error.message;
  }
}
document.querySelector("#host").onclick = () =>
  connectUI(() => network.offer());
document.querySelector("#join").onclick = () =>
  connectUI(() => network.answer(document.querySelector("#signal-in").value));
document.querySelector("#connect").onclick = () =>
  connectUI(() => network.accept(document.querySelector("#signal-in").value));
document.querySelector("#disconnect").onclick = () => {
  network.close();
  document.querySelector("#signal-in").value = "";
  document.querySelector("#signal-out").value = "";
  document.querySelector("#network-status").textContent =
    "Déconnecté. Coop locale disponible.";
};

document.querySelector("#inspect").onclick = () => {
  if (game.status === "running") pause();
  preview.open();
};

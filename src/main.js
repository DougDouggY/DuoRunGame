import {GameAudio} from "./audio.js?v=4.5.1";
import { AnimationPreview } from "./preview.js?v=4.5.1";
import { RelaySession, parseInvitation } from "./relay.js?v=4.5.1";
import { ONLINE_URL } from "./online-config.js?v=4.5.1";
import { Game } from "./game.js?v=4.5.1";
import { Renderer } from "./render.js?v=4.5.1";
import { loadAssets } from "./assets.js?v=4.5.1";
const canvas = document.querySelector("canvas"),
  overlay = document.querySelector("#overlay");
const game = new Game();
const renderer = new Renderer(canvas, await loadAssets());
renderer.resize();
const preview = new AnimationPreview(renderer.assets);
addEventListener("resize", () => renderer.resize());
const network = new RelaySession(game, (status) => {
  document.querySelector("#network-status").textContent = status;
  document.querySelector(".live").textContent = network.connected
    ? "● DUO CONNECTÉ · " + (network.role === "host" ? "NÉON IV" : "INDAFRENCH")
    : network.sessionActive ? "● SALLE PRIVÉE · ATTENTE" : "● COOP LOCALE";
  document.querySelector("#ai1").disabled = network.sessionActive;
  document.querySelector("#demo").disabled = network.sessionActive;
  document.querySelector("#play").disabled = network.sessionActive && (!network.connected || network.role === "guest");
  document.querySelector("#reset").disabled = network.role === "guest";
  document.querySelector("#pre-speed").disabled = network.role === "guest";
  document.querySelector("#play").textContent = network.sessionActive
    ? network.role === "guest" ? "EN ATTENTE DE NÉON IV…" : network.connected ? "LANCER LA PARTIE À DEUX →" : "EN ATTENTE D’INDAFRENCH…"
    : "ENTRER DANS LA VILLE →";
  if (network.connected) {
    document.querySelector("#ai1").checked = false;
  }
});
window.duoRush = { game, renderer, network, preview };
window.neonRush = window.duoRush; // Existing developer tooling compatibility.
const sound = new GameAudio();
window.duoRush.sound = sound;
function start(demo = false) {
  if (network.role === "guest" || (network.sessionActive && !network.connected)) return;
  overlay.querySelector("h1").innerHTML = "DUO <i>RUSH</i>";
  overlay.querySelector(".eyebrow").textContent =
    "DEUX DESTINS. UNE MÊME FRÉQUENCE.";
  game.reset();
  sound.reset();
  game.speed = +document.querySelector("#pre-speed").value;
  game.ai = network.connected
    ? [false, false]
    : [demo, demo || document.querySelector("#ai1").checked];
  document.querySelector("#speed").disabled = true;
  document.querySelector("#pre-speed").disabled = false;
  game.status = "running";
  overlay.classList.add("hidden");
  document.querySelector("#pause").textContent = "Ⅱ PAUSE";
  sound.sync(game.status);
}
function pause() {
  if (network.sessionActive && !network.connected) return;
  if (network.role === "guest") {
    network.send({ type: "pause" });
    return;
  }
  if (!["running", "paused"].includes(game.status)) return;
  game.status = game.status === "paused" ? "running" : "paused";
  document.querySelector("#pause").textContent =
    game.status === "paused" ? "▶ REPRENDRE" : "Ⅱ PAUSE";
  sound.sync(game.status);
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
  if (network.sessionActive && !network.connected) return;
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
document.querySelector("#sound").onclick = async () => {
  const muted = await sound.toggle();
  document.querySelector("#sound").textContent = muted ? "SON OFF" : "SON ON";
  if(!muted) sound.play("note");
  sound.sync(game.status);
};
document.querySelector("#audio").onchange = async (e) => {
  const file=e.target.files[0]; if(!file)return;
  try {
    await sound.import(file);
    document.querySelector("#audio-status").textContent=file.name + " · privé sur cet appareil";
    sound.sync(game.status);
  } catch {document.querySelector("#audio-status").textContent="Impossible de lire ce fichier audio.";}
};
document.querySelector("#volume").oninput=e=>sound.setVolume(+e.target.value);
document.querySelector("#rhythm").onchange=e=>{sound.mode=e.target.value;sound.rhythm.reset();};
document.querySelector("#bpm").onchange=e=>{sound.bpm=Math.min(240,Math.max(40,+e.target.value||120));e.target.value=sound.bpm;sound.rhythm.reset();};
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
  if (network.role === "guest") {
    if(game.status === "running") overlay.classList.add("hidden");
    if(game.status === "menu") overlay.classList.remove("hidden");
    const speed=String(game.baseSpeed ?? game.speed);
    if(document.querySelector('#pre-speed').value!==speed) {
      document.querySelector('#pre-speed').value=speed;document.querySelector('#speed').value=speed;
    }
  }
  last = now;
  const events=game.events.splice(0);
  network.queueSounds(events);
  for (const event of events) sound.play(event);
  const localPlayer=game.players[network.role === "guest"?1:0];
  const lane=localPlayer.lane;
  sound.update(Math.min((now-(sound.lastFrame ?? now))/1000,.1),game.status,lane,localPlayer.y);
  sound.lastFrame=now;
  renderer.personalNotes=sound.personal;
  renderer.online=network.connected;
  renderer.draw(network.view(now));
  document.querySelector("#latency").textContent = network.sessionActive ? (network.rtt === null ? "Liaison privée" : `Aller-retour : ${network.rtt} ms`) : "";
  preview.draw(now);
  if (["over", "win"].includes(game.status)) {
    overlay.classList.remove("hidden");
    overlay.querySelector("h1").textContent =
      game.status === "win" ? "SIGNAL REÇU" : "SIGNAL PERDU";
    overlay.querySelector(".eyebrow").textContent =
      `${Math.floor(game.distance)} MÈTRES · ${game.score} POINTS`;
    document.querySelector("#play").textContent = "RECOMMENCER →";
    sound.sync(game.status);
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
const serverInput=document.querySelector('#relay-url');
serverInput.value=ONLINE_URL || localStorage.getItem('duoRush.server') || '';
document.querySelector('#server-settings').open=!serverInput.value;
try {
  const invitation=new URLSearchParams(location.hash.slice(1));
  if(invitation.has('room')) {
    const room=parseInvitation(location.href,serverInput.value);
    serverInput.value=room.server;document.querySelector('#room-in').value=room.code;document.querySelector('#server-settings').open=false;document.querySelector('#create-room').hidden=true;
    panel.showModal();document.querySelector('#network-status').textContent='Invitation reçue · cliquez sur Rejoindre pour jouer INDAFRENCH.';
  }
} catch(error) {document.querySelector('#network-status').textContent=error.message;}
async function connectUI(work) {
  const buttons=[...panel.querySelectorAll('.network-actions button')];
  buttons.forEach(b=>b.disabled=true);
  document.querySelector('#network-status').textContent='Connexion à votre salle…';
  try {
    await work();localStorage.setItem('duoRush.server',network.server);
    document.querySelector('#room-out').value=network.invitation();
    document.querySelector('#room-code').textContent=network.code;
    document.querySelector('#network-status').textContent=network.connected
      ? 'Vous êtes deux · fermez ce panneau. NÉON IV peut lancer la partie.'
      : 'Salle ouverte · envoyez le lien privé à l’autre joueur.';
  } catch(error) {document.querySelector('#network-status').textContent=error.message;}
  finally {buttons.forEach(b=>b.disabled=false);}
}
document.querySelector('#host').onclick=()=>{
  const key=document.querySelector('#room-key');
  if(!key.value){key.focus();document.querySelector('#network-status').textContent='Saisissez votre phrase privée ROOM_CREATION_KEY dans le champ ci-dessus, puis cliquez sur Créer une salle.';return;}
  return connectUI(()=>network.create(serverInput.value,key.value));
};
document.querySelector('#join').onclick=()=>connectUI(()=>network.join(document.querySelector('#room-in').value,serverInput.value));
document.querySelector('#reconnect').onclick=()=>connectUI(()=>network.reconnect());
document.querySelector('#copy-room').onclick=async()=>{
  const field=document.querySelector('#room-out');if(!field.value)return;
  try {await navigator.clipboard.writeText(field.value);document.querySelector('#network-status').textContent='Lien copié · envoyez-le uniquement à votre partenaire.';}
  catch {field.focus();field.select();document.querySelector('#network-status').textContent='Sélectionnez et copiez le lien affiché.';}
};
document.querySelector('#disconnect').onclick=()=>{
  network.close();document.querySelector('#create-room').hidden=false;document.querySelector('#room-out').value='';document.querySelector('#room-code').textContent='';
  document.querySelector('#network-status').textContent='Déconnecté. Coop locale disponible.';
  document.querySelector('#play').disabled=false;document.querySelector('#reset').disabled=false;document.querySelector('#pre-speed').disabled=false;
  document.querySelector('#ai1').disabled=false;document.querySelector('#demo').disabled=false;
};

document.querySelector("#inspect").onclick = () => {
  if (game.status === "running") pause();
  preview.open();
};

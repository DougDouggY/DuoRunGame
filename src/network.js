// Host-authoritative WebRTC. No game server, paid API or signalling service.
// Users exchange offer/answer codes themselves. STUN helps direct connections;
// restrictive NATs require a TURN relay that this project does not supply.
const FIELDS = [
  "players",
  "objects",
  "time",
  "scroll",
  "distance",
  "score",
  "speed",
  "status",
  "switchState",
  "switching",
  "from",
  "message",
  "messageTime",
  "effects",
  "projectiles",
  "ai",
  "stats",
  "switchLog",
];
export class PeerSession {
  constructor(game, onStatus = () => {}) {
    this.game = game;
    this.onStatus = onStatus;
    this.role = null;
    this.pc = null;
    this.channel = null;
    this.connected = false;
    this.lastSend = 0;
    this.remoteAt = 0;
  }
  async init(role, iceServers = [{ urls: "stun:stun.l.google.com:19302" }]) {
    this.close();
    this.role = role;
    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.ondatachannel = (e) => this.bind(e.channel);
    this.pc.onconnectionstatechange = () => {
      this.onStatus(this.pc?.connectionState || "closed");
      if (
        ["disconnected", "failed", "closed"].includes(
          this.pc?.connectionState,
        ) &&
        this.game.status === "running"
      )
        this.game.status = "paused";
    };
    if (role === "host")
      this.bind(this.pc.createDataChannel("duo-rush", { ordered: true }));
  }
  bind(channel) {
    this.channel = channel;
    channel.onopen = () => {
      this.connected = true;
      this.game.ai = [false, false];
      this.onStatus(
        "connecté · " +
          (this.role === "host" ? "vous êtes NÉON IV" : "vous êtes INDAFRENCH"),
      );
    };
    channel.onclose = () => {
      this.connected = false;
      if (this.game.status === "running") this.game.status = "paused";
      this.onStatus("connexion fermée · partie en pause");
    };
    channel.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object" || Array.isArray(msg)) return;
      if (this.role === "host") {
        if (
          msg.type === "action" &&
          ["jump", "slide", "power", "weapon", "switch"].includes(msg.action)
        )
          this.game.action(1, msg.action);
        if (
          msg.type === "pause" &&
          ["paused", "running"].includes(this.game.status)
        )
          this.game.status =
            this.game.status === "paused" ? "running" : "paused";
      } else if (
        msg.type === "state" &&
        msg.state &&
        typeof msg.state.time === "number"
      ) {
        for (const k of FIELDS) if (k in msg.state) this.game[k] = msg.state[k];
        this.remoteAt = performance.now();
      }
    };
  }
  async gathered() {
    const pc = this.pc;
    if (pc.iceGatheringState !== "complete")
      await new Promise((resolve) => {
        const done = () => {
          if (pc.iceGatheringState === "complete") {
            pc.removeEventListener("icegatheringstatechange", done);
            clearTimeout(timer);
            resolve();
          }
        };
        const timer = setTimeout(() => {
          pc.removeEventListener("icegatheringstatechange", done);
          resolve();
        }, 6000);
        pc.addEventListener("icegatheringstatechange", done);
      });
    if (!pc.localDescription.sdp.includes("a=candidate:"))
      throw new Error(
        "Aucune route réseau WebRTC disponible dans ce navigateur. La coop locale reste disponible.",
      );
    return JSON.stringify(pc.localDescription);
  }
  async offer(iceServers) {
    await this.init("host", iceServers);
    await this.pc.setLocalDescription(await this.pc.createOffer());
    return this.gathered();
  }
  async answer(code, iceServers) {
    const offer = this.parse(code, "offer");
    await this.init("guest", iceServers);
    await this.pc.setRemoteDescription(offer);
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    return this.gathered();
  }
  async accept(code) {
    if (this.role !== "host" || !this.pc)
      throw new Error("Créez une partie hôte avant de recevoir la réponse.");
    await this.pc.setRemoteDescription(this.parse(code, "answer"));
  }
  parse(code, type) {
    let value;
    try {
      value = JSON.parse(code);
    } catch {
      throw new Error("Code de connexion invalide.");
    }
    if (
      !value ||
      value.type !== type ||
      typeof value.sdp !== "string" ||
      value.sdp.length > 100000
    )
      throw new Error("Type de code incorrect.");
    return value;
  }
  send(msg) {
    if (
      this.channel?.readyState === "open" &&
      this.channel.bufferedAmount < 100000
    )
      this.channel.send(JSON.stringify(msg));
  }
  action(key) {
    if (this.role === "guest") {
      this.send({ type: "action", action: key });
      return;
    }
    this.game.action(0, key);
  }
  tick(now) {
    if (this.role === "host" && this.connected && now - this.lastSend >= 50) {
      const state = {};
      for (const k of FIELDS) state[k] = this.game[k];
      this.send({ type: "state", state });
      this.lastSend = now;
    }
  }
  close() {
    if (this.game.status === "running") this.game.status = "paused";
    this.channel?.close();
    this.pc?.close();
    this.channel = null;
    this.pc = null;
    this.connected = false;
    this.role = null;
  }
}

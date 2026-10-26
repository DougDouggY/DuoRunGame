import { SWORD_SEQUENCE } from "./motion.js?v=4.4.1";
import { ANIMATION } from "./animation.js?v=4.4.1";
export class AnimationPreview {
  constructor(assets) {
    this.assets = assets;
    this.panel = document.querySelector("#animation-panel");
    this.c = document.querySelector("#animation-canvas").getContext("2d");
    this.frame = 0;
    this.last = 0;
    this.playing = true;
    this.kind = "neon-bow";
    document.querySelector("#preview-kind").onchange = (e) => {
      this.kind = e.target.value;
      this.frame = 0;
    };
    document.querySelector("#preview-play").onclick = () => {
      this.playing = !this.playing;
    };
    for (const [id, delta] of [
      ["preview-prev", -1],
      ["preview-next", 1],
    ])
      document.getElementById(id).onclick = () => {
        this.playing = false;
        this.frame = (this.frame + delta + this.count()) % this.count();
      };
    document.querySelector("#preview-close").onclick = () => this.panel.close();
  }
  count() {
    return this.kind === "arrow"
      ? 1
      : (this.kind.endsWith("run") || this.kind.endsWith("dash"))
        ? 12
        : this.kind.endsWith("bow")
          ? 16
          : this.kind.endsWith("sword")
            ? 18
            : 16;
  }
  open() {
    this.frame = 0;
    this.last = performance.now();
    this.panel.showModal();
  }
  draw(now) {
    if (!this.panel.open) return;
    if (this.playing && now - this.last >= 125) {
      this.frame = (this.frame + 1) % this.count();
      this.last = now;
    }
    const c = this.c,
      { width: W, height: H, anchor: A } = ANIMATION;
    const id = this.kind.startsWith("inda") ? 1 : 0,
      run = this.assets[id ? "indaRun" : "neonRun"];
    c.clearRect(0, 0, 768, 480);
    c.fillStyle = "#050d1e";
    c.fillRect(0, 0, 768, 480);
    if (this.assets.city) {
      c.globalAlpha = 0.25;
      c.drawImage(this.assets.city, 0, 0, 768, 420);
      c.globalAlpha = 1;
    }
    c.strokeStyle = id ? "#4edbff" : "#7584ff";
    c.beginPath();
    c.moveTo(0, 455);
    c.lineTo(768, 455);
    c.stroke();
    const draw = (img, f, row = 0) => {
      if (img) c.drawImage(img, f * W, row * H, W, H, 0, 0, W * 2, H * 2);
    };
    if (this.kind === "arrow") {
      const img = this.assets.arrow;
      if (img) {
        const w = 460,
          h = (w * img.height) / img.width;
        this.c.drawImage(img, 140, 235 - h / 2, w, h);
      }
    } else if (this.kind.endsWith("run")) draw(run, this.frame);
    else if (this.kind.endsWith("dash")) draw(this.assets.neonDash,this.frame);
    else {
      draw(run, Math.floor((this.frame / this.count()) * 12) % 12, 1);
      draw(
        this.assets[
          this.kind.endsWith("bow")
            ? "neonBow"
            : this.kind.endsWith("sword")
              ? "indaSword"
              : "indaShield"
        ],
        this.kind.endsWith("sword")?SWORD_SEQUENCE[this.frame]:this.frame,
      );
    }
    document.querySelector("#preview-count").textContent =
      `POSE ${this.frame + 1} / ${this.count()} · RALENTI`;
    document.querySelector("#preview-play").textContent = this.playing
      ? "Ⅱ PAUSE"
      : "▶ LIRE";
  }
}

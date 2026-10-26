// This controller is deliberately local. No PCM, file, beat or personal note is
// included in the authoritative simulation or the network snapshot.
export class RhythmClock {
  constructor() { this.reset(); }
  reset() { this.lastTime = null; this.lastBar = null; this.kicks = 0; this.lastKick = -Infinity; this.average = 0; }
  sample(time, mode, bpm = 120, bass = 0) {
    if (!Number.isFinite(time)) return false;
    if (this.lastTime === null || time < this.lastTime || time-this.lastTime > .5) {
      this.lastBar = Math.floor(time / (480 / bpm));
      this.lastTime = time; this.average = bass; this.lastKick = time; return false;
    }
    this.lastTime = time;
    if (mode === 'bars') {
      const bar = Math.floor((time + 1e-7) / (480 / bpm));
      const fire = bar > this.lastBar;
      this.lastBar = bar; return fire;
    }
    if (mode === 'kicks') {
      const threshold = Math.max(.075, this.average * 1.55);
      const onset = bass > threshold && time-this.lastKick > .25;
      this.average = this.average * .94 + bass * .06;
      if (onset) { this.lastKick = time; return ++this.kicks % 8 === 0; }
    }
    return false;
  }
}
export class PersonalNotes {
  constructor() { this.reset(); }
  reset() { this.notes = []; this.score = 0; this.serial = 0; }
  update(dt, emit, lane, playerY = 0) {
    if (emit) this.notes.push({ id:++this.serial, lane, age:0 });
    let collected=0;
    for (const n of this.notes) {
      const before=n.age;
      n.age += dt;
      const contactStart=1.15*(1-32/880),contactEnd=1.15*(1+32/880);
      const height=62+Math.sin(n.age*5)*7;
      if(before<=contactEnd&&n.age>=contactStart&&n.lane===lane&&Math.abs(playerY+38-height)<63) {
        n.collected=true;collected++;
      }
    }
    this.score += collected;
    this.notes=this.notes.filter(n=>!n.collected&&n.age<1.45);
    return collected;
  }
}

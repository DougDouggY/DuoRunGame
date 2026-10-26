import {RhythmClock, PersonalNotes} from './rhythm.js?v=4.4.1';
export class GameAudio {
  constructor() {
    this.media = new Audio(); this.media.loop = true;
    this.muted = true; this.volume = .4; this.context = null;
    this.rhythm = new RhythmClock(); this.personal = new PersonalNotes();
    this.mode = 'off'; this.bpm = 120; this.url = null; this.lastStatus = 'menu';
    this.played = {}; this.loadSerial = 0;
  }
  async unlock() {
    this.context ??= new AudioContext();
    if (!this.master) {
      const c=this.context;
      this.master=c.createGain(); this.master.connect(c.destination);
      this.source=c.createMediaElementSource(this.media);
      this.analyser=c.createAnalyser(); this.analyser.fftSize=2048;
      this.source.connect(this.analyser).connect(this.master);
      this.bins=new Uint8Array(this.analyser.frequencyBinCount);
      this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);
      const a=this.noise.getChannelData(0);let seed=9241;
      for(let i=0;i<a.length;i++){seed=(seed*16807)%2147483647;a[i]=seed/1073741824-1;}
    }
    this.master.gain.value=this.muted?0:this.volume;
    if(this.context.state==='suspended') await this.context.resume();
  }
  setVolume(value) { this.volume=value; if(this.master)this.master.gain.value=this.muted?0:value; }
  async toggle() { this.playBlocked=false;this.muted=!this.muted;await this.unlock();if(this.muted)this.media.pause();return this.muted; }
  async import(file) {
    if(!file) return;
    this.media.pause();
    if(this.url) URL.revokeObjectURL(this.url);
    this.url=URL.createObjectURL(file);
    this.rhythm.reset(); this.personal.reset(); this.loadSerial++;
    this.playBlocked=false;
    await this.unlock();
    await new Promise((resolve,reject)=>{
      const cleanup=()=>{this.media.removeEventListener('loadedmetadata',ready);this.media.removeEventListener('error',failed);};
      const ready=()=>{cleanup();resolve();};
      const failed=()=>{cleanup();this.playBlocked=true;reject(new Error('Format audio illisible'));};
      this.media.addEventListener('loadedmetadata',ready);
      this.media.addEventListener('error',failed);
      this.media.src=this.url; this.media.load();
    });
  }
  reset() { this.personal.reset();this.rhythm.reset();if(this.media.src)this.media.currentTime=0; }
  sync(status) {
    if(status!==this.lastStatus)this.playBlocked=false;
    const play=status==='running'&&!this.muted;
    if(play && this.media.src && this.media.paused && !this.playBlocked) {
      if(!this.playPending){this.playPending=true;this.media.play().catch(()=>{this.playBlocked=true;}).finally(()=>this.playPending=false);}
    } else if(!play&&!this.media.paused)this.media.pause();
    this.lastStatus=status;
  }
  update(dt, status, lane, playerY = 0) {
    this.sync(status);
    if(status!=='running')return;
    let bass=0;
    if(this.analyser){this.analyser.getByteFrequencyData(this.bins);const hz=this.context.sampleRate/this.analyser.fftSize;let n=0;for(let i=Math.ceil(40/hz);i<=Math.floor(180/hz);i++){bass+=this.bins[i]/255;n++;}bass/=Math.max(1,n);}
    const emit=this.mode!=='off'&&!this.media.paused && this.rhythm.sample(this.media.currentTime,this.mode,this.bpm,bass);
    if(this.personal.update(dt,emit,lane,playerY))this.play('personalNote');
  }
  play(event) {
    if(this.muted||!this.context||!this.master)return;
    const c=this.context,t=c.currentTime;
    this.played[event]=(this.played[event]||0)+1;
    const tone=(from,to,duration,type='sine',gain=.16,delay=0)=>{
      const o=c.createOscillator(),v=c.createGain(),start=t+delay;
      o.type=type;o.frequency.setValueAtTime(from,start);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),start+duration);
      v.gain.setValueAtTime(.001,start);v.gain.exponentialRampToValueAtTime(gain,start+.008);v.gain.exponentialRampToValueAtTime(.001,start+duration);
      o.connect(v).connect(this.master);o.start(start);o.stop(start+duration+.02);
    };
    const noise=(duration,frequency,gain=.18,type='bandpass')=>{
      const s=c.createBufferSource(),f=c.createBiquadFilter(),v=c.createGain();s.buffer=this.noise;f.type=type;f.frequency.setValueAtTime(frequency,t);f.frequency.exponentialRampToValueAtTime(Math.max(70,frequency/5),t+duration);f.Q.value=.8;
      v.gain.setValueAtTime(gain,t);v.gain.exponentialRampToValueAtTime(.001,t+duration);
      s.connect(f).connect(v).connect(this.master);s.start(t);s.stop(t+duration);
    };
    switch(event){
      case 'draw': noise(.1,1700,.05);break;
      case 'arrow':noise(.13,5000,.23);tone(1500,550,.12,'triangle',.09);break;
      case 'sword':noise(.25,3400,.24);tone(320,70,.22,'triangle',.12);break;
      case 'slash':noise(.2,1400,.27);tone(160,45,.2,'sawtooth',.11);break;
      case 'break':case 'arrowHit':noise(.42,2100,.35,'lowpass');tone(100,28,.38,'triangle',.28);tone(1350,300,.17,'square',.045,.04);break;
      case 'monsterDeath':noise(.48,1200,.24,'lowpass');tone(170,28,.44,'sawtooth',.1);tone(80,25,.4,'sine',.2);break;
      case 'electric':case 'zap':case 'power':noise(.35,5800,.16);tone(70,850,.22,'sawtooth',.075);tone(1400,130,.32,'triangle',.12);break;
      case 'shieldHit':noise(.2,2400,.18);tone(250,65,.3,'triangle',.24);tone(850,560,.28,'square',.045);break;
      case 'unshield':noise(.34,4100,.24);tone(1800,120,.4,'sawtooth',.09);break;
      case 'switch':case 'return':tone(160,1200,.32,'triangle',.13);tone(600,200,.3,'sine',.1,.08);noise(.22,6200,.1);break;
      case 'damage':noise(.15,800,.17);tone(130,45,.23,'sawtooth',.1);break;
      case 'note':case 'personalNote':tone(880,1100,.1,'sine',.08);tone(1320,1320,.14,'sine',.06,.055);break;
      case 'jump':tone(170,410,.11,'sine',.07);break;
      case 'request':tone(600,800,.1,'triangle',.06);break;
      case 'cancel':tone(230,110,.18,'triangle',.08);break;
    }
  }
}

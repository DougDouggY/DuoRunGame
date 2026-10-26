import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
function wav(frequency){
 const rate=22050,seconds=6,n=rate*seconds,b=Buffer.alloc(44+n*2);
 b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++){const t=i/rate,phase=t%.5,envelope=phase<.08?Math.exp(-phase*40):0;b.writeInt16LE(Math.round(Math.sin(t*frequency*Math.PI*2)*envelope*18000),44+i*2);}return b;
}
try{
 const pages=await Promise.all([browser.newPage(),browser.newPage()]);const errors=[],uploads=[];
 for(const [i,p] of pages.entries()){
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')uploads.push(r.url());});
  await p.goto('http://127.0.0.1:8080');await p.waitForFunction(()=>window.duoRush);
  await p.click('#sound');await p.setInputFiles('#audio',{name:`private-${i}.wav`,mimeType:'audio/wav',buffer:wav(i?95:65)});
  await p.waitForFunction(()=>duoRush.sound.media.readyState>=2);
  await p.selectOption('#rhythm','bars');await p.fill('#bpm','120');await p.locator('#bpm').dispatchEvent('change');
  assert.match(await p.locator('#audio-status').innerText(),/privé/);
  await p.click('#play');
  await p.evaluate(()=>{duoRush.game.schedule=[];duoRush.game.objects=[];});
  await p.waitForFunction(()=>duoRush.sound.media.currentTime>.05);
  assert.match(await p.evaluate(()=>duoRush.sound.media.src),/^blob:/);
 }
 // Different imported files remain separate, even when the other client is reset.
 assert.notEqual(await pages[0].evaluate(()=>duoRush.sound.media.src),await pages[1].evaluate(()=>duoRush.sound.media.src));
 const p=pages[1];await p.evaluate(()=>{duoRush.sound.media.currentTime=3.82;duoRush.sound.rhythm.reset();});
 await p.waitForFunction(()=>duoRush.sound.personal.notes.length>0,null,{timeout:3000});
 await p.waitForFunction(()=>duoRush.sound.personal.score>0,null,{timeout:3000});
 await p.click('#pause');const time=await p.evaluate(()=>duoRush.sound.media.currentTime);
 await p.waitForTimeout(160);assert.equal(await p.evaluate(()=>duoRush.sound.media.currentTime),time);
 await p.click('#pause');await p.waitForFunction(t=>duoRush.sound.media.currentTime>t,time);
 await p.locator('#volume').fill('0.2');await p.locator('#volume').dispatchEvent('input');
 assert.equal(await p.evaluate(()=>duoRush.sound.master.gain.value.toFixed(1)),'0.2');
 await p.selectOption('#rhythm','kicks');
 await p.evaluate(()=>{duoRush.sound.media.currentTime=0;duoRush.sound.rhythm.reset();duoRush.sound.personal.reset();});
 await p.waitForFunction(()=>duoRush.sound.personal.notes.length>0||duoRush.sound.personal.score>0,null,{timeout:6500});
 assert.equal(await p.evaluate(()=>duoRush.game.score),0);
 // Render actual synthesis offline and inspect output samples, not just event counters.
 const energies=await p.evaluate(async()=>{
  const {GameAudio}=await import('/src/audio.js?v=4.4.0');const result={};
  for(const event of ['arrow','sword','slash','break','monsterDeath','electric','zap','shieldHit','unshield','switch','return']){
   const a=new GameAudio();a.muted=false;a.context=new OfflineAudioContext(1,24000,48000);a.master=a.context.createGain();a.master.connect(a.context.destination);
   a.noise=a.context.createBuffer(1,48000,48000);const n=a.noise.getChannelData(0);for(let i=0;i<n.length;i++)n[i]=Math.sin(i*13.37)*.8;
   a.play(event);const buffer=await a.context.startRendering();const samples=buffer.getChannelData(0);let sum=0;for(const v of samples)sum+=v*v;result[event]=Math.sqrt(sum/samples.length);
  }return result;
 });
 for(const [event,rms] of Object.entries(energies))assert.ok(rms>.001,`${event} has no audible signal`);
 await pages[0].setInputFiles('#audio',{name:'broken.mp3',mimeType:'audio/mpeg',buffer:Buffer.from('invalid audio fixture')});
 await pages[0].waitForFunction(()=>document.querySelector('#audio-status').textContent.includes('Impossible'));
 assert.equal(uploads.length,0);assert.deepEqual(errors,[]);
 console.log('Audio Chromium PASS: two independent local WAV imports, zero uploads, BPM and real analyser kick notes, personal counter, pause/resume, volume, 11 synthesized sound effects with measured non-silent PCM.');
 console.log('Effect RMS',energies);
}finally{await browser.close();}

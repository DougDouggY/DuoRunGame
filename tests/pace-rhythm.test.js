import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {paceFactor,worldDistance,bowTiming} from '../src/pace.js';
import {buildLevel,validateLevel} from '../src/sequences.js';
import {OBSTACLES,SPEEDS} from '../src/config.js';
import {animationFrames} from '../src/animation.js';
import {RhythmClock,PersonalNotes} from '../src/rhythm.js';
function running(speed=180){const g=new Game();g.speed=speed;g.schedule=[];g.ai=[false,false];g.status='running';return g;}
test('speed ramps continuously after the introduction, freezes on pause, and scheduled geometry never teleports',()=>{
 const g=running(600);g.schedule=[{id:1,type:'note',at:50,lane:0}];g.update(44);
 const x=g.objects[0].x,speed=g.speed;g.update(.01);
 assert.ok(g.speed>speed);assert.ok(Math.abs(x-g.objects[0].x-g.speed*.01)<.01);
 assert.ok(Math.abs(g.scroll-worldDistance(g.time,600))<1e-6);
 g.status='paused';const state=[g.time,g.speed,g.scroll];g.update(50);assert.deepEqual([g.time,g.speed,g.scroll],state);
 assert.equal(paceFactor(0),1);assert.equal(paceFactor(90),1.25);assert.equal(paceFactor(1000),1.25);
});
test('bow retains all poses, releases at pose 12, and reloads faster at higher speeds',()=>{
 let previous=Infinity;
 for(const speed of [180,350,600,800,1000,1250]){
  const g=running(speed),t=bowTiming(speed);g.action(0,'weapon');
  assert.ok(t.release<=previous);previous=t.release;
  assert.equal(animationFrames(g.players[0],0,speed).weapon,0);
  g.update(t.release-.009);assert.equal(g.stats.arrows,0);
  g.update(.011);assert.equal(g.stats.arrows,1);
  assert.ok(animationFrames(g.players[0],g.time,speed).weapon>=11);
  assert.equal(animationFrames({...g.players[0],weaponAge:t.duration-.0001},0,speed).weapon,15);
  g.update(t.cooldown);assert.ok(g.action(0,'weapon'));
 }
 assert.ok(bowTiming(1000).release<.2);assert.ok(bowTiming(1000).cooldown<.4);
});
test('late classic encounters are denser while authored switch return corridors stay empty',()=>{
 const level=buildLevel(),hazards=level.filter(o=>OBSTACLES[o.type]&&!OBSTACLES[o.type].mechanism);
 assert.ok(hazards.length>75);
 const times=[...new Set(hazards.map(o=>o.at))].sort((a,b)=>a-b);
 const gaps=(lo,hi)=>times.slice(1).map((t,i)=>({t,gap:t-times[i]})).filter(o=>o.t>=lo&&o.t<hi).map(o=>o.gap);
 const average=a=>a.reduce((x,y)=>x+y,0)/a.length;
 assert.ok(average(gaps(90,130))<average(gaps(0,20)));
 assert.ok(gaps(90,110).some(t=>t<1.8));
 for(const o of hazards.filter(o=>o.swap))assert.ok(!hazards.some(n=>n.flow&&n.at>=o.at+.9&&n.at<=o.at+5.7));
 for(const s of SPEEDS)assert.deepEqual(validateLevel(level,s.value),[]);
 assert.ok(validateLevel([{id:1,type:'crate',lane:0,at:5},{id:2,type:'barrier',lane:0,at:5.2}],600).length>0);
});
test('local music notes emit once every eight beats; seek, loops and restart do not burst',()=>{
 for(const bpm of [60,120,180]){
  const clock=new RhythmClock(),events=[];
  for(let i=0;i<=2400;i++){const t=i/100;if(clock.sample(t,'bars',bpm))events.push(t);}
  const interval=480/bpm;assert.equal(events.length,Math.floor(24/interval));
  events.forEach((t,i)=>assert.ok(Math.abs(t-(i+1)*interval)<.011));
  assert.equal(clock.sample(0,'bars',bpm),false);assert.equal(clock.sample(100,'bars',bpm),false);
 }
});
test('kick detector counts eight separated low-frequency onsets, not a sustained tone',()=>{
 const c=new RhythmClock();let fires=0;
 for(let i=0;i<410;i++)if(c.sample(i*.01,'kicks',120,i%50<3?.8:.01))fires++;
 assert.equal(fires,1);
 const steady=new RhythmClock();let n=0;for(let i=0;i<1000;i++)n+=+steady.sample(i*.01,'kicks',120,.8);assert.equal(n,0);
});
test('personal notes stay in a separate counter and follow the requesting player lane',()=>{
 const notes=new PersonalNotes(),g=running();notes.update(0,true,1);assert.equal(notes.notes[0].lane,1);
 notes.update(1.16,false,1);assert.equal(notes.score,1);assert.equal(g.score,0);assert.equal(g.objects.length,0);
 notes.reset();assert.equal(notes.score,0);
});

test('personal notes use actual lane/height contact and cannot be collected midair on the other route',()=>{
 const p=new PersonalNotes();p.update(0,true,1);p.update(1.25,false,0,0);assert.equal(p.score,0);
 p.update(.4,false,1,0);assert.equal(p.score,0);
 p.update(0,true,1);p.update(1.25,false,1,150);assert.equal(p.score,0);
 p.update(.4,false,1,0);assert.equal(p.score,0);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ambientMotion,runCadence,frameBlend,swordFrame} from '../src/motion.js';
import {OBSTACLES,CEILING_SWITCH} from '../src/config.js';
test('notes and drones animate identically at all scroll speeds and positions',()=>{
 for(const type of ['note','heart','shield','energy','drone'])for(let t=0;t<5;t+=.031){
  const expected=ambientMotion({id:7,type,x:800},t);
  for(const speed of [180,280,400,600,800])assert.deepEqual(ambientMotion({id:7,type,x:800-speed*t,speed},t),expected);
 }
});
test('run cadence remains readable and frame blending is continuous at wrap',()=>{
 for(const speed of [180,280,400,600,800])assert.ok(runCadence(speed)>=14&&runCadence(speed)<=22);
 const end=frameBlend(11.999999,12),start=frameBlend(12,12);
 assert.equal(end.next,start.current);assert.ok(end.mix>.999);
 for(let i=0;i<120;i++){const f=frameBlend(i/10,12);assert.ok(f.mix>=0&&f.mix<=1);}
});
test('dash atlas contains twelve full poses; corrected actor registration is bounded',()=>{
 const dir=new URL('../assets/characters/v43/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('frames.json',dir)));
 const bytes=readFileSync(new URL('neon-dash.png',dir));assert.equal(bytes.readUInt32BE(16),384*12);assert.equal(bytes.readUInt32BE(20),240);
 for(const name of ['neon-run','inda-run','inda-weapon'])assert.ok(manifest[name].shifts.every(dx=>Math.abs(dx)<=28));
 assert.equal(swordFrame(.4),9);assert.equal(swordFrame(.799),17);
});
test('larger obstacle hitboxes and ceiling aim remain aligned with illustrated geometry',()=>{
 assert.equal(OBSTACLES.crate.h,88);assert.equal(OBSTACLES.armored.h,132);
 assert.ok(CEILING_SWITCH.aimHeight<=CEILING_SWITCH.top&&CEILING_SWITCH.aimHeight>=CEILING_SWITCH.top-CEILING_SWITCH.height);
});

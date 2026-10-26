import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {normalizeRelayURL,parseInvitation,RelaySession} from '../src/relay.js';
import {Game} from '../src/game.js';
const origin='https://dougdouggy.github.io';
const mf=new Miniflare({modules:true,script:await readFile(new URL('../cloudflare/worker.js',import.meta.url),'utf8'),compatibilityDate:'2026-07-01',bindings:{CLIENT_ORIGINS:origin,ROOM_CREATION_KEY:'unit-test-only',ROOM_TTL_SECONDS:'21600'},durableObjects:{ROOMS:{className:'DuoRoom',useSQLite:true}}});
after(()=>mf.dispose());
async function create(key='unit-test-only',from=origin){
 return mf.dispatchFetch('https://relay/api/rooms',{method:'POST',headers:{Origin:from,'X-Room-Key':key}});
}
async function open(room,role='guest',token){
 const response=await mf.dispatchFetch(`https://relay/api/rooms/${room.code}/socket?role=${role}`,{headers:{Origin:origin,Upgrade:'websocket','Sec-WebSocket-Protocol':'duo-rush-v1'+(role==='host'?', host.'+(token||room.hostToken):'')}});
 if(response.status!==101)return {response};
 const ws=response.webSocket,messages=[];ws.addEventListener('message',e=>messages.push(e.data));ws.accept();
 await new Promise(resolve=>setTimeout(resolve,20));return {ws,messages,response};
}
const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
test('room creation requires the private owner key and approved game origin',async()=>{
 assert.equal((await create('wrong')).status,401);assert.equal((await create('unit-test-only','https://untrusted.example')).status,403);
 const r=await create();assert.equal(r.status,201);const room=await r.json();assert.match(room.code,/^[a-f0-9]{32}$/);assert.match(room.hostToken,/^[a-f0-9]{64}$/);
 const preflight=await mf.dispatchFetch('https://relay/api/rooms',{method:'OPTIONS',headers:{Origin:origin}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
});
test('two real Durable Object sockets relay host state, guest actions and native ping; forged roles rejected',async()=>{
 const room=await (await create()).json();assert.equal((await open(room,'host','0'.repeat(64))).response.status,403);
 const host=await open(room,'host'),guest=await open(room);
 assert.equal((await open(room)).response.status,409);
 host.ws.send(JSON.stringify({type:'state',state:{time:12,status:'running',players:[{id:0},{id:1}]},sounds:['arrow']}));
 guest.ws.send(JSON.stringify({type:'action',action:'jump'}));guest.ws.send('ping');await pause();
 assert.ok(guest.messages.includes('pong'));
 assert.ok(guest.messages.some(m=>m.includes('"sounds":["arrow"]')));
 assert.ok(host.messages.some(m=>m.includes('"action":"jump"')));
 const before=host.messages.length;guest.ws.send(JSON.stringify({type:'state',state:{time:999,status:'running',players:[{},{}]}}));guest.ws.send('{broken');await pause();assert.equal(host.messages.length,before);
 guest.ws.close(1000);await pause();assert.ok(host.messages.some(m=>m.includes('peer-left')));host.ws.close(1000);
});
test('private invitations exclude host credentials; non-HTTPS remote relays rejected',()=>{
 assert.equal(normalizeRelayURL('http://127.0.0.1:8787'),'http://127.0.0.1:8787');
 for(const bad of ['http://remote.example','javascript:alert(1)','https://user:secret@example.com','https://example.com/path'])assert.throws(()=>normalizeRelayURL(bad));
 const code='a'.repeat(32);assert.equal(parseInvitation(`https://game.example/#room=${code}&server=https%3A%2F%2Frelay.example`,'').code,code);
 const n=new RelaySession(new Game());n.code=code;n.server='https://relay.example';n.credentials={hostToken:'private'};
 assert.ok(!n.invitation('https://game.example/').includes('private'));
});
test('guest interpolation smooths objects without mutating authoritative state',()=>{
 const g=new Game(),r=new RelaySession(g);g.status='running';r.role='guest';
 const state=(time,x)=>({time,status:'running',scroll:x,distance:x/20,switching:0,players:[{id:0,lane:0,y:x},{id:1,lane:1,y:0}],objects:[{id:1,x}],projectiles:[{id:1,x,y:70,progress:.5,life:1}]});
 r.frames=[{at:100,state:state(1,100)},{at:150,state:state(1.05,150)}];const view=r.view(205);
 assert.equal(view.objects[0].x,125);assert.equal(view.players[0].y,125);assert.equal(view.projectiles[0].x,125);assert.equal(g.objects.length,0);
});
test('relay sends no repeated snapshots while paused and resumes at up to 20/s',()=>{
 const g=new Game(),r=new RelaySession(g);r.role='host';r.connected=true;let n=0;
 r.channel={readyState:'open',bufferedAmount:0,send(){n++;}};
 for(let t=0;t<2000;t+=10)r.tick(t);assert.equal(n,1);
 g.status='running';for(let t=2000;t<3000;t+=10)r.tick(t);assert.equal(n,21);
 g.status='paused';for(let t=3000;t<5000;t+=10)r.tick(t);assert.equal(n,22);
});
test('oversized packets and runaway action floods are closed',async()=>{
 const room=await (await create()).json(),host=await open(room,'host'),guest=await open(room);let closed=false;
 guest.ws.addEventListener('close',()=>closed=true);guest.ws.send('x'.repeat(50*1024));await pause();assert.equal(closed,true);
 host.ws.close(1000);
 const second=await (await create()).json(),g=await open(second);let flooded=false;g.ws.addEventListener('close',()=>flooded=true);
 for(let i=0;i<20;i++)g.ws.send(JSON.stringify({type:'action',action:'jump'}));await pause();assert.equal(flooded,true);
});

test('independent private rooms cannot receive each other’s packets',async()=>{
 const first=await (await create()).json(),second=await (await create()).json();
 const a=await open(first,'host'),b=await open(second);
 a.ws.send(JSON.stringify({type:'state',state:{time:123,status:'running',players:[{},{}]}}));await pause();
 assert.ok(!b.messages.some(m=>m.includes('123')));a.ws.close(1000);b.ws.close(1000);
});
test('native room alarm expires active sockets and prevents late joins',async()=>{
 const room={code:'f'.repeat(32)};
 const namespace=await mf.getDurableObjectNamespace('ROOMS');
 const stub=namespace.get(namespace.idFromName(room.code));
 const initialized=await stub.fetch('https://room/init',{method:'POST',body:JSON.stringify({hostHash:'not-used-by-guest',expiresAt:Date.now()+800})});
 assert.equal(initialized.status,200);
 const guest=await open(room);let closed=false;guest.ws.addEventListener('message',e=>{if(e.data.includes('expired')){closed=true;guest.ws.close(1000);}});
 for(let i=0;i<100&&!closed;i++)await pause();
 assert.equal(closed,true);assert.equal((await open(room)).response.status,404);
});

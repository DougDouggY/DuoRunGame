import {Miniflare} from 'miniflare';
import {readFile} from 'node:fs/promises';
// Deliberately local-only: this key is not a production secret.
const mf=new Miniflare({modules:true,script:await readFile('cloudflare/worker.js','utf8'),port:8787,host:'127.0.0.1',compatibilityDate:'2026-07-01',bindings:{CLIENT_ORIGINS:'http://127.0.0.1:8080,http://localhost:8080',ROOM_CREATION_KEY:'local-duo-test',ROOM_TTL_SECONDS:'21600'},durableObjects:{ROOMS:{className:'DuoRoom',useSQLite:true}}});
console.log('Local relay:',String(await mf.ready));
console.log('Local-only creation key: local-duo-test');
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await mf.dispose();process.exit(0);});

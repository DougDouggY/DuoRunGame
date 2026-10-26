import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {wranglerEnv} from './wrangler-env.mjs';
const cli='node_modules/wrangler/bin/wrangler.js';
function run(args,input) {
  return new Promise((resolve,reject)=>{
    let output='';
    const capture=args[0]==='deploy';
    const child=spawn(process.execPath,[cli,...args],{env:wranglerEnv(),stdio:[input===undefined?'inherit':'pipe',capture?'pipe':'inherit','inherit']});
    if(capture)child.stdout.on('data',data=>{output+=data;process.stdout.write(data);});
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve(output):reject(new Error('Cloudflare a refusé l’opération. Vérifiez la connexion et les permissions du compte.')));
    if(input!==undefined)child.stdin.end(input+'\n');
  });
}
async function deploy() {
try {
  if(!process.env.ROOM_CREATION_KEY&&!process.stdin.isTTY)
    throw new Error('Renseignez ROOM_CREATION_KEY dans les paramètres sécurisés, ou exécutez ce script dans votre terminal pour saisir la clé privée. Ne la collez pas dans le chat.');
  // A dry-run is available separately. Never create a temporary/foreign account.
  const deployed=await run(['deploy','--config','cloudflare/wrangler.jsonc']);
  const url=deployed.match(/https:\/\/[a-z0-9.-]+\.workers\.dev\b/i)?.[0];
  if(!url)throw new Error('Aucune adresse workers.dev trouvée. Consultez la sortie de Cloudflare ; ne devinez pas une adresse.');
  await run(['secret','put','ROOM_CREATION_KEY','--config','cloudflare/wrangler.jsonc'],process.env.ROOM_CREATION_KEY);
  let verified=false;
  for(let attempt=0;attempt<6&&!verified;attempt++) {
    try {
      const response=await fetch(url+'/health',{signal:AbortSignal.timeout(10000)});
      const health=await response.json();
      verified=response.ok&&health.service==='duo-rush-relay'&&health.configured;
    } catch { /* A rollout can briefly serve the previous version. */ }
    if(!verified)await new Promise(resolve=>setTimeout(resolve,1000));
  }
  if(!verified)throw new Error('Le serveur déployé ne confirme pas sa configuration.');
  await writeFile('src/online-config.js',`// Public relay address only. Never put API tokens or room keys in this file.\nexport const ONLINE_URL = ${JSON.stringify(url)};\n`);
  console.log('\nRelais vérifié : '+url);
  console.log('src/online-config.js est prêt. Publiez les fichiers du jeu après les tests, puis créez votre salle depuis DUO À DISTANCE.');
} catch(error) {console.error(error.message);process.exitCode=1;}

}
// Native fetch needs this startup option behind an environment HTTPS proxy.
// Keep TLS verification enabled and retain normal behavior without a proxy.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && process.env.NODE_USE_ENV_PROXY !== '1' && process.allowedNodeEnvironmentFlags.has('--use-env-proxy')) {
  const child=spawn(process.execPath,['--use-env-proxy',fileURLToPath(import.meta.url)],{stdio:'inherit',env:{...process.env,NODE_USE_ENV_PROXY:'1'}});
  child.on('error',error=>{console.error(error.message);process.exitCode=1;});
  child.on('exit',code=>process.exitCode=code??1);
} else await deploy();

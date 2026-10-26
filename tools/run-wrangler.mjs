import {spawn} from 'node:child_process';
import {wranglerEnv} from './wrangler-env.mjs';
const processHandle=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...process.argv.slice(2)],{env:wranglerEnv(),stdio:'inherit'});
processHandle.on('error',e=>{console.error(e.message);process.exitCode=1;});
processHandle.on('exit',code=>process.exitCode=code??1);

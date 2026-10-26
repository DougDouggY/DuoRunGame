import {tmpdir} from 'node:os';
import {join} from 'node:path';
export function wranglerEnv() {
  const env={...process.env,WRANGLER_SEND_METRICS:'false'};
  // Codex's default home may be read-only. Keep tool state outside the checkout.
  // On a normal developer computer, retain the existing OAuth configuration.
  if(env.CODEX_ENVIRONMENT_ID) {
    env.XDG_CONFIG_HOME ||= join(tmpdir(),'duo-cloudflare-config');
    env.WRANGLER_LOG_PATH ||= join(tmpdir(),'duo-wrangler.log');
  }
  return env;
}

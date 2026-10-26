// A private two-player relay. No game tick, audio, per-frame database writes,
// intervals or external services. Room sockets use Durable Object hibernation.
const CODE = /^[a-f0-9]{32}$/;
const ACTIONS = new Set(['jump', 'slide', 'power', 'weapon', 'switch']);
const MAX_PACKET = 48 * 1024;
const encoder = new TextEncoder();
function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
function randomHex(bytes) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
}
async function digest(value) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('');
}
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let different = 0; for (let i = 0; i < a.length; i++) different |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return different === 0;
}
function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return !!origin && (env.CLIENT_ORIGINS || '').split(',').map(s => s.trim()).includes(origin);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET')
      return json({ service: 'duo-rush-relay', version: 1, configured: !!env.ROOM_CREATION_KEY });
    if (!allowedOrigin(request, env)) return json({ error: 'Origine du jeu non autorisée.' }, 403);
    const cors = { 'Access-Control-Allow-Origin': request.headers.get('Origin'), 'Vary': 'Origin' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
      ...cors, 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Room-Key', 'Access-Control-Max-Age': '600',
    }});
    if (url.pathname === '/api/rooms' && request.method === 'POST') {
      if (!env.ROOM_CREATION_KEY) return json({ error: 'La clé de création du serveur doit être configurée.' }, 503, cors);
      if (!equal(request.headers.get('X-Room-Key'), env.ROOM_CREATION_KEY))
        return json({ error: 'Clé de création incorrecte.' }, 401, cors);
      const code = randomHex(16), token = randomHex(32);
      const ttl = Math.min(43200, Math.max(600, Number(env.ROOM_TTL_SECONDS) || 21600));
      const room = env.ROOMS.get(env.ROOMS.idFromName(code));
      const response = await room.fetch(new Request('https://room/init', { method: 'POST', body: JSON.stringify({
        hostHash: await digest(token), expiresAt: Date.now() + ttl * 1000,
      }) }));
      if (!response.ok) return json({ error: 'Création de salle impossible.' }, 503, cors);
      return json({ code, hostToken: token, expiresAt: Date.now() + ttl * 1000 }, 201, cors);
    }
    const match = url.pathname.match(/^\/api\/rooms\/([a-f0-9]{32})\/socket$/);
    if (match && request.method === 'GET' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
    }
    return json({ error: 'Route inconnue.' }, 404, cors);
  },
};
export class DuoRoom {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/init' && request.method === 'POST') {
      if (await this.ctx.storage.get('room')) return json({ error: 'Salle existante.' }, 409);
      const room = await request.json();
      await this.ctx.storage.put('room', room);
      await this.ctx.storage.setAlarm(room.expiresAt);
      return json({ ok: true });
    }
    const room = await this.ctx.storage.get('room');
    if (!room || room.expiresAt <= Date.now()) return json({ error: 'Salle expirée ou introuvable.' }, 404);
    const protocols = (request.headers.get('Sec-WebSocket-Protocol') || '').split(',').map(s => s.trim());
    if (!protocols.includes('duo-rush-v1')) return json({ error: 'Version réseau incompatible.' }, 400);
    const role = url.searchParams.get('role');
    if (!['host', 'guest'].includes(role)) return json({ error: 'Rôle inconnu.' }, 400);
    if (role === 'host') {
      const token = protocols.find(p => /^host\.[a-f0-9]{64}$/.test(p))?.slice(5);
      if (!token || !equal(await digest(token), room.hostHash)) return json({ error: 'Hôte non autorisé.' }, 403);
    }
    const sockets = this.ctx.getWebSockets();
    if (sockets.some(s => s.deserializeAttachment()?.role === role)) return json({ error: 'Ce rôle est déjà occupé.' }, 409);
    if (sockets.length >= 2) return json({ error: 'Cette salle est complète.' }, 409);
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role, window: Date.now(), count: 0 });
    // Native auto-response does not wake the Object for idle keepalives.
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    server.send(JSON.stringify({ type: 'welcome', role, expiresAt: room.expiresAt }));
    for (const socket of this.ctx.getWebSockets()) this.presence(socket);
    return new Response(null, { status: 101, webSocket: client, headers: { 'Sec-WebSocket-Protocol': 'duo-rush-v1' } });
  }
  presence(socket) {
    const roles = this.ctx.getWebSockets().map(s => s.deserializeAttachment()?.role);
    socket.send(JSON.stringify({ type: 'presence', host: roles.includes('host'), guest: roles.includes('guest') }));
  }
  webSocketMessage(socket, message) {
    if (typeof message !== 'string' || encoder.encode(message).byteLength > MAX_PACKET) { socket.close(1009, 'Message trop grand'); return; }
    const attachment = socket.deserializeAttachment();
    if (!attachment) { socket.close(1008, 'Session invalide'); return; }
    const now = Date.now();
    if (now - attachment.window >= 1000) { attachment.window = now; attachment.count = 0; }
    // Plenty for 20 states/s + occasional controls; bound accidental flood costs.
    if (++attachment.count > (attachment.role === 'host' ? 30 : 15)) { socket.close(1008, 'Trop de messages'); return; }
    socket.serializeAttachment(attachment);
    let packet; try { packet = JSON.parse(message); } catch { return; }
    if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return;
    if (packet.type === 'latency' && Number.isFinite(packet.at)) { socket.send(JSON.stringify({ type: 'latency', at: packet.at })); return; }
    if (attachment.role === 'host') {
      if (packet.type !== 'state' || !packet.state || !Number.isFinite(packet.state.time) || !['menu','running','paused','over','win'].includes(packet.state.status)) return;
      if (!Array.isArray(packet.state.players) || packet.state.players.length !== 2) return;
    } else if (!(packet.type === 'action' && ACTIONS.has(packet.action)) && packet.type !== 'pause') return;
    // Forward only recognized packet fields. No room-token or music payloads.
    const outgoing = attachment.role === 'host'
      ? JSON.stringify({ type: 'state', state: packet.state, sounds: Array.isArray(packet.sounds) ? packet.sounds.filter(s => typeof s === 'string').slice(0,128) : [] })
      : JSON.stringify(packet.type === 'pause' ? { type: 'pause' } : { type: 'action', action: packet.action });
    for (const other of this.ctx.getWebSockets()) if (other !== socket && other.deserializeAttachment()?.role !== attachment.role) other.send(outgoing);
  }
  webSocketClose(socket, code, reason) {
    socket.close([1005,1006,1015].includes(code) ? 1000 : code, reason);
    // Exclude closing socket: it can still appear in getWebSockets during callback.
    for (const other of this.ctx.getWebSockets()) if (other !== socket) other.send(JSON.stringify({ type:'peer-left', role: socket.deserializeAttachment()?.role }));
  }
  webSocketError(socket) { this.webSocketClose(socket, 1011, 'Connexion interrompue'); }
  async alarm() {
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(JSON.stringify({type:'expired'}));
      socket.close(1000, 'Salle expirée');
    }
    await this.ctx.storage.deleteAll();
  }
}

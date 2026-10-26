import { PeerSession, FIELDS } from './network.js?v=4.5.0';
export function normalizeRelayURL(value) {
  let url; try { url=new URL(value); } catch { throw new Error('Renseignez l’adresse HTTPS du serveur de jeu.'); }
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if((url.protocol!=='https:'&&!(local&&url.protocol==='http:'))||url.username||url.password||url.search||url.hash||url.pathname!=='/')
    throw new Error('Adresse attendue : https://votre-serveur.workers.dev');
  return url.origin;
}
export function parseInvitation(text, fallbackServer) {
  let code=text.trim(),server=fallbackServer;
  if(/^https?:\/\//.test(code)) {
    let link;try{link=new URL(code);}catch{throw new Error('Lien de salle invalide.');}
    const data=new URLSearchParams(link.hash.slice(1));code=data.get('room')||'';server=data.get('server')||fallbackServer;
  }
  if(!/^[a-f0-9]{32}$/.test(code))throw new Error('Collez le lien privé ou le code de salle reçu.');
  return {code,server:normalizeRelayURL(server)};
}
export class RelaySession extends PeerSession {
  constructor(game,onStatus) {
    super(game,onStatus);this.socket=null;this.code=null;this.server=null;
    this.sessionActive=false;this.frames=[];this.lastStatus=null;this.lastPing=0;this.rtt=null;
  }
  async create(server,creationKey) {
    server=normalizeRelayURL(server);
    const response=await fetch(server+'/api/rooms',{method:'POST',headers:{'X-Room-Key':creationKey},signal:AbortSignal.timeout(12000)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Création de salle impossible.');
    this.credentials={code:result.code,hostToken:result.hostToken,server};
    sessionStorage.setItem('duoRush.host',JSON.stringify(this.credentials));
    await this.connect(server,result.code,'host',result.hostToken);
    return result.code;
  }
  async join(text,server) {
    const room=parseInvitation(text,server);
    await this.connect(room.server,room.code,'guest');return room.code;
  }
  async reconnect() {
    if(!this.credentials) {
      try{this.credentials=JSON.parse(sessionStorage.getItem('duoRush.host')||'null');}catch{}
    }
    if(!this.credentials)throw new Error('Créez d’abord une salle sur cet appareil.');
    const {server,code,hostToken}=this.credentials;return this.connect(server,code,'host',hostToken);
  }
  connect(server,code,role,hostToken) {
    this.close();this.server=server;this.code=code;this.role=role;this.frames=[];this.lastStatus=null;
    const url=new URL(server+'/api/rooms/'+code+'/socket');url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('role',role);
    const socket=this.socket=new WebSocket(url,['duo-rush-v1',...(role==='host'?['host.'+hostToken]:[])]);
    const adapter={get readyState(){return socket.readyState===WebSocket.OPEN?'open':'closed';},get bufferedAmount(){return socket.bufferedAmount;},send:data=>socket.send(data),close:()=>socket.close(1000,'Départ volontaire')};
    this.bind(adapter);
    return new Promise((resolve,reject)=>{
      let welcomed=false;
      const timeout=setTimeout(()=>{socket.close();reject(new Error('Le serveur ne répond pas. Vérifiez son adresse et votre connexion.'));},12000);
      socket.onmessage=e=>{
        if(e.data==='pong'){this.rtt=Math.round(performance.now()-this.pingAt);return;}
        let message;try{message=JSON.parse(e.data);}catch{return;}
        if(message.type==='welcome') {
          welcomed=true;this.sessionActive=true;clearTimeout(timeout);resolve(code);
          this.onStatus(role==='host'?'Salle créée · en attente d’INDAFRENCH.':'Salle rejointe · en attente de NÉON IV.');return;
        }
        if(message.type==='expired') {
          this.close();this.onStatus('Cette salle a expiré. Créez une nouvelle salle privée.');return;
        }
        if(message.type==='presence') {
          if(message.host&&message.guest) {
            if(!this.connected){this.lastStatus=null;adapter.onopen();}
          } else {this.connected=false;this.onStatus('Salle ouverte · en attente de l’autre joueur.');}
          return;
        }
        if(message.type==='peer-left') {
          this.connected=false;this.frames=[];
          if(this.game.status==='running')this.game.status='paused';
          this.onStatus('L’autre joueur est parti · partie en pause. Il peut rejoindre avec le même lien.');return;
        }
        if(message.type==='state'&&this.role==='guest'&&message.state) {
          if(this.frames.length && message.state.time<this.frames[this.frames.length-1].state.time)this.frames=[];
          this.frames.push({at:performance.now(),state:structuredClone(message.state)});
          this.frames=this.frames.slice(-8);
        }
        adapter.onmessage(e);
      };
      socket.onerror=()=>{if(!welcomed){clearTimeout(timeout);reject(new Error('Connexion refusée : salle expirée, complète, adresse incorrecte ou origine non autorisée.'));}};
      socket.onclose=()=>{
        clearTimeout(timeout);if(this.socket!==socket)return;
        this.sessionActive=false;this.frames=[];adapter.onclose();
        if(!welcomed)reject(new Error('La salle est introuvable, complète ou expirée.'));
      };
    }).catch(error=>{
      if(!this.sessionActive){this.close();this.onStatus(error.message);}
      throw error;
    });
  }
  invitation(pageURL=location.href) {
    if(!this.code||!this.server)return '';
    const link=new URL(pageURL);link.hash=new URLSearchParams({room:this.code,server:this.server}).toString();return link.href;
  }
  tick(now) {
    if(this.socket?.readyState===WebSocket.OPEN&&now-this.lastPing>=20000) {
      this.pingAt=now;this.socket.send('ping');this.lastPing=now;
    }
    if(this.role!=='host'||!this.connected)return;
    const changed=this.lastStatus!==this.game.status;
    if((this.game.status==='running'&&now-this.lastSend>=50)||changed) {
      const state={};for(const field of FIELDS)state[field]=this.game[field];
      if(this.send({type:'state',state,sounds:this.pendingSounds})) {
        this.pendingSounds=[];this.lastStatus=this.game.status;this.lastSend=now;
      }
    }
  }
  // Delayed interpolation is render-only: host collision state and action clocks
  // are never modified. Cap the buffer; lost/stale connections freeze and pause.
  view(now) {
    if(this.role!=='guest'||this.frames.length<2||this.game.status!=='running')return this.game;
    const time=now-80,frames=this.frames;
    let a=frames[0],b=frames[frames.length-1];
    for(let i=1;i<frames.length;i++)if(frames[i].at>=time){a=frames[i-1];b=frames[i];break;}
    if(b.at===a.at||a.state.status!=='running'||b.state.status!=='running')return this.game;
    const mix=Math.max(0,Math.min(1,(time-a.at)/(b.at-a.at)));
    const lerp=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)?x+(y-x)*mix:y;
    const view={...this.game,...b.state};
    for(const key of ['time','scroll','distance','switching'])view[key]=lerp(a.state[key],b.state[key]);
    view.players=b.state.players.map((p,i)=>{
      const old=a.state.players[i];if(old.lane!==p.lane)return p;
      const next={...p};for(const key of ['y','weaponAge','power','weapon','energy','slide','inv'])next[key]=lerp(old[key],p[key]);return next;
    });
    const previous=new Map(a.state.objects.map(o=>[o.id,o]));
    view.objects=b.state.objects.map(o=>({...o,x:lerp(previous.get(o.id)?.x,o.x)}));
    const previousArrows=new Map((a.state.projectiles||[]).map(p=>[p.id,p]));
    view.projectiles=(b.state.projectiles||[]).map(p=>{
      const before=previousArrows.get(p.id);if(!before||p.id===undefined)return p;
      const next={...p};for(const key of ['x','y','progress','life'])next[key]=lerp(before[key],p[key]);return next;
    });
    return view;
  }
  close() {
    const socket=this.socket;this.socket=null;this.sessionActive=false;this.frames=[];this.lastStatus=null;
    super.close();if(socket&&socket.readyState<WebSocket.CLOSING)socket.close();
  }
}

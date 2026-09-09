import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse} from '@simplewebauthn/server';
import {safePlayer} from '../live/contract.mjs';

export const ACCOUNT_FORMAT=1;
const TTL=5*60000,SESSION_MS=30*86400000,CLOUD_LIMIT=2*1024*1024;
export const accountDigest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const fail=(code,status=400)=>{throw Object.assign(Error(code),{status});};
const secret=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
const normalizeCode=value=>typeof value==='string'?value.replace(/[\s-]/g,'').toUpperCase():'';
const codeValid=value=>/^[A-F0-9]{48}$/.test(value);
const b64=value=>btoa(String.fromCharCode(...value)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');

// Account records live outside simulation checkpoints. Game rules never receive
// passkeys, recovery credentials or uploaded offline saves.
export class Accounts {
  constructor(world){this.w=world;this.records=new Map();this.challenges=new Map();this.rates=new Map();}
  async load(){
    const index=await this.w.ctx.storage.get('accounts-index');if(!index)return;
    if(index.format!==ACCOUNT_FORMAT||!Array.isArray(index.ids)||index.ids.length>200)throw Error('ACCOUNT_RECOVERY_REQUIRED');
    for(const id of index.ids){const a=await this.w.ctx.storage.get('account:'+id);
      if(!a||a.id!==id||a.format!==ACCOUNT_FORMAT||!Array.isArray(a.passkeys))throw Error('ACCOUNT_RECOVERY_REQUIRED');
      this.records.set(id,a);
    }
  }
  async commit(account,{checkpoint=false,write}={}){
    try{await this.w.ctx.storage.transaction(async tx=>{
      if(write)await write(tx);
      await tx.put('account:'+account.id,account);
      await tx.put('accounts-index',{format:ACCOUNT_FORMAT,ids:[...new Set([...this.records.keys(),account.id])]});
      if(checkpoint)await tx.put('checkpoint',this.w.checkpoint());
    });this.records.set(account.id,account);}
    catch{this.w.failure='SAVE_UNAVAILABLE';this.w.closeStreams('SAVE_UNAVAILABLE');fail('SAVE_UNAVAILABLE',503);}
  }
  limit(request,sessionKey){
    const now=this.w.now(),id=sessionKey?'session:'+sessionKey:'ip:'+(request.headers.get('CF-Connecting-IP')||'local');
    for(const [key,r] of this.rates)if(r.until<=now)this.rates.delete(key);
    if(!this.rates.has(id)){if(this.rates.size>=1000)fail('RATE_LIMITED',429);this.rates.set(id,{until:now+60000,n:0});}
    if(++this.rates.get(id).n>90)fail('RATE_LIMITED',429);
    for(const [key,c] of this.challenges)if(c.until<=now)this.challenges.delete(key);
  }
  account(session,key){
    const a=session?.accountId&&this.records.get(session.accountId);
    if(!a||a.sessionKey!==key)fail('ACCOUNT_REQUIRED',401);return a;
  }
  summary(a){
    const session=this.w.sessions.get(a.sessionKey),p=this.w.sim.players.get(session?.playerId);
    return {id:a.id,linked:true,passkeys:a.passkeys.map(c=>({id:c.id,createdAt:c.createdAt,backedUp:c.backedUp})),
      recovery:!!a.recoveryHash,canManage:session?.authUntil>this.w.now(),cloud:a.cloud?{revision:a.cloud.revision,updatedAt:a.cloud.updatedAt,summary:a.cloud.summary}:null,
      online:p?{name:p.name,clan:p.clan,age:p.age,generation:this.w.sim.legacy(session.owner).generation}:null};
  }
  challenge(kind,origin,key,options,accountId){
    if(this.challenges.size>=200)fail('RATE_LIMITED',429);
    const id=crypto.randomUUID();this.challenges.set(id,{kind,origin,key,options,accountId,until:this.w.now()+TTL});return {id,options};
  }
  take(body,kind,origin,key){
    const c=this.challenges.get(body.id);this.challenges.delete(body.id);
    if(!c||c.kind!==kind||c.origin!==origin||c.until<=this.w.now()||(kind==='register'&&c.key!==key))fail('AUTH_EXPIRED',401);return c;
  }
  async ticket(account,origin,recovery=false){
    const proof=b64(crypto.getRandomValues(new Uint8Array(32))),a=structuredClone(account);
    a.tickets=(a.tickets||[]).filter(t=>t.until>this.w.now()).slice(-4);
    a.tickets.push({hash:await accountDigest(proof),origin,until:this.w.now()+TTL,recovery,sessionKey:a.sessionKey});
    await this.commit(a);return {proof,account:this.summary(a)};
  }
  async handle(request,{key,session,client}){
    const url=new URL(request.url),path=url.pathname.slice('/api/account/'.length),origin=url.origin;
    if(request.method!=='POST')fail('METHOD_NOT_ALLOWED',405);
    if(request.headers.get('Origin')!==origin||request.headers.get('Sec-Fetch-Site')==='cross-site')fail('ORIGIN_REJECTED',403);
    if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))fail('HTTPS_REQUIRED',400);
    const anonymous=['login-options','login-verify','recover','activate'].includes(path);
    this.limit(request,!anonymous&&session&&session.expires>this.w.now()?key:null);
    const body=await this.w.body(request,path==='cloud-save'?CLOUD_LIMIT+16384:32768);
    if(!anonymous&&key&&(!session||session.expires<=this.w.now()))fail('SESSION_EXPIRED',401);
    if(path==='guest'){
      if(session)return {token:request.headers.get('X-Aerin-Session')};
      if(this.w.sessions.size>=200)fail('WORLD_FULL',503);
      const token=b64(crypto.getRandomValues(new Uint8Array(32))),k=await accountDigest(token);
      this.w.sessions.set(k,{owner:crypto.randomUUID(),ack:0,receipts:[],expires:this.w.now()+SESSION_MS,client,lease:null});
      await this.w.persist();return {token};
    }
    if(path==='status')return session?.accountId?this.summary(this.account(session,key)):{linked:false};
    if(path==='register-options'){
      if(!session)fail('SESSION_REQUIRED',401);
      const a=session.accountId?this.account(session,key):null;
      if(a&&!(session.authUntil>this.w.now()))fail('REAUTH_REQUIRED',401);
      if((a?.passkeys.length||0)>=8)fail('PASSKEY_LIMIT');
      const id=a?.id||crypto.randomUUID();
      const options=await generateRegistrationOptions({rpName:'Bloodline Legacy',rpID:url.hostname,userID:new TextEncoder().encode(id),
        userName:'一族 '+id.slice(0,8)+' · '+(this.w.sim.mode==='demo'?'体験':'通常'),userDisplayName:'血脈の系譜',
        attestationType:'none',supportedAlgorithmIDs:[-7,-257],timeout:120000,
        authenticatorSelection:{residentKey:'required',userVerification:'required'},excludeCredentials:a?.passkeys.map(c=>({id:c.id}))||[]});
      return this.challenge('register',origin,key,options,id);
    }
    if(path==='register-verify'){
      if(!session)fail('SESSION_REQUIRED',401);
      const c=this.take(body,'register',origin,key),existing=session.accountId?this.account(session,key):null;
      if(existing&&(!(session.authUntil>this.w.now())||existing.id!==c.accountId||existing.passkeys.length>=8))fail('REAUTH_REQUIRED',401);
      if([...this.records.values()].some(a=>a.passkeys.some(p=>p.id===body.response?.id)))fail('PASSKEY_ALREADY_LINKED',409);
      const code=normalizeCode(body.recoveryCode);if(!existing&&!codeValid(code))fail('INVALID_RECOVERY_CODE');
      let verified;try{verified=await verifyRegistrationResponse({response:body.response,expectedChallenge:c.options.challenge,
        expectedOrigin:origin,expectedRPID:url.hostname,requireUserVerification:true,supportedAlgorithmIDs:[-7,-257]});}catch{fail('AUTH_FAILED',401);}
      if(!verified.verified)fail('AUTH_FAILED',401);
      const info=verified.registrationInfo,a=existing?structuredClone(existing):{format:ACCOUNT_FORMAT,id:c.accountId,sessionKey:key,passkeys:[],tickets:[],cloud:null};
      a.passkeys.push({...info.credential,publicKey:Array.from(info.credential.publicKey),createdAt:this.w.now(),backedUp:info.credentialBackedUp});
      if(!existing)a.recoveryHash=await accountDigest(code);
      session.accountId=a.id;session.authUntil=this.w.now()+TTL;
      await this.commit(a,{checkpoint:true});return {account:this.summary(a)};
    }
    if(path==='login-options'){
      const options=await generateAuthenticationOptions({rpID:url.hostname,userVerification:'required',timeout:120000});
      return this.challenge('login',origin,null,options);
    }
    if(path==='login-verify'){
      const c=this.take(body,'login',origin),a=[...this.records.values()].find(a=>a.passkeys.some(p=>p.id===body.response?.id));
      if(!a)fail('AUTH_FAILED',401);
      const credential=a.passkeys.find(p=>p.id===body.response.id);
      if(body.response?.response?.userHandle!==b64(new TextEncoder().encode(a.id)))fail('AUTH_FAILED',401);
      let verified;try{verified=await verifyAuthenticationResponse({response:body.response,expectedChallenge:c.options.challenge,
        expectedOrigin:origin,expectedRPID:url.hostname,requireUserVerification:true,credential:{...credential,publicKey:new Uint8Array(credential.publicKey)}});}catch{fail('AUTH_FAILED',401);}
      if(!verified.verified)fail('AUTH_FAILED',401);
      const next=structuredClone(a);next.passkeys.find(p=>p.id===credential.id).counter=verified.authenticationInfo.newCounter;
      return this.ticket(next,origin);
    }
    if(path==='recover'){
      const code=normalizeCode(body.code);if(!codeValid(code))fail('AUTH_FAILED',401);
      const hash=await accountDigest(code),a=[...this.records.values()].find(a=>a.recoveryHash===hash);
      if(!a)fail('AUTH_FAILED',401);return this.ticket(a,origin,true);
    }
    if(path==='reauth'){
      const a=this.account(session,key),hash=await accountDigest(String(body.proof)),ticket=a.tickets?.find(t=>t.hash===hash);
      if(!ticket||ticket.recovery||ticket.used||ticket.sessionKey!==key||ticket.origin!==origin||ticket.until<=this.w.now())fail('AUTH_EXPIRED',401);
      const next={...a,tickets:a.tickets.filter(t=>t.hash!==hash)};session.authUntil=this.w.now()+TTL;
      await this.commit(next,{checkpoint:true});return {account:this.summary(next)};
    }
    if(path==='activate'){
      if(!secret(body.proof)||!secret(body.token))fail('AUTH_FAILED',401);
      const hash=await accountDigest(body.proof),newKey=await accountDigest(body.token),a=[...this.records.values()].find(a=>a.tickets?.some(t=>t.hash===hash));
      const ticket=a?.tickets.find(t=>t.hash===hash);
      if(!ticket||ticket.origin!==origin||ticket.until<=this.w.now())fail('AUTH_EXPIRED',401);
      if(ticket.used){if(ticket.used!==newKey||a.sessionKey!==newKey)fail('AUTH_EXPIRED',401);return {account:this.summary(a)};}
      if(a.sessionKey!==ticket.sessionKey)fail('AUTH_EXPIRED',401);
      if(this.w.sessions.has(newKey))fail('INVALID_SESSION',409);
      const previous=this.w.sessions.get(a.sessionKey);if(!previous)fail('ACCOUNT_RECOVERY_REQUIRED',503);
      const p=this.w.sim.players.get(previous.playerId),active=this.w.streams.has(a.sessionKey);
      // A connected device finishes its interaction first. A disconnected device
      // can resume an in-flight battle or inheritance choice from its exact state.
      if(active&&(!safePlayer(p,p&&this.w.sim.getRoom(p),this.w.sim.time)||(previous.busyUntil>this.w.now()&&key!==a.sessionKey)))fail('WAIT_FOR_SAFE_POINT',409);
      if(!client.supportedRules.includes(this.w.rules))fail('UPDATE_REQUIRED',426);
      const next=structuredClone(a),oldKey=a.sessionKey;
      next.sessionKey=newKey;next.tickets=next.tickets.filter(t=>t.hash===hash);next.tickets[0].used=newKey;
      if(ticket.recovery){const code=normalizeCode(body.recoveryCode);if(!codeValid(code))fail('INVALID_RECOVERY_CODE');next.recoveryHash=await accountDigest(code);}
      this.w.sessions.delete(oldKey);this.w.sessions.set(newKey,{...previous,lease:null,client,expires:this.w.now()+SESSION_MS,authUntil:this.w.now()+TTL,busyUntil:0});
      // Token rotation and account ownership switch commit together; the old
      // credential cannot renew itself at /join after device replacement.
      await this.commit(next,{checkpoint:true});
      const stream=this.w.streams.get(oldKey);if(stream){try{stream.controller.enqueue(this.w.encode({control:'SESSION_REPLACED'}));stream.controller.close();}catch{}this.w.streams.delete(oldKey);}
      return {account:this.summary(next)};
    }
    const a=this.account(session,key);
    if(path==='logout'){
      const p=this.w.sim.players.get(session.playerId);
      if(this.w.streams.has(key)&&!safePlayer(p,p&&this.w.sim.getRoom(p),this.w.sim.time))fail('WAIT_FOR_SAFE_POINT',409);
      const newKey=await accountDigest(b64(crypto.getRandomValues(new Uint8Array(32)))),next={...a,sessionKey:newKey,tickets:[]};
      this.w.sessions.delete(key);this.w.sessions.set(newKey,{...session,lease:null,authUntil:0,busyUntil:0});
      await this.commit(next,{checkpoint:true});
      const stream=this.w.streams.get(key);if(stream){try{stream.controller.enqueue(this.w.encode({control:'SESSION_REPLACED'}));stream.controller.close();}catch{}this.w.streams.delete(key);}
      return {ok:true};
    }
    if(path==='recovery-check')return {valid:await accountDigest(normalizeCode(body.code))===a.recoveryHash};
    if(path==='recovery-code'){
      if(!(session.authUntil>this.w.now()))fail('REAUTH_REQUIRED',401);
      const code=normalizeCode(body.code);if(!codeValid(code))fail('INVALID_RECOVERY_CODE');
      const next={...a,recoveryHash:await accountDigest(code),tickets:[]};await this.commit(next);return {ok:true};
    }
    if(path==='remove-passkey'){
      if(!(session.authUntil>this.w.now()))fail('REAUTH_REQUIRED',401);
      if(a.passkeys.length<=1)fail('LAST_PASSKEY');
      const next={...a,passkeys:a.passkeys.filter(c=>c.id!==body.id),tickets:[]};await this.commit(next);return {account:this.summary(next)};
    }
    if(path==='cloud-load'){
      if(!a.cloud)return {cloud:null};
      const chunks=await Promise.all(Array.from({length:a.cloud.parts},(_,i)=>this.w.ctx.storage.get(`cloud:${a.id}:${a.cloud.revision}:${i}`)));
      if(chunks.some(c=>typeof c!=='string'))fail('CLOUD_RECOVERY_REQUIRED',503);
      const raw=chunks.join('');if(await accountDigest(raw)!==a.cloud.hash)fail('CLOUD_RECOVERY_REQUIRED',503);
      return {cloud:{...a.cloud,raw}};
    }
    if(path==='cloud-save'){
      const revision=a.cloud?.revision||0;
      if(typeof body.raw!=='string'||new TextEncoder().encode(body.raw).length>CLOUD_LIMIT)fail('REQUEST_TOO_LARGE',413);
      const hash=await accountDigest(body.raw);
      if(hash===a.cloud?.hash&&[revision,revision-1].includes(body.revision))return {revision,updatedAt:a.cloud.updatedAt};
      if(body.revision!==revision)fail('CLOUD_CONFLICT',409);
      const Engine=this.w.engines[body.rules];if(!Engine)fail('UPDATE_REQUIRED',426);
      let saved,sim;try{saved=JSON.parse(body.raw);sim=Engine.restore(saved);}catch{fail('INVALID_SAVE');}
      const profile=saved._profile;
      if(sim.mode!==this.w.sim.mode||typeof profile?.owner!=='string'||profile.mode!==sim.mode||profile.online)fail('INVALID_SAVE');
      const p=[...sim.players.values()].filter(p=>p.owner===profile.owner).at(-1);
      if(!p)fail('EMPTY_SAVE');
      const parts=[];for(let i=0;i<body.raw.length;i+=16000)parts.push(body.raw.slice(i,i+16000));
      const cloud={revision:revision+1,parts:parts.length,hash,rules:body.rules,updatedAt:this.w.now(),summary:{clan:p.clan,name:p.name,age:p.age,generation:sim.legacy(profile.owner).generation}};
      const next={...a,cloud,previousCloud:a.cloud||null};
      await this.commit(next,{write:async tx=>{
        for(let i=0;i<parts.length;i++)await tx.put(`cloud:${a.id}:${cloud.revision}:${i}`,parts[i]);
        if(a.previousCloud)for(let i=0;i<a.previousCloud.parts;i++)await tx.delete(`cloud:${a.id}:${a.previousCloud.revision}:${i}`);
      }});return {revision:cloud.revision,updatedAt:cloud.updatedAt};
    }
    fail('NOT_FOUND',404);
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './ui-fixture.cjs';
import {GameWorld} from '../src/server/world.mjs';
import {LiveContract} from '../src/live/contract.mjs';
import {currentRules} from '../src/server/engines/registry.mjs';
import {authenticator} from './account-authenticator.mjs';

function backend(){
 const values=new Map(),store={get:async k=>structuredClone(values.get(k)),put:async(k,v)=>values.set(k,structuredClone(v)),delete:async k=>values.delete(k),transaction:async fn=>{
  const old=structuredClone(values);try{return await fn(store);}catch(e){values.clear();for(const [k,v]of old)values.set(k,v);throw e;}}};
 return new GameWorld({storage:store,blockConcurrencyWhile:fn=>fn()},{APP_ENV:'dev'});
}
function device(t,world=backend(),auth=authenticator()){
 const f=fixture(t),{w,g,api}=f;g.profile.mode='normal';g.loadedMode='normal';g.profile.online=false;g.profile.uiExplained=true;g.profile.clan='暁風';g.saveBaseRaw=null;g.saveWorld();
 g.live={client:{...LiveContract,rules:currentRules,supportedRules:[currentRules]},disconnect(){this.ready=false;},async join(){
  const r=await w.fetch('/api/join',{headers:{'X-Aerin-Session':g.token,'X-Bloodline-Client':JSON.stringify(this.client)},body:'{}'});const packet=await r.json();assert.equal(r.status,200);g.acceptSnapshot(packet.snapshot);
 }};g.renderer.effect=()=>{};
 Object.defineProperty(w,'isSecureContext',{value:true});w.PublicKeyCredential=function(){};
 const encode=api.AccountLink.encoded,decode=api.AccountLink.bytes;
 Object.defineProperty(w.navigator,'credentials',{value:{
  async create({publicKey}){const data=auth.register({...publicKey,challenge:encode(publicKey.challenge),user:{...publicKey.user,id:encode(publicKey.user.id)}},{origin:w.location.origin});return native(data);},
  async get({publicKey}){return native(auth.login({...publicKey,challenge:encode(publicKey.challenge)},{origin:w.location.origin}));}
 }});
 function native(data){return {...data,rawId:decode(data.rawId),getClientExtensionResults:()=>data.clientExtensionResults,response:Object.fromEntries(Object.entries(data.response).map(([k,v])=>k==='transports'?['getTransports',()=>v]:[k,v?decode(v):null]))};}
 const calls=[];w.fetch=async(url,options={})=>{calls.push({url,options});return world.fetch(new Request(new URL(url,w.location),{method:'POST',headers:{...options.headers,Origin:w.location.origin},body:options.body||'{}'}));};
 g.account=new api.AccountLink(g);g.account.start();t.after(()=>g.account.destroy());
 return {...f,account:g.account,world,auth,calls,read:name=>JSON.parse(w.localStorage.getItem(api.STORAGE_PREFIX+'account.'+name+'.normal'))};
}

test('settings registers a real passkey and backs up the existing offline family',async t=>{
 const f=device(t),before=f.g.saveBaseRaw;f.ui.settings();assert.ok(f.d.querySelector('#account-link'));
 await f.account.register();f.account.render();assert.equal(f.account.info.linked,true);assert.equal(f.account.meta.revision,1);
 const loaded=await f.account.api('cloud-load');assert.equal(loaded.cloud.raw,f.g.saveBaseRaw);assert.equal(f.world.sim.players.size,0,'no local save is promoted into multiplayer');
 assert.ok(f.d.querySelector('.account-code').value);assert.ok(!f.d.querySelector('#account-link').textContent.includes(f.account.token));
 assert.equal(JSON.parse(f.g.saveBaseRaw).players[0][1].owner,JSON.parse(before).players[0][1].owner);
});
test('registration cancellation retains the journey and does not claim a linked account',async t=>{
 const f=device(t),before=f.g.saveBaseRaw;f.w.navigator.credentials.create=async()=>{throw Object.assign(Error(),{name:'NotAllowedError'});};
 await f.account.run(()=>f.account.register());assert.match(f.account.message,/キャンセル/);assert.equal(f.world.accounts.records.size,0);assert.equal(f.g.saveBaseRaw,before);
});
test('new-device restore previews the family, keeps the local backup, and fences the old uploader',async t=>{
 const a=device(t);await a.account.register();const source=a.g.saveBaseRaw;
 const b=device(t,a.world,a.auth);b.p.name='別の旅人';b.g.saveWorld();const previous=b.g.saveBaseRaw;b.ui.settings();
 await b.account.signIn();b.account.render();assert.match(b.d.querySelector('#account-link').textContent,/ひとりの旅を引き継ぐ/);assert.equal(b.g.saveBaseRaw,previous,'sign-in alone never replaces the local record');
 await b.account.activate('offline');assert.equal(b.read('previous').raw,previous);assert.equal(b.g.sim.players.get(a.p.id).name,a.p.name);
 assert.equal(JSON.parse(b.g.saveBaseRaw).time,JSON.parse(source).time);assert.equal(b.g.live.ack,0);assert.equal(b.g.screen,'clan');
 a.sim.tick(1/30);a.g.saveWorld();await a.account.run(()=>a.account.upload(true));assert.equal(a.account.meta.auto,false);assert.equal(a.g.blockSave,undefined);
});
test('lost activation response resumes with the pre-saved candidate credential without a second account',async t=>{
 const a=device(t);await a.account.register();const b=device(t,a.world,a.auth);await b.account.signIn();
 const fetch=b.w.fetch;let lost=true;b.w.fetch=async(url,options)=>{const response=await fetch(url,options);if(url.endsWith('/activate')&&lost){lost=false;throw Error('network');}return response;};
 await assert.rejects(()=>b.account.activate('offline'));const pending=b.read('pending');assert.ok(pending.token);
 await b.account.finish(pending);assert.equal(b.account.info.id,a.account.info.id);assert.equal(a.world.accounts.records.size,1);assert.equal(b.read('pending'),null);
});
test('migration failure leaves local progress and retry ticket available',async t=>{
 const a=device(t);await a.account.register();const b=device(t,a.world,a.auth),before=b.g.saveBaseRaw;await b.account.signIn();
 const fetch=b.w.fetch;b.w.fetch=async(url,options)=>{const r=await fetch(url,options);if(url.endsWith('/cloud-load')){const data=await r.json();data.cloud.raw=JSON.stringify({...JSON.parse(data.cloud.raw),schema:999});return Response.json(data);}return r;};
 await assert.rejects(()=>b.account.activate('offline'),/INVALID_SAVE/);assert.equal(b.g.saveBaseRaw,before);assert.equal(b.w.localStorage.getItem(b.api.STORAGE_PREFIX+'world4.normal'),before);assert.ok(b.read('pending'));
 b.w.fetch=fetch;await b.account.finish(b.read('pending'));assert.equal(b.account.meta.revision,1);
});
test('local backup failure prevents device takeover',async t=>{
 const a=device(t);await a.account.register();const b=device(t,a.world,a.auth);await b.account.signIn();
 const set=b.w.Storage.prototype.setItem;b.w.Storage.prototype.setItem=function(key,value){if(key.includes('account.previous'))throw Error('quota');return set.call(this,key,value);};
 await assert.rejects(()=>b.account.activate('offline'),/LOCAL_SAVE_FAILED/);assert.equal((await a.account.api('status')).linked,true);assert.equal(b.read('pending'),null);
});
test('cloud conflicts stop automatic upload while local saving continues',async t=>{
 const f=device(t);await f.account.register();f.account.meta.revision=0;f.sim.tick(1/30);f.g.saveWorld();
 await f.account.run(()=>f.account.upload(true));assert.match(f.account.message,/上書きを止め/);assert.equal(f.account.meta.auto,false);
 f.sim.tick(1/30);assert.equal(f.g.saveWorld(),true);
});
test('autosave does no network work while hidden or within its one-minute interval',async t=>{
 const f=device(t);await f.account.register();const count=f.calls.length;f.account.lastSync=Date.now();f.sim.tick(1/30);f.g.saveWorld();f.account.maybeSave();assert.equal(f.calls.length,count);
 Object.defineProperty(f.w.document,'hidden',{configurable:true,value:true});f.account.lastSync=0;f.account.maybeSave();assert.equal(f.calls.length,count);
});
test('online join hands the actual guest credential to account linking',async t=>{
 const f=device(t),r=await f.w.fetch('/api/join',{headers:{'X-Bloodline-Client':JSON.stringify(f.g.live.client)},body:'{}'}),joined=await r.json();
 f.g.online=true;f.g.token=joined.token;f.account.joined(joined.token);await f.account.register();assert.equal(f.account.token,joined.token);assert.equal(f.account.info.online.name,joined.snapshot.player.name);
 assert.equal(f.world.sim.players.size,1);assert.equal(f.account.info.cloud,null);
});

test('logout clears device credentials and still permits passkey recovery',async t=>{
 const f=device(t);await f.account.register();f.w.confirm=()=>true;
 await f.account.logout();assert.equal(f.account.token,null);assert.equal(f.read('link'),null);assert.ok(f.g.sim.players.has(f.p.id));
 await f.account.signIn();assert.ok(f.account.proposal.account.cloud);
});

test('automatic save does not erase a recovery code being typed',async t=>{
 const f=device(t);await f.account.register();f.ui.settings();await new Promise(resolve=>setTimeout(resolve,20));
 const input=f.d.querySelector('#account-link input');input.value='ABCDEF';input.focus();f.sim.tick(1/30);f.g.saveWorld();await f.account.upload(true);
 assert.equal(input.isConnected,true);assert.equal(input.value,'ABCDEF');assert.equal(f.d.activeElement,input);
});

test('an anonymous online family remains reachable after switching to a linked account',async t=>{
 const a=device(t);await a.account.register();const b=device(t,a.world,a.auth);
 const response=await b.w.fetch('/api/join',{headers:{'X-Bloodline-Client':JSON.stringify(b.g.live.client)},body:'{}'}),guest=await response.json();
 b.g.online=true;b.g.profile.online=true;b.g.token=guest.token;b.account.joined(guest.token);b.g.live.ready=false;
 await b.account.signIn();await b.account.activate('offline');const previous=b.read('previous');assert.equal(previous.token,guest.token);
 await b.account.previousOnline(previous);assert.equal(b.g.snapshot.player.id,guest.playerId);assert.equal(b.g.profile.online,true);
});

test('partial local installation can resume after quota failure without replacing the original backup',async t=>{
 const a=device(t);await a.account.register();const b=device(t,a.world,a.auth),before=b.g.saveBaseRaw;await b.account.signIn();
 const set=b.w.Storage.prototype.setItem;let fail=true;b.w.Storage.prototype.setItem=function(key,value){if(fail&&key.endsWith('online.token.normal')){fail=false;throw Error('quota');}return set.call(this,key,value);};
 await assert.rejects(()=>b.account.activate('offline'),/LOCAL_SAVE_FAILED/);assert.equal(b.read('pending').installing,true);
 b.g.saveWorld();assert.equal(b.g.blockSave,true);
 await b.account.finish(b.read('pending'));assert.equal(b.g.blockSave,false);assert.equal(b.read('previous').raw,before);assert.equal(b.read('pending'),null);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {GameWorld} from '../src/server/world.mjs';
import {engines,currentRules} from '../src/server/engines/registry.mjs';
import {LiveContract,clientCompatible,safeGame,safePlayer} from '../src/live/contract.mjs';
import worker from '../deploy/worker.mjs';
import {assertSafeRollout} from '../deploy/check-rollout.mjs';

const Simulation=engines[currentRules],copy=x=>JSON.parse(JSON.stringify(x));
test('deployment gate rejects unsafe protocol, save and archived-runtime rollback before publishing',()=>{
  const previous={environment:'dev',mode:'game',live:{...LiveContract,supportedRules:['old']}};
  assert.doesNotThrow(()=>assertSafeRollout({...previous,live:{...previous.live,supportedRules:['old','new']}},previous));
  for(const live of [null,{...previous.live,protocol:2},{...previous.live,save:3},{...previous.live,minSave:5},{...previous.live,supportedRules:['new']}])
    assert.throws(()=>assertSafeRollout({...previous,live},previous));
});
function storage(){
  const values=new Map();let fail=false;
  const s={values,get:async k=>structuredClone(values.get(k)),put:async(k,v)=>{if(fail)throw Error('disk');values.set(k,structuredClone(v));},
    transaction:async fn=>{const before=structuredClone(values);try{return await fn(s);}catch(e){values.clear();for(const [k,v]of before)values.set(k,v);throw e;}},break:()=>{fail=true;}};
  return s;
}
function fixture(options={}){
  const store=options.store||storage(),ctx={storage:store,blockConcurrencyWhile:fn=>fn()};let now=1000000;
  const world=new GameWorld(ctx,{APP_ENV:'dev'},{now:()=>now,...options});
  const client={...LiveContract,rules:options.rules||currentRules,supportedRules:[options.rules||currentRules]};
  return {world,store,client,advance:ms=>{now+=ms;}};
}
async function call(f,path,{session,body,client=f.client,headers={}}={}){
  const r=await f.world.fetch(new Request('https://test.invalid/api/'+path,{method:path==='events'?'GET':'POST',headers:{
    'Content-Type':'application/json','X-Bloodline-Client':JSON.stringify(client),
    ...(session?{'X-Aerin-Session':session.token,'X-Bloodline-Lease':session.lease}:{}),...headers},
    ...(path==='events'?{}:{body:JSON.stringify(body||{})})}));
  return {status:r.status,body:path==='events'&&r.ok?r:await r.json()};
}
async function join(f,session,client){const r=await call(f,'join',{session,client,body:{config:{owner:'untrusted',name:'test'},beginLife:true}});assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
function command(session,sequence=1,cmd={type:'talk'}){return {epoch:session.epoch,lease:session.lease,sequence,id:'command-'+sequence,command:cmd};}
function makeSafe(f){for(const p of f.world.sim.players.values())Object.assign(p,{prologue:false,introUntil:0,age:18,pendingSkill:null,combo:null,chain:null,autoFight:null,dash:null,actionUntil:0,motherUntil:0,speechUntil:0,input:{x:0,z:0}});}

test('same-version players share authority; client owner cannot impersonate another family',async()=>{
  const f=fixture(),a=await join(f),b=await join(f);assert.notEqual(a.playerId,b.playerId);assert.notEqual(a.snapshot.player.owner,b.snapshot.player.owner);
  assert.equal(b.snapshot.players.length,2);assert.equal(b.snapshot.room.id,a.snapshot.room.id);assert.equal(f.store.values.get('checkpoint').world.players.length,2);
});
test('compatible visual builds coexist without a build-SHA equality gate',async()=>{
  const f=fixture();await join(f,null,{...f.client,commit:'old'});const b=await join(f,null,{...f.client,commit:'new'});assert.equal(b.snapshot.players.length,2);
  assert.equal(clientCompatible(f.client,LiveContract),true);
});
test('unversioned, incompatible protocol, and unsupported rules cannot mutate the world',async()=>{
  const f=fixture(),a=await join(f),before=copy(f.store.values.get('checkpoint'));
  for(const client of [null,{...f.client,protocol:99},{...f.client,supportedRules:['unknown']}]){
    assert.equal((await call(f,'command',{session:a,body:command(a),client})).status,426);
  }
  assert.deepEqual(copy(f.store.values.get('checkpoint')),before);
});
test('command ACK is durable; duplicate receipt is idempotent; changed/old/out-of-order commands fail',async()=>{
  const f=fixture(),a=await join(f),body=command(a);
  assert.equal((await call(f,'command',{session:a,body})).status,200);const state=copy(f.store.values.get('checkpoint'));
  const duplicate=await call(f,'command',{session:a,body});assert.equal(duplicate.body.duplicate,true);assert.deepEqual(copy(f.store.values.get('checkpoint')),state);
  assert.equal((await call(f,'command',{session:a,body:{...body,command:{type:'gift',item:'bell'}}})).status,409);
  assert.equal((await call(f,'command',{session:a,body:command(a,3)})).status,409);
});
test('disconnect -> deploy -> resume retains player, progress and ACK while fencing old lease',async()=>{
  const f=fixture(),a=await join(f);await call(f,'command',{session:a,body:command(a)});
  const reboot=fixture({store:f.store});const b=await join(reboot,a);
  assert.equal(b.playerId,a.playerId);assert.equal(b.ack,1);assert.notEqual(b.lease,a.lease);
  assert.equal((await call(reboot,'command',{session:a,body:command(a,2)})).status,409);
  assert.equal(reboot.world.sim.players.size,1);
});
test('idle session requires a new lease; credential renewal preserves family; unknown credentials fail',async()=>{
  const f=fixture(),a=await join(f);f.advance(31*86400000);
  assert.equal((await call(f,'command',{session:a,body:command(a)})).status,401);
  const resumed=await join(f,a);assert.equal(resumed.playerId,a.playerId);assert.equal(f.world.sim.players.size,1);
  assert.equal((await call(f,'join',{session:{...a,token:'unknown'}})).status,401);
});
test('SSE reconnect begins with a full recovery snapshot and confirmed command cursor',async()=>{
  const f=fixture(),a=await join(f);const r=await call(f,'events',{session:a});assert.equal(r.status,200);
  const reader=r.body.body.getReader(),packet=JSON.parse(new TextDecoder().decode((await reader.read()).value).slice(6));
  assert.equal(packet.recovery,true);assert.equal(packet.snapshot.player.id,a.playerId);assert.equal(packet.ack,0);
  await reader.cancel();f.world.closeStreams('TEST_END');
});
test('combat-time redeploy retains in-flight attacks and RNG exactly; no forced rules switch',async()=>{
  const f=fixture(),a=await join(f),p=f.world.sim.players.get(a.playerId);
  p.prologue=false;p.pendingSkill={id:4000,at:7};p.combo={band:0,total:1};p.wounds={head:{severity:1}};
  await f.world.persist();const state=copy(f.store.values.get('checkpoint'));
  const g=fixture({store:f.store,rules:'next',engines:{...engines,next:Simulation}});await g.world.ready;await g.world.rollForward();
  assert.equal(g.world.rules,currentRules);assert.deepEqual(copy(g.world.sim.exportState()),state.world);
});
test('rules grace period waits for safe state; old clients are fenced after world migration',async()=>{
  const f=fixture(),a=await join(f);makeSafe(f);await f.world.persist();
  const g=fixture({store:f.store,rules:'next',engines:{...engines,next:Simulation}});await g.world.ready;
  const key=[...g.world.sessions.keys()][0];g.world.streams.set(key,{controller:{enqueue(){},close(){}}});
  await g.world.rollForward();assert.equal(g.world.rules,currentRules);
  g.advance(LiveContract.graceMs+1);await g.world.rollForward();assert.equal(g.world.rules,'next');
  assert.equal(g.store.values.get('migration-backup').rules,currentRules);
  assert.equal((await call(g,'join',{session:a,client:f.client})).status,426);
  const resumed=await join(g,a,{...g.client,supportedRules:[currentRules,'next']});assert.equal(resumed.playerId,a.playerId);
});
test('deploy-immediate new arrivals can join the pinned old rules using the retained compatibility set',async()=>{
  const f=fixture();await join(f);const g=fixture({store:f.store,rules:'next',engines:{...engines,next:Simulation}});
  const b=await join(g,null,{...g.client,supportedRules:[currentRules,'next']});assert.equal(b.compatibility.rules,currentRules);assert.equal(b.snapshot.players.length,2);
});
test('join across a safe rules handoff returns the committed replacement lease',async()=>{
  const f=fixture(),a=await join(f);makeSafe(f);f.world.engines={...engines,next:Simulation};f.world.target='next';
  const client={...f.client,supportedRules:[currentRules,'next']},b=await join(f,a,client);
  assert.equal(b.compatibility.rules,'next');assert.notEqual(b.epoch,a.epoch);
  assert.equal(f.store.values.get('checkpoint').sessions[0][1].lease,b.lease);
  assert.equal((await call(f,'command',{session:b,client,body:command(b)})).status,200);
});
test('dead player resumes an unconfirmed bequest and commits it exactly once before a new life',async()=>{
  const f=fixture(),a=await join(f),p=f.world.sim.players.get(a.playerId);makeSafe(f);p.skills=[4000];f.world.sim.die(p,'老衰');await f.world.persist();
  assert.equal(p.legacyChoice.state,'pending');const b=await join(f,a);assert.equal(b.playerId,a.playerId);assert.equal(f.world.sim.players.size,1);
  const body=command(b,1,{type:'choose-legacy',skill:4000});assert.equal((await call(f,'command',{session:b,body})).body.accepted,true);
  const saved=copy(f.store.values.get('checkpoint'));assert.equal((await call(f,'command',{session:b,body})).body.duplicate,true);assert.deepEqual(copy(f.store.values.get('checkpoint')),saved);
  const c=await join(f,b);assert.notEqual(c.playerId,b.playerId);assert.equal(c.snapshot.legacy.records.length,1);assert(c.snapshot.legacy.archive.includes(4000));
});
test('save migration 3 -> 4 preserves lineage, inventory, injuries and is idempotent; unknown schemas fail',()=>{
  const s=new Simulation(),p=s.addPlayer('p',{owner:'o'});p.inventory=['bell'];p.wounds={head:{severity:1}};s.legacy('o').records=[{name:'ancestor'}];
  const old=s.exportState();old.schema=3;const before=copy(old),next=Simulation.migrateSave(old);
  assert.deepEqual(old,before);assert.equal(next.schema,4);assert.deepEqual(next.players,old.players);assert.deepEqual(next.legacies,old.legacies);
  assert.deepEqual(Simulation.migrateSave(next),next);assert.throws(()=>Simulation.restore({...old,schema:99}));
  assert.throws(()=>Simulation.restore({...old,players:[['p',{...p,x:null}]]}));
});
test('migration failure keeps the old authority intact; missing archive cannot silently reset saves',async()=>{
  const f=fixture();await join(f);makeSafe(f);await f.world.persist();const before=copy(f.store.values.get('checkpoint'));
  const g=fixture({store:f.store,rules:'broken',engines:{...engines,broken:{restoreLive(){throw Error('bad migration');}}}});
  await g.world.ready;await g.world.rollForward();assert.equal(g.world.rules,currentRules);assert.equal(g.world.migrationFailed,true);
  assert.deepEqual(copy(g.store.values.get('checkpoint')),before);
  const unavailable=fixture({store:f.store,engines:{}});assert.equal((await call(unavailable,'join')).status,503);assert.deepEqual(copy(f.store.values.get('checkpoint')),before);
});
test('rollback restores current progress under retained compatible rules, not the pre-migration backup',async()=>{
  const f=fixture();await join(f);makeSafe(f);await f.world.persist();
  const g=fixture({store:f.store,rules:'next',engines:{...engines,next:Simulation}});await g.world.ready;await g.world.rollForward();
  g.world.sim.time=123;await g.world.persist();g.world.target=currentRules;await g.world.rollForward();
  assert.equal(g.world.rules,currentRules);assert.equal(g.world.sim.time,123);
});
test('failed durable write never acknowledges a command; server stops and preserves last committed checkpoint',async()=>{
  const f=fixture(),a=await join(f),before=copy(f.store.values.get('checkpoint'));f.store.break();
  assert.equal((await call(f,'command',{session:a,body:command(a)})).status,503);assert.deepEqual(copy(f.store.values.get('checkpoint')),before);
  assert.equal((await call(f,'join',{session:a})).body.code,'SAVE_UNAVAILABLE');
});
test('safe update gate covers combat, conversation, death, inheritance/modal, save and import',()=>{
  const p={alive:true,input:{x:0,z:0}},g={screen:'game',snapshot:{player:p,t:10,actors:[]},ui:{}};
  assert.equal(safeGame(g),true);
  for(const field of ['pendingSkill','combo','chain','autoFight','dash','activity','prologue']){p[field]={};assert.equal(safeGame(g),false,field);delete p[field];}
  p.speechUntil=11;assert.equal(safeGame(g),false);p.speechUntil=0;p.alive=false;assert.equal(safeGame(g),false);p.recorded=true;assert.equal(safeGame(g),true);
  for(const field of ['saving','importing','starting','blockSave']){g[field]=true;assert.equal(safeGame(g),false);delete g[field];}
  g.ui.modal='lineage';assert.equal(safeGame(g),false);
});
function browserHarness(fetcher){
  const nodes=[],listeners={},timers=[];const document={hidden:false,body:{append:n=>nodes.push(n)},addEventListener:(k,fn)=>listeners[k]=fn,
    createElement:tag=>({tag,className:'',setAttribute(){},append(...children){this.firstChild=children[0];this.lastChild=children.at(-1);},remove(){this.removed=true;}})};
  let navigations=0;
  const g={profile:{mode:'normal'},screen:'game',ui:{toast(){},modal:null},snapshot:{t:10,player:{alive:true,input:{x:0,z:0}},actors:[]},
    pendingMove:null,commandBuffer:[],renderer:{effects:[]},mapCache:new Map(),acceptSnapshot(s){this.snapshot=s;},stopInput(){},saveWorld(){return true;}};
  const context={console,document,window:{addEventListener(){}},location:{protocol:'https:',href:'https://test.invalid/',assign(){navigations++;}},
    setInterval:fn=>{timers.push(fn);return timers.length;},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},
    fetch:fetcher,crypto:webcrypto,URL,AbortController,AbortSignal,TextDecoder,TextEncoder,performance,LiveContract,clientCompatible,safeGame,
    LIVE_BUILD:{rules:currentRules,supportedRules:[currentRules]},BUILD_INFO:{commit:'a'.repeat(40),environment:'dev'},writeStore:()=>true,gameId:()=>webcrypto.randomUUID()};
  vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../src/live/client.js',import.meta.url),'utf8')+'\nglobalThis.C=LiveUpdate;',context);
  return {g,live:new context.C(g),document,listeners,timers,navigations:()=>navigations};
}
test('compatible update detection never reloads or changes the displayed build; network error is independent',async()=>{
  const target={application:'Bloodline Legacy',environment:'dev',mode:'game',commit:'b'.repeat(40),htmlSha256:'c'.repeat(64),live:LiveContract};
  const h=browserHarness(async()=>Response.json(target));await h.live.check();assert.equal(h.navigations(),0);assert.equal(h.live.target.commit,target.commit);
  assert.equal(h.live.notice.lastChild.hidden,false);h.live.requested=true;h.g.snapshot.player.combo={};assert.equal(await h.live.update(),false);assert.equal(h.navigations(),0);
});
test('background -> deploy -> foreground clears stale inputs and reconnects before accepting commands',async()=>{
  const h=browserHarness(async()=>Response.json({}));let joins=0;h.live.join=async()=>{joins++;};h.g.online=true;h.live.start();
  h.g.pendingMove={type:'move',x:1,z:0};h.g.commandBuffer=[{type:'attack'}];h.live.ready=true;h.document.hidden=true;h.listeners.visibilitychange();
  assert.equal(h.live.ready,false);assert.equal(h.g.pendingMove,null);assert.equal(h.g.commandBuffer.length,0);
  h.document.hidden=false;h.listeners.visibilitychange();await Promise.resolve();assert.equal(joins,1);assert.equal(h.g.accumulator,0);
});
test('stale snapshot from a replaced stream cannot rewind position or ACK',()=>{
  const h=browserHarness();const packet={snapshot:{t:5,player:{id:'p',x:10}},epoch:'e',revision:9,ack:4,lease:'l',recovery:true};
  assert.equal(h.live.apply(packet,0),true);assert.equal(h.live.apply({...packet,revision:8},0),false);assert.equal(h.live.apply({...packet,revision:10},-1),false);assert.equal(h.g.snapshot.player.x,10);
});
test('cached/incomplete deployment bytes cannot cause reload even at a safe point',async()=>{
  const target={application:'Bloodline Legacy',environment:'dev',mode:'game',commit:'b'.repeat(40),htmlSha256:'c'.repeat(64),live:LiveContract};
  const h=browserHarness(async url=>String(url).includes('version.json')?Response.json(target):new Response('wrong asset'));
  await h.live.check();h.live.requested=true;assert.equal(await h.live.update(),false);assert.equal(h.navigations(),0);
});
test('a verified update navigates once only after successful save; quota failure keeps the running game',async()=>{
  const bytes=new TextEncoder().encode('<html>verified update</html>'),hash=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  const target={application:'Bloodline Legacy',environment:'dev',mode:'game',commit:'b'.repeat(40),htmlSha256:hash,live:LiveContract};
  for(const canSave of [false,true]){
    const h=browserHarness(async url=>String(url).includes('version.json')?Response.json(target):new Response(bytes));let saved=0;
    h.g.saveWorld=()=>{saved++;return canSave;};await h.live.check();h.live.requested=true;
    assert.equal(await h.live.update(),canSave);assert.equal(saved,1);assert.equal(h.navigations(),canSave?1:0);
  }
});
test('combat starting while new assets download defers navigation and preserves input',async()=>{
  const bytes=new TextEncoder().encode('verified'),hash=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  const target={application:'Bloodline Legacy',environment:'dev',mode:'game',commit:'b'.repeat(40),htmlSha256:hash,live:LiveContract};
  let h;h=browserHarness(async url=>{if(String(url).includes('version.json'))return Response.json(target);h.g.snapshot.player.combo={};return new Response(bytes);});
  await h.live.check();h.live.requested=true;assert.equal(await h.live.update(),false);assert.equal(h.navigations(),0);assert(h.g.snapshot.player.combo);
});
test('snapshot arriving behind a command ACK cannot rewind the next command sequence',()=>{
  const h=browserHarness();h.live.ack=5;h.live.epoch='e';h.live.revision=5;
  h.live.apply({snapshot:{player:{id:'p'}},epoch:'e',revision:6,ack:4,lease:'l'},0);assert.equal(h.live.ack,5);
});
test('conversation/selection presence blocks server migration until released, even after grace',async()=>{
  const f=fixture(),a=await join(f);makeSafe(f);const p=await call(f,'presence',{session:a,body:{busy:true}});assert.equal(p.status,200);
  f.world.engines={...engines,next:Simulation};f.world.target='next';
  f.world.streams.set([...f.world.sessions.keys()][0],{controller:{enqueue(){},close(){}}});
  await f.world.rollForward();assert.equal(f.world.rules,currentRules);
  await call(f,'presence',{session:a,body:{busy:false}});f.advance(LiveContract.graceMs+1);
  await f.world.rollForward();assert.equal(f.world.rules,'next');
});
test('online checkpoint/reboot retains conversation, wounds, movement state and RNG',async()=>{
  const f=fixture(),a=await join(f),p=f.world.sim.players.get(a.playerId);
  Object.assign(p,{speech:'村を守ろう',speechUntil:20,pendingSkill:{id:4000,at:2},combo:{band:0,total:1}});
  await f.world.persist();const before=f.world.sim.exportState({live:true});const g=fixture({store:f.store});await g.world.ready;
  assert.deepEqual(g.world.sim.exportState({live:true}),before);assert.equal(g.world.sim.players.get(a.playerId).speech,p.speech);
});
test('oversized command bodies are rejected without reading them into the simulation',async()=>{
  const f=fixture(),a=await join(f),before=copy(f.store.values.get('checkpoint'));
  const r=await call(f,'command',{session:a,body:{...command(a),extra:'x'.repeat(20000)}});assert.equal(r.status,413);
  assert.deepEqual(copy(f.store.values.get('checkpoint')),before);
});
test('worker gates holding deployments, cross-origin commands and stale cached document navigation',async()=>{
  const env={APP_ENV:'dev',ASSETS:{fetch:async()=>Response.json({environment:'dev',commit:'new',mode:'game',live:{...LiveContract,rules:currentRules}})},WORLDS:{idFromName:x=>x,get:()=>({fetch:async()=>new Response('ok')})}};
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/command',{method:'POST',headers:{Origin:'https://evil.invalid'}}),env)).status,403);
  assert.equal((await worker.fetch(new Request('https://test.invalid/index.html?build=old'),env)).status,409);
  const holding={...env,ASSETS:{fetch:async()=>Response.json({environment:'dev',mode:'holding'})}};
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/join',{method:'POST'}),holding)).status,503);
});
test('updates defer during rescue, traversal, bequest, speech entry or pending movement',()=>{
 const p={alive:true,input:{x:0,z:0}},g={screen:'game',snapshot:{player:p,t:10,actors:[]},ui:{}};
 for(const lifeState of ['downed','carried','recovering'])assert.equal(safePlayer({...p,lifeState},g.snapshot,10),false);
 for(const field of ['rescueTarget','carrierId','traversal'])assert.equal(safePlayer({...p,[field]:'active'},g.snapshot,10),false);
 p.alive=false;p.recorded=true;p.legacyChoice={state:'pending'};g.screen='clan';assert.equal(safeGame(g),false);
 delete p.legacyChoice;p.alive=true;g.screen='game';
 for(const field of ['menu','pointer','recognition']){g.ui.talkFan={[field]:{}};assert.equal(safeGame(g),false);}
 delete g.ui.talkFan;g.pendingMove={x:1,z:0};assert.equal(safeGame(g),false);g.pendingMove={x:0,z:0};assert.equal(safeGame(g),true);
});

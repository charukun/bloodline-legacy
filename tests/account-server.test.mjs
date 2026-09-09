import test from 'node:test';
import assert from 'node:assert/strict';
import {GameWorld} from '../src/server/world.mjs';
import {LiveContract} from '../src/live/contract.mjs';
import {engines,currentRules} from '../src/server/engines/registry.mjs';
import {accountDigest} from '../src/server/accounts.mjs';
import {assertSafeRollout} from '../deploy/check-rollout.mjs';
import {authenticator,token,recoveryCode} from './account-authenticator.mjs';

function fixture(store){
 let now=1000000;const values=store?.values||new Map();
 store??={values,get:async k=>structuredClone(values.get(k)),put:async(k,v)=>{if(store.fail)throw Error('disk');values.set(k,structuredClone(v));},delete:async k=>{if(store.fail)throw Error('disk');values.delete(k);},transaction:async fn=>{
  const before=structuredClone(values);try{return await fn(store);}catch(e){values.clear();for(const [k,v]of before)values.set(k,v);throw e;}}};
 const world=new GameWorld({storage:store,blockConcurrencyWhile:fn=>fn()},{APP_ENV:'dev'},{now:()=>now});
 const client={...LiveContract,rules:currentRules,supportedRules:[currentRules]};
 return {world,store,client,advance:ms=>{now+=ms;},async call(path,body={},credential,extra={}){
  const r=await world.fetch(new Request('https://test.invalid/api/'+path,{method:'POST',headers:{Origin:'https://test.invalid','Content-Type':'application/json','X-Bloodline-Client':JSON.stringify(client),...(credential?{'X-Aerin-Session':credential}:{}),...extra},body:JSON.stringify(body)}));
  return {status:r.status,...await r.json()};
 }};
}
async function linked(f){
 const guest=await f.call('account/guest');assert.equal(guest.status,200);
 const auth=authenticator(),options=await f.call('account/register-options',{},guest.token),code=recoveryCode();
 assert.equal(options.options.authenticatorSelection.userVerification,'required');assert.equal(options.options.authenticatorSelection.residentKey,'required');
 const result=await f.call('account/register-verify',{id:options.id,response:auth.register(options.options),recoveryCode:code},guest.token);assert.equal(result.status,200,JSON.stringify(result));
 return {token:guest.token,auth,code,account:result.account};
}
async function login(f,a){const o=await f.call('account/login-options');const result=await f.call('account/login-verify',{id:o.id,response:a.auth.login(o.options)});assert.equal(result.status,200,JSON.stringify(result));return result;}
function rawSave(){const s=new engines[currentRules]({mode:'normal'}),p=s.addPlayer('local',{owner:'offline-owner',name:'リオ',clan:'暁風'});Object.assign(p,{age:27,prologue:false,inventory:['bell']});return JSON.stringify({...s.exportState(),_profile:{owner:p.owner,mode:'normal',online:false,clan:p.clan,name:p.name}});}

test('passkey linking binds the existing anonymous family, never client ownership',async()=>{
 const f=fixture(),joined=await f.call('join',{config:{name:'リオ'},beginLife:true}),auth=authenticator(),options=await f.call('account/register-options',{},joined.token);
 const before=structuredClone(f.world.sim.exportState({live:true}));
 const registered=await f.call('account/register-verify',{id:options.id,response:auth.register(options.options),owner:'someone-else',recoveryCode:recoveryCode()},joined.token);
 assert.equal(registered.status,200);assert.deepEqual(f.world.sim.exportState({live:true}),before);
 assert.equal(f.world.sessions.get(await accountDigest(joined.token)).playerId,joined.playerId);
 assert.equal(f.world.accounts.records.get(registered.account.id).sessionKey,await accountDigest(joined.token));
});
test('real WebAuthn rejects wrong origin, RP ID, challenge, UV and replay',async()=>{
 const f=fixture(),guest=await f.call('account/guest'),auth=authenticator();
 for(const overrides of [{origin:'https://evil.invalid'},{rpID:'evil.invalid'},{challenge:token()},{uv:false}]){
  const o=await f.call('account/register-options',{},guest.token),response=auth.register(o.options,overrides);
  assert.equal((await f.call('account/register-verify',{id:o.id,response,recoveryCode:recoveryCode()},guest.token)).status,401);
  assert.equal((await f.call('account/register-verify',{id:o.id,response,recoveryCode:recoveryCode()},guest.token)).code,'AUTH_EXPIRED');
 }
 const a=await linked(f);
 for(const overrides of [{origin:'https://evil.invalid'},{rpID:'evil.invalid'},{challenge:token()},{uv:false},{handle:token()}]){
  const o=await f.call('account/login-options');assert.equal((await f.call('account/login-verify',{id:o.id,response:a.auth.login(o.options,overrides)})).status,401);
 }
 assert.equal(f.world.accounts.records.size,1);
});
test('account endpoints reject cross-origin, absent Origin and stale sessions without account mutation',async()=>{
 const f=fixture();assert.equal((await f.call('account/guest',{},null,{Origin:'https://evil.invalid'})).status,403);
 assert.equal((await f.call('account/guest',{},null,{Origin:''})).status,403);
 assert.equal((await f.call('account/guest',{},token())).status,401);assert.equal(f.world.sessions.size,0);
});
test('a credential cannot be rebound to a different guest; key management needs fresh verification',async()=>{
 const f=fixture(),a=await linked(f),guest=await f.call('account/guest'),o=await f.call('account/register-options',{},guest.token);
 assert.equal((await f.call('account/register-verify',{id:o.id,response:a.auth.register(o.options),recoveryCode:recoveryCode()},guest.token)).code,'PASSKEY_ALREADY_LINKED');
 f.advance(300001);assert.equal((await f.call('account/register-options',{},a.token)).code,'REAUTH_REQUIRED');
 const proof=await login(f,a);assert.equal((await f.call('account/reauth',{proof:proof.proof},a.token)).status,200);
 const second=authenticator(),options=await f.call('account/register-options',{},a.token);
 const added=await f.call('account/register-verify',{id:options.id,response:second.register(options.options)},a.token);assert.equal(added.account.passkeys.length,2);
 const removed=await f.call('account/remove-passkey',{id:second.id},a.token);assert.equal(removed.account.passkeys.length,1);
 assert.equal((await f.call('account/remove-passkey',{id:a.auth.id},a.token)).code,'LAST_PASSKEY');
});
test('device replacement rotates durable credentials; old clients cannot join or issue commands',async()=>{
 const f=fixture(),a=await linked(f),p=await f.call('join',{beginLife:true,config:{name:'リオ'}},a.token),proof=await login(f,a),next=token();
 const state=structuredClone(f.world.sim.exportState({live:true}));
 assert.equal((await f.call('account/activate',{proof:proof.proof,token:next})).status,200);
 assert.deepEqual(f.world.sim.exportState({live:true}),state);
 assert.equal((await f.call('join',{},a.token)).status,401);
 assert.equal((await f.call('command',{},a.token)).status,401);
 const reboot=fixture(f.store),resumed=await reboot.call('join',{},next);assert.equal(resumed.playerId,p.playerId);
 assert.deepEqual(resumed.snapshot.player.inventory,p.snapshot.player.inventory);
 assert.equal((await reboot.call('account/activate',{proof:proof.proof,token:next})).status,200,'lost activation reply retries after deploy');
 assert.equal((await reboot.call('account/activate',{proof:proof.proof,token:token()})).status,401);
});
test('connected combat and conversation defer takeover; disconnected in-flight progress remains exact',async()=>{
 const f=fixture(),a=await linked(f),joined=await f.call('join',{beginLife:true},a.token),key=await accountDigest(a.token),proof=await login(f,a);
 const p=f.world.sim.players.get(joined.playerId);p.combo={band:0,total:1};const stream={controller:{enqueue(){},close(){}}};f.world.streams.set(key,stream);
 assert.equal((await f.call('account/activate',{proof:proof.proof,token:token()})).code,'WAIT_FOR_SAFE_POINT');
 f.world.streams.delete(key);const before=structuredClone(f.world.sim.exportState({live:true})),next=token();
 assert.equal((await f.call('account/activate',{proof:proof.proof,token:next})).status,200);assert.deepEqual(f.world.sim.exportState({live:true}),before);
});
test('recovery code is single-use, rotated atomically, and never stored as plaintext',async()=>{
 const f=fixture(),a=await linked(f),proof=await f.call('account/recover',{code:a.code}),next=token(),code=recoveryCode();
 assert.equal(proof.status,200);assert.equal((await f.call('account/recover',{code:recoveryCode()})).status,401);
 assert.equal((await f.call('account/activate',{proof:proof.proof,token:next,recoveryCode:code})).status,200);
 assert.equal((await f.call('account/recover',{code:a.code})).status,401);assert.equal((await f.call('account/recover',{code})).status,200);
 const persisted=JSON.stringify([...f.store.values]);assert.ok(!persisted.includes(code));assert.ok(!persisted.includes(a.code));assert.ok(!persisted.includes(next));
});
test('offline cloud CAS prevents stale overwrite, stays separate from multiplayer and survives restart',async()=>{
 const f=fixture(),a=await linked(f),raw=rawSave(),world=structuredClone(f.world.sim.exportState({live:true}));
 const saved=await f.call('account/cloud-save',{raw,rules:currentRules,revision:0},a.token);assert.equal(saved.revision,1,JSON.stringify(saved));
 assert.deepEqual(f.world.sim.exportState({live:true}),world);
 assert.equal((await f.call('account/cloud-save',{raw,rules:currentRules,revision:0},a.token)).revision,1,'retry after lost ACK is idempotent');
 const newer=JSON.parse(raw);newer.time+=10;
 assert.equal((await f.call('account/cloud-save',{raw:JSON.stringify(newer),rules:currentRules,revision:1},a.token)).revision,2);
 assert.equal((await f.call('account/cloud-save',{raw,rules:currentRules,revision:0},a.token)).code,'CLOUD_CONFLICT');
 const reboot=fixture(f.store),loaded=await reboot.call('account/cloud-load',{},a.token);assert.equal(loaded.cloud.raw,JSON.stringify(newer));
 assert.equal((await reboot.call('account/cloud-load',{},token())).status,401);
 assert.equal(f.world.accounts.records.get(a.account.id).previousCloud.revision,1);
});
test('save validation and transaction failure preserve committed cloud data',async()=>{
 const f=fixture(),a=await linked(f),raw=rawSave();await f.call('account/cloud-save',{raw,rules:currentRules,revision:0},a.token);
 for(const broken of [{...JSON.parse(raw),schema:99},{...JSON.parse(raw),players:[['bad',{x:null}]]}])assert.equal((await f.call('account/cloud-save',{raw:JSON.stringify(broken),rules:currentRules,revision:1},a.token)).code,'INVALID_SAVE');
 assert.equal((await f.call('account/cloud-save',{raw,rules:'unknown',revision:1},a.token)).revision,1,'an identical retry does not migrate data');
 const state=structuredClone(f.store.values),newer=JSON.parse(raw);newer.time++;
 f.store.fail=true;assert.equal((await f.call('account/cloud-save',{raw:JSON.stringify(newer),rules:currentRules,revision:1},a.token)).status,503);
 assert.deepEqual(f.store.values,state);
});
test('failed ownership transaction retains the old session and permits recovery after restart',async()=>{
 const f=fixture(),a=await linked(f),proof=await login(f,a),state=structuredClone(f.store.values);f.store.fail=true;
 assert.equal((await f.call('account/activate',{proof:proof.proof,token:token()})).status,503);assert.deepEqual(f.store.values,state);
 f.store.fail=false;const reboot=fixture(f.store);assert.equal((await reboot.call('account/status',{},a.token)).linked,true);
});
test('expired challenges and rollback without account recovery support fail closed',async()=>{
 const f=fixture(),a=await linked(f),o=await f.call('account/login-options');f.advance(300001);
 assert.equal((await f.call('account/login-verify',{id:o.id,response:a.auth.login(o.options)})).status,401);
 const prior={environment:'dev',mode:'game',live:{...LiveContract,supportedRules:[currentRules]}};
 assert.throws(()=>assertSafeRollout({...prior,live:{...prior.live,account:undefined}},prior));assert.doesNotThrow(()=>assertSafeRollout(prior,prior));
});

test('logout revokes the credential without deleting the linked family or cloud record',async()=>{
 const f=fixture(),a=await linked(f);await f.call('account/cloud-save',{raw:rawSave(),rules:currentRules,revision:0},a.token);
 assert.equal((await f.call('account/logout',{},a.token)).status,200);assert.equal((await f.call('account/status',{},a.token)).status,401);
 const proof=await login(f,a),next=token();assert.equal((await f.call('account/activate',{proof:proof.proof,token:next})).status,200);
 assert.equal((await f.call('account/cloud-load',{},next)).cloud.revision,1);
});

test('signature tampering and a decreasing authenticator counter fail verification',async()=>{
 const f=fixture(),a=await linked(f);await login(f,a);
 let o=await f.call('account/login-options'),response=a.auth.login(o.options,{signCount:1});
 assert.equal((await f.call('account/login-verify',{id:o.id,response})).status,401);
 o=await f.call('account/login-options');response=a.auth.login(o.options);response.response.signature=token();
 assert.equal((await f.call('account/login-verify',{id:o.id,response})).status,401);
});

test('the current device can confirm its own switch without its settings presence blocking it',async()=>{
 const f=fixture(),a=await linked(f),joined=await f.call('join',{beginLife:true},a.token),key=await accountDigest(a.token),proof=await login(f,a);
 const p=f.world.sim.players.get(joined.playerId);Object.assign(p,{prologue:false,age:18,introUntil:0,motherUntil:0,speechUntil:0,actionUntil:0});
 f.world.sessions.get(key).busyUntil=2000000;f.world.streams.set(key,{controller:{enqueue(){},close(){}}});
 assert.equal((await f.call('account/activate',{proof:proof.proof,token:token()},a.token)).status,200);
});

test('unknown account formats and missing cloud chunks preserve data and stop recovery safely',async()=>{
 const f=fixture(),a=await linked(f);await f.call('account/cloud-save',{raw:rawSave(),rules:currentRules,revision:0},a.token);
 f.store.values.delete(`cloud:${a.account.id}:1:0`);assert.equal((await f.call('account/cloud-load',{},a.token)).code,'CLOUD_RECOVERY_REQUIRED');
 f.store.values.get('accounts-index').format=99;const before=structuredClone(f.store.values),reboot=fixture(f.store);
 assert.equal((await reboot.call('account/status',{},a.token)).code,'ACCOUNT_RECOVERY_REQUIRED');assert.deepEqual(f.store.values,before);
});

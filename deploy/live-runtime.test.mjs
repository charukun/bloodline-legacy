import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {build as bundle} from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {LiveContract} from '../src/live/contract.mjs';
import {currentRules,engines} from '../src/server/engines/registry.mjs';
import {authenticator,token as accountToken,recoveryCode} from '../tests/account-authenticator.mjs';
const target=process.argv[2]||'dev';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bloodline-live-runtime-'));
const output=await bundle({entryPoints:['deploy/worker.mjs'],bundle:true,format:'esm',platform:'browser',write:false});
const workerOptions={name:'app',modules:true,script:output.outputFiles[0].text,compatibilityDate:'2026-09-07',
 durableObjects:{WORLDS:{className:'GameWorld',useSQLite:true}},bindings:{APP_ENV:target},
 assets:{directory:path.resolve('deploy/out',target),binding:'ASSETS',routerConfig:{has_user_worker:true},run_worker_first:['/api/*','/','/index.html']}};
const options=convertV4MiniflareOptions({workers:[workerOptions],resourcePersistencePath:dir});
let mf=new Miniflare(options);
const client={...LiveContract,supportedRules:[currentRules],rules:currentRules};
const headers=session=>({'Content-Type':'application/json','X-Bloodline-Client':JSON.stringify(client),...(session?{'X-Aerin-Session':session.token,'X-Bloodline-Lease':session.lease}:{})});
async function join(session){const r=await mf.dispatchFetch('https://local.test/api/join',{method:'POST',headers:headers(session),body:JSON.stringify({config:{name:'検証'},beginLife:false})});assert.equal(r.status,200,await r.clone().text());return r.json();}
try{
 const health=await mf.dispatchFetch('https://local.test/api/health');assert.equal(health.status,200,await health.clone().text());assert.equal((await health.json()).online,true);
 const a=await join(),b=await join();assert.equal(b.snapshot.players.length,2);
 const r=await mf.dispatchFetch('https://local.test/api/command',{method:'POST',headers:headers(a),body:JSON.stringify({id:'first',sequence:1,epoch:a.epoch,lease:a.lease,command:{type:'talk'}})});assert.equal(r.status,200);
 const stream=await mf.dispatchFetch('https://local.test/api/events',{headers:headers(a)}),reader=stream.body.getReader();
 const first=JSON.parse(new TextDecoder().decode((await reader.read()).value).slice(6));assert.equal(first.recovery,true);assert.equal(first.ack,1);
 const second=JSON.parse(new TextDecoder().decode((await reader.read()).value).slice(6));assert(second.snapshot.t>first.snapshot.t);
 await reader.cancel();await mf.dispose();mf=new Miniflare(options);
 const resumed=await join(a);assert.equal(resumed.playerId,a.playerId);assert.equal(resumed.ack,1);assert.notEqual(resumed.lease,a.lease);
 assert(resumed.snapshot.t>=second.snapshot.t,'last streamed state is durable across runtime restart');
 const stale=await mf.dispatchFetch('https://local.test/api/command',{method:'POST',headers:headers(a),body:JSON.stringify({id:'stale',sequence:2,epoch:a.epoch,lease:a.lease,command:{type:'talk'}})});assert.equal(stale.status,409);
 console.log('PASS: real workerd / SQLite / Worker assets / two players / SSE / durable ACK / runtime restart / stale lease');
 const accountCall=async(path,body={},credential)=>{
  const r=await mf.dispatchFetch('https://local.test/api/account/'+path,{method:'POST',headers:{...headers(credential?{token:credential}:null),Origin:'https://local.test'},body:JSON.stringify(body)});
  assert.equal(r.status,200,await r.clone().text());return r.json();
 };
 const auth=authenticator(),registration=await accountCall('register-options',{},resumed.token),code=recoveryCode();
 await accountCall('register-verify',{id:registration.id,response:auth.register(registration.options,{origin:'https://local.test'}),recoveryCode:code},resumed.token);
 const offline=new engines[currentRules]({mode:'normal'});offline.addPlayer('offline',{owner:'offline',name:'保存検証'});
 const raw=JSON.stringify({...offline.exportState(),_profile:{owner:'offline',mode:'normal',online:false}});
 await accountCall('cloud-save',{raw,rules:currentRules,revision:0},resumed.token);
 await mf.dispose();mf=new Miniflare(options);
 const authentication=await accountCall('login-options'),proof=await accountCall('login-verify',{id:authentication.id,response:auth.login(authentication.options,{origin:'https://local.test'})}),replacement=accountToken();
 await accountCall('activate',{proof:proof.proof,token:replacement});
 assert.equal((await accountCall('cloud-load',{},replacement)).cloud.raw,raw);
 const recovered=await join({token:replacement});assert.equal(recovered.playerId,resumed.playerId);assert.equal(recovered.ack,resumed.ack);
 const revoked=await mf.dispatchFetch('https://local.test/api/join',{method:'POST',headers:headers(resumed),body:'{}'});assert.equal(revoked.status,401);
 console.log('PASS: real workerd / passkey P-256 registration and login / account restart / token rotation / offline cloud round-trip / retained online family');
}finally{await mf.dispose();await fs.rm(dir,{recursive:true,force:true});}

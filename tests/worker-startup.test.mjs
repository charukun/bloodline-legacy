import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from '../deploy/node_modules/esbuild/lib/main.js';
import {engines,currentRules} from '../src/server/engines/registry.mjs';
import {LiveContract} from '../src/live/contract.mjs';

test('bundled Worker defers archives through health, restores the pinned rules, and retains every version',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bloodline-startup-'));
 const initialized=[];globalThis.__bloodlineArchiveInitializations=initialized;
 try{
  const outfile=path.join(dir,'worker.mjs');
  await build({entryPoints:[path.resolve('deploy/worker.mjs')],outfile,bundle:true,format:'esm',platform:'browser',plugins:[{
   name:'observe-archive-initialization',setup(builder){builder.onLoad({filter:/[/\\][a-f0-9]{64}\.mjs$/},async({path:file})=>({
    contents:`globalThis.__bloodlineArchiveInitializations.push(${JSON.stringify(path.basename(file,'.mjs'))});\n`+await fs.readFile(file,'utf8'),loader:'js'
   }));}
  }]});
  const {default:worker,GameWorld}=await import(pathToFileURL(outfile).href);
  assert.deepEqual(initialized,[],'merely loading the deployed bundle must not initialize any simulation');
  const env={APP_ENV:'dev',WORLDS:{},ASSETS:{fetch:async()=>Response.json({environment:'dev',mode:'game',commit:'startup-test',live:{...LiveContract,rules:currentRules}})}};
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/health'),env)).status,200);
  assert.deepEqual(initialized,[],'health must not initialize a simulation');

  const historical=Object.keys(engines).find(id=>id!==currentRules),sim=new engines[historical]({mode:'normal'});
  const p=sim.addPlayer('pinned',{owner:'owner',name:'旧版'});Object.assign(p,{age:27,prologue:false,inventory:['bell']});
  const saved={format:1,rules:historical,epoch:'old-epoch',revision:7,world:sim.exportState({live:true}),sessions:[['session',{playerId:p.id,ack:3,lease:'old-lease'}]],pending:null};
  const fixture=checkpoint=>{
   const values=new Map(checkpoint?[['checkpoint',structuredClone(checkpoint)]]:[]);
   const storage={get:async key=>structuredClone(values.get(key)),put:async(key,value)=>values.set(key,structuredClone(value))};
   return new GameWorld({storage,blockConcurrencyWhile:fn=>fn()},{APP_ENV:'dev'});
  };
  const restored=fixture(saved);await restored.ready;
  assert.equal(restored.failure,undefined);assert.equal(restored.rules,historical);
  assert.deepEqual(initialized,[historical],'restore must select the checkpoint rules without initializing the new target');
  assert.deepEqual(restored.sim.exportState({live:true}),saved.world);
  assert.equal(restored.sessions.get('session').ack,3);assert.equal(restored.sessions.get('session').lease,null);
  const missing=fixture({...saved,rules:'unknown'});await missing.ready;
  assert.equal(missing.failure,'RECOVERY_REQUIRED');assert.deepEqual(initialized,[historical]);

  const fresh=fixture();await fresh.ready;const second=fixture();await second.ready;
  assert.deepEqual(initialized,[historical,currentRules],'multiple worlds share one initialization per version');
  for(const id of Object.keys(engines))assert.equal(typeof (await fresh.engine(id)).restoreLive,'function');
  assert.deepEqual([...initialized].sort(),Object.keys(engines).sort(),'all retained archives remain usable in the single deployed bundle');
  assert.equal(new Set(initialized).size,initialized.length);
 }finally{delete globalThis.__bloodlineArchiveInitializations;await fs.rm(dir,{recursive:true,force:true});}
});

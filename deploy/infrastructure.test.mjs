import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {environmentForBranch,assertDeployment,environments} from './config.mjs';
import {build} from './build.mjs';
import worker from './worker.mjs';

test('only mapped push events can deploy, never feature/PR/manual into production',()=>{
  for(const [environment,{branch}] of Object.entries(environments)) {
    assert.equal(environmentForBranch(branch),environment);
    assert.doesNotThrow(()=>assertDeployment(environment,branch,'push'));
    for(const badBranch of ['feature/game','work/current-handoff',...Object.values(environments).map(e=>e.branch).filter(b=>b!==branch)])
      assert.throws(()=>assertDeployment(environment,badBranch,'push'));
    for(const event of ['pull_request','pull_request_target','workflow_dispatch','workflow_run']) assert.throws(()=>assertDeployment(environment,branch,event));
  }
});
test('worker configurations use separate origins and no storage bindings',async()=>{
  const names=new Set();
  for(const [environment,{worker:name}] of Object.entries(environments)) {
    const config=JSON.parse(await fs.readFile(new URL(`./wrangler.${environment}.json`,import.meta.url)));
    assert.equal(config.name,name); names.add(name);
    assert.equal(config.vars.APP_ENV,environment);
    assert.equal(config.assets.directory,`./out/${environment}`);
    assert.equal(config.assets.not_found_handling,'none');
    assert.deepEqual(config.assets.run_worker_first,['/api/*']);
    for(const key of ['routes','d1_databases','kv_namespaces','r2_buckets','services','durable_objects']) assert.equal(config[key],undefined);
  }
  assert.equal(names.size,3);
});
test('health is offline JSON, unknown API cannot touch a save backend',async()=>{
  for(const environment of Object.keys(environments)) {
    const env={APP_ENV:environment};
    const response=await worker.fetch(new Request('https://test.invalid/api/health'),env);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{online:false,environment});
    assert.equal((await worker.fetch(new Request('https://test.invalid/api/join',{method:'POST'}),env)).status,501);
    assert.equal((await worker.fetch(new Request('https://test.invalid/missing.glb'),env)).status,404);
  }
});
test('production is a holding page until explicitly released',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bloodline-holding-'));
  try {
    await fs.mkdir(path.join(dir,'deploy'));
    await fs.writeFile(path.join(dir,'deploy/release.json'),'{"production":false}');
    const result=await build('production','local-recovery',dir);
    assert.equal(result.mode,'holding');
    const html=await fs.readFile(path.join(dir,'deploy/out/production/index.html'),'utf8');
    assert(html.includes('release-pending'));
    assert(!html.includes('VISUAL_ASSETS'));
    await fs.writeFile(path.join(dir,'deploy/release.json'),'{"production":"false"}');
    await assert.rejects(build('production','local-recovery',dir),/boolean/);
  } finally {await fs.rm(dir,{recursive:true,force:true});}
});
test('a failed game build throws and cannot leave a stale deployable index',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bloodline-failed-build-'));
  try {
    await fs.mkdir(path.join(dir,'deploy/out/dev'),{recursive:true});
    await fs.writeFile(path.join(dir,'deploy/release.json'),'{"production":false}');
    await fs.writeFile(path.join(dir,'deploy/out/dev/index.html'),'stale build');
    await fs.writeFile(path.join(dir,'build.mjs'),'process.exitCode=1;');
    await assert.rejects(build('dev','local-recovery',dir));
    await assert.rejects(fs.access(path.join(dir,'deploy/out/dev/index.html')));
  } finally {await fs.rm(dir,{recursive:true,force:true});}
});

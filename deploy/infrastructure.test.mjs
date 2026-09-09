import './build-info.test.mjs';
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
test('worker configurations use separate origins and isolated world bindings',async()=>{
  const names=new Set();
  for(const [environment,{worker:name}] of Object.entries(environments)) {
    const config=JSON.parse(await fs.readFile(new URL(`./wrangler.${environment}.json`,import.meta.url)));
    assert.equal(config.name,name); names.add(name);
    assert.deepEqual(config.durable_objects,{bindings:[{name:'WORLDS',class_name:'GameWorld'}]});
    assert.deepEqual(config.migrations,[{tag:'game-world-v1',new_sqlite_classes:['GameWorld']}]);
    assert.equal(config.vars.APP_ENV,environment);
    assert.equal(config.assets.directory,`./out/${environment}`);
    assert.equal(config.assets.not_found_handling,'none');
    assert.deepEqual(config.assets.run_worker_first,['/api/*','/','/index.html']);
    for(const key of ['routes','d1_databases','kv_namespaces','r2_buckets','services']) assert.equal(config[key],undefined);
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
    await fs.writeFile(path.join(dir,'deploy/release.json'),'{"production":false,"baseVersion":"0.6.0"}');
    const result=await build('production','local-recovery',dir);
    assert.equal(result.mode,'holding');
    const html=await fs.readFile(path.join(dir,'deploy/out/production/index.html'),'utf8');
    assert(html.includes('release-pending'));
    assert(!html.includes('VISUAL_ASSETS'));
    await fs.writeFile(path.join(dir,'deploy/release.json'),'{"production":"false"}');
    await assert.rejects(build('production','local-recovery',dir),/boolean/);
  } finally {await fs.rm(dir,{recursive:true,force:true});}
});
test('document fallback serves the real asset without masking missing assets',async()=>{
  for (const environment of Object.keys(environments)) {
    for (const method of ['GET','HEAD']) {
      for (const pathname of ['/','/index.html']) {
        const request=new Request(`https://test.invalid${pathname}`,{method});
        const asset=new Response(method==='HEAD'?null:'<p>Actual deployed document</p>',
          {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','ETag':'"deployed"'}});
        let requested;
        const response=await worker.fetch(request,{APP_ENV:environment,ASSETS:{fetch:async incoming=>{requested=incoming;return asset;}}});
        assert.equal(requested,request);
        assert.equal(response,asset,'Keep asset status, headers and bytes intact');
        assert.equal(response.status,200);
      }
    }
    const missing=await worker.fetch(new Request('https://test.invalid/missing.glb'),
      {APP_ENV:environment,ASSETS:{fetch:async()=>{throw Error('Do not route missing models to the document');}}});
    assert.equal(missing.status,404);
    const unavailable=new Response('Asset unavailable',{status:404});
    assert.equal(await worker.fetch(new Request('https://test.invalid/'),
      {APP_ENV:environment,ASSETS:{fetch:async()=>unavailable}}),unavailable,'Do not turn a real missing document into a false 200');
  }
});
test('a failed game build throws and cannot leave a stale deployable index',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bloodline-failed-build-'));
  try {
    await fs.mkdir(path.join(dir,'deploy/out/dev'),{recursive:true});
    await fs.writeFile(path.join(dir,'deploy/release.json'),'{"production":false,"baseVersion":"0.6.0"}');
    await fs.writeFile(path.join(dir,'deploy/out/dev/index.html'),'stale build');
    await fs.writeFile(path.join(dir,'build.mjs'),'process.exitCode=1;');
    await assert.rejects(build('dev','local-recovery',dir));
    await assert.rejects(fs.access(path.join(dir,'deploy/out/dev/index.html')));
  } finally {await fs.rm(dir,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {installCharacterPerformanceProbe} from './character-performance.mjs';

function fixture(frameMs) {
  let now=0, queued=0, rendered=0;
  const scope={performance:{now:()=>now}};
  const app={closed:false,renderer:{stats:{calls:42,triangles:500,cpuSubmitMs:1},
    gl:{RGBA:1,UNSIGNED_BYTE:2,isContextLost:()=>false,
      readPixels(){assert.equal(queued,1,'never queue another unfinished frame');queued--;now+=frameMs;}},
    render(){queued++;rendered++;return 'rendered';}}};
  return {app,scope,get rendered(){return rendered;},get queued(){return queued;}};
}
test('performance samples completed frames, drains warmup and retains slow frames',()=>{
  const f=fixture(3000), original=f.app.renderer.render;
  const probe=installCharacterPerformanceProbe(f.app,f.scope);
  assert.equal(f.app.renderer.render(),'rendered');
  assert.equal(f.queued,0);
  probe.begin();
  for(let n=0;n<12;n++)f.app.renderer.render();
  assert(!probe.complete,'30 seconds cannot waive the 12-interval minimum');
  f.app.renderer.render();
  assert(probe.complete);assert(f.app.closed);
  const sample=probe.stop();
  assert.equal(sample.frames.length,13);
  assert(sample.frames.every(x=>x.completionMs===3000));
  assert(sample.frames.slice(1).every((x,i)=>x.t-sample.frames[i].t===3000));
  assert.equal(f.app.renderer.render,original);
  assert.equal(f.rendered,14);
});
test('fast frames cannot shorten the 30-second sustained window',()=>{
  const f=fixture(1000), probe=installCharacterPerformanceProbe(f.app,f.scope);
  probe.begin();for(let n=0;n<29;n++)f.app.renderer.render();
  assert(!probe.complete);f.app.renderer.render();assert(probe.complete);
  assert.equal(probe.stop().frames.length,30);
});
test('timeout stops and restores probe without claiming complete; next scenario is isolated',()=>{
  const f=fixture(10000), original=f.app.renderer.render;
  const probe=installCharacterPerformanceProbe(f.app,f.scope);
  probe.begin();for(let n=0;n<9;n++)f.app.renderer.render();
  const sample=probe.stop();assert(!sample.complete);assert.equal(sample.frames.length,9);
  assert.equal(f.app.renderer.render,original);
  f.app.closed=false;
  const next=installCharacterPerformanceProbe(f.app,f.scope);next.begin();f.app.renderer.render();
  assert.equal(next.stop().frames.length,1);assert.equal(f.app.renderer.render,original);
});
test('context loss fails instead of counting an unrendered frame',()=>{
  const f=fixture(1000), probe=installCharacterPerformanceProbe(f.app,f.scope);
  f.app.renderer.gl.isContextLost=()=>true;probe.begin();
  assert.throws(()=>f.app.renderer.render(),/context lost/);
  assert.equal(probe.stop().frames.length,0);
});

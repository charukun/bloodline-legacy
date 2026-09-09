import test from 'node:test';
import assert from 'node:assert/strict';
import {loadScene} from './export_scene.mjs';

const scene=await loadScene(undefined,{x:6.5,z:19.5,zoom:11});

test('the real village art builds a dedicated dojo in either layout without a cottage fallback',()=>{
 const before=JSON.stringify(scene.sim.exportState()),r=scene.r,Art=r.art.constructor;
 const original={static:r.static,groundFX:r.groundFX};
 try{
  for(const side of [-1,1]){
   r.static=new Map();r.groundFX=new Map();const art=new Art(r);art.goldenActive=true;
   art.cottage=()=>assert.fail('dojo must not reuse the residential house');art.dojo(side*6.5,15.3);
   const rows=[...r.static.values()].flat();assert.ok(rows.length>100);assert.ok(rows.every(m=>m.every(Number.isFinite)));
   const roofs=r.static.get('roof');assert.ok(roofs?.some(m=>Math.abs(m[8])>5.5&&Math.abs(m[2])>3.6),'wide transverse roof silhouette');
   assert.ok(rows.every(m=>m[13]<4),'no residential chimney or dormer above the training roof');
   assert.ok(r.static.has('golden:slate'),'shares the existing village material/LOD path');
   // All new furnishing is behind the open forecourt and its eight approach paths.
   assert.ok(rows.every(m=>m[14]<18),'no high props in the practice approach');
   assert.ok(rows.length<350,'bounded instanced furnishing, without a new draw pass');
  }
 }finally{Object.assign(r,original);}
 assert.equal(JSON.stringify(scene.sim.exportState()),before,'rendering cannot mutate the room, player or RNG');
});

test('dojo district remains within the existing rendering budget and visible in the real draw batches',()=>{
 assert.ok(scene.stats.calls<=72);assert.ok(scene.stats.triangles<1_050_000);
 assert.ok(scene.passes.static.some(b=>b.mesh==='golden:slate'));
 assert.ok(scene.passes.staticShadow.some(b=>b.mesh==='roof'));
 assert.ok(scene.meshBytes<12*1024*1024);
});

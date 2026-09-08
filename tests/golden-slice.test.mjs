import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {loadScene, repository} from './export_scene.mjs';

const scene=await loadScene();
const copy=o=>JSON.parse(JSON.stringify(o));

test('scene authoring is deterministic and does not change the simulation',()=>{
  const before=copy(scene.sim.exportState()), rows=copy(scene.staticRows);
  scene.r.static.clear();scene.r.art.village(scene.snapshot.map);
  assert.deepEqual(copy(scene.sim.exportState()),before);
  assert.deepEqual(copy(Object.fromEntries(scene.r.static)),rows);
});

test('paving is bounded to the district and stays below the existing foot plane',()=>{
  const stones=scene.staticRows['golden:stone'].filter(m=>m[20]===20);
  assert.ok(stones.length>600 && stones.length<1600);
  for(const m of stones){assert.ok(Math.abs(m[12])<16 && m[14]>-14 && m[14]<22);
    assert.ok(m[13]+m[5]/2<=.18,'walking relief cannot raise the foot plane');}
});

test('authored meshes have finite nondegenerate triangles and upward paving faces',()=>{
  for(const [name,g] of Object.entries(scene.geometries).filter(([k])=>k.startsWith('golden:'))){
    assert.equal(g.positions.length,g.count*3);assert.equal(g.normals.length,g.count*3);
    assert.ok(g.positions.every(Number.isFinite));assert.ok(g.normals.every(Number.isFinite));
    for(let i=0;i<g.positions.length;i+=9){const p=g.positions,u=[0,1,2].map(k=>p[i+3+k]-p[i+k]),v=[0,1,2].map(k=>p[i+6+k]-p[i+k]);
      assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-10,name);}
    if(name==='golden:stone')assert.ok(g.normals.filter((v,i)=>i%3===1&&v>.99).length>=18);
  }
});

test('well has an open center and water below the annular coping',()=>{
  const well=scene.snapshot.map.schools.find(s=>s.id==='dance');
  const wall=scene.staticRows['golden:stone'].filter(m=>Math.hypot(m[12]-well.x,m[14]-well.z)<1.5&&m[13]>.2);
  assert.equal(wall.length,64);
  assert.ok(wall.every(m=>Math.hypot(m[12]-well.x,m[14]-well.z)>.9));
});

test('surface sampler avoids the existing character bone palette on texture unit 5',()=>{
  assert.equal(scene.uniforms.goldenAtlas,6);
  assert.equal(new Set(['shadowTex','dynamicShadow','materialAtlas','detailAtlas','terrainMap','goldenAtlas'].map(k=>scene.uniforms[k])).size,6);
  assert.ok(!Object.values(scene.staticRows).flat().some(m=>m[20]>=24));
});

test('new furnishing keeps the centerline and well approach free',()=>{
  // New high props, unlike the low pavement, must not occupy the central street.
  const items=Object.entries(scene.staticRows).filter(([k])=>k.startsWith('golden:')).flatMap(([,v])=>v);
  const well=scene.snapshot.map.schools.find(s=>s.id==='dance');
  for(const m of items.filter(m=>m[13]>.30&&Math.abs(m[12])<1.5&&m[14]>-6&&m[14]<20)){
    assert.ok(Math.abs(m[14]-well.z)<1.7,'centerline obstruction');
  }
});

test('district draw budget is bounded with real culling and instancing',()=>{
  assert.ok(scene.stats.calls<=72);assert.ok(scene.stats.triangles<1_050_000);
  assert.equal(scene.r.static.get('golden:grout').length,1);
  assert.ok(scene.meshBytes<12*1024*1024);
  const materialGroups=Object.keys(scene.staticRows).filter(k=>k.startsWith('golden:'));
  assert.equal(materialGroups.length,4);
});

test('new texture is original, deterministic and present in the embedded build',async()=>{
  const {createHash}=await import('node:crypto');
  const meta=JSON.parse(await fs.readFile(repository+'/public/assets/golden-assets.json'));
  const png=await fs.readFile(repository+'/public/assets/golden-surfaces.png');
  assert.equal(createHash('sha256').update(png).digest('hex'),meta.atlas.sha256);
  const html=await fs.readFile(repository+'/dist/index.html','utf8');
  assert.ok(html.includes(png.toString('base64')));assert.ok(html.includes('class GoldenArt extends VillageArt'));
});

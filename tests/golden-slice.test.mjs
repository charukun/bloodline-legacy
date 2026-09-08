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
  // Existing flower heads now use a golden mesh too; they are not new high props.
  const items=Object.entries(scene.staticRows).filter(([k])=>k.startsWith('golden:')&&k!=='golden:blossom').flatMap(([,v])=>v);
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
  assert.equal(materialGroups.length,6);
});

test('leaf and flower detail stays opaque, shared and cheaper than solid primitive clusters',()=>{
  const bough=scene.geometries['golden:canopy'],flower=scene.geometries['golden:blossom'];
  assert.ok(bough.count<scene.geometries['gltf:leaf-crown'].count,'per-bough geometry budget');
  assert.ok(flower.count<scene.geometries.beadlow.count,'all five petals cost less than one old petal');
  for(const mesh of ['golden:canopy','golden:blossom']){
    const rows=scene.staticRows[mesh];assert.ok(rows.length>20);
    assert.ok(rows.every(m=>m[19]===1),'no alpha overdraw or transparent sorting');
    assert.ok(scene.passes.dynamic.every(b=>b.mesh!==mesh),'environment-only mesh');
  }
});

test('new texture is original, deterministic and present in the embedded build',async()=>{
  const {createHash}=await import('node:crypto');
  const meta=JSON.parse(await fs.readFile(repository+'/public/assets/golden-assets.json'));
  const png=await fs.readFile(repository+'/public/assets/golden-surfaces.png');
  assert.equal(createHash('sha256').update(png).digest('hex'),meta.atlas.sha256);
  const html=await fs.readFile(repository+'/dist/index.html','utf8');
  assert.ok(html.includes(png.toString('base64')));assert.ok(html.includes('class GoldenArt extends VillageArt'));
});

test('terrain stays submitted across village positions, camera rotations and aspect ratios',()=>{
  const r=scene.r,oldGL=r.gl,oldCamera={...r.camera},oldWidth=r.width,oldHeight=r.height;
  const terrain=new Map([['slice-terrain',r.static.get('slice-terrain')]]);
  let draws=0;
  r.gl={...oldGL,drawArraysInstanced(){draws++;}};
  try{
    for(const [width,height] of [[640,1000],[1000,640]])for(const yaw of [.42,2.1]){
      r.width=width;r.height=height;
      for(const [x,z] of [[0,-29],[0,-38],[-28,-19],[28,-19],[-25,7],[25,7],[0,25],[1.8,16]]){
        Object.assign(r.camera,{x,z:z-1.5,yaw,zoom:16});r.matrix();
        for(const shadow of [false,true]){
          draws=0;r.drawBatches(terrain,{},shadow);
          assert.equal(draws,1,`terrain missing at ${x},${z}, ${width}x${height}, yaw ${yaw}, shadow ${shadow}`);
        }
      }
    }
  }finally{r.gl=oldGL;r.width=oldWidth;r.height=oldHeight;r.camera=oldCamera;r.matrix();}
});

test('batched grout bounds cover its real footprint and offscreen meshes still cull',()=>{
  const r=scene.r,oldCamera={...r.camera};
  try{
    const m=r.static.get('golden:grout')[0],bounds=r.geometryBounds('golden:grout');
    assert.ok(bounds.extent[0]*m[0]>10&&bounds.extent[2]*m[10]>10,'scaled grout footprint');
    // Origin is outside the view, but pavement at the southern end is visible.
    Object.assign(r.camera,{x:0,z:23,zoom:8,yaw:0});r.matrix();
    assert.equal(r.visible(m,r.vp,.09,bounds),true);
    const distant=m.slice();distant[12]+=1000;
    assert.equal(r.visible(distant,r.vp,.09,bounds),false);
    assert.equal(r.geometryBounds('golden:grout'),bounds,'static bounds are cached');
  }finally{r.camera=oldCamera;r.matrix();}
});

test('static shadow proxies reduce geometry while retaining roof shells and character passes',()=>{
  const shadow=scene.passes.staticShadow;
  assert.ok(shadow.reduce((n,b)=>n+b.count*b.instances/3,0)<430_000);
  assert.ok(shadow.some(b=>b.mesh==='roof'),'building roof silhouette survives');
  assert.ok(scene.passes.static.some(b=>b.mesh==='golden:slate'),'roof detail stays visible');
  for(const pass of [scene.passes.dynamic,scene.passes.dynamicShadow])
    assert.ok(pass.every(b=>b.mesh!=='beadlow'&&b.mesh!=='toruslow'),'character geometry is unchanged');
});

test('instance uploads reuse capacity and send only live rows on consecutive frames',()=>{
  const r=scene.r,oldGL=r.gl,frames=[];let type,frame,uploaded;
  r.gl={...oldGL,bindVertexArray(v){type=v;},bufferData(_,data){uploaded=data;frame.set(type,data.buffer);},
    drawArraysInstanced(_,start,count,instances){assert.equal(uploaded.length,instances*21);assert.ok(count>0);}};
  try{for(let i=0;i<2;i++){frame=new Map();r.drawBatches(r.static,{},false);frames.push(frame);}
    assert.ok(frames[0].size>10);for(const [mesh,buffer]of frames[0])assert.equal(frames[1].get(mesh),buffer);
  }finally{r.gl=oldGL;}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({Math,Float32Array});
for(const file of ['legacy/render_math.js','render/renderer-base.js'])vm.runInContext(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),ctx);
const {Renderer,rModel}=vm.runInContext('({Renderer,rModel})',ctx);

test('scenery cells never discard visible rotated, oversized, off-center or boundary-crossing geometry',()=>{
 const r=Object.assign(Object.create(Renderer.prototype),{width:540,height:960,camera:{x:0,z:16,yaw:.3,pitch:.52,zoom:12}});
 let seed=913;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const rows=Array.from({length:1800},()=>rModel((random()-.5)*160,random()*8,(random()-.5)*160,.1+random()*3,.1+random()*4,.1+random()*3,random()*6,random()*.5,random()*.5));
 rows.push(rModel(0,-.2,0,300,.1,300));
 for(const bounds of [{center:[0,0,0],extent:[.5,.5,.5]},{center:[-6,1,3],extent:[9,3,5]}]){
  const index=r.staticRanges(rows,bounds);
  for(let i=0;i<24;i++){
   Object.assign(r.camera,{x:(random()-.5)*70,z:(random()-.5)*70,yaw:random()*6,pitch:.3+random()*.8});r.matrix();
   for(const [vp,padding]of [[r.vp,.09],[r.lightVP,.4]]){
    const selected=new Set();for(const cell of index.cells.values())if(r.visible(rModel(),vp,padding,cell))for(const j of cell.indices)selected.add(j);
    for(let j=0;j<rows.length;j++)if(r.visible(rows[j],vp,padding,bounds))assert.ok(selected.has(j),`visible row ${j} discarded by cell`);
   }
  }
 }
});

test('appended scenery, rebuilt scenes and replaced geometry bounds invalidate the spatial index',()=>{
 const r=Object.create(Renderer.prototype),bounds={center:[0,0,0],extent:[1,1,1]},rows=[rModel()];
 const first=r.staticRanges(rows,bounds);assert.equal(r.staticRanges(rows,bounds),first);
 rows.push(rModel(20,0,20));const added=r.staticRanges(rows,bounds);assert.notEqual(added,first);assert.equal(added.radii.length,2);
 assert.notEqual(r.staticRanges([...rows],bounds),added);
 assert.notEqual(r.staticRanges(rows,{center:[40,0,0],extent:[20,1,1]}),added);
});

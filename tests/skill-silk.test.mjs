import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const c=vm.createContext({});vm.runInContext(read('src/render/skill-silk.js')+'\n'+read('src/render/skill-effects.js')+'\n'+read('src/render/combat-presentation.js'),c);
const {Silk,FX,Presentation}=vm.runInContext('({Silk:SkillSilk,FX:SkillEffects,Presentation:CombatPresentation})',c);
test('ribbon geometry has shared edges, UV bounds, bounded tessellation and tapered tips',()=>{
 for(const path of Object.keys(FX.options.path))for(const quality of ['low','high'])for(const u of [.2,.5,.8,.96]){
  const frames=Silk.stroke(FX.resolve({family:'blade',path}),u,quality);
  for(const ribbon of frames){
   const g=Silk.geometry(ribbon);assert(g.count<=48*6);assert(g.radius<4);assert([...g.positions,...g.normals].every(Number.isFinite));
   assert.deepEqual(ribbon.sections[0].a,ribbon.sections[0].b);
   for(let j=0;j<g.normals.length;j+=3){assert(g.normals[j]>=0&&g.normals[j]<=1);assert(g.normals[j+1]===0||g.normals[j+1]===1);}
   // Consecutive triangles share the exact edge: no disconnected diamonds.
   for(let j=0;j<g.count/6-1;j++){const end=Array.from(g.positions.slice(j*18+15,j*18+18)),next=Array.from(g.positions.slice((j+1)*18,(j+1)*18+3));assert.deepEqual(end,next);}
  }
 }
});
test('material erodes continuously, remains bounded and ends have no opaque seams',()=>{
 let opaque=0,eroded=0,maxDelta=0;
 for(let i=0;i<70;i++)for(let j=0;j<40;j++){
  const u=i/69,v=j/39,a=Silk.mask(u,v,0),b=Silk.mask(u,v,.95),next=Silk.mask(u,v,.501),prev=Silk.mask(u,v,.5);
  assert(a.alpha>=0&&a.alpha<=1);assert(b.alpha>=0&&b.alpha<=1);opaque+=a.alpha;eroded+=b.alpha;maxDelta=Math.max(maxDelta,Math.abs(next.alpha-prev.alpha));
 }
 assert(eroded<opaque*.7);assert(maxDelta<.03);
 for(const x of [0,.3,.7,1])assert.equal(Silk.mask(0,x,.4).alpha+Silk.mask(1,x,.4).alpha+Silk.mask(x,0,.4).alpha+Silk.mask(x,1,.4).alpha,0);
});
test('weapon trail remains attached to real sample endpoints and deterministic during hitstop',()=>{
 const samples=[{p:[1,1,2],t:1},{p:[.8,1.1,1.8],t:.98},{p:[.5,1,1.7],t:.96}];
 const a=Silk.trail(samples,[0,6,8],1),b=Silk.trail(samples,[0,6,8],1);assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.deepEqual(Array.from(a.sections[0].a),samples.at(-1).p);assert.deepEqual(Array.from(a.sections.at(-1).a),samples[0].p);
 assert.equal(Silk.trail(samples,[0,6,8],1.2).alpha,0);
});
test('renderer reuses a bounded ribbon pool and frees it on room disposal',()=>{
 vm.runInContext('globalThis.RG_CACHE=new Map()',c);
 const calls=[],deleted=[],r={quality:'low',geo:new Map(),instanceScratch:new Map(),fxBatches:[],add:(...a)=>calls.push(a),gl:{deleteBuffer:b=>deleted.push(b),deleteVertexArray:b=>deleted.push(b)}};
 const renderer=new Presentation(r),ribbons=Silk.stroke(FX.presets[0].recipe,.6,'low');
 for(let i=0;i<100;i++)renderer.composition(ribbons,v=>v);
 assert(renderer.silkKeys.size<=8);assert(renderer.compositionBudget>=0);
 const keys=[...renderer.silkKeys];for(const key of keys){r.geo.set(key,{vertex:key+'v',instance:key+'i',vao:key+'a'});r.instanceScratch.set(key,[]);}
 renderer.silkSlot=0;renderer.compositionBudget=256;renderer.composition(ribbons,v=>v);assert(renderer.silkKeys.size<=8);
 renderer.clearSilk();assert.equal(renderer.silkKeys.size,0);assert.equal(r.geo.size,0);assert.equal(r.instanceScratch.size,0);assert.equal(deleted.length,keys.length*3);
});
test('upgraded material only applies to blade, with legacy comparison retained',()=>{
 assert(FX.stroke(FX.presets[0].recipe,.6).some(p=>p.kind==='ribbon'));
 assert(!FX.stroke(FX.presets[0].recipe,.6,'high',true).some(p=>p.kind==='ribbon'));
 for(const preset of FX.presets.slice(1))assert.equal(JSON.stringify(FX.stroke(preset.recipe,.6)),JSON.stringify(FX.stroke(preset.recipe,.6,'high',true)));
});

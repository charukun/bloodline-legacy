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
test('flutter changes continuously before erosion, supports zero and deterministic seeds',()=>{
 const sample=(seed,clock,flutter=1)=>Silk.mask(.43,.42,0,{seed,clock,flutter}).alpha;
 assert.notEqual(sample(73,.1),sample(73,.3));assert.notEqual(sample(73,.3),sample(170,.3));
 assert.equal(sample(73,.1,0),sample(170,.3,0));
 let delta=0;
 for(let u=0;u<=1;u+=.025)for(let clock=0;clock<1;clock+=.013){
  const a=Silk.mask(u,.42,.1,{seed:73,clock,flutter:1}),b=Silk.mask(u,.42,.1,{seed:73,clock:clock+.0001,flutter:1});
  delta=Math.max(delta,Math.abs(a.alpha-b.alpha));
 }
 assert(delta<.004,'no temporal jumps at noise lattice boundaries');
 const recipe=FX.resolve({flutter:.9,thickness:3,seed:170}),frame=JSON.stringify(Silk.stroke(recipe,.63));
 Silk.stroke(recipe,.9);assert.equal(JSON.stringify(Silk.stroke(FX.resolve(JSON.parse(JSON.stringify(recipe))),.63)),frame);
});
test('thickness widens the wake without moving the cutting edge or increasing the mesh budget',()=>{
 const width=s=>Math.hypot(...s.a.map((v,i)=>v-s.b[i]));
 for(const path of Object.keys(FX.options.path))for(const quality of ['low','high']){
  const thin=Silk.stroke(FX.resolve({path,thickness:1,flutter:0}),.6,quality)[0];
  const thick=Silk.stroke(FX.resolve({path,thickness:3,flutter:0}),.6,quality)[0];
  const flutter=Silk.stroke(FX.resolve({path,thickness:3,flutter:1}),.6,quality)[0];
  assert.equal(thin.sections.length,thick.sections.length);
  thin.sections.forEach((s,i)=>{assert.deepEqual(s.a,thick.sections[i].a);assert.deepEqual(s.a,flutter.sections[i].a);assert(Math.abs(width(thick.sections[i])-width(s)*3)<1e-9);});
  assert.notEqual(JSON.stringify(thick.sections),JSON.stringify(flutter.sections));
 }
});
test('actual renderer freezes blade noise and trail ageing when the attack clock pauses',()=>{
 const ctx=vm.createContext({});vm.runInContext(`const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const skillById=id=>({id});const RG_CACHE=new Map();const SkillMotion={clock:(a,t)=>({duration:1,beat:t-a.actionStarted,index:0,shape:'slash'})};`,ctx);
 vm.runInContext(read('src/render/skill-silk.js')+'\n'+read('src/render/skill-effects.js')+'\n'+read('src/render/combat-presentation.js'),ctx);
 const P=vm.runInContext('CombatPresentation',ctx),actor={id:'a',alive:true,x:0,z:0,action:'attack',attackSkill:60041,actionStarted:1,actionUntil:2};
 const r={camera:{x:0,z:0},eye:[0,6,8],quality:'high',effects:[],weatherState:{rain:0},art:{sources:[]},weaponTips:new Map([['a',[0,1,1]]])},p=new P(r),draws=[];
 p.composition=primitives=>draws.push(JSON.stringify(primitives));
 const s={t:1.3,actors:[actor],room:{id:'test'}};p.update(s);
 r.weaponTips.set('a',[.2,1,1.2]);s.t=1.32;p.update(s);const before=draws.at(-1);
 actor.actionStarted+=.08;actor.actionUntil+=.08;s.t+=.08;p.update(s);
 assert.equal(draws.at(-1),before);assert.equal(p.trails.get('a').length,2);
 s.t+=.03;p.update(s);assert.notEqual(draws.at(-1),before);
 actor.actionStarted=s.t;actor.actionUntil=s.t+1;p.update(s);assert.equal(p.trails.has('a'),false);
});

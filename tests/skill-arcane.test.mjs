import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),c=vm.createContext({});
for(const name of ['skill-silk','skill-arcane','skill-effects','combat-presentation'])vm.runInContext(read('src/render/'+name+'.js'),c);
const {FX,Arc,P}=vm.runInContext('({FX:SkillEffects,Arc:SkillArcane,P:CombatPresentation})',c);
test('12 original forms have distinct body geometry with the same seed, color and timing',()=>{
 const signatures=Arc.definitions.map(d=>JSON.stringify(Arc.impact(FX.resolve({family:d.id,seed:9,layers:{sigil:false,motes:false}}),.16).map(p=>p.strips)));
 assert.equal(new Set(signatures).size,12);
 const core=read('src/legacy/core.js');for(const id of [4320,4311,4310,4303,4312,4030,4304,4031,4302,4330,4301,4313]){assert(core.includes('('+id+',')||core.includes('['+id+','));assert(Arc.has(FX.forSkill(id).family));}
});
test('each spell stays finite, bounded and visible across lifecycle and quality settings',()=>{
 for(const p of FX.presets.slice(6))for(const quality of ['low','high'])for(const age of [.001,.04,.16,.34,.56]){
  const frame=Arc.impact(p.recipe,age,quality),cost=frame.reduce((n,p)=>n+Arc.cost(p),0);assert(cost<=(quality==='low'?256:512));assert(frame.length<=(quality==='low'?8:16));
  for(const f of frame){const g=Arc.geometry(f);assert(g.count>0);assert(g.radius<6);assert([...g.positions,...g.normals,...Arc.ink(f)].every(Number.isFinite));assert(f.alpha>=0&&f.alpha<=1);}
  assert.equal(Arc.impact(p.recipe,Arc.life(p.recipe),quality).length,0);
 }
 for(let mode=0;mode<=7;mode++)for(let u=0;u<=1;u+=.07)for(let v=0;v<=1;v+=.08){const alpha=Arc.mask(mode,u,v,.3,.7,1);assert(Number.isFinite(alpha)&&alpha>=0&&alpha<=1);}
});
test('layers are independently removable and imports replay the same effect',()=>{
 for(const p of FX.presets.slice(6)){
  const empty=FX.resolve({...p.recipe,layers:{sigil:false,body:false,motes:false}});assert.equal(FX.frame(empty,.48).length,0);
  const noMotes=FX.resolve({...p.recipe,layers:{motes:false}});assert(!FX.frame(noMotes,.48).some(p=>p.kind==='motes'));
  const json=JSON.stringify(FX.frame(p.recipe,.56));FX.frame(p.recipe,.1);assert.equal(JSON.stringify(FX.frame(FX.resolve(JSON.parse(JSON.stringify(p.recipe))),.56)),json);
 }
 for(const layers of [[],1,{sigil:'yes'},{motes:1}])assert.throws(()=>FX.resolve({layers}));
});
test('spell meshes share the composition budget and dark eclipse uses alpha instead of additive',()=>{
 vm.runInContext('const RG_CACHE=new Map()',c);const draws=[],r={quality:'low',eye:[4,5,8],fxBatches:new Map(),add:(...args)=>draws.push(args)},p=new P(r);
 p.compositionBudget=256;const eclipse=Arc.impact(FX.resolve({family:'eclipse'}),.1,'low');
 p.composition(eclipse,v=>v);assert(draws.some(a=>Math.floor(a[7][0])%8===5&&a.at(-1)===r.fxBatches));assert(draws.some(a=>Math.floor(a[7][0])%8!==5&&a.at(-1)===r.arcaneFX));
 for(let j=0;j<40;j++)p.composition(eclipse,v=>v);assert(p.compositionBudget>=0);assert(p.silkKeys.size<=8);
});
test('spell impacts require a hit, anchor their ground layer and keep their authored lifetime',()=>{
 const ctx=vm.createContext({});vm.runInContext('const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const SkillMotion={groundAt:()=>2};const skillById=()=>null;',ctx);
 for(const name of ['skill-silk','skill-arcane','skill-effects','combat-presentation'])vm.runInContext(read('src/render/'+name+'.js'),ctx);
 const P=vm.runInContext('CombatPresentation',ctx),target={id:'target',alive:true,x:0,z:0},r={quality:'low',camera:{x:0,z:0},effects:[],weatherState:{rain:0},art:{sources:[]}},p=new P(r),draws=[];
 p.composition=(primitives,point)=>draws.push(primitives.flatMap(p=>(p.strips||[]).flatMap(s=>s.flatMap(q=>[point(q.a),point(q.b)]))));
 const s={t:1.1,actors:[target],room:{id:'test'}};p.update(s);assert.equal(draws.length,0);
 r.effects=[{type:'hit',skill:4320,target:'target',born:1,x:0,z:0}];p.update(s);assert(draws.length>0);assert(Math.min(...draws.at(-1).map(p=>p[1]))>=2.035-1e-6);
 s.t=1.6;p.update(s);assert.equal(r.effects.length,1);s.t=1+vm.runInContext("SkillEffects",ctx).life(r.effects[0].skillRecipe)+.001;p.update(s);assert.equal(r.effects.length,0);
});

import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const c=vm.createContext({});for(const f of ['skill-silk','skill-arcane','skill-effects','combat-presentation'])vm.runInContext(fs.readFileSync('src/render/'+f+'.js','utf8'),c);
const {FX,Arc,P}=vm.runInContext('({FX:SkillEffects,Arc:SkillArcane,P:CombatPresentation})',c),json=JSON.stringify;
test('cosmetic samples vary within limits while skill signature and source stay stable',()=>{
 for(const p of FX.presets){const r=FX.resolve({...p.recipe,variation:1}),before=json(r),a=FX.forCast(r,'actor:1'),b=FX.forCast(r,'actor:2');
  assert.notEqual(a.seed,b.seed);assert.equal(json(FX.forCast(r,'actor:1')),json(a));assert.equal(json(r),before);
  for(const k of ['family','path','rhythm','impact','release','palette'])assert.equal(a[k],b[k]);
  assert(a.thickness>=.5&&a.thickness<=3);assert(a.afterglow>=.5&&a.afterglow<=2.4);
  const still=FX.resolve({...r,variation:0});assert.equal(FX.forCast(still,1),FX.forCast(still,2));
 }
});
test('afterglow keeps the first 120ms intact and expires at the requested cosmetic lifetime',()=>{
 for(const p of FX.presets){const a=FX.resolve({...p.recipe,afterglow:.5}),b=FX.resolve({...p.recipe,afterglow:2.4});
  assert.deepEqual(FX.beats(a),FX.beats(b));assert.equal(json(FX.impact(a,.08)),json(FX.impact(b,.08)));
  assert(FX.life(b)>FX.life(a));assert.equal(FX.impact(a,FX.life(a)).length,0);assert.equal(FX.impact(b,FX.life(b)).length,0);
  assert(FX.frame(b,FX.beats(b).at(-1)+.3).length>0);assert(FX.beats(b).at(-1)+FX.life(b)<FX.duration);
 }
});
test('color evolves without replacing geometry; extreme thickness and variation stay bounded',()=>{
 for(const p of FX.presets.slice(6))for(const quality of ['low','high']){
  const r=FX.resolve({...p.recipe,thickness:3,afterglow:2.4,variation:1}),mono=FX.resolve({...r,palette:'native'});
  for(const t of [.04,.30,FX.life(r)-.01]){
   const a=Arc.impact(r,t,quality),b=Arc.impact(mono,t,quality);
   assert.equal(json(a.map(p=>p.strips??p.points)),json(b.map(p=>p.strips??p.points)));
   assert(a.reduce((n,p)=>n+Arc.cost(p),0)<=(quality==='low'?256:512));
   for(const p of a){const g=Arc.geometry(p);assert([...g.positions,...g.normals,...Arc.ink(p)].every(Number.isFinite));assert(g.radius<7);}
  }
 }
 assert.notEqual(FX.colorAt({palette:'amber'},0),FX.colorAt({palette:'amber'},1));
 for(const bad of [{afterglow:Infinity},{afterglow:0},{variation:NaN},{variation:2},{palette:'__proto__'}])assert.throws(()=>FX.resolve(bad));
 const old=FX.resolve({version:1});assert.equal(old.afterglow,1);assert.equal(old.variation,0);assert.equal(old.palette,'native');
});
test('one attack shares its sample with hits, freezes under hitstop, and releases actor caches',()=>{
 const p=new P({}),a={id:'hero',action:'attack',actionStarted:10},sk={id:4320},before=json(a),r=p.castRecipe(a,sk,10.1);
 assert.equal(json(a),before);a.actionStarted+=.1;assert.equal(p.castRecipe(a,sk,10.2),r);
 const hit={type:'hit',skill:4320,source:'hero',seq:8,born:10.2};assert.equal(p.hitRecipe(hit),r);
 a.action='recover';p.castRecipe(a,sk,10.4);a.action='attack';a.actionStarted=10.5;
 const next=p.castRecipe(a,sk,10.6);assert.notEqual(next.seed,r.seed);assert.equal(p.hitRecipe(hit),r);
 assert.equal(p.hitRecipe({type:'wound',skill:4320}),null);
 assert.equal(p.castRecipe(a,{id:4000},10.7),null);assert.equal(p.castSamples.size,0);
 assert.equal(p.hitRecipe(hit),r);
});
test('default spell anticipation is not a repeated ground sigil and shape evolution differs',()=>{
 const sigils=FX.presets.slice(6).filter(p=>FX.stroke(p.recipe,.4).some(f=>f.mode===2));assert.deepEqual(Array.from(sigils,p=>p.recipe.family),['pillar','gate']);
 const profiles=FX.presets.slice(6).map(p=>[.05,.18,.4].map(t=>{
  const body=Arc.impact(FX.resolve({...p.recipe,palette:'native',afterglow:1,variation:0,layers:{sigil:false,motes:false}}),t);
  return body.map(f=>Arc.geometry(f).radius.toFixed(2)).join(':');
 }).join('/'));assert.equal(new Set(profiles).size,12);
});

import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const c=vm.createContext({});for(const f of ['skill-silk','skill-arcane','skill-effects','combat-presentation'])vm.runInContext(fs.readFileSync('src/render/'+f+'.js','utf8'),c);
const {FX,Arc,Silk,P}=vm.runInContext('({FX:SkillEffects,Arc:SkillArcane,Silk:SkillSilk,P:CombatPresentation})',c);
test('fog masks fade to zero at padded support and stay smooth, bounded and reproducible',()=>{
 for(let mode=0;mode<7;mode++){
  for(const u of [.1,.4,.8]){assert.equal(Arc.mask(mode,u,1,.3,.4,.65,1),0);if(mode!==5)assert.equal(Arc.mask(mode,u,0,.3,.4,.65,1),0);}
  for(let u=.05;u<1;u+=.14)for(let v=.05;v<1;v+=.14){const a=Arc.mask(mode,u,v,.3,.4,.65,1),b=Arc.mask(mode,u,v,.3,.4001,.65,1);assert(a>=0&&a<=1&&Number.isFinite(a));assert(Math.abs(a-b)<.002);assert.equal(a,Arc.mask(mode,u,v,.3,.4,.65,1));}
 }
 for(const v of [0,1])assert.equal(Silk.mask(.5,v,.3,{mist:1}).alpha,0);
 const r=FX.resolve({family:'lotus'});assert.equal(r.mist,.85);assert.equal(FX.resolve(JSON.parse(JSON.stringify(r))).mist,.85);
 for(const mist of [-1,2,NaN,'1'])assert.throws(()=>FX.resolve({mist}));
});
test('fog widens the support without new vertices, particles, timing or silhouette definitions',()=>{
 for(const p of FX.presets.slice(6)){
  const a=FX.resolve({...p.recipe,mist:0}),b=FX.resolve({...p.recipe,mist:1}),A=Arc.impact(a,.16),B=Arc.impact(b,.16);
  assert.equal(FX.life(a),FX.life(b));assert.deepEqual(FX.beats(a),FX.beats(b));assert.equal(A.length,B.length);
  A.forEach((p,i)=>{const q=B[i];assert.equal(Arc.cost(p),Arc.cost(q));assert.equal(Arc.geometry(p).count,Arc.geometry(q).count);assert.equal(JSON.stringify(p.strips??p.points),JSON.stringify(q.strips??q.points));assert.equal(Math.floor(Arc.ink(q)[0])%8,p.mode);});
 }
 const a=Silk.stroke(FX.resolve({mist:0}),.5)[0],b=Silk.stroke(FX.resolve({mist:1}),.5)[0];assert.equal(Silk.geometry(a).count,Silk.geometry(b).count);assert(Silk.geometry(b).radius>=Silk.geometry(a).radius);assert.equal(Math.floor(Silk.ink(b)[1]),Math.floor(Silk.ink(a)[1]));
});
test('only composed skill needles and fragments use the haze materials',()=>{
 vm.runInContext('const RG_CACHE=new Map()',c);const draws=[],p=new P({quality:'high',fxBatches:new Map(),add:(...args)=>draws.push(args)});
 p.needle([0,0,0],[0,1,0],.1,'#ffffff',1);assert.equal(draws.at(-1)[11],4);
 p.composition([{kind:'line',a:[0,0,0],b:[0,1,0],width:.1,color:'#ffffff',alpha:1,mist:1},{kind:'shard',p:[0,1,0],size:[.2,.2,.2],turn:0,color:'#ffffff',alpha:1,mist:1}],v=>v);
 assert.equal(draws.at(-2)[11],26.49);assert.equal(draws.at(-1)[11],27.49);assert.equal(p.compositionBudget,510);
});

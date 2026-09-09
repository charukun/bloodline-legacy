import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {compileCatalog} from '../tools/skill-catalog.mjs';
const sources=['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','legacy/render_math.js','legacy/motion.js','legacy/art.js','render/tilt-shift.js','render/shaders.js','character/rig.js','character/golden-master.runtime.js','character/traveler-model.js','character/traveler-clip-data.js','character/traveler-clips.js','character/traveler-age.js','character/traveler-runtime.js'];
const gl=new Proxy({FLOAT:5126,UNSIGNED_SHORT:5123,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:k.startsWith('create')?()=>({}):()=>{}});
const ctx=vm.createContext({console,performance,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,URL,atob});
const defs=compileCatalog(JSON.parse(fs.readFileSync(new URL('../src/skills/catalog-source.json',import.meta.url),'utf8')));
vm.runInContext(`const BL_SKILL_DEFINITIONS=${JSON.stringify(defs)};class VillageArt{};const AssetBank={load:async()=>{}};`,ctx);
for(const s of sources)vm.runInContext(fs.readFileSync(new URL('../src/'+s,import.meta.url),'utf8'),ctx,{filename:s});
const T=vm.runInContext('Travelers',ctx),Model=vm.runInContext('TravelerModel',ctx);
const renderer=()=>({gl,programOf:()=>({}),frame:0,sceneKey:'village-test',static:new Map(),canvas:{height:900},viewHeight:16,camera:{zoom:16}});
const player=(race=0)=>({id:'hero',kind:'player',race,gender:[0,1,0,1][race],age:24,prologue:false,alive:true,x:0,z:4,dir:0,weapon:-1,armor:0,action:'idle',wounds:{},statuses:{}});
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};

test('four approved identities extend across ages; other characters retain their renderer',()=>{
 for(let race=0;race<4;race++){const p=player(race);assert(T.eligible(p,true));assert(!T.eligible(p,false));for(const age of [0,1,4,9,10,17,18,34,35,55,72,100])assert(T.eligible({...p,age},true));assert(T.eligible({...p,age:1,prologue:true},true));for(const change of [{age:-1},{age:NaN},{gender:1-p.gender},{kind:'guard'},{kind:'portrait'}])assert(!T.eligible({...p,...change},true));}
});
test('two LODs preserve seams, valid four weights, limb regions and a bounded model cache',()=>{
 for(let race=0;race<4;race++){const a=T.prepare(race);assert(a.bind.length<=17);assert(a.lods[1].indices.length<a.lods[0].indices.length*.70);for(const lod of a.lods){const d=lod.attrs,n=d.POSITION.length/3;assert(n<65536);assert(lod.indices.every(i=>i<n));for(const ar of Object.values(d))assert(ar.every(Number.isFinite));for(let i=0;i<n;i++){const w=d.WEIGHTS_0.slice(i*4,i*4+4);assert(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-5);assert(w.every(x=>x>=0&&x<=1));assert(d.JOINTS_0.slice(i*4,i*4+4).every(j=>j<a.bind.length));}for(const region of [2,3,4,5,10])assert(d._REGION.includes(region));}}
 assert(T.modelCache.size<=2);
});
test('new rig in its bind pose preserves the authored character proportions',()=>{
 for(let race=0;race<4;race++){const raw=Model.create(Model.definitions[race].id).data,a=T.prepare(race),pos=a.lods[0].attrs.POSITION;for(let i=0;i<pos.length;i++)assert(Math.abs(pos[i]-raw.positions[i]*1.5)<1e-6);}
});
test('all four movement rigs keep frozen snapshots, finite joints and planted feet',t=>{
 for(let race=0;race<4;race++)for(const speed of [1.2,3.8,6.8]){
  const r=renderer(),c=new T.Character(r,race);let previous=[],slip=0,error=0,drop=0;
  for(let i=0;i<100;i++){const p=freeze({...player(race),z:4+Math.min(65,i)*speed/30,action:i<=65?'run':'idle',dash:speed>6?{}:null});const saved=JSON.stringify(p);r.frame++;c.update(p,i/30);assert.equal(JSON.stringify(p),saved);assert(c.palette.every(Number.isFinite));
   for(let k=0;k<c.footDebug.length;k++){const f=c.footDebug[k],b=previous[k];error=Math.max(error,f.error);if(!f.swing&&b&&!b.swing)slip=Math.max(slip,Math.hypot(f.actual[0]-b.actual[0],f.actual[2]-b.actual[2]));}
   previous=structuredClone(c.footDebug);drop=Math.max(drop,c.metrics.pelvisDrop);
  }
  t.diagnostic(JSON.stringify({race,speed,slip,error,drop}));assert(slip<.012);assert(error<.035);assert(drop<.38);
 }
});
test('combat, impact, rest, rescue, traversal and death follow existing state clocks',()=>{
 const cases=[{autoFight:'enemy'},{action:'attack',actionStarted:0,actionUntil:1,weapon:0},{seated:true,sitSince:0},{activity:'pray',activitySince:0},{traversal:{progress:.5},supportHeight:1,verticalOffset:.2},{lifeState:'downed',downedAt:0},{lifeState:'carried',downedAt:0,baseY:1.2},{standUpAt:0,standUpUntil:1},{rescueTarget:'friend'},{alive:false,deathAt:0},{hitReactAt:.2,hitReactUntil:1,hitReactSeverity:.5,hitPart:'rightArm',hitMotionId:1,wounds:{rightArm:{severity:'lost'}}}];
 for(let race=0;race<4;race++)for(const state of cases){const r=renderer(),c=new T.Character(r,race),p=freeze({...player(race),...state}),before=JSON.stringify(p);c.update(p,.5);assert(c.palette.every(Number.isFinite),JSON.stringify(state));assert.equal(JSON.stringify(p),before);}
});
test('repeat render sampling and teleport reset cannot advance authoritative timing',()=>{
 const r=renderer(),c=new T.Character(r);for(let i=0;i<10;i++){const p=player();p.z+=i*.06;p.action='run';r.frame++;c.update(p,i/30);const phase=c.state.phase,mat=Array.from(c.palette);r.frame++;c.update(p,i/30);assert.equal(c.state.phase,phase);assert(mat.every((x,k)=>Math.abs(x-c.palette[k])<1e-5));}
 for(const [t,x]of [[2,20],[0,0]]){r.frame++;c.update({...player(),x},t);assert(c.palette.every(Number.isFinite));}
});

test('confirmed damage follows the active traveler skeleton rather than CM01 indices',()=>{
 vm.runInContext(fs.readFileSync(new URL('../src/render/combat-presentation.js',import.meta.url),'utf8'),ctx);
 const FX=vm.runInContext('CombatPresentation',ctx);
 for(let race=0;race<4;race++){
  const r=renderer(),c=new T.Character(r,race),p=player(race);r.characterMaster=c;c.update(p,.5);const fx=new FX(r);
  for(const [part,index]of [['head',2],['torso',1],['rightArm',4],['leftArm',7],['rightLeg',10],['leftLeg',13]]){
   const hit=Array.from(fx.contact({part},p,p.x,p.z,0)),m=c.transforms[index];
   assert.deepEqual(hit,[m[12],m[13],m[14]-.12]);
  }
 }
});

const Age=vm.runInContext('TravelerAge',ctx);
test('age landmarks are continuous, young adult geometry stays exact and dwarf beard grows after childhood',()=>{
 for(let race=0;race<4;race++){
  const asset=T.prepare(race),p=player(race),points=[[.1,.2,.1],[.2,.8,.1],[.1,2,.3]];
  for(const boundary of [4,10,18,35,55,72]){
   const before=Age.sample({...p,age:boundary-1,ageFraction:.999999}),after=Age.sample({...p,age:boundary});
   for(const head of [false,true])for(const v of points){const a=Age.point(v,head,before,asset),b=Age.point(v,head,after,asset);assert(Math.hypot(...a.map((x,i)=>x-b[i]))<1e-6);}
  }
  for(const v of points)for(const head of [false,true])assert(Age.point(v,head,Age.sample(p),asset).every((x,i)=>Math.abs(x-v[i])<1e-12));
  const child=Age.sample({...p,age:4}),adult=Age.sample(p),elder=Age.sample({...p,age:80});
  assert(child.head[0]/child.body[0]>adult.head[0]/adult.body[0]);assert(child.body[0]!==child.body[1]);assert(elder.gray>.9);assert(elder.posture>0);assert.equal(child.beard,0);assert.equal(adult.beard,1);
 }
});
test('each age uses the same GPU geometry and keeps the small feet grounded while moving and stopping',()=>{
 for(let race=0;race<4;race++){
  const r=renderer(),c=new T.Character(r,race),gpu=c.lods,rest=c.restAsset;let previous=[];
  for(const age of [4,10,17.99,35,55,72,99])for(const speed of [1.2,4.5,6.8]){
   c.state=null;previous=[];
   for(let i=0;i<70;i++){
    const p=freeze({...player(race),age,action:i<45?'run':'idle',z:4+Math.min(i,44)*speed/30,dash:speed>6?{}:null});r.frame++;c.update(p,i/30);
    assert.strictEqual(c.lods,gpu);assert.strictEqual(c.restAsset,rest);assert(c.palette.every(Number.isFinite));assert(c.metrics.contactError<.035);assert(c.metrics.pelvisDrop<.38);
    for(let k=0;k<c.footDebug.length;k++){const a=c.footDebug[k],b=previous[k];if(!a.swing&&b&&!b.swing)assert(Math.hypot(a.actual[0]-b.actual[0],a.actual[2]-b.actual[2])<.012);}
    previous=structuredClone(c.footDebug);
   }
  }
 }
});
test('cradle, lowering and existing release transition keep simulation and GPU allocation intact',()=>{
 for(let race=0;race<4;race++){
  const r=renderer(),c=new T.Character(r,race),gpu=c.lods;
  for(const t of [0,9,27,28.55,29,29.99,30,30.01]){
   const p=freeze({...player(race),age:t<30?Math.min(3,Math.floor(t/9)):4,prologue:t<30,born:0,releaseAt:30}),before=JSON.stringify(p);r.frame++;c.update(p,t);
   assert(c.palette.every(Number.isFinite));assert.equal(JSON.stringify(p),before);assert.strictEqual(c.lods,gpu);
  }
  const a=Age.sample({...player(race),age:3,prologue:true,born:0,releaseAt:30},29.99999),b=Age.sample({...player(race),age:4},30);
  assert(Math.abs(a.visual-b.visual)<1e-6);
 }
});

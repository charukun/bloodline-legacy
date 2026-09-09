import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {compileCatalog} from '../tools/skill-catalog.mjs';
const sources=['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','legacy/render_math.js','legacy/motion.js','legacy/art.js','render/tilt-shift.js','render/shaders.js','character/rig.js','character/golden-master.runtime.js','character/traveler-model.js','character/traveler-runtime.js'];
const gl=new Proxy({FLOAT:5126,UNSIGNED_SHORT:5123,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:k.startsWith('create')?()=>({}):()=>{}});
const ctx=vm.createContext({console,performance,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,URL,atob});
const defs=compileCatalog(JSON.parse(fs.readFileSync(new URL('../src/skills/catalog-source.json',import.meta.url),'utf8')));
vm.runInContext(`const BL_SKILL_DEFINITIONS=${JSON.stringify(defs)};class VillageArt{};const AssetBank={load:async()=>{}};`,ctx);
for(const s of sources)vm.runInContext(fs.readFileSync(new URL('../src/'+s,import.meta.url),'utf8'),ctx,{filename:s});
const T=vm.runInContext('Travelers',ctx),Model=vm.runInContext('TravelerModel',ctx);
const renderer=()=>({gl,programOf:()=>({}),frame:0,sceneKey:'village-test',static:new Map(),canvas:{height:900},viewHeight:16,camera:{zoom:16}});
const player=(race=0)=>({id:'hero',kind:'player',race,gender:[0,1,0,1][race],age:24,prologue:false,alive:true,x:0,z:4,dir:0,weapon:-1,armor:0,action:'idle',wounds:{},statuses:{}});
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};

test('four approved age/gender samples only; other characters retain their renderer',()=>{
 for(let race=0;race<4;race++){const p=player(race);assert(T.eligible(p,true));assert(!T.eligible(p,false));for(const change of [{age:17},{age:35},{gender:1-p.gender},{prologue:true},{kind:'guard'},{kind:'portrait'}])assert(!T.eligible({...p,...change},true));}
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

test('all four new models follow an actual climb, landing and descent without ground IK pinning them in midair',()=>{
 const Simulation=vm.runInContext('Simulation',ctx);
 for(let race=0;race<4;race++){
  const sim=new Simulation({seed:13}),p=sim.addPlayer('terrain-'+race,{owner:'terrain-'+race,race}),room=sim.getRoom(p),o=room.map.traversables.find(o=>o.id==='north:lower');room.actors=[];room.waveAt=1e8;
  Object.assign(p,{prologue:false,age:24,ageFraction:0,gender:[0,1,0,1][race],introUntil:-100,releaseAt:-100,farewellStage:3,stun:0,cooldown:0,x:o.x,z:-18.7,supportHeight:0});
  const r=renderer();r.traversalMap=room.map;const c=new T.Character(r,race);let direction=1,climbed=false,air=0,landed=0;
  for(let i=0;i<600;i++){
   sim.command(p.id,{type:'move',x:0,z:direction});sim.tick(1/60);const snapshot=freeze(JSON.parse(JSON.stringify(p))),saved=JSON.stringify(p);r.frame++;c.update(snapshot,sim.time);
   assert(c.palette.every(Number.isFinite));assert.equal(JSON.stringify(p),saved);
   if(p.traversal){air++;assert.equal(c.footDebug.length,0);assert(Math.abs(c.transforms[0][13]-(Math.max(.1,p.supportHeight)+(p.verticalOffset||0)))<1e-5);}
   else {for(const f of c.footDebug)assert(f.soleY>=f.floor-.035);if(p.action==='land')landed++;}
   if(!p.traversal&&p.supportHeight===1.2){climbed=true;direction=-1;}
   if(climbed&&!p.traversal&&p.supportHeight===0&&p.z<-18.55)break;
  }
  assert(climbed&&air>60&&landed>=4);assert.equal(p.supportHeight,0);assert.equal(p.traversal,null);
 }
});

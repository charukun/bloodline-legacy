import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sources=['legacy/dialogue.js','legacy/core.js','legacy/render_math.js','legacy/motion.js','legacy/art.js','render/shaders.js','character/rig.js','character/golden-master.runtime.js'];
const gl=new Proxy({FLOAT:5126,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:k.startsWith('create')?()=>({}):()=>{}});
class DecodedImage { set src(_){queueMicrotask(()=>this.onload());} }
const context=vm.createContext({console,performance,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,URL,atob,Image:DecodedImage,queueMicrotask});
vm.runInContext('class VillageArt extends Object {}; const AssetBank={load:async()=>{}};',context);
for(const source of sources)vm.runInContext(fs.readFileSync(new URL('../src/'+source,import.meta.url),'utf8'),context,{filename:source});
const cm=vm.runInContext('CM01',context);
await cm.load(fs.readFileSync(new URL('../public/assets/character/young-human-male-cm01.glb',import.meta.url)).toString('base64'));
const renderer=()=>({gl,programOf:()=>({u:new Map()}),frame:0,sceneKey:'village-test',static:new Map(),canvas:{height:900},viewHeight:16,camera:{zoom:16}});
const player=()=>({id:'hero',kind:'player',alive:true,prologue:false,race:0,gender:0,age:24,x:0,z:4,dir:0,weapon:-1,armor:0,action:'idle',wounds:{},statuses:{}});
function frozen(value){for(const x of Object.values(value))if(x&&typeof x==='object')frozen(x);return Object.freeze(value);}
function poseSequence(points){const r=renderer(),c=new cm.Character(r);const values=[];for(const p of points){r.frame++;c.update(frozen(p),p.time);values.push({metrics:c.metrics,feet:structuredClone(c.footDebug),palette:Array.from(c.palette)});}return {c,values};}

test('only the local young human male uses the master',()=>{
  const p=player();assert(cm.eligible(p,true));assert(!cm.eligible(p,false));
  for(const fields of [{age:17},{age:35},{gender:1},{race:1},{kind:'guard'},{kind:'portrait'},{kind:'parent'},{prologue:true}])assert(!cm.eligible({...p,...fields},true),JSON.stringify(fields));
});
test('rendering leaves deeply frozen game snapshots untouched',()=>{
  const p=player(),original=JSON.stringify(p);const r=renderer(),c=new cm.Character(r);
  for(let i=0;i<30;i++){r.frame++;c.update(frozen(p),i/30);}assert.equal(JSON.stringify(p),original);
});
test('walk/run/pause maintain finite joints and plausible pelvis height',t=>{
  for(const speed of [1.2,3.8,6.8]){
    const points=Array.from({length:181},(_,i)=>({...player(),time:i/30,z:4+i/30*speed,action:'run',dash:speed>6?{}:null}));
    const {values}=poseSequence(points);
    assert(values.every(v=>v.palette.every(Number.isFinite)),`finite at speed ${speed}`);
    assert(values.every(v=>v.metrics.pelvisDrop<.38),`pelvis at speed ${speed}: ${Math.max(...values.map(v=>v.metrics.pelvisDrop))}`);
    const supports=values.flatMap(v=>v.feet.filter(f=>!f.swing));
    assert(supports.every(f=>f.error<.035),`support reach at speed ${speed}: ${Math.max(...supports.map(f=>f.error))}`);
    t.diagnostic(JSON.stringify({speed,frames:values.length,maxPelvisDrop:Math.max(...values.map(v=>v.metrics.pelvisDrop)),maxSupportError:Math.max(...supports.map(f=>f.error))}));
  }
});
test('turn, teleport, and time rewind reset visual contact state safely',()=>{
  const {values}=poseSequence([{...player(),time:1},{...player(),time:1.1,x:.2,action:'run'},{...player(),time:1.2,dir:Math.PI},{...player(),time:1.3,x:20},{...player(),time:0,x:0}]);
  assert(values.every(v=>v.palette.every(Number.isFinite)));
  assert(values.every(v=>v.metrics.pelvisDrop<.38));
});
test('six requested states are sampled from existing motion clocks',()=>{
  const fixtures=[{name:'idle',p:{}},{name:'combat_idle',p:{autoFight:'foe'}},{name:'attack',p:{action:'attack',attackSkill:4100,actionStarted:0,actionUntil:1}},{name:'hit',p:{hitReactAt:0,hitReactUntil:1,hitPart:'torso',hitSeverity:'heavy'}}];
  for(const f of fixtures){const {values}=poseSequence([{...player(),...f.p,time:.1}]);assert.equal(values[0].metrics.animation,f.name);assert(values[0].palette.every(Number.isFinite));}
  for(const [speed,name] of [[1.2,'walk'],[3.8,'run']]){const {values}=poseSequence(Array.from({length:30},(_,i)=>({...player(),time:i/30,z:4+i/30*speed,action:'run'})));assert.equal(values.at(-1).metrics.animation,name);}
});
test('LOD hysteresis switches only beyond the two thresholds',()=>{
  const r=renderer(),c=new cm.Character(r);c.update(player(),0);assert.equal(c.lod,0);
  r.viewHeight=30;c.update(player(),.1);assert.equal(c.lod,1);
  r.viewHeight=25;c.update(player(),.2);assert.equal(c.lod,1);
  r.viewHeight=20;c.update(player(),.3);assert.equal(c.lod,0);
});
test('bound skeleton inverse matrices reproduce the rest pose',()=>{
  const a=cm.asset;assert.equal(a.names.length,31);
  for(let i=0;i<a.bind.length;i++){const b=a.bind[i],m=a.ibm.subarray(i*16,i*16+16);for(let j=0;j<3;j++)assert(Math.abs(b[j]+m[12+j])<1e-6);}
});
test('resting and limb loss preserve finite visual transforms',()=>{
  for(const p of [{seated:true,sitSince:0},{wounds:{rightLeg:{severity:'lost'},leftArm:{severity:'lost'}}},{activity:'read',activitySince:0}]){
    const {values}=poseSequence([{...player(),...p,time:.5}]);assert(values[0].palette.every(Number.isFinite));
  }
});
test('invalid GLB cannot silently install an empty or partial model',async()=>{
  const original=cm.asset;
  await assert.rejects(cm.load(''),/invalid glTF/);
  const b=fs.readFileSync(new URL('../public/assets/character/young-human-male-cm01.glb',import.meta.url));
  await assert.rejects(cm.load(b.subarray(0,b.length-4).toString('base64')),/invalid glTF/);
  assert.equal(cm.asset,original);
});
test('resume after a long render gap starts with new foot anchors',()=>{
  const {c,values}=poseSequence([{...player(),time:0},{...player(),time:.1,z:4.5,action:'run'},{...player(),time:60,z:5,action:'idle'}]);
  assert.equal(c.state.speed,0);assert(values.at(-1).feet.every(f=>f.error<.001));
});

function simulation(){const sim=vm.runInContext("new Simulation({seed:7349,mode:'normal'})",context);const p=sim.addPlayer('hero',{owner:'character-test',race:0,name:'QA'});sim.releaseFromParent(p);p.age=24;p.gender=0;return {sim,p,room:sim.getRoom(p)};}
test('house collision sweep still stops at the original hull',()=>{
  const {sim,p,room}=simulation(),h=room.map.houses[0];p.x=h.x-4;p.z=h.z;
  sim.moveAttackStep(p,room,8,0);assert(p.x<=h.x-2+1e-6);
});
test('body collision retains player and dummy radii',()=>{
  const {sim,p,room}=simulation(),dummy=room.actors.find(a=>a.kind==='dummy');p.x=dummy.x;p.z=dummy.z+2;
  sim.moveAttackStep(p,room,0,-3);assert(Math.hypot(p.x-dummy.x,p.z-dummy.z)>=sim.collisionRadius(p)+sim.collisionRadius(dummy)-1e-6);
});
test('visual updates retain world bounds and full simulation serialization',()=>{
  const {sim,p,room}=simulation();p.x=34;p.z=0;sim.moveAttackStep(p,room,10,0);assert(p.x<=35);
  const before=JSON.stringify(sim.exportState()),r=renderer(),c=new cm.Character(r);
  c.update(frozen(JSON.parse(JSON.stringify(p))),sim.time);
  assert.equal(JSON.stringify(sim.exportState()),before);
  context.saved=JSON.parse(before);const restored=vm.runInContext('Simulation.restore(saved)',context);
  assert.equal(JSON.stringify(restored.exportState()),before);
});
test('attack and hit clocks remain unchanged after character sampling',()=>{
  const {sim,p}=simulation();p.action='attack';p.attackSkill=4100;p.actionStarted=10;p.actionUntil=11;p.hitReactAt=10;p.hitReactUntil=10.8;p.hitstopUntil=10.2;
  const before=JSON.stringify(sim.exportState()),r=renderer(),c=new cm.Character(r);
  for(let i=0;i<30;i++)c.update(frozen(JSON.parse(JSON.stringify(p))),10+i/30);
  assert.equal(JSON.stringify(sim.exportState()),before);
});

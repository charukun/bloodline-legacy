import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {compileCatalog} from '../tools/skill-catalog.mjs';

const sources=['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','legacy/render_math.js','legacy/motion.js','legacy/art.js','render/tilt-shift.js','render/shaders.js','character/rig.js','character/golden-master.runtime.js'];
const gl=new Proxy({FLOAT:5126,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:k.startsWith('create')?()=>({}):()=>{}});
class DecodedImage { set src(_){queueMicrotask(()=>this.onload());} }
const context=vm.createContext({console,performance,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,URL,atob,Image:DecodedImage,queueMicrotask});
const definitions=compileCatalog(JSON.parse(fs.readFileSync(new URL('../src/skills/catalog-source.json',import.meta.url),'utf8')));
vm.runInContext(`const BL_SKILL_DEFINITIONS=${JSON.stringify(definitions)};`,context);
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
test('Golden Slice paving contributes to visual ground contact',()=>{
  const r=renderer(),stone=vm.runInContext('rModel(0,.148,4,1,.053,1)',context);
  r.static=new Map([['golden:stone',[stone]]]);const c=new cm.Character(r);
  assert(Math.abs(c.groundAt(0,4)-.1745)<1e-5,'sole would sink below GS02 paving');
  assert(c.groundAt(2,4)<.12,'paving height must not spread to adjacent grass');
});
test('character textures preserve the Golden Slice atlas binding',()=>{
  const constants={TEXTURE0:33984,TEXTURE5:33989,TEXTURE6:33990,TEXTURE7:33991};
  const bindings=new Map(),samplers={},golden={};let active;
  const tracked=new Proxy(gl,{get:(g,k)=>k==='activeTexture'?unit=>{active=unit;}:k==='bindTexture'?(_target,texture)=>bindings.set(active,texture):k in constants?constants[k]:g[k]});
  const r=renderer();r.gl=tracked;r.stats={calls:0,triangles:0};r.uniform=()=>{};r.int=(_p,name,unit)=>{samplers[name]=unit;};
  r.setupSurfaceUniforms=()=>{tracked.activeTexture(constants.TEXTURE6);tracked.bindTexture(3553,golden);};
  const c=new cm.Character(r);c.update(player(),0);c.draw(false);
  assert.equal(bindings.get(constants.TEXTURE6),golden);
  assert.deepEqual([samplers.cmBase,samplers.cmOrm,samplers.cmNormal],[7,8,9]);
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
test('stopping settles feet with a lift instead of sliding a grounded sole',()=>{
  for(const speed of [1.2,3.8]){
    const points=Array.from({length:121},(_,i)=>({...player(),time:i/30,z:4+Math.min(i,45)/30*speed,action:i<=45?'run':'idle'}));
    const {values}=poseSequence(points);
    let slip=0;
    for(let i=47;i<values.length;i++)for(let side=0;side<2;side++){
      const a=values[i-1].feet[side],b=values[i].feet[side];
      if(a&&!a.swing&&b&&!b.swing)slip=Math.max(slip,Math.hypot(b.actual[0]-a.actual[0],b.actual[2]-a.actual[2]));
    }
    assert(slip<.012,`grounded stop slip at ${speed}: ${slip}`);
  }
});
test('rendering a 30 Hz movement snapshot twice preserves gait phase',()=>{
  const points=Array.from({length:61},(_,i)=>({...player(),time:i/30,z:4+i/30*3.8,action:'run'}));
  const once=poseSequence(points),twice=poseSequence(points.flatMap(p=>[p,{...p}]));
  assert(Math.abs(once.c.state.phase-twice.c.state.phase)<1e-8,'extra render restarted the stride');
  const a=once.values.at(-1).palette,b=twice.values.at(-1).palette;
  assert(a.every((v,i)=>Math.abs(v-b[i])<1e-5),'pose depends on render sampling rate');
});

test('interpolated render positions retain CM01 movement speed between simulation ticks',()=>{
  vm.runInContext(fs.readFileSync(new URL('../src/render/motion-interpolation.js',import.meta.url),'utf8'),context);
  const Motion=vm.runInContext('MotionInterpolation',context);
  for(const hz of [30,60,120]){
    const r=renderer(),c=new cm.Character(r),p={...player(),room:'village',action:'run'};
    const room={id:'village',actors:[]},sim={time:0,players:new Map([[p.id,p]]),getRoom:()=>room};
    const motion=new Motion();let tick=0;
    for(let frame=0;frame<=hz*2;frame++){
      const now=frame/hz,wanted=Math.floor(now*30+1e-8)+1;
      while(tick<wanted){motion.capture(sim,p.id);sim.time=++tick/30;p.z=4+sim.time*3.8;}
      const snapshot={t:sim.time,player:p,players:[p],actors:[],room};
      const rendered=motion.sample(snapshot,now*30-(tick-1));
      r.frame++;c.update(rendered.player,rendered.t);
      assert.equal(rendered.t,sim.time,'combat time remains authoritative');
    }
    assert.ok(Math.abs(c.state.speed-3.8)<.01,`${hz} Hz estimated speed ${c.state.speed}`);
    assert.equal(c.state.gaitMode,'run');
  }
});
test('accelerating from rest through walk and run preserves planted world anchors',()=>{
  for(const speed of [3.8,5.665,6.8]){
    const points=Array.from({length:91},(_,i)=>({...player(),time:i/30,z:4+Math.max(0,i-3)/30*speed,action:i>3?'run':'idle',dash:speed>6&&i>3?{}:null}));
    const {values}=poseSequence(points);let slip=0;
    for(let i=1;i<values.length;i++)for(let side=0;side<2;side++){
      const a=values[i-1].feet[side],b=values[i].feet[side];
      if(!a.swing&&!b.swing)slip=Math.max(slip,Math.hypot(b.actual[0]-a.actual[0],b.actual[2]-a.actual[2]));
    }
    assert(slip<.012,`grounded acceleration slip at ${speed}: ${slip}`);
    assert(values.every(v=>v.metrics.pelvisDrop<.38),'acceleration pelvis reach');
  }
});
test('a full-speed reversal releases unreachable feet before the pelvis collapses',()=>{
  for(const speed of [3.8,5.665,6.8]){
    const points=Array.from({length:80},(_,i)=>({...player(),time:i/30,z:4+(i<=20?i:40-i)/30*speed,dir:i<=20?0:Math.PI,action:'run',dash:speed>6?{}:null}));
    const {values}=poseSequence(points);
    assert(values.every(v=>v.metrics.pelvisDrop<.38),`reversal pelvis at ${speed}: ${Math.max(...values.map(v=>v.metrics.pelvisDrop))}`);
    assert(values.every(v=>v.feet.every(f=>f.error<.035)),'reversal joint reach');
    for(let i=1;i<values.length;i++)for(let j=0;j<2;j++){
      const a=values[i-1].feet[j],b=values[i].feet[j];
      if(!a.swing&&!b.swing)assert(Math.hypot(b.actual[0]-a.actual[0],b.actual[2]-a.actual[2])<.012,'planted reversal sole moved');
    }
  }
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

test('directional strong hits keep support soles grounded through recoil and recovery',()=>{
 for(const part of ['head','torso','rightArm','leftLeg'])for(const direction of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const points=Array.from({length:91},(_,i)=>({...player(),time:1+i/60,hitReactAt:1,hitReactUntil:1.72,hitMotionId:1,hitPart:part,hitDir:direction,hitSeverity:'heavy',hitStrength:1}));
  const {values}=poseSequence(points);let slip=0;
  for(let i=1;i<values.length;i++)for(let side=0;side<2;side++){
   const a=values[i-1].feet[side],b=values[i].feet[side];
   if(!a.swing&&!b.swing)slip=Math.max(slip,Math.hypot(b.actual[0]-a.actual[0],b.actual[2]-a.actual[2]));
  }
  assert(slip<.012,`${part} ${direction} support slip ${slip}`);
  assert(values.every(v=>v.feet.every(f=>f.error<.035&&f.soleY>=f.floor-.006)),'finite reach and no ground penetration');
  assert(values.every(v=>v.palette.every(Number.isFinite)));
 }
});
test('alternating repeated hits preserve continuous foot targets and settle by the existing deadline',()=>{
 let fields={};const points=Array.from({length:151},(_,i)=>{
  const time=1+i/120;if(i%12===0&&i<96)fields={hitReactAt:time,hitReactUntil:time+.72,hitMotionId:i/12+1,hitDir:i%24?Math.PI/2:-Math.PI/2};
  return {...player(),time,...fields,hitPart:'leftLeg',hitSeverity:'heavy',hitStrength:1};
 });
 const {values}=poseSequence(points);
 for(let i=1;i<values.length;i++)for(let j=0;j<2;j++)assert(Math.hypot(...values[i].feet[j].actual.map((x,k)=>x-values[i-1].feet[j].actual[k]))<.06,'no foot teleport on re-hit');
 assert(values.every(v=>v.palette.every(Number.isFinite)));
});

test('interrupted attack releases the last arm pose beneath immediate impact without changing deadlines',()=>{
 const r=renderer(),c=new cm.Character(r),p={...player(),action:'attack',attackSkill:4100,actionStarted:.7,actionUntil:1.5};
 for(let i=0;i<12;i++){r.frame++;c.update({...p},.8+i/60);}
 const arm=cm.asset.names.indexOf('arm.R'),old=c.transforms[arm];
 const hit={...p,action:'hit',hitReactAt:.99,hitReactUntil:1.71,hitMotionId:1,hitSeverity:'heavy',hitPart:'torso',hitDir:Math.PI};
 r.frame++;c.update(hit,.99);const next=c.transforms[arm];
 assert(Math.hypot(...[0,1,2].map(k=>old[k]-next[k]))<.5,'arm cannot snap to bind pose at contact');
 assert.equal(hit.actionUntil,1.5);assert.equal(hit.hitReactUntil,1.71);
});

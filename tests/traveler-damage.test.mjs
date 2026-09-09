import test from 'node:test';
import assert from 'node:assert/strict';
import {travelerRuntime,BASE} from './traveler-damage-harness.mjs';
const api=travelerRuntime();
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};

test('recoil is directional, bounded, framerate independent and does not move through hitstop',()=>{
 for(const dir of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const strength of [.6,1]){
  const distances=[];
  for(const hz of [30,60,120]){const {sim,p,room,source}=api.fixture();source.x=p.x-Math.sin(dir)*1.2;source.z=p.z-Math.cos(dir)*1.2;
   sim.inflictWound(p,'torso','light',source,strength);const initial=[p.x,p.z];sim.tick(1/hz);assert.deepEqual([p.x,p.z],initial,'hitstop freezes physical recoil');
   for(let i=1;i<hz;i++)sim.tick(1/hz);
   const dx=p.x-initial[0],dz=p.z-initial[1],expected=strength===1?.24:.08;
   assert(Math.abs(dx-Math.sin(dir)*expected)<1e-7);assert(Math.abs(dz-Math.cos(dir)*expected)<1e-7);distances.push(Math.hypot(dx,dz));
  }
  assert(Math.max(...distances)-Math.min(...distances)<1e-7);
 }
});

test('recoil preserves all damage, guard, interruption and action clocks from the dependency baseline',()=>{
 const old=travelerRuntime(BASE);
 for(const guard of [false,true]){
  const pairs=[old,api].map(a=>a.fixture());
  for(const {sim,p,source}of pairs){if(guard)sim.reactToHit(p,source,'leftArm','light',.32,true);else sim.inflictWound(p,'leftArm','heavy',source,1);for(let i=0;i<30;i++)sim.tick(1/60);}
  for(const key of ['health','wounds','stun','cooldown','hitUntil','hitstopUntil','action','actionStarted','actionUntil','pendingSkill','combo','guard','stamina','staminaCap'])assert.equal(JSON.stringify(pairs[0].p[key]),JSON.stringify(pairs[1].p[key]),key);
  assert.equal(pairs[0].sim.rng.getState(),pairs[1].sim.rng.getState());assert.equal(pairs[0].sim.events.length,pairs[1].sim.events.length);
  assert(Math.hypot(pairs[1].p.x-pairs[0].p.x,pairs[1].p.z-pairs[0].p.z)<=(guard?.025:.24)+1e-7);
 }
});

test('wall/body constraints stop recoil; root, restore and room changes cannot replay it',()=>{
 for(const blocked of ['wall','body','root']){const {sim,p,room,source}=api.fixture();p.x=blocked==='wall'?27.99:0;p.z=4;source.x=p.x-1;source.z=p.z;sim.inflictWound(p,'head','light',source,1);
  if(blocked==='wall'){const q={...p,x:100};sim.bound(q,room);p.x=q.x;p.hitRecoil.lastX=p.x;}
  if(blocked==='body'){const e=sim.actor('guard',p.x+.87,p.z);room.actors=[e];}
  if(blocked==='root')p.statuses.root={until:sim.time+2};
  const x=p.x;for(let i=0;i<20;i++)sim.tickHitRecoil(p,room,1/60);assert(p.x-x<.04,blocked);
 }
 const f=api.fixture();f.sim.inflictWound(f.p,'torso','light',f.source,1);const restored=api.Simulation.restore(JSON.parse(JSON.stringify(f.sim.exportState())));assert.equal(restored.players.get(f.p.id).hitRecoil,undefined);
 f.sim.downPlayer(f.p,'test',f.source);assert.equal(f.p.hitRecoil,null);
 f.p.lifeState='active';f.sim.reactToHit(f.p,f.source,'torso','light',1);f.p.room='other';f.sim.tickHitRecoil(f.p,{id:'other'},1/30);assert.equal(f.p.hitRecoil,null);
});

test('approach/lunge share body spacing and allow escape from an existing overlap',()=>{
 const {sim,p,room,source}=api.fixture();p.x=0;p.z=4;source.x=0;source.z=6;room.actors=[source];const min=sim.contactSpacing(p,source);
 assert.equal(sim.contactSpacing(p,{...p,id:'friend'}),.84,'friendly spacing retained');
 assert(Math.abs(sim.contactSpacing(p,{kind:'dummy'})-.82)<1e-9,'practice spacing retained');
 sim.moveAttackStep(p,room,0,3);assert(Math.hypot(p.x-source.x,p.z-source.z)>=min-1e-8);
 p.z=source.z-.1;assert(sim.moveAttackStep(p,room,0,-.2)>.19,'escape never blocked');
 const q=api.fixture();q.p.z=4;q.source.z=7;q.source.cooldown=1e9;q.room.actors=[q.source];q.source.target=q.p.id;
 for(let i=0;i<30;i++)q.sim.tickActor(q.source,q.room,[q.p],.1);
 assert(Math.hypot(q.p.x-q.source.x,q.p.z-q.source.z)>=q.sim.contactSpacing(q.p,q.source));
});

test('four traveler rigs catch real recoil with stable soles, finite joints and retained support',t=>{
 for(let race=0;race<4;race++)for(const part of ['head','torso','rightArm','leftArm','rightLeg','leftLeg']){
  const {sim,p,source}=api.fixture(race),r=api.renderer(),cm=new api.Travelers.Character(r,race);let previous,maxSlip=0,maxError=0,maxDrop=0,maxJump=0;
  for(let i=0;i<100;i++){
   if(i===6){Object.assign(p,{action:'attack',actionStarted:sim.time,actionUntil:sim.time+1,attackSkill:4001});}
   if(i===16)sim.inflictWound(p,part,'light',source,1);
   if(i===31){source.x=p.x-1;source.z=p.z;sim.reactToHit(p,source,part,'heavy',1);sim.impact(source,p,part,true);}
   sim.tick(1/60);r.frame++;const snapshot=freeze(structuredClone(p));cm.update(snapshot,sim.time);assert(cm.palette.every(Number.isFinite));
   for(let j=0;j<cm.footDebug.length;j++){const f=cm.footDebug[j],b=previous?.[j];maxError=Math.max(maxError,f.error);if(b&&i!==16){const jump=Math.hypot(...f.actual.map((v,k)=>v-b.actual[k]));maxJump=Math.max(maxJump,jump);if(!f.swing&&!b.swing)maxSlip=Math.max(maxSlip,Math.hypot(f.actual[0]-b.actual[0],f.actual[2]-b.actual[2]));}}
   maxDrop=Math.max(maxDrop,cm.metrics.pelvisDrop);previous=structuredClone(cm.footDebug);
  }
  t.diagnostic(JSON.stringify({race,part,maxSlip,maxError,maxDrop,maxJump}));assert(maxSlip<.012,'planted sole slide');assert(maxError<.035,'foot target');assert(maxDrop<.38,'leg reach');assert(maxJump<.13,'pose continuity');
 }
});

test('child and elder proportions retain bounded recoil, planted soles and finite joints',()=>{
 for(let race=0;race<4;race++)for(const age of [7,10,55,80]){
  const {sim,p,source}=api.fixture(race);p.age=age;const r=api.renderer(),cm=new api.Travelers.Character(r,race);
  for(let i=0;i<80;i++){
   if(i===10)sim.inflictWound(p,'torso','light',source,1);
   sim.tick(1/60);r.frame++;cm.update(freeze(structuredClone(p)),sim.time);
   assert(cm.palette.every(Number.isFinite));assert(cm.metrics.contactError<.035,race+' age '+age+' contact');assert(cm.metrics.pelvisDrop<.38,race+' age '+age+' drop');
  }
 }
});

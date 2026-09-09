import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {definitions,life} from './skills/harness.mjs';
const read=f=>fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
const base='b0174532818b078a9bc59dec83c11b9e06b00bad';
function runtime(baseline=false){
 const ctx=vm.createContext({console,performance,structuredClone});
 vm.runInContext('const BL_SKILL_DEFINITIONS='+JSON.stringify(definitions)+';'+read('legacy/dialogue.js')+'\n'+(baseline?execFileSync('git',['show',base+':src/legacy/core.js'],{encoding:'utf8'}):read('legacy/core.js'))+'\n'+read('skills/engine.js')+'\n'+read('skills/runtime.js')+'\n'+read('legacy/render_math.js')+'\n'+read('legacy/motion.js')+'\nthis.API={Simulation,hitPose,DamageMotion,damageLeg};',ctx);
 return ctx.API;
}
const api=runtime();
const actor=(f={})=>({id:'test',alive:true,dir:0,x:0,z:0,hitReactAt:1,hitReactUntil:1.72,hitSeverity:'heavy',hitPart:'torso',hitDir:Math.PI,hitMotionId:1,...f});
const magnitude=p=>Math.hypot(p.head,p.headRoll,p.torso,p.torsoRoll,p.pitch,p.roll,p.rightArm,p.leftArm,p.drop);
test('reaction begins at contact, distinguishes force and ends without replay during stun',()=>{
 for(const hitStrength of [.35,.7,1.1]){const p=actor({hitStrength,action:'hit',actionStarted:1,actionUntil:3});assert(api.hitPose(p,1).amount>0);assert.equal(api.hitPose(p,.99).amount,0);assert.equal(magnitude(api.hitPose(p,1.72)),0);assert.equal(api.hitPose(p,2).amount,0);}
 const values=[.35,.7,1.1].map(hitStrength=>magnitude(api.hitPose(actor({hitStrength}),1.13)));
 assert(values[1]>values[0]*1.7&&values[2]>values[1]*1.4);
});
test('front/rear and left/right contacts retain force direction through the upper body',()=>{
 const front=api.hitPose(actor({hitDir:Math.PI,hitPart:'head'}),1.06),rear=api.hitPose(actor({hitDir:0,hitPart:'head'}),1.06);
 assert(front.head<0&&rear.head>0);
 const left=api.hitPose(actor({hitDir:Math.PI/2}),1.12),right=api.hitPose(actor({hitDir:-Math.PI/2}),1.12);
 assert(left.torsoRoll<0&&right.torsoRoll>0);
 for(const facing of [0,.7,Math.PI]){const a=api.hitPose(actor({dir:facing,hitDir:facing+.7}),1.15),b=api.hitPose(actor({hitDir:.7}),1.15);assert(Math.abs(a.torsoRoll-b.torsoRoll)<1e-9);}
});
test('struck parts lead with a different silhouette and feet follow after the contact',()=>{
 const p=actor(),parts=['head','torso','rightArm','leftArm','rightLeg','leftLeg'];
 const poses=parts.map(hitPart=>api.hitPose({...p,hitPart},1.12));
 assert.equal(new Set(poses.map(p=>JSON.stringify([p.head,p.torso,p.rightArm,p.leftArm,p.drop,p.rightKnee,p.leftKnee]))).size,6);
 const first=api.hitPose({...p,hitPart:'rightLeg'},1),collapse=api.hitPose({...p,hitPart:'rightLeg'},1.22);
 assert.equal(first.drop,0);assert.equal(first.stepLift,0);assert(collapse.drop>.12&&collapse.stepLift>0);assert.equal(collapse.stepSide,-1);
 const guard=api.hitPose(actor({hitGuard:true,hitStrength:.32}),1.1);assert(guard.leftArm>0);assert(guard.drop<.012);assert.equal(guard.stepLift,0);
});
test('consecutive opposite hits transition continuously, stay finite and do not accumulate force',()=>{
 const motion=new api.DamageMotion();let p=actor(),last;
 for(let i=0;i<=240;i++){
  const t=1+i/120;if(i%10===0&&i>0)p={...p,hitMotionId:p.hitMotionId+1,hitReactAt:t,hitReactUntil:t+.72,hitDir:p.hitDir+Math.PI};
  const q=motion.sample(Object.freeze(p),t);
  if(i%10===0&&i>0)assert(Math.abs(q.torso-last.torso)<1e-9,'a new contact starts from the rendered body');
  assert(Object.values(q).filter(v=>typeof v==='number').every(Number.isFinite));assert(q.drop<.3&&Math.abs(q.torso)<.5);last=q;
 }
 const dead=motion.sample({...p,alive:false},3.01);assert.equal(dead.amount,0);
});
test('hitstop freezes reaction and a rewind/teleport does not reuse old blends',()=>{
 const motion=new api.DamageMotion(),p=actor();const a=motion.sample(p,1.13);
 const b=motion.sample({...p,hitReactAt:1.1,hitReactUntil:1.82},1.23);
 for(const k of Object.keys(a))if(typeof a[k]==='number')assert(Math.abs(a[k]-b[k])<1e-8,k);
 const q=motion.sample({...p,x:20,hitMotionId:2,hitDir:0},1.14);assert(q.torso<0);
 const rewind=motion.sample(p,.5);assert.equal(rewind.amount,0);
});
test('presentation cache evicts absent characters',()=>{
 const m=new api.DamageMotion();for(let i=0;i<150;i++)m.sample(actor({id:'actor'+i}),i*.5+1);assert(m.actors.size<=64);
});
// Compare protected gameplay fields and RNG with the fixed develop source.
// hitRecoil is the newly authorized movement state; traveler-damage.test checks
// its displacement, collision limits and unchanged action clocks separately.
// The neutral frontal case retains prior damage/reaction behavior. New persisted
// life, surface and damage-mark metadata is checked by the feature suites.
const baselineExceptions=new Set(['hitPart','hitSeverity','hitReactAt','hitReactUntil','hitDir','hitStrength','hitMotionAt','hitMotionId','hitGuard','lifeState','traversables','damageMarks','grounded','supportHeight','verticalOffset','hitRecoil']);
const state=sim=>JSON.parse(JSON.stringify(sim.exportState(),(k,v)=>baselineExceptions.has(k)||k==='phaseLimitVersion'?undefined:v));
test('damage, wound progression, attack interruption, hitstop and RNG match develop',()=>{
 const before=runtime(true);
 for(const seed of [13,27,48])for(const power of [.3,1,1.5,2,3])for(const part of ['head','torso','rightArm','leftLeg']){
  const pair=[before,api].map(a=>{const f=life(a,seed);f.sim.time=10;const e=f.sim.actor('soldier',0,3,0);return {...f,e};});
  for(const f of pair){f.e.guard=false;f.e.dir=Math.PI;Object.assign(f.p,{x:0,z:1,dir:0});f.room.actors=[f.e];f.room.waveAt=1e6;f.e.telegraph={at:12,started:9,dir:Math.PI};f.sim.damageActor(f.e,f.p,part,power,f.room);for(let i=0;i<8;i++)f.sim.tick(1/30);}
  assert.deepEqual(state(pair[1].sim),state(pair[0].sim),`${seed} ${power} ${part}`);
 }
});
test('approved player damage tuning preserves guarding, timers, event counts and RNG',()=>{
 const before=runtime(true);let guards=0;
 for(let seed=11;seed<20;seed++)for(const guarding of [false,true]){
  const pair=[before,api].map(a=>{const f=life(a,seed);f.sim.time=10;const e=f.sim.actor('soldier',0,6,0);Object.assign(f.p,{x:0,z:5,dir:0,guard:guarding});f.e=e;f.room.actors.push(e);return f;});
  for(const f of pair){f.sim.hitPlayer(f.p,f.e,{part:'leftLeg'});}
  const wounded=pair[1].sim.events.some(e=>e.type==='wound');
  assert.equal(pair[1].p.health,pair[0].p.health-(wounded?11:0));
  if(wounded)pair[0].p.health-=11; // Explicit approved light-wound delta; compare every other field.
  assert.deepEqual(state(pair[1].sim),state(pair[0].sim));if(pair[1].p.hitGuard)guards++;
 }
 assert(guards>0,'exercise an actual guarded event');
});

test('the first impact is visible immediately even if hitstop freezes its first pose',()=>{
 const m=new api.DamageMotion(),p=actor({hitReactUntil:0,hitMotionId:0});m.sample(p,.99);
 const hit=actor({hitReactAt:.915});const first=m.sample(hit,1);
 assert(first.amount>.4&&Math.abs(first.torso)>.1,'first contact must never blend from idle across a hitstop');
 const frozen=m.sample({...hit,hitReactAt:1.015,hitReactUntil:1.82},1.1);
 assert(Math.abs(first.torso-frozen.torso)<1e-8);
});

test('rigid two-link bracing reaches backward and forward foot targets without mirroring them',()=>{
 for(const dir of [0,Math.PI]){
  const reaction=api.hitPose(actor({hitDir:dir,hitPart:'leftLeg'}),1.23),side=reaction.stepSide,leg=api.damageLeg(reaction,side,.45,.43,1,0);
  const localZ=-Math.sin(leg.hip)*.45-Math.sin(leg.hip+leg.knee)*.43;
  const expected=reaction[(side===1?'rightFoot':'leftFoot')+'Z']-reaction.z;
  assert(Math.abs(localZ-expected)<.002,`${localZ} != ${expected}`);
 }
});

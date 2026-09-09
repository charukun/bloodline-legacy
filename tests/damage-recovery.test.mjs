import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {runtime,life} from './skills/harness.mjs';
import {motionRuntime} from './skill-motion-harness.mjs';
const api=runtime(),rig=await motionRuntime();
const ctx=vm.createContext({});
vm.runInContext('const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));'+fs.readFileSync(new URL('../src/legacy/motion.js',import.meta.url),'utf8')+';this.API={DamageMotion,hitPose,damageFoot,damageArtPose};',ctx);
const {DamageMotion,damageFoot,damageArtPose}=ctx.API;
const hit=(extra={})=>({id:'p',alive:true,x:0,z:0,dir:0,room:'r',hitMotionId:1,hitReactAt:1,hitReactUntil:1.72,hitStrength:1,hitPart:'torso',hitSeverity:'heavy',hitDir:Math.PI/2,...extra});

test('unarmored ordinary hits become lethal in 3–4 contacts, armor still matters',()=>{
 for(const armor of [0,1,2]){
  const {sim,p}=life(api);p.armor=armor;const e=sim.actor('soldier',0,1);e.attackCount=1;
  let hits=0;const parts=['rightArm','leftArm','rightLeg','leftLeg'];
  while(p.alive&&hits<10){sim.time=10+hits*2;sim.hitPlayer(p,e,{part:parts[hits%4]});hits++;}
  assert.equal(hits,armor===2?5:4);
  const wounds=sim.events.filter(e=>e.type==='wound');assert.equal(wounds.length,hits);
  assert.equal(wounds.at(-1).severity,'fatal');assert.equal(wounds.at(-1).source,e.id);
  assert.equal(sim.events.filter(e=>e.type==='death').length,1);
 }
 for(const elite of [false,true]){const {sim,p}=life(api),e=sim.actor('soldier',0,1);e.elite=elite;e.attackCount=1;let n=0;while(p.alive&&n<5){sim.time=10+n*2;sim.hitPlayer(p,e,{part:'torso'});n++;}assert.equal(n,elite?2:3);}
});

test('fatal contact by either route has one source/part notification before death; wound strength follows the incoming blow',()=>{
 for(const health of [100,1]){const {sim,p}=life(api);p.health=health;sim.inflictWound(p,'head',health===100?'fatal':'light',{id:'enemy',x:1,z:0});const es=sim.events.filter(e=>['wound','death'].includes(e.type));assert.deepEqual(Array.from(es,e=>e.type),['wound','death']);assert.equal(es[0].severity,'fatal');assert.equal(es[0].part,'head');assert.equal(es[0].dir,Math.atan2(p.x-1,p.z));}
 const {sim,p}=life(api),e=sim.actor('soldier',0,1);e.attackCount=1;p.wounds.leftArm={severity:'light'};sim.hitPlayer(p,e,{part:'leftArm'});assert.equal(p.hitSeverity,'heavy');assert.equal(p.hitStrength,.6);
});

test('reaction inherits the last authored torso and chooses the already lifted foot',()=>{
 const a=new DamageMotion(),b=new DamageMotion();const idle=hit({hitMotionId:0,hitReactUntil:0});
 const ra={damageMotion:a},rb={damageMotion:b};a.sample(idle,.9);b.sample(idle,.9);
 damageArtPose(ra,{...idle,action:'attack'},.9,{yaw:.3,torsoYaw:.4,torso:.2,weightX:.1});
 damageArtPose(rb,idle,.9,{yaw:0,torsoYaw:0,torso:0});
 const one=a.sample(hit(),1.2,[{lift:0},{lift:.1}]),two=b.sample(hit(),1.2);
 assert.equal(one.stepSide,-1);assert(Math.abs(one.torso-two.torso)>.1);
 const carried=damageArtPose(ra,hit(),1.2,{yaw:0,torso:0,newOptionalJoint:0});assert(Object.values(carried).filter(v=>typeof v==='number').every(Number.isFinite));
});

test('catch step plants once, persists through recovery and consecutive opposite hits never double its offset',()=>{
 const m=new DamageMotion(),feet=[{anchor:[.18,0],lift:0,yaw:0},{anchor:[-.18,0],lift:0,yaw:0}];let p=hit(),previous=null,slip=0,maxJump=0;
 for(let i=0;i<150;i++){
  const t=.9+i/120;if(i===43||i===65)p={...p,hitMotionId:p.hitMotionId+1,hitReactAt:t,hitReactUntil:t+.72,hitDir:p.hitDir+Math.PI};
  const q=m.sample(p,t,feet);for(const [j,side]of [1,-1].entries())damageFoot(p,q,side,feet[j]);
  if(previous)for(let j=0;j<2;j++){const d=Math.hypot(...feet[j].anchor.map((v,k)=>v-previous[j].anchor[k]));maxJump=Math.max(maxJump,d);if(!feet[j].swing&&!previous[j].swing)slip=Math.max(slip,d);}
  previous=structuredClone(feet);
 }
 assert(maxJump<.018,`foot jump ${maxJump}`);assert(slip<.003,`support foot slip ${slip}`);
 const still=JSON.stringify(feet.map(f=>f.anchor));for(const [j,side]of [1,-1].entries())damageFoot(p,m.sample(p,4),side,feet[j]);assert.equal(JSON.stringify(feet.map(f=>f.anchor)),still);
});

test('actual master and legacy rigs remain grounded during attack interruption and repeated hits',()=>{
 for(const kind of ['master','legacy']){
  const r=rig.renderer(),cm=kind==='master'?new rig.CM01.Character(r):null,art=new rig.VillageArt(r);let p={...rig.player(),x:0,z:0,action:'attack',attackSkill:60020,actionStarted:.5,actionUntil:1.6},last;
  let error=0,jump=0;
  for(let i=0;i<145;i++){
   const t=.6+i/120;if(i===30||i===52){p={...p,action:'hit',actionStarted:t,actionUntil:t+.85,hitReactAt:t,hitReactUntil:t+.72,hitMotionId:i,hitDir:i===30?Math.PI/2:-Math.PI/2,hitPart:'leftLeg',hitSeverity:'heavy',hitStrength:1};}
   r.frame++;r.parts=[];if(cm)cm.update(p,t);else art.doll(p,t,false);
   const feet=cm?cm.footDebug:art.skillFeet?.get(p.id)?.debug;
   if(feet){for(let j=0;j<feet.length;j++){error=Math.max(error,feet[j].error);if(last&&i>31&&i!==52)jump=Math.max(jump,Math.hypot(...feet[j].actual.map((v,k)=>v-last[j].actual[k])));}last=structuredClone(feet);}
   if(cm)assert([...cm.palette].every(Number.isFinite));else assert(r.parts.every(p=>p.m.every(Number.isFinite)));
  }
  assert(error<.035,`${kind} contact ${error}`);assert(jump<.13,`${kind} jump ${jump}`);
 }
});

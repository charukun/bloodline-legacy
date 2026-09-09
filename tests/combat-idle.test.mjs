import test from 'node:test';
import assert from 'node:assert/strict';
import {motionRuntime} from './skill-motion-harness.mjs';
const {Travelers,renderer,player,SkillMotion,artPose}=await motionRuntime(null,null,true);

test('four traveler bodies breathe in combat with planted feet and unchanged gameplay state',()=>{
 for(let race=0;race<4;race++)for(const weapon of [-1,0,2,3,4,5]){
  const r=renderer(),c=new Travelers.Character(r,race),p={...player(),race,gender:[0,1,0,1][race],weapon,focusTarget:'dummy',focusUntil:6},before=JSON.stringify(p),xs=[];let previous;
  for(let i=0;i<180;i++){
   r.frame++;c.update(Object.freeze(p),i/60);assert(c.palette.every(Number.isFinite));assert(c.metrics.contactError<.035);
   if(i>40){assert.equal(c.metrics.animation,'combat_idle');assert.equal(c.clipDebug,null);xs.push(c.transforms[1][12]);}
   for(const f of c.footDebug){const prev=previous?.find(o=>o.side===f.side);if(prev&&!prev.swing&&!f.swing)assert(Math.hypot(f.actual[0]-prev.actual[0],f.actual[2]-prev.actual[2])<.003,'planted sole slides');}
   previous=structuredClone(c.footDebug);
  }
  assert(Math.max(...xs)-Math.min(...xs)>.025,'combat stance is frozen');assert(Math.max(...xs)-Math.min(...xs)<.14,'stance sways too far');assert.equal(JSON.stringify(p),before);
 }
});

test('combat breathing fades out, freezes in hitstop, and yields to attack and life poses',()=>{
 const r=renderer(),p={...player(),weapon:-1,focusTarget:'dummy',focusUntil:5};let out;
 const sample=t=>out=artPose(p,t,SkillMotion.stateFor(r,p,t));
 for(let i=0;i<=120;i++)sample(i/60);
 assert(out.combatIdle);p.hitstopUntil=2.2;const held={...out};sample(2.1);assert.equal(out.weightX,held.weightX);assert.equal(out.y,held.y);
 p.hitstopUntil=0;p.pendingSkill={id:4000,started:2.1,at:2.3};p.attackSkill=4000;p.action='charge';sample(2.15);assert.equal(out.motionClock.stage,'charge');assert.equal(out.combatIdle,undefined);
 p.pendingSkill=null;p.action='idle';p.focusUntil=2.2;
 for(let i=0;i<90;i++)sample(2.2+i/60);assert.equal(out.active,false);assert.equal(out.combatIdle,undefined);
 for(const change of [{prologue:true},{seated:true},{activity:'read'},{lifeState:'downed'},{traversal:{kind:'vault',progress:.4}},{rescueTarget:'friend'},{statuses:{stun:{until:20}}},{alive:false}]){
  const other={...p,focusUntil:20,...change};assert.equal(SkillMotion.ready(other,4),false);assert.equal(artPose(other,4,SkillMotion.stateFor(renderer(),other,4)).combatIdle,undefined);
 }
});

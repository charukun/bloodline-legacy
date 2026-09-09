import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life,step} from './skills/harness.mjs';

const api=runtime();
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function quiet(){
 const f=life(api,13);f.room.actors=[];f.room.waveAt=1e9;
 Object.assign(f.p,{x:0,z:6});return f;
}
function tired(){
 const f=quiet();Object.assign(f.p,{stamina:15,staminaCap:55,lastExertion:f.sim.time,lastSkillAt:f.sim.time});return f;
}
function training(ids=[4000]){
 const f=life(api,13),dummy=f.room.actors.find(a=>a.kind==='dummy');
 f.room.actors=[dummy];f.room.waveAt=1e9;Object.assign(f.p,{x:dummy.x,z:dummy.z+1.1});
 for(const id of ids)f.sim.learn(f.p,id);
 f.p.phaseWeights=[0,1,2].map(b=>Object.fromEntries(ids.filter(id=>(api.skillById(id).band||0)===b).map(id=>[id,100])));
 return f;
}
function leaveTraining(f){
 // Remove the target and let the current impact/strike finish before sitting.
 f.room.actors=[];f.p.autoFight=null;f.p.autoSuppressedUntil=1e9;step(f.sim,3);
 assert.ok(f.sim.command(f.p.id,{type:'sit',active:true}));
}

test('ordinary attacks accumulate fatigue over a minute and a short sit restores the ceiling',()=>{
 const f=training();step(f.sim,60);
 assert.ok(f.p.usages.attack>=30,'ordinary attack tempo stays continuous');
 assert.ok(f.p.staminaCap>70&&f.p.staminaCap<85,'cheap attacks no longer remain almost unfatigued');
 leaveTraining(f);step(f.sim,3.5);
 near(f.p.staminaCap,api.staminaMaximum(f.p));near(f.p.stamina,f.p.staminaCap);
});

test('complete three-phase exchanges remain affordable, sustained arts call for rest and can restart',()=>{
 for(const ids of [[60000,60001,60002],[60010,60011,60012]]){
  const f=training(ids);step(f.sim,10);
  for(const id of ids)assert.ok(f.p.skillUses[id]>0,`${id} still participates in the opening exchanges`);
  assert.ok(f.p.stamina>35,'a short encounter must not exhaust a fresh character');
  step(f.sim,50);assert.ok(f.p.staminaCap>22&&f.p.staminaCap<50);assert.ok(f.p.usages.attack>=28);
  leaveTraining(f);step(f.sim,9);near(f.p.stamina,api.staminaMaximum(f.p));
  assert.ok(f.sim.command(f.p.id,{type:'attack'}));assert.equal(f.p.seated,false);assert.ok(f.p.pendingSkill);
 }
});

test('five seconds seated recovers fatigue; five seconds standing only restores current stamina',()=>{
 const standing=tired(),seated=tired();assert.ok(seated.sim.command(seated.p.id,{type:'sit',active:true}));
 step(standing.sim,5);step(seated.sim,5);
 assert.ok(standing.p.stamina>=54&&standing.p.staminaCap<=56);
 assert.ok(seated.p.stamina>90&&seated.p.staminaCap<95);
 step(seated.sim,1);near(seated.p.stamina,100);near(seated.p.staminaCap,100);
});

test('sitting settles before recovery and never stacks ordinary recovery onto seated rates',()=>{
 const {sim,p}=tired();assert.ok(sim.command(p.id,{type:'sit',active:true}));
 step(sim,.3);near(p.stamina,15);near(p.staminaCap,55);
 step(sim,.7);assert.ok(p.stamina>34&&p.stamina<38);assert.ok(p.staminaCap>59&&p.staminaCap<61);
});

test('idle, engaged and guarded recovery remain distinct between combo cycles',()=>{
 const values=[];
 for(const mode of ['idle','engaged','guarded']){
  const {sim,p}=tired();sim.time=10;p.lastExertion=0;p.lastSkillAt=0;
  if(mode==='engaged')p.autoFight='opponent';if(mode==='guarded')p.guard=true;
  sim.tickRecovery(p,.1);values.push(p.stamina-15);
 }
 assert.ok(values[0]>values[1]*2);assert.ok(values[1]>values[2]);
});

test('fatigue follows successful actual spending and remains independent of tick subdivision',()=>{
 const a=quiet(),b=quiet();assert.ok(a.sim.spend(a.p,18));
 for(let i=0;i<120;i++)assert.ok(b.sim.spend(b.p,18/120));
 near(a.p.staminaCap,b.p.staminaCap);near(a.p.stamina,b.p.stamina);
 const discounted=quiet();discounted.sim.spend(discounted.p,9);assert.ok(discounted.p.staminaCap>a.p.staminaCap);
 const severe=quiet();severe.sim.spend(severe.p,1,5);near(severe.p.staminaCap,95);
 for(const cost of [1000,-1,NaN,Infinity]){
  const before=JSON.stringify(a.p);assert.equal(a.sim.spend(a.p,cost,8),false);assert.equal(JSON.stringify(a.p),before);
 }
});

test('running tires the ceiling, exhaustion stops dash, and ordinary walking still works for free',()=>{
 for(const hz of [30,60]){
  const {sim,p,room}=quiet(),front=sim.makeRoom('front');front.stage=5;front.bossDefeated=true;front.actors=[];
  p.room=front.id;p.x=0;p.z=0;assert.ok(sim.command(p.id,{type:'dash',x:0,z:-1}));
  for(let i=0;i<hz*8;i++)sim.tick(1/hz);
  near(p.stamina,28);near(p.staminaCap,87.04);assert.ok(p.dash);
  for(let i=0;i<hz*3.2;i++)sim.tick(1/hz);
  assert.equal(p.dash,null);assert.ok(p.stamina<1);assert.ok(p.staminaCap>80&&p.staminaCap<83);
  const z=p.z,cap=p.staminaCap;assert.ok(sim.command(p.id,{type:'move',x:0,z:1}));step(sim,.5);
  assert.ok(p.z>z+1);near(p.staminaCap,cap);
  // Original village is quiet too; no unrelated wave affected the stamina trace.
  assert.equal(room.actors.length,0);
 }
 const {sim,p}=quiet();const x=p.x;sim.command(p.id,{type:'move',x:1,z:0});step(sim,1);
 assert.ok(p.x>x);near(p.stamina,100);near(p.staminaCap,100);
});

test('fatigue floor still allows an exhausted character to recover and attack without mandatory sitting',()=>{
 const f=training();Object.assign(f.p,{stamina:0,staminaCap:22,lastExertion:f.sim.time,lastSkillAt:f.sim.time});
 step(f.sim,12);assert.ok(f.p.usages.attack>=4);assert.ok(f.p.staminaCap>=22);assert.ok(f.p.stamina>=0);assert.equal(f.p.seated,false);
});

test('recovery passives retain their benefit both standing and seated',()=>{
 for(const seated of [false,true]){
  const plain=tired(),trained=tired();trained.sim.learn(trained.p,3072);trained.sim.learn(trained.p,3074);
  for(const f of [plain,trained]){f.p.lastExertion=-10;f.p.lastSkillAt=-10;if(seated)assert.ok(f.sim.command(f.p.id,{type:'sit',active:true}));step(f.sim,1);}
  assert.ok(trained.p.stamina>plain.p.stamina);assert.ok(trained.p.staminaCap>plain.p.staminaCap);
 }
});

test('rest respects injury and permanent ceilings, survives save, and provides no damage immunity',()=>{
 const {sim,p}=tired();p.wounds.torso={severity:'heavy',healsAt:99};p.wounds.leftArm={severity:'lost'};p.permanentFatigue=12;
 assert.ok(sim.command(p.id,{type:'sit',active:true}));step(sim,5);near(p.staminaCap,73);near(p.stamina,73);
 const restored=api.Simulation.restore(structuredClone(sim.exportState())),q=restored.players.get(p.id);
 near(q.stamina,73);near(q.staminaCap,73);assert.equal(q.permanentFatigue,12);assert.equal(q.wounds.leftArm.severity,'lost');
 const health=p.health;sim.inflictWound(p,'rightLeg','light');assert.equal(p.seated,false);assert.ok(p.health<health);
 assert.equal(sim.command(p.id,{type:'sit',active:true}),false,'cannot rest through the wound stun');
});

test('movement and speech wake the player, and interrupted rest loses the fast recovery',()=>{
 for(const cmd of [{type:'move',x:1,z:0},{type:'chat',text:'ありがとう'}]){
  const {sim,p}=tired();assert.ok(sim.command(p.id,{type:'sit',active:true}));step(sim,1);
  assert.ok(sim.command(p.id,cmd));assert.equal(p.seated,false);const cap=p.staminaCap;step(sim,1);near(p.staminaCap,cap);
 }
 const {sim,p}=tired();assert.ok(sim.command(p.id,{type:'sit',active:true}));sim.applyStatus(p,'sleep',2,null,sim.getRoom(p));
 assert.equal(p.seated,false);assert.equal(sim.command(p.id,{type:'sit',active:true}),false);step(sim,1);near(p.staminaCap,55);
});

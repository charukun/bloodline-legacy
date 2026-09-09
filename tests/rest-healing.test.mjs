import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life,step} from './skills/harness.mjs';
const api=runtime(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function hurt(severity='light',mode='normal'){
 const f=life(api,13);f.sim.mode=mode;f.sim.yearSeconds=mode==='normal'?60:20;
 f.room.actors=[];f.room.waveAt=1e9;Object.assign(f.p,{x:0,z:6,health:50,lastHurtAt:0,wounds:{torso:{severity,since:18,healsAt:18+(severity==='heavy'?5:1)}}});return f;
}
function sit(f){assert.ok(f.sim.command(f.p.id,{type:'sit',active:true}));assert.equal(f.p.seated,true);}

test('seated recovery starts after the existing quiet period and restores health twice as quickly',()=>{
 const standing=hurt('heavy'),seated=hurt('heavy');sit(seated);
 for(const f of [standing,seated])step(f.sim,11);
 near(standing.p.health,50);near(seated.p.health,50);near(seated.p.wounds.torso.healsAt,23);
 for(const f of [standing,seated])step(f.sim,9);
 near(seated.p.health-50,(standing.p.health-50)*2);assert.ok(seated.p.wounds.torso.healsAt<standing.p.wounds.torso.healsAt);
 near(seated.p.age+seated.p.ageFraction,standing.p.age+standing.p.ageFraction);assert.equal(seated.p.lifespan,standing.p.lifespan);
});

test('light and heavy injuries heal four times faster during settled rest, at both world time scales',()=>{
 for(const mode of ['normal','demo'])for(const severity of ['light','heavy']){
  const f=hurt(severity,mode);sit(f);
  const natural=(severity==='heavy'?5:1)*f.sim.yearSeconds,expected=12+(natural-12)/4;
  step(f.sim,expected-.2);assert.ok(f.p.wounds.torso,`${mode} ${severity}: not instantaneous`);
  step(f.sim,.4);assert.equal(f.p.wounds.torso,undefined,`${mode} ${severity}`);
  assert.equal(f.sim.events.filter(e=>e.type==='healed'&&e.part==='torso').length,1);
  step(f.sim,1);assert.equal(f.sim.events.filter(e=>e.type==='healed'&&e.part==='torso').length,1);
 }
 const f=hurt();step(f.sim,59.8);assert.ok(f.p.wounds.torso);step(f.sim,.4);assert.equal(f.p.wounds.torso,undefined);
});

test('partial healing persists through save/restore without moving age or regenerating missing limbs',()=>{
 const f=hurt('heavy');f.p.wounds.leftArm={severity:'lost',since:18,healsAt:null};f.p.permanentFatigue=12;sit(f);step(f.sim,20);
 const deadline=f.p.wounds.torso.healsAt,age=f.p.age+f.p.ageFraction,saved=structuredClone(f.sim.exportState());
 const restored=api.Simulation.restore(saved),p=restored.players.get(f.p.id);
 near(p.wounds.torso.healsAt,deadline);near(p.age+p.ageFraction,age);assert.equal(p.permanentFatigue,12);
 assert.ok(restored.command(p.id,{type:'sit',active:true}));step(restored,70);
 assert.equal(p.wounds.torso,undefined);assert.equal(p.wounds.leftArm.severity,'lost');assert.equal(p.wounds.leftArm.healsAt,null);assert.equal(p.permanentFatigue,12);assert.ok(p.health<=100);
});

test('standing up through movement or speech immediately stops accelerated wound recovery',()=>{
 for(const command of [{type:'move',x:1,z:0},{type:'chat',text:'ありがとう'}]){
  const f=hurt('heavy');sit(f);step(f.sim,15);assert.ok(f.sim.command(f.p.id,command));assert.equal(f.p.seated,false);
  const deadline=f.p.wounds.torso.healsAt;step(f.sim,3);near(f.p.wounds.torso.healsAt,deadline);
 }
});

test('fresh damage and harmful statuses interrupt the healing advantage; sitting does not prevent wounds',()=>{
 const f=hurt('heavy');sit(f);step(f.sim,15);const health=f.p.health;
 f.sim.inflictWound(f.p,'rightLeg','light');assert.equal(f.p.seated,false);assert.ok(f.p.health<health);
 assert.equal(f.sim.command(f.p.id,{type:'sit',active:true}),false);step(f.sim,1);sit(f);
 const deadline=f.p.wounds.rightLeg.healsAt;step(f.sim,10);near(f.p.wounds.rightLeg.healsAt,deadline);
 f.sim.applyStatus(f.p,'sleep',2,null,f.room);assert.equal(f.p.seated,false);assert.equal(f.sim.command(f.p.id,{type:'sit',active:true}),false);
 const poisoned=hurt('heavy');sit(poisoned);step(poisoned.sim,15);poisoned.sim.applyStatus(poisoned.p,'poison',4,null,poisoned.room);step(poisoned.sim,1.1);
 const poisonedDeadline=poisoned.p.wounds.torso.healsAt;step(poisoned.sim,2);near(poisoned.p.wounds.torso.healsAt,poisonedDeadline);
});

test('resting after retreat works outside the village without bypassing incapacitation or rescue',()=>{
 const f=hurt();f.p.z=-33;const health=f.p.health;step(f.sim,13);near(f.p.health,health);sit(f);step(f.sim,2);assert.ok(f.p.health>health);
 f.sim.downPlayer(f.p,'深手');assert.equal(f.sim.command(f.p.id,{type:'sit',active:true}),false);
 const deadline=f.p.wounds.torso.healsAt;step(f.sim,5);near(f.p.wounds.torso.healsAt,deadline);assert.equal(f.p.lifeState,'downed');
});

test('rest alone never invents deadlines for missing or invalid historical injuries',()=>{
 const f=hurt('heavy');f.p.wounds={leftArm:{severity:'lost',healsAt:0},rightArm:{severity:'light'},head:{severity:'heavy',healsAt:null}};
 sit(f);step(f.sim,13);assert.equal(f.p.wounds.leftArm.severity,'lost');assert.equal(f.p.wounds.rightArm.healsAt,undefined);
 // The new acceleration only touches finite deadlines; historical normal healing retains its own behavior.
 assert.equal(f.p.wounds.head,undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life,step} from './skills/harness.mjs';
const api=runtime();
function setup(seed=1){const f=life(api,seed);Object.assign(f.p,{x:0,z:-33,dir:Math.PI});f.room.actors=[];f.room.waveAt=1e6;return f;}
test('mutual targets, facing, distance and action state define the same engagement for defense and lure',()=>{
 const {sim,p,room}=setup(),e=sim.actor('goblin',0,-34);room.actors=[e];e.dir=0;e.target=p.id;p.autoFight=e.id;
 assert.ok(sim.mutualEngagement(p,e));assert.equal(sim.freeAttacker(e,room),false);
 e.target='another';assert.equal(sim.mutualEngagement(p,e),false);assert.equal(sim.freeAttacker(e,room),true);
 e.target=p.id;p.dir=0;assert.ok(sim.awareness(p,e).unaware);p.dir=Math.PI;p.rescueTarget='casualty';assert.equal(sim.mutualEngagement(p,e),false);
 p.rescueTarget=null;e.z=-44;assert.equal(sim.mutualEngagement(p,e),false);
});
test('400 matched seeds distinguish frontal engagement, back attacks and a free second attacker',()=>{
 const stats={};for(const scenario of ['engaged','behind','second']){let hit=0,fatal=0;
  for(let seed=1;seed<=400;seed++){const {sim,p,room}=setup(seed),front=sim.actor('goblin',0,-34),other=sim.actor('goblin',scenario==='second'?1:0,-32);
   room.actors=[front,other];front.dir=0;front.target=p.id;other.dir=Math.PI;other.target=p.id;p.autoFight=front.id;
   sim.hitPlayer(p,scenario==='engaged'?front:other,{part:'head'});hit+=p.health<100;fatal+=p.lifeState==='downed';assert.ok(p.alive,'first impact must not kill');
  }stats[scenario]={hit,fatal};
 }
 assert.ok(stats.engaged.hit>140&&stats.engaged.hit<260);assert.equal(stats.engaged.fatal,0);assert.equal(stats.behind.hit,400);assert.ok(stats.behind.fatal>90&&stats.behind.fatal<170);assert.ok(stats.second.fatal>90);
 console.log('Matched awareness trials:',JSON.stringify(stats));
});
test('committed target stays fixed, while defender turning before contact changes awareness',()=>{
 const {sim,p,room}=setup(),e=sim.actor('goblin',0,-34);room.actors=[e];e.target=p.id;e.dir=0;p.autoFight=e.id;e.telegraph={target:p.id,started:0,at:2,dir:0,reach:2.3,arc:1.7};
 e.target='new';assert.ok(sim.mutualEngagement(p,e));p.dir=0;assert.ok(sim.awareness(p,e).unaware);
});
test('lure prefers the free second attacker, does not steal mutual opponents, and expires',()=>{
 const {sim,p,room}=setup(),ally=sim.addPlayer('ally',{owner:'ally'});Object.assign(ally,{x:0,z:-35,dir:Math.PI,age:18,prologue:false});
 const paired=sim.actor('goblin',0,-36.5),free=sim.actor('goblin',2,-35);room.actors=[paired,free];paired.target=free.target=ally.id;paired.dir=0;free.dir=-Math.PI/2;ally.autoFight=paired.id;
 assert.equal(sim.lureCandidates(p)[0].id,free.id);assert.ok(sim.performLure(p,room));assert.equal(free.luredBy,p.id);assert.equal(paired.target,ally.id);assert.equal(sim.performLure(p,room),false);
 const before=free.x;sim.tick(.1);assert.ok(free.x<before);sim.time+=6;sim.tick(.1);assert.equal(free.luredBy,null);
});
test('range, blocked route, death, leaving and casualty eligibility constrain lure',()=>{
 const {sim,p,room}=setup(),e=sim.actor('goblin',0,-43);e.target=null;room.actors=[e];assert.equal(sim.performLure(p,room),false);
 e.x=12;e.z=-28.8;p.x=12;p.z=-26.8;assert.equal(sim.performLure(p,room),false);
 p.x=0;p.z=-33;e.x=1;e.z=-33;assert.ok(sim.performLure(p,room));sim.downPlayer(p,'深手');sim.tick(.1);assert.equal(e.luredBy,null);
});
test('the discovered lure uses the existing weighted phase, cost, charge and skill execution path',()=>{
 const {sim,p,room}=setup(),e=sim.actor('goblin',2,-35),paired=sim.actor('goblin',0,-36.5),ally=sim.addPlayer('ally',{owner:'ally'});p.z=-30;Object.assign(ally,{x:0,z:-35,dir:Math.PI,age:18,prologue:false,autoFight:paired.id});room.actors=[e,paired];e.dir=-Math.PI/2;e.target=ally.id;e.cooldown=10;paired.dir=0;paired.target=ally.id;paired.cooldown=10;
 sim.learn(p,60390);p.phaseWeights[0]={60390:1};assert.equal(sim.chooseSkill(p,0).id,60390);
 assert.ok(sim.command(p.id,{type:'attack'}));const afterCost=p.stamina;assert.ok(afterCost<100);step(sim,1.3);
 assert.ok(sim.events.some(e=>e.type==='lured'));assert.ok(p.lureReadyAt>sim.time);assert.notEqual(api.skillRestriction(p,api.skillById(60390)),'');
});
test('NPC damage marks persist, deepen on repeated contacts and agree with boss seals',()=>{
 const {sim,p,room}=setup();for(const kind of ['goblin','crawler','maw','wraith','mushroom','boss']){const e=sim.actor(kind,0,-34);e.hp=e.hpMax=1000;e.dir=0;room.actors=[e];
  sim.damageActor(e,p,'torso',.4,room);sim.damageActor(e,p,'torso',1,room);assert.equal(e.damageMarks.torso.hits,2);assert.ok(e.damageMarks.torso.depth>=1.4);assert.ok(e.wounds.torso);
  if(kind==='boss')assert.equal(e.seals,2);
  const restored=api.Simulation.restore(sim.exportState());assert.equal(restored.getRoom(restored.players.get(p.id)).actors[0].damageMarks.torso.hits,2);
 }
});
test('first exposed heavy wound keeps the old kill threshold; ongoing damage deepens the visible wound',()=>{
 const {sim,p,room}=setup(),e=sim.actor('goblin',0,-34);room.actors=[e];e.dir=0;e.exposedUntil=20;e.hp=e.hpMax=500;
 sim.damageActor(e,p,'torso',3,room);assert.ok(e.alive);const before=e.damageMarks.torso.depth;
 sim.applyStatus(e,'burn',5,p,room);sim.time+=1;sim.tickStatuses(e,room,1);assert.ok(e.damageMarks.torso.depth>before);
 e.exposedUntil=20;sim.damageActor(e,p,'torso',3,room);assert.equal(e.alive,false);
});
test('combat experience can discover, learn and retain the lure through the normal inspiration path',()=>{
 const {sim,p}=setup(51);for(let i=0;i<180&&!p.skills.includes(60390);i++){sim.time=i*5;api.SkillSystem.record(sim,p,{kind:'contact',context:'combat:'+i%5,tags:['combat','tension'],text:'味方と敵を引き受ける'});}
 assert.ok(p.skills.includes(60390));assert.ok(p.skillLife.discovered.some(d=>d.id===60390));assert.equal(p.phaseWeights[0][60390],0);
 const r=api.Simulation.restore(sim.exportState());assert.ok(r.players.get(p.id).skills.includes(60390));
});

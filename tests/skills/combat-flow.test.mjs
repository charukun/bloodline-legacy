import test from 'node:test';import assert from 'node:assert/strict';
import {runtime,life,definitions} from './harness.mjs';
const api=runtime();
function setup(id,kind='dummy'){const f=life(api,41),{sim,p,room}=f;Object.assign(p,{age:24,x:0,z:0,dir:0,weapon:-1,stamina:100});room.kind='frontline';room.actors=[sim.actor(kind,0,3.6)];room.waveAt=1e9;sim.yearSeconds=1e9;sim.learn(p,id);p.phaseWeights=[{[id]:1},{},{}];p.autoFight=room.actors[0].id;return f;}
const opening=definitions.find(d=>d.composition&&d.phase===0&&d.composition.footwork==='drive'&&d.composition.ending==='withdraw');
test('auto combat commits one weighted opening, respects withdrawal and then reapproaches',()=>{
 const {sim,p,room}=setup(opening.id);let choices=0;const choose=sim.chooseSkill.bind(sim);sim.chooseSkill=(...args)=>(choices++,choose(...args));
 sim.tickAutoCombat(p,room,1/60);const planned=p.autoSkill?.id??p.pendingSkill?.id;assert.equal(planned,opening.id);
 for(let i=0;i<180&&!p.pendingSkill;i++)sim.tick(1/60);assert.ok(p.pendingSkill);assert.equal(choices,1,'approach and start may not reroll the chosen move');
 let retreat=0,retreatFrames=0;const tick=sim.tickAutoCombat.bind(sim);
 sim.tickAutoCombat=(actor,r,dt)=>{const protectedMotion=!!actor.combo,x=actor.x,z=actor.z;tick(actor,r,dt);if(protectedMotion)assert.equal(Math.hypot(actor.x-x,actor.z-z),0,'chase must not cancel technique-owned footwork');};
 for(let i=0;i<600;i++){const x=p.x,z=p.z,dir=p.dir;sim.tick(1/60);const away=-((p.x-x)*Math.sin(dir)+(p.z-z)*Math.cos(dir));if(away>.001){retreat+=away;retreatFrames++;}}
 assert.ok(retreat>.4&&retreatFrames>3,{retreat,retreatFrames});assert.ok(sim.events.filter(e=>e.type==='skill').length>1);
});
test('opening plan cancels when consciousness disables it, movement takes over, or a save restores',()=>{
 const {sim,p,room}=setup(opening.id);room.actors[0].z=4.2;sim.tickAutoCombat(p,room,.001);assert.ok(p.autoSkill);
 p.phaseWeights[0][opening.id]=0;sim.tickAutoCombat(p,room,.001);assert.equal(p.autoSkill,null);assert.equal(p.pendingSkill,null);
 p.autoSkill={id:opening.id,target:room.actors[0].id};p.input={x:0,z:-1};sim.tickAutoCombat(p,room,.01);assert.equal(p.autoFight,null);assert.equal(p.autoSkill,null);
 p.autoSkill={id:opening.id,target:room.actors[0].id};const loaded=api.Simulation.restore(sim.exportState()).players.get(p.id);assert.equal(loaded.autoSkill,null);
});
test('flame sword and lightning leap keep weapon restrictions, real costs, contacts and saved IDs',()=>{
 for(const id of [60093,60073]){const {sim,p,room}=setup(id);p.phaseWeights=[{},{},{}];room.actors[0].z=2.2;const skill=api.skillById(id);p.combo={band:skill.band,total:0,repeats:0};
  if(id===60093){assert.ok(api.skillRestriction(p,skill));p.weapon=0;}
  assert.ok(sim.beginComboStrike(p,id));assert.ok(p.stamina<100);for(let i=0;i<240;i++)sim.tick(1/60);
  assert.ok(sim.events.some(e=>e.type==='skill'&&e.id===id));assert.ok(sim.events.some(e=>e.type==='hit'&&e.skill===id),String(id));
  assert.ok(api.Simulation.restore(sim.exportState()).players.get(p.id).skills.includes(id));
 }
});

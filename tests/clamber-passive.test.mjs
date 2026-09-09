import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life} from './skills/harness.mjs';
const api=runtime(),PASSIVE=60905;
function setup(seed=13){const s=life(api,seed);s.room.actors=[];s.room.waveAt=1e9;Object.assign(s.p,{x:12,z:-27.2,supportHeight:0});return s;}
function finish(s,hz=60){for(let i=0;i<hz*3&&s.p.traversal;i++)s.sim.tick(1/hz);assert.equal(s.p.traversal,null);}
test('only a learned passive selects vault; default fence and both ledge directions use hands',()=>{
 for(const state of ['none','weights','other-passive','learned']){
  const s=setup();if(state==='weights')s.p.weights[PASSIVE]=1;if(state==='other-passive')s.sim.learn(s.p,4063);if(state==='learned')s.sim.learn(s.p,PASSIVE);
  assert(s.sim.tryTraversal(s.p,s.room,0,-1));assert.equal(s.p.traversal.kind,state==='learned'?'vault':'climb');assert.equal(s.p.traversal.duration,state==='learned'?.68:1.35);
 }
 for(const descend of [false,true]){const s=setup(),o=s.room.map.traversables.find(o=>o.id==='north:lower');s.sim.learn(s.p,PASSIVE);Object.assign(s.p,{x:o.x,z:descend?-17.5:-18.55,supportHeight:descend?.6:0});assert(s.sim.tryTraversal(s.p,s.room,0,descend?-1:1));assert.equal(s.p.traversal.kind,'climb');assert.equal(s.p.traversal.descending,descend);assert(Math.cos(s.p.dir)>.99);}
});
test('clamber raises the body before crossing; 30/60/120Hz preserve endpoint and one landing',()=>{
 for(const learned of [false,true])for(const hz of [30,60,120]){
  const s=setup();if(learned)s.sim.learn(s.p,PASSIVE);assert(s.sim.tryTraversal(s.p,s.room,0,-1));const a=structuredClone(s.p.traversal),beforeRng=s.sim.rng.getState();
  while(s.p.traversal){s.sim.command(s.p.id,{type:'move',x:1,z:1});s.sim.tick(1/hz);if(!learned&&s.p.traversal?.progress<.34)assert.equal(s.p.z,a.from.z);if(!learned&&Math.abs(s.p.z+28)<.54)assert(s.p.supportHeight+s.p.verticalOffset>=.55,'body stays raised while the legs clear the rail');}
  assert.equal(s.p.z,a.to.z);assert.equal(s.p.x,a.to.x);assert.equal(s.p.grounded,true);assert.equal(s.sim.events.filter(e=>e.type==='landed').length,1);assert.equal(s.sim.rng.getState(),beforeRng);
 }
});
test('learning mid-clamber does not switch motion; saved/live choices and old trajectories survive',()=>{
 const s=setup();assert(s.sim.tryTraversal(s.p,s.room,0,-1));s.sim.tick(.1);s.sim.learn(s.p,PASSIVE);assert.equal(s.p.traversal.kind,'climb');
 const data=s.sim.exportState({live:true}),live=api.Simulation.restoreLive(data),p=live.players.get(s.p.id);assert.equal(p.traversal.kind,'climb');assert(p.passives.includes(PASSIVE));finish({sim:live,p});
 p.traversalReadyAt=0;assert(live.tryTraversal(p,live.getRoom(p),0,1));assert.equal(p.traversal.kind,'vault');
 const offline=api.Simulation.restore(data),q=offline.players.get(s.p.id);assert(!q.traversal);assert(q.passives.includes(PASSIVE));assert.equal(q.z,-27.2);
 const old=setup();assert(old.sim.tryTraversal(old.p,old.room,0,-1));Object.assign(old.p.traversal,{kind:'vault',duration:.68});delete old.p.traversal.profile;
 const restored=api.Simulation.restoreLive(old.sim.exportState({live:true})),rp=restored.players.get(old.p.id);restored.tick(.1);const u=rp.traversal.progress;assert(Math.abs(rp.verticalOffset-Math.sin(Math.PI*u)*1.16)<1e-10);assert(!rp.passives.includes(PASSIVE));
});
test('passive cannot bypass injury, rescue, downed state or invalid landing',()=>{
 for(const state of ['arm-heavy','arm-lost','leg-heavy','rescue','downed','blocked']){
  const s=setup();s.sim.learn(s.p,PASSIVE);
  if(state==='arm-heavy')s.p.wounds.leftArm={severity:'heavy'};if(state==='arm-lost')s.p.wounds.rightArm={severity:'lost'};if(state==='leg-heavy')s.p.wounds.leftLeg={severity:'heavy'};if(state==='rescue')s.p.rescueTarget='friend';if(state==='downed')s.sim.downPlayer(s.p,'test');if(state==='blocked')s.room.actors.push(s.sim.actor('dummy',12,-28.84));
  assert.equal(s.sim.tryTraversal(s.p,s.room,0,-1),false,state);
 }
});
test('exploration and successful clambers can discover the passive through the real life catalog',()=>{
 const s=setup();let direction=-1,landings=0;
 for(let i=0;i<240&&!s.p.passives.includes(PASSIVE);i++){
  s.p.traversalReadyAt=0;assert(s.sim.tryTraversal(s.p,s.room,0,direction));finish(s,30);direction*=-1;landings++;
  // Real exploration sampler: a walk of more than 3 units since the last sample.
  s.p.skillLife.sampleX=s.p.x-4;s.p.skillLife.sampleZ=s.p.z;s.p.skillLife.sampleAt=0;s.sim.time+=5;api.SkillSystem.sample(s.sim,s.p);
 }
 assert(s.p.passives.includes(PASSIVE),'passive remains discoverable in the full catalog');const d=s.p.skillLife.discovered.find(d=>d.id===PASSIVE);assert(d);assert(d.reasons.some(r=>r.includes('よじ登り')));assert(d.reasons.some(r=>r.includes('歩')));assert(landings>1);
 const notices=s.sim.events.filter(e=>e.type==='passive'&&e.id===PASSIVE);assert.equal(notices.length,1);assert(!s.p.skills.includes(PASSIVE));assert.equal(s.p.phaseWeights[0][PASSIVE],undefined);
 const loaded=api.Simulation.restore(s.sim.exportState()).players.get(s.p.id);assert(loaded.passives.includes(PASSIVE));assert(loaded.skillLife.discovered.some(d=>d.id===PASSIVE));
});

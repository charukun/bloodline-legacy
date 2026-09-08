import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life,step} from './harness.mjs';
const api=runtime();

test('both village layouts leave the training dummy reachable in the dojo area',()=>{
 const sides=new Set();
 for(const seed of [1,2,3,4,5,6,7,8,7349,12345]){
  const {sim,p,room}=life(api,seed),dummy=room.actors.find(a=>a.kind==='dummy');sides.add(Math.sign(dummy.x));
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;Object.assign(p,{x:dummy.x+Math.sin(angle)*1.2,z:dummy.z+Math.cos(angle)*1.2});
   const before=[p.x,p.z];sim.bound(p,room);assert.deepEqual([p.x,p.z],before,'approach must not intersect shore or building colliders');
   assert.equal(sim.getArea(p),'sword');
  }
  Object.assign(p,{x:dummy.x,z:dummy.z+1.1});step(sim,1.5);
  assert.ok(sim.events.some(e=>e.type==='hit'&&e.target===dummy.id&&e.kind==='practice'),'contact still starts practice combat');
 }
 assert.deepEqual([...sides].sort(),[-1,1]);
});

test('old saves relocate the existing dummy without replacing it or resetting the life',()=>{
 const {sim,p,room}=life(api,7349),dummy=room.actors.find(a=>a.kind==='dummy');
 Object.assign(dummy,{x:15.2,z:10.9,homeX:12,homeZ:8.65});dummy.wounds={torso:{severity:'light'}};
 sim.learn(p,60010);p.phaseWeights[0][60010]=1;const saved=structuredClone(sim.exportState());
 const restored=api.Simulation.restore(saved),r=restored.rooms.get(room.id),d=r.actors.find(a=>a.id===dummy.id);
 assert.equal(r.actors.filter(a=>a.kind==='dummy').length,1);assert.notEqual(d.x,15.2);assert.equal(d.x,d.homeX);assert.equal(d.z,d.homeZ);
 assert.deepEqual(d.wounds,dummy.wounds);assert.equal(restored.getArea({...d,room:r.id}),'sword');
 const q=restored.players.get(p.id);assert.deepEqual(structuredClone(q.skills),structuredClone(p.skills));assert.deepEqual(structuredClone(q.phaseWeights),structuredClone(p.phaseWeights));assert.equal(q.age,p.age);
 const twice=api.Simulation.restore(structuredClone(restored.exportState())).rooms.get(room.id).actors.find(a=>a.id===dummy.id);
 assert.deepEqual([twice.x,twice.z,twice.homeX,twice.homeZ],[d.x,d.z,d.homeX,d.homeZ]);
});

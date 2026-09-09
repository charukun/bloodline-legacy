import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life} from './skills/harness.mjs';
const api=runtime();
function setup(){const x=life(api);x.room.actors=[];x.room.waveAt=1e6;Object.assign(x.p,{x:12,z:-26.5});return x;}
function walk(sim,p,x,z,seconds,fps=30){for(let i=0;i<seconds*fps;i++){sim.command(p.id,{type:'move',x,z});sim.tick(1/fps);}}
test('fence crossing uses the same landing at 30, 60 and 120 simulation steps',()=>{
 const ends=[];for(const fps of [30,60,120]){const {sim,p}=setup();let maxY=0,started=false;
  for(let i=0;i<fps*1.8;i++){sim.command(p.id,{type:'move',x:0,z:-1});sim.tick(1/fps);maxY=Math.max(maxY,p.verticalOffset||0);started||=!!p.traversal;}
  assert.ok(started,String(fps));assert.ok(maxY>1);assert.ok(p.z<-28.5);assert.equal(p.grounded,true);assert.equal(p.traversal,null);ends.push(sim.events.find(e=>e.type==='landed').z);
 }assert.ok(Math.max(...ends)-Math.min(...ends)<1e-8);
});
test('three low supported steps can be climbed and descended without floating',()=>{
 const {sim,p,room}=setup(),step=room.map.traversables.find(o=>o.kind==='step');p.x=step.x;p.z=step.z+1.6;
 walk(sim,p,0,-1,1.7);assert.ok(p.supportHeight>=.6);assert.ok(sim.events.some(e=>e.type==='traverse'&&e.kind==='climb'));
 walk(sim,p,0,1,2.8);assert.equal(p.traversal,null);assert.equal(p.supportHeight,0);assert.equal(p.verticalOffset,0);
});
test('high barriers, side entry, occupied and narrow landings reject traversal',()=>{
 for(const scenario of ['high','side','occupied','narrow']){const {sim,p,room}=setup();p.z=-27.2;const o=room.map.traversables.find(o=>o.id==='fence:12');
  if(scenario==='high')o.height=3;
  if(scenario==='occupied')room.actors.push(sim.actor('dummy',12,-28.84));
  if(scenario==='narrow')o.width=.6;
  assert.equal(sim.tryTraversal(p,room,scenario==='side'?1:0,scenario==='side'?0:-1),false,scenario);
 }
});
test('diagonal approach, corners, normal wall sliding and repeated input stay bounded',()=>{
 const {sim,p,room}=setup();p.x=11.6;p.z=-27.2;assert.equal(sim.tryTraversal(p,room,.2,-1),true);walk(sim,p,1,-1,1);assert.ok(p.x<14&&p.z<-28.5);
 p.x=room.map.houses[0].x+2.01;p.z=room.map.houses[0].z;const before=p.z;walk(sim,p,-1,1,.5);assert.ok(p.z>before);const bounded={x:p.x,z:p.z};sim.bound(bounded,room);assert.equal(bounded.x,p.x);assert.equal(bounded.z,p.z);
});
test('injury, childhood carry, rescue carry and incapacitation cannot initiate traversal',()=>{
 for(const block of ['leg','prologue','rescue','downed','root']){const {sim,p,room}=setup();p.z=-27.2;
  if(block==='leg')p.wounds.leftLeg={severity:'heavy'};if(block==='prologue')p.prologue=true;if(block==='rescue')p.rescueTarget='somebody';if(block==='downed')sim.downPlayer(p,'深手');if(block==='root')sim.applyStatus(p,'root',3,null,room);
  assert.equal(sim.tryTraversal(p,room,0,-1),false,block);
 }
});
test('midair save, hit interruption and occupied destination restore a supported position',()=>{
 for(const stop of ['save','hit','occupied']){const {sim,p,room}=setup();p.z=-27.2;assert.ok(sim.tryTraversal(p,room,0,-1));sim.tick(.1);sim.tick(.1);
  if(stop==='save'){const r=api.Simulation.restore(sim.exportState()),rp=r.players.get(p.id);assert.equal(rp.traversal,null);assert.equal(rp.grounded,true);assert.equal(rp.z,-27.2);}
  if(stop==='hit'){sim.inflictWound(p,'torso','heavy');assert.equal(p.traversal,null);assert.equal(p.verticalOffset,0);assert.equal(p.z,-27.2);}
  if(stop==='occupied'){room.actors.push(sim.actor('dummy',p.traversal.to.x,p.traversal.to.z));sim.tick(1/30);assert.equal(p.traversal,null);assert.equal(p.z,-27.2);}
 }
});

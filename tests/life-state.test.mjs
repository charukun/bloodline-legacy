import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life,step} from './skills/harness.mjs';
const api=runtime();
function scene(seed=13){const x=life(api,seed);x.room.actors=[];x.room.waveAt=1e6;Object.assign(x.p,{x:0,z:-33});return x;}
test('fatal blow incapacitates; only a later, reachable attack confirms death once',()=>{
 const {sim,p,room}=scene(),e=sim.actor('goblin',0,-34);room.actors=[e];e.dir=0;
 sim.inflictWound(p,'head','fatal',e);assert.equal(p.alive,true);assert.equal(p.lifeState,'downed');assert.equal(sim.legacy(p.owner).generation,1);
 assert.equal(sim.command(p.id,{type:'move',x:1,z:0}),false);assert.equal(sim.command(p.id,{type:'attack'}),false);assert.equal(sim.command(p.id,{type:'dash',x:1,z:0}),false);
 sim.hitPlayer(p,e,{started:sim.time,reach:2.3});assert.equal(p.alive,true);
 sim.time+=3;sim.hitPlayer(p,e,{started:p.downedAt,reach:2.3});assert.equal(p.alive,true);
 sim.hitPlayer(p,e,{started:sim.time-.1,reach:2.3});assert.equal(p.alive,false);assert.equal(p.legacyChoice.state,'pending');
 sim.die(p,'再度');assert.equal(sim.events.filter(e=>e.type==='death').length,1);assert.equal(sim.legacy(p.owner).generation,2);
});
test('rescue validates distance, self, duplicate carrier and releases on carrier damage',()=>{
 const {sim,p,room}=scene(),q=sim.addPlayer('helper',{owner:'helper'}),other=sim.addPlayer('helper2',{owner:'helper2'});
 Object.assign(q,{age:18,prologue:false,x:0,z:-32});Object.assign(other,{age:18,prologue:false,x:1,z:-33});
 sim.downPlayer(p,'深手');assert.equal(sim.command(p.id,{type:'rescue',target:p.id}),false);
 q.x=10;assert.equal(sim.command(q.id,{type:'rescue',target:p.id}),false);q.x=0;
 assert.equal(sim.command(q.id,{type:'rescue',target:p.id}),true);assert.equal(sim.command(other.id,{type:'rescue',target:p.id}),false);
 assert.equal(sim.command(q.id,{type:'dash',x:0,z:1}),false);assert.equal(sim.command(q.id,{type:'board'}),false);
 sim.syncRescue(q,room);assert.equal(p.x,q.x);assert.equal(p.z,q.z);
 sim.inflictWound(q,'torso','light');assert.equal(p.lifeState,'downed');assert.equal(p.carrierId,null);assert.equal(q.rescueTarget,null);
});
test('player carries to safety, recovery survives save and preserves lost limbs',()=>{
 const {sim,p,room}=scene(),q=sim.addPlayer('helper',{owner:'helper'});Object.assign(q,{age:18,prologue:false,x:0,z:-32,releaseAt:-100,introUntil:-100});
 p.wounds.leftArm={severity:'lost'};sim.downPlayer(p,'深手');assert.ok(sim.command(q.id,{type:'rescue',target:p.id}));
 for(let i=0;i<110;i++){sim.command(q.id,{type:'move',x:0,z:1});sim.tick(1/30);}
 assert.equal(p.lifeState,'recovering');assert.ok(p.z>=-25.5);assert.equal(q.rescueTarget,null);
 const restored=api.Simulation.restore(sim.exportState()),rp=restored.players.get(p.id);step(restored,13);
 assert.equal(rp.lifeState,'active');assert.equal(rp.alive,true);assert.equal(rp.wounds.leftArm.severity,'lost');assert.equal(rp.wounds.torso.severity,'heavy');assert.ok(rp.health<70);
});
test('guard claims and physically carries an outside casualty through the gate',()=>{
 const {sim,p,room}=scene(),g=sim.actor('guard',-7,-32);room.actors=[g];p.x=-7;p.z=-34;sim.downPlayer(p,'深手');
 let carried=false,safe=false;for(let i=0;i<1600;i++){sim.tick(1/30);carried||=p.lifeState==='carried';safe||=p.lifeState==='recovering';}
 assert.ok(carried);assert.ok(safe);assert.equal(p.lifeState,'active');assert.ok(p.z>=-25.5);assert.ok(sim.events.filter(e=>e.type==='guardline').length>=3);
});
test('disconnect, removal and carrier death cannot strand the rescued player',()=>{
 for(const action of ['timeout','remove','death']){const {sim,p,room}=scene(),q=sim.addPlayer('helper',{owner:'helper'});Object.assign(q,{age:18,prologue:false,x:0,z:-32});sim.downPlayer(p,'深手');sim.startRescue(q,p);
  if(action==='timeout'){sim.time+=9;sim.syncRescue(q,room);}if(action==='remove')sim.removePlayer(q.id);if(action==='death')sim.die(q,'寿命');
  assert.equal(p.lifeState,'downed',action);assert.equal(p.carrierId,null,action);
 }
});
test('leave one learned active art: pending survives reload/witness, choice cannot duplicate records',()=>{
 const {sim,p}=scene();sim.learn(p,4001);p.skillUses[4000]=99;sim.die(p,'寿命');
 assert.equal(sim.bank(p,{id:'witness'}),false);assert.equal(sim.legacy(p.owner).archive.length,0);
 const r=api.Simulation.restore(sim.exportState()),rp=r.players.get(p.id);assert.equal(rp.legacyChoice.state,'pending');
 assert.equal(r.command(p.id,{type:'choose-legacy',skill:4017}),false);assert.equal(r.command(p.id,{type:'choose-legacy',skill:'4001'}),false);
 assert.ok(r.command(p.id,{type:'choose-legacy',skill:4001}));assert.equal(r.command(p.id,{type:'choose-legacy',skill:4000}),false);assert.equal(r.bank(rp),false);
 const l=r.legacy(p.owner);assert.deepEqual(Array.from(l.archive),[4001]);assert.equal(l.records.length,1);assert.equal(l.records[0].skill,4001);
 const next=r.addPlayer('child',{owner:p.owner,inherit:[4001]});assert.equal(next.gen,2);assert.equal(next.inherit[0],4001);
});
test('status damage cannot finish a casualty; field recovery and lifespan remain independent',()=>{
 const {sim,p}=scene();p.health=1;sim.applyStatus(p,'poison',9,null,sim.getRoom(p));step(sim,2);assert.equal(p.lifeState,'downed');step(sim,42);assert.equal(p.lifeState,'active');assert.ok(p.alive);
 sim.downPlayer(p,'深手');p.lifespan=p.age+p.ageFraction+.001;step(sim,1);assert.equal(p.alive,false);assert.equal(p.cause,'寿命');
});
test('old recorded saves keep their chosen archive and are never converted to pending',()=>{
 const {sim,p}=scene();p.alive=false;p.recorded=true;p.bankedSkills=[4000];sim.legacy(p.owner).archive=[4000];sim.legacy(p.owner).records=[{id:p.id,skill:4000,skills:[4000]}];
 const r=api.Simulation.restore(sim.exportState()),rp=r.players.get(p.id);assert.equal(rp.legacyChoice,undefined);assert.equal(r.bank(rp),false);assert.equal(r.legacy(p.owner).records.length,1);
});
test('guard goes around the fence to claim a casualty on the inner approach, without crossing timber',()=>{
 const {sim,p,room}=scene(),g=sim.actor('guard',-7,-32);room.actors=[g];p.x=-8;p.z=-26.5;sim.downPlayer(p,'深手');
 let carried=false,gate=false;for(let i=0;i<1000;i++){const before={x:g.x,z:g.z};sim.tick(1/30);if((before.z+28)*(g.z+28)<0){assert.ok(Math.abs(g.x)<2.5);gate=true;}carried||=p.lifeState==='carried';}
 assert.ok(gate);assert.ok(carried);assert.equal(p.lifeState,'active');
});
test('the carried target dying clears both references and records only the eventual personal choice',()=>{
 const {sim,p}=scene(),q=sim.addPlayer('helper',{owner:'helper'});Object.assign(q,{age:18,prologue:false,x:0,z:-32});sim.downPlayer(p,'深手');assert.ok(sim.startRescue(q,p));
 sim.die(p,'寿命');assert.equal(p.lifeState,'dead');assert.equal(p.carrierId,null);assert.equal(q.rescueTarget,null);assert.equal(sim.bank(p,q),false);
 assert.ok(sim.command(p.id,{type:'choose-legacy',skill:4000}));assert.equal(sim.legacy(p.owner).records.length,1);
});

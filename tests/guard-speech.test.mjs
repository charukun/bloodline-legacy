import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life} from './skills/harness.mjs';
const api=runtime();
const speaking=(room,time)=>room.actors.filter(a=>a.alive&&a.kind==='guard'&&a.speech&&a.speechUntil>time);
const encounter=()=>{const f=life(api);Object.assign(f.p,{x:0,z:-32});return f;};

test('nearby guards speak one at a time and skipped lines do not queue behind the speaker',()=>{
 const {sim,p,room}=encounter();sim.tick(1/30);
 assert.equal(speaking(room,sim.time).length,1);assert.equal(sim.events.filter(e=>e.type==='guardline').length,1);
 const silent=room.actors.find(e=>e.kind==='guard'&&Math.abs(e.x)<5&&!e.speech);
 assert.ok(silent);assert.ok(silent.nextSpeechAt>=sim.time+10,'a skipped line waits for the next normal opportunity');
 const speaker=speaking(room,sim.time)[0];sim.time=speaker.speechUntil;sim.tickActor(silent,room,[p],1/30);
 assert.equal(speaking(room,sim.time).length,0,'no queued line starts immediately after the previous one');
 sim.time=silent.nextSpeechAt;sim.tickActor(silent,room,[p],1/30);
 assert.equal(speaking(room,sim.time)[0]?.id,silent.id,'a different guard can speak on its next opportunity');
});

test('coordination keeps combat movement, actions and RNG identical to independent speech',()=>{
 const coordinated=encounter(),independent=encounter();
 for(const f of [coordinated,independent])for(const guard of f.room.actors.filter(a=>a.kind==='guard')){
  // Expire only speech between actors to reproduce independent speech without altering combat.
  if(f===independent)for(const other of f.room.actors)other.speechUntil=0;
  f.sim.tickActor(guard,f.room,[f.p],1/30);
 }
 assert.equal(coordinated.sim.rng.getState(),independent.sim.rng.getState());
 const gameplay=room=>JSON.parse(JSON.stringify(room.actors,(key,value)=>['speech','speechUntil'].includes(key)?undefined:value));
 assert.deepEqual(gameplay(coordinated.room),gameplay(independent.room));
 assert.equal(coordinated.sim.events.filter(e=>e.type==='guardline').length,1);assert.equal(independent.sim.events.filter(e=>e.type==='guardline').length,2);
});

test('expired or dead speakers and player chat do not silence guards',()=>{
 for(const state of ['expired','dead','player']){
  const {sim,p,room}=encounter(),guards=room.actors.filter(e=>e.kind==='guard'),candidate=guards[1],other=guards[2];
  Object.assign(other,{speech:'話し中',speechUntil:100});
  if(state==='expired')other.speechUntil=sim.time;
  if(state==='dead')other.alive=false;
  if(state==='player'){other.speech='';p.speech='待っているよ';p.speechUntil=100;}
  sim.tickActor(candidate,room,[p],1/30);assert.equal(speaking(room,sim.time)[0]?.id,candidate.id,state);
 }
});

test('a speaking guard in another room does not block the local group',()=>{
 const {sim,p,room}=encounter(),other=sim.makeRoom('village'),guard=other.actors.find(e=>e.kind==='guard');
 Object.assign(guard,{speech:'別の村の声',speechUntil:100});sim.tick(1/30);
 assert.equal(speaking(room,sim.time).length,1);assert.ok(guard.speechUntil>sim.time);
});

test('restored guard speech still prevents overlap without new save fields',()=>{
 const {sim,p,room}=encounter();sim.tick(1/30);const saved=sim.exportState(),restored=api.Simulation.restore(saved),q=restored.players.get(p.id),r=restored.getRoom(q);
 const current=speaking(r,restored.time)[0];assert.ok(current);
 const candidate=r.actors.find(e=>e.kind==='guard'&&e.id!==current.id&&Math.abs(e.x)<5);candidate.nextSpeechAt=0;
 restored.tickActor(candidate,r,[q],1/30);assert.equal(speaking(r,restored.time).length,1);assert.equal(restored.events.filter(e=>e.type==='guardline').length,0);
});

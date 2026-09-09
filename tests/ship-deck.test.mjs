import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life,step} from './skills/harness.mjs';
import {safePlayer} from '../src/live/contract.mjs';

const api=runtime();
function setup(){const f=life(api);f.room.actors=f.room.actors.filter(a=>a.kind==='dummy');f.room.waveAt=1e9;Object.assign(f.p,{x:0,z:27});return f;}
function walk(f,x,z,seconds){for(let i=0;i<seconds*30;i++){f.sim.command(f.p.id,{type:'move',x,z});f.sim.tick(1/30);}f.sim.command(f.p.id,{type:'move',x:0,z:0});}
function deck(f,x=-2,z=43){Object.assign(f.p,{x,z,supportHeight:1.2,queued:true});}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);

test('walk up and down the continuous gangway without a boarding command or traversal',()=>{
 const f=setup();walk(f,0,1,2.4);assert.ok(f.p.z>34&&f.p.z<40);assert.equal(f.p.queued,true);close(f.p.supportHeight,1.2);assert.ok(!f.p.traversal);
 walk(f,0,-1,2.8);assert.ok(f.p.z<29.5);assert.equal(f.p.queued,false);assert.equal(f.p.supportHeight,0);assert.equal(f.p.room,f.room.id);
 assert.equal(f.sim.command(f.p.id,{type:'board'}),false);
});

test('children cannot enter by walking or dash; 15-year-old boarding remains possible',()=>{
 for(const dash of [false,true]){const f=setup();f.p.age=14;if(dash){f.sim.command(f.p.id,{type:'dash',x:0,z:1});step(f.sim,2);}else walk(f,0,1,3);assert.ok(f.p.z<=29.5);assert.equal(f.p.queued,false);}
 const f=setup();f.p.age=15;walk(f,0,1,2.4);assert.ok(f.p.z>34);
});

test('rails, bow, stern, masts and gangway retain walk, attack, recoil and dash movement',()=>{
 for(const [x,z,dx,dz] of [[-2,43,-30,0],[2,46,30,0],[1,53,0,30],[3,35,0,-30],[0,37,0,10],[0,31,10,0]]){
  const f=setup();deck(f,x,z);f.sim.moveAttackStep(f.p,f.room,dx,dz);assert.ok(Math.hypot(f.p.x-x,f.p.z-z)<Math.hypot(dx,dz));
  const bounded={...f.p};f.sim.bound(bounded,f.room);close(f.p.x,bounded.x);close(f.p.z,bounded.z);assert.equal(f.sim.tryTraversal(f.p,f.room,dx,dz),false);
  assert.ok(f.p.z>=29.5&&f.p.z<=56);assert.ok(Math.abs(f.p.x)<6);
 }
 const f=setup();deck(f,-3,45);f.sim.command(f.p.id,{type:'dash',x:-1,z:0});step(f.sim,2);assert.ok(f.p.x>-6);assert.equal(f.p.queued,true);
});

test('each ship dummy supports real practice, stamina expenditure and learning evidence',()=>{
 for(let i=0;i<3;i++){const f=setup(),dummy=f.room.actors.find(a=>a.shipStation===i);assert.ok(dummy);close(dummy.supportHeight,1.2);
  deck(f,dummy.x,dummy.z-.95);f.sim.command(f.p.id,{type:'move',x:0,z:1});step(f.sim,8);
  assert.ok(f.sim.events.some(e=>e.type==='hit'&&e.kind==='practice'&&e.target===dummy.id));assert.ok(f.p.skillUses[4000]>0);assert.ok(f.p.staminaCap<100);assert.ok(f.p.skillLife.serial>0);assert.equal(f.p.queued,true);
 }
});

test('ship prayer progresses through the existing faith learning path and stops outside the shrine',()=>{
 const f=setup(),s=f.room.map.ship.shrine;deck(f,s.x,s.z);
 assert.equal(f.sim.command(f.p.id,{type:'activity',activity:'pray'}),true);step(f.sim,12);
 assert.ok(f.p.activityClock>11);assert.ok(f.p.skillLife.serial>0);assert.equal(f.p.queued,true);
 const lines=f.sim.events.filter(e=>e.type==='progress');assert.ok(lines.length>=2);assert.ok(lines.every(e=>!e.text.includes('聖堂')&&!e.text.includes('冷たい石')));
 walk(f,0,1,.5);assert.equal(f.p.activity,null);deck(f,-3,44);assert.equal(f.sim.command(f.p.id,{type:'activity',activity:'pray'}),false);
});

test('seated deck rest recovers fatigue and injuries through the existing recovery rules',()=>{
 const f=setup();deck(f,-3.6,44.7);Object.assign(f.p,{stamina:5,staminaCap:35,health:40,lastHurtAt:-100,wounds:{torso:{severity:'heavy',since:18,healsAt:23}}});
 assert.equal(f.sim.command(f.p.id,{type:'sit',active:true}),true);step(f.sim,5);
 assert.ok(f.p.stamina>35);assert.ok(f.p.staminaCap>35);assert.ok(f.p.health>40);assert.ok(f.p.wounds.torso.healsAt<23);assert.equal(f.p.queued,true);
});

test('one shared five-year boundary transfers all deck passengers, preserves progress and clears deck actions',()=>{
 const f=setup(),{sim,room,p}=f;deck(f);const q=sim.addPlayer('second',{owner:'second'}),shore=sim.addPlayer('shore',{owner:'shore'});
 Object.assign(q,{age:31,prologue:false,x:3,z:52,queued:false});Object.assign(shore,{age:22,prologue:false,x:0,z:28,queued:true});
 p.inventory=['bell'];p.weapon=1;p.wounds={torso:{severity:'heavy',since:18,healsAt:30}};p.dash={started:0};p.attackBufferedUntil=999;
 sim.time=sim.boatInterval-.02;sim.tick(1/30);
 assert.notEqual(p.room,room.id);assert.equal(p.room,q.room);assert.equal(shore.room,room.id);assert.equal(sim.getRoom(p).partySize,2);
 assert.equal(p.inventory[0],'bell');assert.equal(p.weapon,1);assert.ok(p.wounds.torso);assert.equal(p.supportHeight,0);assert.equal(p.dash,null);assert.equal(p.attackBufferedUntil,0);
 step(sim,.2);assert.equal(sim.events.filter(e=>e.type==='depart').length,2);assert.equal([...sim.rooms.values()].filter(r=>r.kind==='front').length,1);
 assert.equal(sim.returnHome(p),true);assert.equal(p.room,room.id);assert.equal(p.z,24);
});

test('empty departure is not replayed for a late arrival; next departure uses shared world time',()=>{
 const f=setup();f.sim.time=f.sim.boatInterval-.02;f.sim.tick(1/30);deck(f);step(f.sim,.2);assert.equal(f.p.room,f.room.id);
 f.sim.time=2*f.sim.boatInterval-.02;f.sim.tick(1/30);assert.notEqual(f.p.room,f.room.id);
});

test('deck and gangway save/reconnect preserve location; a checkpoint cannot duplicate departure',()=>{
 for(const restore of ['restore','restoreLive'])for(const z of [31,43]){
  const f=setup();deck(f,0,z);f.sim.time=f.sim.boatInterval-.2;
  let sim=api.Simulation[restore](f.sim.exportState({live:true})),p=sim.players.get(f.p.id);close(p.x,0);close(p.z,z);assert.equal(sim.getRoom(p).actors.filter(a=>a.shipStation!=null).length,3);
  step(sim,.3);assert.equal(sim.getRoom(p).kind,z===43?'front':'village');sim=api.Simulation[restore](sim.exportState({live:true}));step(sim,.3);
  assert.equal([...sim.rooms.values()].filter(r=>r.kind==='front').length,z===43?1:0);
 }
});

test('old saves gain exactly three ship stations without moving dojo targets or boarding old reservations',()=>{
 const f=setup(),data=f.sim.exportState({live:true});const r=data.rooms.find(([id])=>id===f.room.id)[1];delete r.map.ship;r.actors=r.actors.filter(a=>a.shipStation==null);
 data.players[0][1].queued=true;
 for(const restore of ['restore','restoreLive']){let sim=api.Simulation[restore](data),p=sim.players.get(f.p.id);sim=api.Simulation[restore](sim.exportState({live:true}));assert.equal(sim.getRoom(p).actors.filter(a=>a.shipStation!=null).length,3);sim.time=sim.boatInterval-.01;sim.tick(1/30);assert.equal(sim.players.get(p.id).room,r.id);}
});

test('live update waits for a passenger to disembark even when no reservation flag is set',()=>{
 const f=setup();deck(f);f.p.queued=false;assert.equal(safePlayer(f.p,f.room,f.sim.time),false);assert.equal(safePlayer(f.p,f.sim.snapshot(f.p.id),f.sim.time),false);
 f.p.z=31;assert.equal(safePlayer(f.p,f.room,f.sim.time),false);
});


test('gangway walking and recoil follow continuous height without weakening terrace edge guards',()=>{
 const f=setup();let last=0,lastZ=f.p.z;
 for(let i=0;i<75;i++){f.sim.command(f.p.id,{type:'move',x:0,z:1});f.sim.tick(1/30);assert.ok(Math.abs(f.p.supportHeight-last)<=Math.abs(f.p.z-lastZ)*.275+1e-8);last=f.p.supportHeight;lastZ=f.p.z;}
 assert.ok(f.p.z>34);assert.equal(f.p.supportHeight,1.2);
 Object.assign(f.p,{x:0,z:32,supportHeight:.275+(32-29.5)/4.5*.925});
 const moved=f.sim.moveAttackStep(f.p,f.room,0,-1);assert.ok(moved>.99);assert.ok(f.p.supportHeight<.6);
});

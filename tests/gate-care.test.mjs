import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,life,step} from './skills/harness.mjs';
const api=runtime();
function field(seed=13){const f=life(api,seed);f.room.actors=[];f.room.waveAt=1e9;Object.assign(f.p,{x:0,z:-33,dir:Math.PI});return f;}

test('young children cannot sever or cancel an elite swing with a weak punch; a direct hit downs them',()=>{
 let down=0;for(let seed=1;seed<=100;seed++){
  const {sim,p,room}=field(seed);p.age=4;const e=sim.actor('elite',0,-34,2);room.actors=[e];e.dir=0;e.target=p.id;p.autoFight=e.id;
  sim.hitPlayer(p,e,{part:'torso'});down+=p.lifeState==='downed';assert.ok(p.alive);
  const before=e.hp,tg=e.telegraph={target:p.id,started:sim.time,at:sim.time+1};sim.damageActor(e,p,'rightArm',.6,room);
  assert.ok(e.hp>=before-2);assert.notEqual(e.wounds.rightArm?.severity,'lost');assert.equal(e.telegraph,tg);
 }
 assert.ok(down>=85,'a child cannot rely on adult frontal avoidance');
});

test('starting a basic swing or holding guard cannot immunize a child against elite contact',()=>{
 for(const mode of ['pending','guard']){const {sim,p,room}=field();p.age=4;const e=sim.actor('elite',0,-34,2);e.dir=0;room.actors=[e];if(mode==='pending')p.pendingSkill={id:4000,at:sim.time+.2};else p.guard=true;
  sim.hitPlayer(p,e,{part:'torso',started:sim.time});assert.equal(p.lifeState,'downed');assert.equal(sim.events.some(e=>e.type==='clash'||e.type==='guarded'),false);
  sim.time+=3;sim.hitPlayer(p,e,{started:sim.time-.1,reach:3.4});assert.equal(p.alive,false);assert.equal(sim.events.filter(e=>e.type==='death').length,1);
 }
});

test('growth increases attack strength and durability; adult armor and ordinary practice remain useful',()=>{
 const rows=[];for(const age of [4,10,18]){const {sim,p,room}=field();p.age=age;const e=sim.actor('elite',0,-34,2);room.actors=[e];e.dir=0;sim.damageActor(e,p,'torso',1,room);const damage=120-e.hp;sim.inflictWound(p,'torso','light');rows.push({damage,health:p.health});}
 assert.ok(rows[0].damage<rows[1].damage&&rows[1].damage<rows[2].damage);assert.ok(rows[0].health<rows[1].health&&rows[1].health<rows[2].health);
 const f=life(api);f.p.age=4;const d=f.room.actors.find(e=>e.kind==='dummy');f.room.actors=[d];f.room.waveAt=1e9;Object.assign(f.p,{x:d.x,z:d.z+.9});f.sim.command(f.p.id,{type:'move',x:0,z:-1});step(f.sim,8);assert.ok(f.p.skillUses[4000]>0);assert.ok(f.p.skillLife.serial>0);
});

test('aid team physically carries both a guard and a player through the gate and revives them',()=>{
 const f=life(api),{sim,p,room}=f;room.actors=room.actors.filter(a=>a.role==='medic');room.waveAt=1e9;const guard=sim.actor('guard',-6,-33);room.actors.push(guard);Object.assign(p,{x:5,z:-34});sim.downPlayer(p,'深手');sim.killActor(guard,null,room);
 assert.ok(guard.alive);assert.equal(guard.lifeState,'downed');let playerCarried=false,guardCarried=false,gate=false;
 for(let i=0;i<2100;i++){
  const old=room.actors.filter(a=>a.role==='medic').map(a=>({id:a.id,x:a.x,z:a.z}));sim.tick(1/30);
  playerCarried||=p.lifeState==='carried';guardCarried||=guard.lifeState==='carried';
  for(const before of old){const a=room.actors.find(a=>a.id===before.id);if((a.z+28)*(before.z+28)<0){assert.ok(Math.abs(a.x)<2.5);gate=true;}}
 }
 assert.ok(playerCarried&&guardCarried&&gate);assert.equal(p.lifeState,'active');assert.equal(guard.lifeState,'active');assert.ok(p.z>-26);assert.ok(guard.hp>70);assert.equal(room.actors.filter(a=>a.kind==='guard'&&a.role!=='medic').length,1);assert.ok(sim.events.some(e=>e.type==='guardline'&&e.text.includes('安全')));
});

test('player can rescue a downed guard; carrier damage, finishing and duplicate claims clean references',()=>{
 const {sim,p,room}=field(),g=sim.actor('guard',0,-32);room.actors=[g];sim.killActor(g,null,room);assert.ok(sim.command(p.id,{type:'rescue',target:g.id}));assert.equal(g.carrierId,p.id);
 sim.inflictWound(p,'leftArm','light');assert.equal(g.carrierId,null);assert.equal(p.rescueTarget,null);assert.equal(g.lifeState,'downed');
 const e=sim.actor('elite',0,-33);room.actors.push(e);sim.time+=3;assert.ok(sim.finishPlayer(g,e,{started:sim.time-.1,reach:3.4}));assert.equal(g.alive,false);assert.equal(sim.command(p.id,{type:'rescue',target:g.id}),false);
});

test('treatment is local, speeds recovery without regrowing limbs, and ends on movement',()=>{
 const a=field(),b=field();for(const f of [a,b])Object.assign(f.p,{x:8,z:-23,health:30,lastHurtAt:-100,wounds:{torso:{severity:'heavy',healsAt:23},leftArm:{severity:'lost'}}});b.p.x=0;b.p.z=4;
 assert.equal(b.sim.command(b.p.id,{type:'treatment'}),false);assert.ok(a.sim.command(a.p.id,{type:'treatment'}));assert.ok(b.sim.command(b.p.id,{type:'sit',active:true}));step(a.sim,5);step(b.sim,5);
 assert.ok(a.p.health>b.p.health+20);assert.ok(a.p.wounds.torso.healsAt<b.p.wounds.torso.healsAt);assert.equal(a.p.wounds.leftArm.severity,'lost');
 a.sim.command(a.p.id,{type:'move',x:0,z:1});assert.equal(a.p.seated,false);
});

test('save and live reconnect retain a carried guard, and old saves add exactly two stable medics',()=>{
 for(const restore of ['restore','restoreLive']){
  const f=life(api),{sim,p,room}=f;room.waveAt=1e9;const m=room.actors.find(a=>a.role==='medic'),g=room.actors.find(a=>a.kind==='guard'&&!a.role);Object.assign(m,{x:0,z:-33});Object.assign(g,{x:0,z:-34});sim.killActor(g,null,room);assert.ok(sim.startRescue(m,g));
  let copy=api.Simulation[restore](structuredClone(sim.exportState({live:true})));const r=copy.rooms.get(room.id),q=r.actors.find(a=>a.id===g.id),c=r.actors.find(a=>a.id===m.id);assert.equal(c.rescueTarget,q.id);assert.equal(q.carrierId,c.id);step(copy,35);assert.ok(q.alive);assert.notEqual(q.lifeState,'carried');
  const old=structuredClone(sim.exportState({live:true}));old.rooms[0][1].actors=old.rooms[0][1].actors.filter(a=>a.role!=='medic');delete old.rooms[0][1].map.clinic;
  copy=api.Simulation[restore](old);copy=api.Simulation[restore](copy.exportState({live:true}));assert.equal(copy.rooms.get(room.id).actors.filter(a=>a.role==='medic').length,2);assert.equal(copy.eid,old.eid);assert.equal(copy.rng.getState(),old.rngState);
 }
});

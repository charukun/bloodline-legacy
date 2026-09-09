import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {runtime,life} from './skills/harness.mjs';
const api=runtime();
function setup(seed=13){const s=life(api,seed);s.room.actors=[];s.room.waveAt=1e9;s.m=-Math.sign(s.room.map.traversables.find(o=>o.id==='north:lower').x);return s;}
function move(s,dx,dz,until,fps=30,limit=12){for(let i=0;i<limit*fps;i++){s.sim.command(s.p.id,{type:'move',x:dx,z:dz});s.sim.tick(1/fps);if(until?.(s.p))return;}assert.fail('route did not reach its destination: '+JSON.stringify({x:s.p.x,z:s.p.z,y:s.p.supportHeight,action:s.p.action}));}
test('new terrain retains the old map RNG, homes, facilities and open main roads in both layouts',()=>{
 for(let seed=1;seed<=24;seed++){
  const old=api.makeVillage(seed,0),map=api.makeVillage(seed,1);
  assert.equal(JSON.stringify(old.houses),JSON.stringify(map.houses));assert.equal(JSON.stringify(old.schools),JSON.stringify(map.schools));
  for(const o of map.traversables.filter(o=>o.kind==='step')){
   assert(Math.abs(o.x)+o.width/2<35&&o.z+o.depth/2<23);
   assert(Math.abs(o.x)>o.width/2+2.35,'central road');
   for(const s of map.schools.filter(s=>s.id!=='dance'))assert(Math.abs(o.x-s.x)>=o.width/2+2.5||Math.abs(o.z-(s.z-2))>=o.depth/2+1.5,'building '+s.id+' / '+o.id);
  }
 }
});
test('two ledges climb and descend through movement input at 30/60/120Hz, including mirrored villages',()=>{
 for(const seed of [13,14])for(const fps of [30,60,120]){
  const s=setup(seed);Object.assign(s.p,{x:-10.5*s.m,z:-18.7,supportHeight:0});
  move(s,0,1,p=>p.supportHeight===1.2&&!p.traversal,fps);
  move(s,0,-1,p=>p.z<-18.6&&!p.traversal,fps);
  assert.equal(s.p.supportHeight,0);assert.equal(s.p.verticalOffset,0);assert.equal(s.p.grounded,true);
  assert.equal(s.sim.events.filter(e=>e.type==='traverse').length,4);
 }
});
test('walking stairs reach both high landings and return without vaulting for injured, young and carrying actors',()=>{
 for(const state of [{},{wounds:{leftLeg:{severity:'heavy'}}},{prologue:true,age:3},{rescueTarget:'friend'}]){
  const s=setup();Object.assign(s.p,state,{x:-4.2*s.m,z:-15.2,supportHeight:0});
  for(let i=0;i<200&&s.p.x*s.m>-11;i++)s.sim.moveWalk(s.p,s.room,-s.m*.05,0);
  assert(Math.abs(s.p.supportHeight-1.2)<1e-6);assert(s.p.x*s.m<=-11);assert(!s.p.traversal);
  for(let i=0;i<200&&s.p.x*s.m<-4.2;i++)s.sim.moveWalk(s.p,s.room,s.m*.05,0);
  assert.equal(s.p.supportHeight,0);assert(s.p.x*s.m>=-4.2);assert(!s.p.traversal);
 }
});
test('southern terrace has a walking exit and the stone wall uses a real vault',()=>{
 const s=setup();Object.assign(s.p,{x:-2.6*s.m,z:9.8,supportHeight:0});
 move(s,-s.m,0,p=>p.x*s.m<-6.4&&!p.traversal);assert(Math.abs(s.p.supportHeight-.9)<1e-8);
 move(s,s.m,0,p=>p.x*s.m>-2.7&&!p.traversal);assert.equal(s.p.supportHeight,0);
 Object.assign(s.p,{x:9*s.m,z:14.8,supportHeight:0});move(s,0,1,p=>p.z>16.9&&!p.traversal);assert(s.sim.events.some(e=>e.type==='traverse'&&e.kind==='vault'));
});
test('unavailable parkour and attack steps stop at ledges; high drops and hidden higher corridors are rejected',()=>{
 const s=setup();Object.assign(s.p,{x:-11.5*s.m,z:-14.2,supportHeight:1.2,wounds:{leftLeg:{severity:'heavy'}}});
 for(let i=0;i<80;i++)s.sim.moveAttackStep(s.p,s.room,0,.08,true);
 assert(s.p.z<=-14&&s.p.supportHeight===1.2);
 s.p.wounds={};s.room.map.traversables=[{id:'test:cliff',kind:'step',x:0,z:0,width:4,depth:4,height:2}];Object.assign(s.p,{x:0,z:1.4,supportHeight:2});
 assert.equal(s.sim.tryTraversal(s.p,s.room,0,1),false);
});
test('occupied or unsupported landings are rejected without moving the actor',()=>{
 const s=setup();Object.assign(s.p,{x:-10.5*s.m,z:-18.55,supportHeight:0});const before={x:s.p.x,z:s.p.z};
 s.room.actors.push(s.sim.actor('dummy',s.p.x,-17.43));assert.equal(s.sim.tryTraversal(s.p,s.room,0,1),false);assert.deepEqual({x:s.p.x,z:s.p.z},before);
 s.room.actors=[];const o=s.room.map.traversables.find(o=>o.id==='north:lower');o.depth=.5;assert.equal(s.sim.tryTraversal(s.p,s.room,0,1),false);
});
test('saved positions and downed lives move onto the new ground without losing their records',()=>{
 for(const mode of ['active','downed']){
  const s=setup();Object.assign(s.p,{x:-11.5*s.m,z:-15.2,supportHeight:0,lifeState:mode});const data=s.sim.exportState(),saved=JSON.stringify(data.legacies);
  data.rooms.find(([id])=>id===s.room.id)[1].map=api.makeVillage(s.room.seed,0);
  for(const restore of ['restore','restoreLive']){const sim=api.Simulation[restore](data),p=sim.players.get(s.p.id);assert.equal(p.lifeState,mode);assert.equal(p.x,s.p.x);assert.equal(p.z,s.p.z);assert.equal(p.supportHeight,1.2);assert.equal(JSON.stringify(sim.legacies),saved);}
 }
});
test('a traversal survives live restart and ordinary reload returns to a supported side',()=>{
 const s=setup();Object.assign(s.p,{x:-10.5*s.m,z:-18.55,supportHeight:0});assert(s.sim.tryTraversal(s.p,s.room,0,1));s.sim.tick(.1);const data=s.sim.exportState({live:true});
 const live=api.Simulation.restoreLive(data),p=live.players.get(s.p.id);assert(p.traversal);for(let i=0;i<25;i++)live.tick(1/30);assert.equal(p.supportHeight,.6);assert.equal(p.traversal,null);
 const offline=api.Simulation.restore(data),q=offline.players.get(s.p.id);assert.equal(q.traversal,null);assert.equal(q.supportHeight,0);assert.equal(q.z,-18.55);
});
test('combat can cross a flat upper landing, while attacks and rescue cannot reach through a tall wall',()=>{
 const s=setup();Object.assign(s.p,{x:-11.5*s.m,z:-15.2,supportHeight:1.2});const b={x:s.p.x+s.m*.5,z:s.p.z,supportHeight:1.2};assert(s.sim.clearPath(s.p,b,s.room));
 assert.equal(s.sim.clearPath(s.p,{x:s.p.x,z:-18.5,supportHeight:0},s.room),false);
});
test('online display follows the server terrain revision while old rules remain active',()=>{
 const ctx=vm.createContext({makeVillage:api.makeVillage});vm.runInContext(fs.readFileSync(new URL('../src/legacy/game.js',import.meta.url),'utf8')+'\nglobalThis.decorate=Game.prototype.decorate;',ctx);
 const g={online:true,mapCache:new Map()},s={room:{seed:13}};ctx.decorate.call(g,s);assert.equal(s.map.terrainRevision,0);assert(!s.map.traversables.some(o=>o.id==='north:upper'));
 const latest={room:{seed:13,terrainRevision:1}};ctx.decorate.call(g,latest);assert.equal(latest.map.terrainRevision,1);assert(latest.map.traversables.some(o=>o.id==='north:upper'));assert.notEqual(s.map,latest.map);
});

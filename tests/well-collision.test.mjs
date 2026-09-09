import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {compileCatalog} from '../tools/skill-catalog.mjs';
const ctx=vm.createContext({console,performance});
ctx.BL_SKILL_DEFINITIONS=compileCatalog(JSON.parse(fs.readFileSync(new URL('../src/skills/catalog-source.json',import.meta.url),'utf8')));
for(const f of ['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js'])
 vm.runInContext(fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8'),ctx);
const Simulation=vm.runInContext('Simulation',ctx);
function setup(seed=7349){const sim=new Simulation({seed,mode:'normal'}),p=sim.addPlayer('hero',{owner:'well-test',race:0});sim.releaseFromParent(p);p.age=14;const room=sim.getRoom(p),well=room.map.schools.find(s=>s.id==='dance');room.actors=[];return {sim,p,room,well};}
const distance=(p,w)=>Math.hypot(p.x-w.x,p.z-w.z);

test('swept movement cannot cross the well from any direction or village seed',()=>{
 for(const seed of [1,7349,20260909])for(let i=0;i<16;i++){
  const {sim,p,room,well}=setup(seed),a=i*Math.PI/8,x=Math.sin(a),z=Math.cos(a);
  p.x=well.x+x*2.4;p.z=well.z+z*2.4;
  const moved=sim.moveAttackStep(p,room,-x*5,-z*5);
  assert.ok(moved>.5&&moved<.73,'stops at stone/posts plus body radius');
  assert.ok(distance(p,well)>=1.3+sim.collisionRadius(p)-1e-6);
  assert.ok((p.x-well.x)*x+(p.z-well.z)*z>0,'cannot tunnel to opposite side');
  assert.ok(sim.moveAttackStep(p,room,x*.5,z*.5)>.49,'can back away');
 }
});
test('ordinary move and dash commands hit the well, and blocked dash ends',()=>{
 for(const type of ['move','dash']){
  const {sim,p,well}=setup();p.x=well.x;p.z=well.z+3;
  assert.equal(sim.command(p.id,{type,x:0,z:-1}),true);
  for(let i=0;i<36;i++){sim.tick(1/30);assert.ok(distance(p,well)>=1.72-1e-6);}
  assert.ok(p.z<well.z+2);assert.ok(p.z>=well.z+1.72-1e-6);
  if(type==='dash')assert.equal(p.dash,null);
 }
});
test('old save inside the well is recovered by normal simulation without changing skills',()=>{
 const {sim,p,well}=setup();p.x=well.x;p.z=well.z;
 const saved=sim.exportState(),restored=Simulation.restore(saved),rp=restored.players.get(p.id);
 const skills=JSON.stringify(rp.skills),inventory=JSON.stringify(rp.inventory);
 restored.tick(1/30);assert.ok(Number.isFinite(rp.x)&&Number.isFinite(rp.z));
 assert.ok(distance(rp,well)>=1.72-1e-6);assert.equal(JSON.stringify(rp.skills),skills);assert.equal(JSON.stringify(rp.inventory),inventory);
});
test('square perimeter and school interaction area remain accessible',()=>{
 const {sim,p,room,well}=setup();const radius=2.1;
 for(let i=0;i<=96;i++){
  const a=i*Math.PI/48,target={x:well.x+Math.sin(a)*radius,z:well.z+Math.cos(a)*radius};
  if(i===0)Object.assign(p,target);else sim.moveAttackStep(p,room,target.x-p.x,target.z-p.z);
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<1e-5);
 }
 assert.equal(sim.getArea(p),'dance');
});
test('knockback uses actor radius; front-room bounds do not gain a well',()=>{
 const {sim,p,room,well}=setup(),actor={kind:'stag',x:well.x,z:well.z+2.5,alive:true};
 sim.moveAttackStep(actor,room,0,-5);assert.ok(distance(actor,well)>=1.3+sim.collisionRadius(actor)-1e-6);
 const front={kind:'front',stage:1};p.x=0;p.z=well.z;sim.bound(p,front);assert.equal(p.z,9);
});

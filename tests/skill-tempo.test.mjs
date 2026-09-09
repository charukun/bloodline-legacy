import test from 'node:test';
import assert from 'node:assert/strict';
import {motionRuntime} from './skill-motion-harness.mjs';
import {tempoCombat} from './skill-tempo-harness.mjs';
const api=await motionRuntime(null,null,true),{SkillMotion,CM01,Travelers}=api;
const copy=x=>JSON.parse(JSON.stringify(x));
const attack=(id=4001)=>({...api.player(),attackSkill:id,currentSkill:id,action:'attack',actionStarted:1,actionUntil:2,combo:{total:1,awaitUntil:2.24}});

test('motion consumes only accepted cast bonuses; catalog compatibility alone never grants a link',()=>{
 const {sim,p}=tempoCombat(api,[60000,60001,60002]);let accepted;
 for(let i=0;i<240;i++){sim.tick(1/60);if(p.pendingSkill?.id===60001){accepted=copy(p);break;}}
 assert(accepted?.skillCast?.linked,'real contact produced no link');
 const before=JSON.stringify(accepted),t=accepted.pendingSkill.started+.10,c=SkillMotion.clock(accepted,t),q=SkillMotion.phrasing(accepted,c);
 assert.equal(c.sk.charge,api.skillById(60001).charge*.68);
 assert(q.linked);assert.equal(JSON.stringify(accepted),before);
 for(const patch of [{skillCast:null},{skillCast:{id:60002,linked:true,charge:0}},{skillCast:{id:60001,linked:false}}]){
  const unlinked={...accepted,...patch},u=SkillMotion.clock(unlinked,t);
  assert.equal(SkillMotion.phrasing(unlinked,u).linked,false);
  assert.equal(u.sk.charge,api.skillById(60001).charge);
 }
 const original=SkillMotion.phrasing({...accepted,skillCast:null},SkillMotion.clock({...accepted,skillCast:null},t));
 assert(q.chargeEnd<original.chargeEnd,'charge bonus has no visible phrasing');
 const finisher={...attack(60002),skillCast:{id:60002,linked:true,recovery:api.skillById(60002).recovery*.68}};
 const linked=SkillMotion.phrasing(finisher,SkillMotion.clock(finisher,1.6)),plain=SkillMotion.phrasing({...finisher,skillCast:null},SkillMotion.clock({...finisher,skillCast:null},1.6));
 assert(linked.settleAt<plain.settleAt&&linked.settle<plain.settle,'recovery bonus loses the carried follow-through');
});

test('baked cuts reach follow-through early and preserve contact for all four bodies and hitstop',()=>{
 for(let race=0;race<4;race++)for(const hz of [30,60,120]){
  const r=api.renderer(),c=new Travelers.Character(r,race),p={...attack(),race,gender:[0,1,0,1][race]};
  for(let i=0;i<hz*.43;i++){r.frame++;c.update(p,1+i/hz);}
  r.frame++;c.update(p,1.43);assert(Math.abs(c.clipDebug.u-c.clipDebug.contact)<1e-9);
  const at=copy(c.transforms[5]);
  r.frame++;c.update({...p,actionStarted:1.08,actionUntil:2.08,hitstopUntil:1.6},1.51);
  assert(c.transforms[5].every((v,i)=>Math.abs(v-at[i])<1e-6),'hitstop moved the blade');
  r.frame++;c.update(p,1.75);assert(c.clipDebug.u>=c.asset.clips.get('diagonal').follow,'follow-through still stretched across the whole action');
 }
});

test('actual skeletons cross clip/procedural boundaries and repeated clip casts without a hand or chest pop',()=>{
 for(const race of [-1,0,1,2,3])for(const [from,to,total]of [[60070,60051,4],[60070,60000,2],[60000,60051,2]]){
  const r=api.renderer(),c=race<0?new CM01.Character(r):new Travelers.Character(r,race),p={...attack(from),race:Math.max(0,race),gender:race<0?0:[0,1,0,1][race]};
  for(let i=0;i<=60;i++){r.frame++;c.update(p,1+i/60);}
  const before=copy(c.transforms),charge={...p,attackSkill:to,action:'charge',combo:{total},pendingSkill:{id:to,started:2,at:2.5},skillCast:{id:to,from,linked:true}};
  r.frame++;c.update(charge,2);
  for(const j of race<0?[1,3,11,16]:[1,2,5,8])assert(c.transforms[j].every((v,i)=>Math.abs(v-before[j][i])<.002),`${race}/${from}/${to}: displayed joint ${j} snapped`);
  for(let i=1;i<=60;i++){r.frame++;c.update(charge,2+i/120);assert(c.palette.every(Number.isFinite));}
  const ready=copy(c.transforms);r.frame++;c.update({...charge,pendingSkill:null,action:'attack',actionStarted:2.5,actionUntil:3.5},2.5);
  for(const j of race<0?[11,16]:[5,8])assert(c.transforms[j].every((v,i)=>Math.abs(v-ready[j][i])<.002),'entry blend delayed release');
 }
});

test('combo grace keeps the completed pose; an interrupted charge cannot reuse its old blend',()=>{
 const p=attack(),r=api.renderer(),c=new Travelers.Character(r,0);for(let i=0;i<=60;i++){r.frame++;c.update(p,1+i/60);}
 const hand=copy(c.transforms[5]);r.frame++;c.update(p,2.12);assert(c.transforms[5].every((v,i)=>Math.abs(v-hand[i])<(i===13?.002:1e-6)));
 const charge={...p,action:'charge',combo:{total:2},pendingSkill:{id:4001,started:2.12,at:2.5}};r.frame++;c.update(charge,2.15);assert(c.state.chargeFrom);
 r.frame++;c.update({...p,action:'idle',combo:null},2.18);assert.equal(c.state.chargeFrom,null);
});

test('rendering real linked and incompatible sequences preserves skills, hits, costs, RNG and saves',()=>{
 for(const ids of [[60050,60051,60052],[60000,60001,60002],[60010,60001,60002]]){
  const run=draw=>{const {sim,p}=tempoCombat(api,ids),r=api.renderer(),c=new Travelers.Character(r,0);let accepted=0,contacts=0,oldSeq=0;
   for(let i=0;i<420;i++){
    sim.tick(1/60);if(p.skillCast?.linked)accepted++;
    const hits=sim.events.filter(e=>e.seq>oldSeq&&e.type==='hit'&&e.source===p.id);contacts+=hits.length;oldSeq=sim.seq;
    if(draw){const state=JSON.stringify(sim.exportState()),events=JSON.stringify(sim.events);r.frame++;c.update(copy(p),sim.time);assert(c.palette.every(Number.isFinite));assert.equal(JSON.stringify(sim.exportState()),state);assert.equal(JSON.stringify(sim.events),events);}
   }
   assert(contacts>0);const links=sim.events.filter(e=>e.type==='skillconnection');if(ids[0]===60010)assert(!links.some(e=>e.from===60010&&e.id===60001));else assert(links.some(e=>e.from===ids[0]&&e.id===ids[1]),'the intended pair never actually connected');return {state:JSON.stringify(sim.exportState()),events:JSON.stringify(sim.events),accepted,contacts};};
  assert.deepEqual(run(true),run(false));
 }
});

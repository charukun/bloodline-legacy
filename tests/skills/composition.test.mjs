import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {runtime,life,definitions,read} from './harness.mjs';
import {SkillComposition} from '../../src/skills/composition.mjs';
import {catalogProgram,validateCatalog} from '../../tools/skill-catalog.mjs';
const api=runtime(),generated=definitions.filter(d=>d.composition),authored=definitions.filter(d=>!d.composition);
const recipe=(parts={})=>({version:1,form:'needle',cadence:'single',footwork:'plant',reaction:'bind',ending:'settle',...parts});
const definition=parts=>api.BL_SKILL_CATALOG.byId.get(SkillComposition.id(recipe(parts)));
function setup(parts={},distance=1.5){const x=life(api,134),d=definition(parts);x.room.actors=[];x.room.map.schools=[];x.room.map.houses=[];x.room.waveAt=1e9;
 Object.assign(x.p,{x:0,z:0,dir:0,stamina:100,staminaCap:100});const target=x.sim.actor('dummy',0,distance);x.room.actors.push(target);x.sim.learn(x.p,d.id);x.p.combo={band:d.phase,total:0,repeats:0};assert.equal(x.sim.beginComboStrike(x.p,d.id),true);return {...x,d,target};}
test('2304 deterministic techniques differ in combat structure, excluding colour, seed, power and cost',()=>{
 assert.equal(generated.length,2304);const structures=new Set(),ids=new Set();
 for(const d of generated){const {anim,targets,beatCuts,approach,finishStep,status,stagger,knockback,arc}=d.action;structures.add(JSON.stringify({anim,targets,beatCuts,approach,finishStep,status,stagger,knockback,arc}));ids.add(d.id);assert.equal(SkillComposition.id(d.composition),d.id);}
 assert.equal(structures.size,2304);assert.equal(ids.size,2304);validateCatalog(definitions);
 for(const locale of ['ja','en'])assert.equal(new Set(definitions.map(d=>d.names[locale])).size,definitions.length,'Each title identifies one technique in '+locale);
 for(const d of generated){assert.doesNotMatch(d.names.ja,/[序破急・〈〉]/);assert.match(d.names.en,/^[A-Z][A-Za-z ]+$/);}
 const reordered=SkillComposition.expand([...authored].reverse());assert.equal(JSON.stringify(reordered.sort((a,b)=>a.id-b.id)),JSON.stringify([...generated].sort((a,b)=>a.id-b.id)));
 const ctx=vm.createContext({});vm.runInContext(catalogProgram(JSON.parse(read('src/skills/catalog-source.json')))+';this.result=BL_SKILL_DEFINITIONS;',ctx);assert.equal(JSON.stringify(ctx.result),JSON.stringify(definitions));
 assert.throws(()=>SkillComposition.id({...recipe(),version:2}));assert.throws(()=>SkillComposition.id({...recipe(),form:'unknown'}));
});
test('authored IDs and action definitions remain unchanged by expansion',()=>{
 for(const d of authored)assert.equal(JSON.stringify(api.BL_SKILL_CATALOG.byId.get(d.id)),JSON.stringify(d));
});
test('shared motion clock reaches contact at each scheduled beat, including delayed returns and hitstop',()=>{
 const ctx=vm.createContext({console});vm.runInContext(read('src/legacy/dialogue.js')+'\n'+read('src/legacy/core.js')+'\n'+read('src/legacy/motion.js')+'\nthis.motion=SkillMotion;',ctx);
 for(const cadence of SkillComposition.tables.cadence){const {sim,p,d}=setup({cadence:cadence.key}),sk=api.skillById(d.id);sim.time=p.pendingSkill.at;sim.releaseSkill(p);
  for(let i=0;i<sk.hits;i++){const at=p.chain.start+p.chain.offsets[i],c=ctx.motion.clock(p,at,sk);assert.equal(c.index,i);assert.ok(Math.abs(c.beat-.43)<1e-8);}
  const before=p.chain.start;p.hitstopUntil=sim.time+.08;sim.tickHitStop(p,.03);assert.ok(p.chain.start>before);
  const at=p.chain.start+p.chain.offsets[0];assert.ok(Math.abs(ctx.motion.clock(p,at,sk).beat-.43)<1e-8);
 }
});
test('real simulation executes side steps and withdrawal, while misses do not create contact or connections',()=>{
 const positions=[];
 for(const parts of [{footwork:'plant',ending:'settle'},{footwork:'side',ending:'settle'},{footwork:'plant',ending:'withdraw'}]){
  const x=setup(parts,1.5);for(let i=0;i<800;i++)x.sim.tick(1/240);positions.push([x.p.x,x.p.z]);
 }
 assert.ok(positions[1][0]-positions[0][0]>.35,JSON.stringify(positions));assert.ok(positions[2][1]-positions[0][1]<-.4,JSON.stringify(positions));
 const x=setup({cadence:'triple'},8),seq=x.sim.seq;for(let i=0;i<1000;i++)x.sim.tick(1/240);
 assert.equal(x.sim.events.filter(e=>e.seq>seq&&['hit','skillconnection'].includes(e.type)).length,0);
});
test('composed definitions restore learned IDs, weights, witnesses and next inspiration without rerolling',()=>{
 const {sim,p}=life(api,181),d=definition({footwork:'drive'});sim.learn(p,d.id);p.phaseWeights[d.phase][d.id]=25;
 const saved=sim.exportState(),restored=api.Simulation.restore(structuredClone(saved)),q=restored.players.get(p.id);
 assert.ok(q.skills.includes(d.id));assert.equal(q.phaseWeights[d.phase][d.id],25);assert.equal(api.skillRestriction(q,api.skillById(d.id)),'');
 for(let i=0;i<180;i++)for(const [s,a]of [[sim,p],[restored,q]]){s.time+=5;api.SkillSystem.record(s,a,{kind:i%2?'care':'contact',context:i%2?'care':'contact',tags:i%2?['craft','care','patience']:['combat','rhythm','tension'],text:i%2?'手仕事':'実戦'});}
 assert.equal(JSON.stringify(p.skillLife),JSON.stringify(q.skillLife));assert.ok(p.skillLife.discovered.some(d=>d.id>=700000));
});
test('large approaches use real movement, respect restraint and smoothly face the target on a sidestep',()=>{
 const forward=setup({footwork:'drive',ending:'settle'},8);while(forward.p.pendingSkill)forward.sim.tick(1/120);assert.ok(forward.p.z>1.85&&forward.p.z<1.95);
 const rooted=setup({footwork:'drive'},8);rooted.p.statuses.root={until:100};for(let i=0;i<90;i++)rooted.sim.tick(1/120);assert.equal(rooted.p.z,0);
 const side=setup({footwork:'side',ending:'settle'},1.8);let dir=side.p.dir;while(side.p.pendingSkill){side.sim.tick(1/120);assert.ok(Math.abs(side.p.dir-dir)<.22,'turn must be distributed over the approach');dir=side.p.dir;}
 assert.ok(side.p.x>1.2);assert.ok(Math.abs(side.p.dir-Math.atan2(side.target.x-side.p.x,side.target.z-side.p.z))<.03);
 for(let i=0;i<130;i++)side.sim.tick(1/120);assert.ok(side.sim.events.some(e=>e.type==='hit'&&e.source===side.p.id));
 const close=setup({footwork:'drive'},1.5);while(close.p.pendingSkill)close.sim.tick(1/120);assert.ok(Math.hypot(close.p.x-close.target.x,close.p.z-close.target.z)>=close.sim.contactSpacing(close.p,close.target)-1e-6);
});
test('expanded pool preserves slow active pace and passive frequency across different lives',()=>{
 const events=[{kind:'observe',tags:['craft','weight','rhythm']},{kind:'contact',tags:['combat','rhythm','tension']},{kind:'rest',tags:['rest','patience']},{kind:'care',tags:['care','craft','patience']},{kind:'explore',tags:['explore','light','precision']},{kind:'pray',tags:['pray','rest','patience']}];
 const catalogs=[new api.BloodlineSkills.Catalog(authored),new api.BloodlineSkills.Catalog(definitions)],counts=[{active:0,passive:0},{active:0,passive:0}],sets=new Set();let worst=0;
 for(let seed=1;seed<=48;seed++)for(let c=0;c<2;c++){const s=api.BloodlineSkills.create(seed,'composition-life');
  for(let at=0;at<1200;at+=5){const e=events[at/5%events.length],start=performance.now();catalogs[c].observe(s,{...e,at,context:e.kind,text:e.kind},{age:18,weapon:-1});if(c)worst=Math.max(worst,performance.now()-start);}
  const active=s.discovered.filter(d=>!catalogs[c].byId.get(d.id).passive);counts[c].active+=active.length;counts[c].passive+=s.discovered.length-active.length;
  if(c){sets.add(active.map(d=>d.id).sort().join(','));assert.ok(active.some(d=>d.id>=700000));for(let i=1;i<active.length;i++)assert.ok(active[i].at-active[i-1].at>=Math.min(300,105+i*15));}
 }
 assert.ok(counts[1].active/counts[0].active>=.8&&counts[1].active/counts[0].active<=1.2,JSON.stringify(counts));
 assert.ok(counts[1].passive/counts[0].passive>=.9&&counts[1].passive/counts[0].passive<=1.1,JSON.stringify(counts));assert.ok(sets.size>=44);
 console.log('Composition cohorts',JSON.stringify({counts,distinctLives:sets.size,worstEventMs:+worst.toFixed(2)}));
});
test('new life inherits a family bias, never the generated technique itself; idle ticks do not query the catalog',()=>{
 const {sim,p}=life(api,36),d=definition();sim.learn(p,d.id);p.skillUses[d.id]=10;sim.die(p,'寿命');assert.ok(sim.command(p.id,{type:'choose-legacy',skill:d.id}));
 const child=sim.addPlayer('composition-child',{owner:p.owner,inherit:[d.id]});assert.ok(!child.skills.includes(d.id));const before=api.BL_SKILL_CATALOG.metrics.evaluated;for(let i=0;i<50;i++)sim.tick(1/30);assert.equal(api.BL_SKILL_CATALOG.metrics.evaluated,before);
});

test('evaded and guarded composed strikes do not attach a status, push, stagger or connection',()=>{
 for(const reaction of ['break','bind','drain','push'])for(const outcome of ['evade','guard']){
  const {sim,p,room,d}=setup({reaction}),e=sim.actor('soldier',0,1.3);room.actors=[e];e.dir=Math.PI;e.guard=outcome==='guard';e.stun=-1;
  sim.awareness=()=>({engaged:outcome==='evade',unaware:false});sim.rng=()=>0;
  p.skillCast={id:d.id,from:1,linked:true,target:e.id,announced:false};p.skillExit=null;
  const before={x:e.x,z:e.z,hp:e.hp,statuses:JSON.stringify(e.statuses),stun:e.stun},seq=sim.seq;
  sim.performStrike(p,room,api.skillById(d.id));
  assert.equal(e.hp,before.hp);assert.equal(e.x,before.x);assert.equal(e.z,before.z);assert.equal(e.stun,before.stun);assert.equal(JSON.stringify(e.statuses),before.statuses);
  assert.equal(p.skillExit,null);assert.ok(!sim.events.some(e=>e.seq>seq&&e.type==='skillconnection'));
  assert.ok(sim.events.some(e=>e.seq>seq&&e.type===(outcome==='evade'?'evaded':'blocked')));
 }
});

test('archived server and client replay the same composed combat from a portable save',async()=>{
 const {engines,currentRules}=await import('../../src/server/engines/registry.mjs');
 const {sim}=setup({form:'wheel',cadence:'delay',footwork:'side',reaction:'push',ending:'withdraw'});
 const saved=sim.exportState(),client=api.Simulation.restore(structuredClone(saved)),server=engines[currentRules].restore(structuredClone(saved));
 for(let i=0;i<180;i++){client.tick(1/60);server.tick(1/60);}
 assert.equal(JSON.stringify(server.exportState()),JSON.stringify(client.exportState()));
});

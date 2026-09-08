import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {runtime,definitions,root} from './harness.mjs';
const api=runtime().BloodlineSkills;
const plain=value=>JSON.parse(JSON.stringify(value));
const baseline=vm.createContext({Math});
vm.runInContext(execFileSync('git',['show','fad97fcc91f13f76adacb21c9257b6496396dfca:src/skills/engine.js'],{cwd:root,encoding:'utf8'})+';globalThis.API=BloodlineSkills;',baseline);
const before=baseline.API;
const actions={craft:{tags:['craft','weight','rhythm'],kind:'observe'},combat:{tags:['combat','rhythm','tension'],kind:'contact'},care:{tags:['care','craft','patience'],kind:'care'},study:{tags:['study','combat','patience'],kind:'study'},rest:{tags:['rest','patience'],kind:'rest'},explore:{tags:['explore','light','precision'],kind:'explore'},pray:{tags:['pray','rest','patience'],kind:'pray'}};
const plans={craft:['craft'],combat:['combat'],cross:['study','care'],mixed:['craft','combat','rest','care','explore','pray']};
const event=(at,plan)=>({...actions[plan[Math.floor(at/5)%plan.length]],at,context:plan[Math.floor(at/5)%plan.length],text:plan[Math.floor(at/5)%plan.length]});
function run(engine,seed,plan,seconds=240,defs=definitions){
 const catalog=new engine.Catalog(defs),state=engine.create(seed,'pace');
 for(let at=0;at<seconds;at+=5)catalog.observe(state,event(at,plan),{age:18,known:state.discovered.map(d=>d.id)});
 return {catalog,state,active:state.discovered.filter(d=>!catalog.byId.get(d.id).passive),passive:state.discovered.filter(d=>catalog.byId.get(d.id).passive)};
}
test('fixed input cohorts cut active discoveries to roughly one third while retaining passive pace and life variety',()=>{
 for(const plan of Object.values(plans)){
  const totals=[{active:0,passive:0,same:0,cross:0},{active:0,passive:0,same:0,cross:0}],sets=new Set();
  for(let seed=1;seed<=96;seed++)for(const [i,engine]of [before,api].entries()){
   const r=run(engine,seed,plan);totals[i].active+=r.active.length;totals[i].passive+=r.passive.length;
   totals[i].same+=r.active.filter((d,j)=>j>0&&d.family===r.active[j-1].family).length;totals[i].cross+=r.active.filter(d=>d.route==='cross').length;
   if(i===1)sets.add(r.active.map(d=>d.id).sort().join(','));
  }
  const [old,current]=totals;assert.ok(current.active/old.active>=.25&&current.active/old.active<=.4,JSON.stringify({plan,totals}));
  if(old.passive)assert.ok(current.passive/old.passive>=.9&&current.passive/old.passive<=1.1,'passive frequency must remain within 10% on identical inputs');
  else assert.equal(current.passive,0);
  assert.ok(current.same/current.active<old.same/old.active,'reduce successive techniques from one family');
  if(old.cross)assert.ok(current.cross/current.active>=old.cross/old.active,'crossed experiences remain prominent');
  assert.ok(sets.size>=20,'fewer techniques must not collapse life diversity');
 }
});
test('late-life intervals grow without imposing a hard skill count cap',()=>{
 const r=run(api,29,plans.mixed,3600),times=r.active.map(d=>d.at),gaps=times.slice(1).map((t,i)=>t-times[i]);
 assert.ok(times.length>10);assert.ok(gaps.slice(-3).reduce((a,b)=>a+b)>gaps.slice(0,3).reduce((a,b)=>a+b));
});
test('passive-only opportunities exactly retain the old cadence even when active learning is blocked',()=>{
 const defs=definitions.filter(d=>d.passive),old=run(before,45,plans.mixed,900,defs),c=new api.Catalog(defs),s=api.create(45,'pace');
 s.activeInspiration.lastDiscovery=10000;
 for(let at=0;at<900;at+=5)c.observe(s,event(at,plans.mixed),{age:18,known:s.discovered.map(d=>d.id)});
 assert.ok(old.passive.length>=3);assert.equal(JSON.stringify(s.discovered),JSON.stringify(old.state.discovered));assert.equal(s.activeInspiration.lastDiscovery,10000);
});
test('revision-2 saves retain records and experience, then resume independent pacing deterministically',()=>{
 const old=run(before,34,plans.mixed,120).state,s=api.restore(JSON.parse(JSON.stringify(old)),34,'pace');
 assert.deepEqual(plain(s.discovered),plain(old.discovered));assert.equal(JSON.stringify(s.experience),JSON.stringify(old.experience));assert.equal(s.lastDiscovery,old.lastDiscovery);assert.equal(s.lastOpportunity,old.lastDiscovery);
 assert.ok(s.activeInspiration.charge<=old.charge);const c=new api.Catalog(definitions);
 for(let at=120;at<185;at+=5)c.observe(s,event(at,plans.mixed),{age:18,known:s.discovered.map(d=>d.id)});
 const restored=api.restore(JSON.parse(JSON.stringify(s)),34,'pace'),c2=new api.Catalog(definitions),start=s.discovered.length;
 for(let at=185;at<785;at+=5)for(const [catalog,state]of [[c,s],[c2,restored]])catalog.observe(state,event(at,plans.mixed),{age:18,known:state.discovered.map(d=>d.id)});
 assert.ok(s.discovered.length>start);assert.deepEqual(plain(restored),plain(s));
 const child=api.create(34,'child');assert.equal(child.activeInspiration.charge,0);assert.equal(child.discovered.length,0);assert.notEqual(child.activeInspiration.rng,s.activeInspiration.rng);
});

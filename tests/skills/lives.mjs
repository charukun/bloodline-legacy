import fs from 'node:fs';import assert from 'node:assert/strict';import {runtime,life,step,activity,root,definitions} from './harness.mjs';
const api=runtime(),out={conditions:'Simulation at 30Hz; adult/location fixture; actual activity/pickup/weights/combat commands, no discovery grants. Same 240-second activity budget.',lives:[],diversity:[],matchups:[]};
function configure(sim,p,ids){for(let phase=0;phase<3;phase++)sim.command(p.id,{type:'weights',phase,weights:Object.fromEntries(ids.filter(id=>api.skillById(id).band===phase).map(id=>[id,100]))});}
function fight(saved,player,ids,kind='crawler') {
 const sim=api.Simulation.restore(structuredClone(saved)),p=sim.players.get(player),r=sim.getRoom(p);r.actors=[];r.waveAt=100000;
 const e=sim.actor(kind,0,-37);r.actors=[e];Object.assign(p,{x:0,z:-38,dir:0,autoFight:null,input:{x:0,z:0}});configure(sim,p,ids);
 const start=sim.time,events=[];let seq=sim.seq;
 for(let i=0;i<30*35&&p.alive&&e.alive;i++){sim.tick(1/30);events.push(...sim.events.filter(e=>e.seq>seq));seq=sim.seq;}
 return {ids,kind,elapsed:+(sim.time-start).toFixed(2),won:!e.alive,survived:p.alive,health:p.health,enemyHp:e.hp,connections:events.filter(e=>e.type==='skillconnection').length,used:[...new Set(events.filter(e=>e.type==='skill').map(e=>e.id))]};
}
const plans=[['稽古と学び',[["study",120],["care",120]],null],['足跡と遊び',[["track",100],["play",80],["pray",60]],'feather'],['家族の鈴と手仕事',[["observe",90],["care",60],["study",90]],'bell']];
for(let i=0;i<plans.length;i++){
 const [name,work,item]=plans[i],{sim,p}=life(api,30+i);if(item)sim.receiveItem(p,item,{gift:item==='bell'});
 for(const [activityId,seconds] of work)activity(sim,p,activityId,seconds);
 const acquired=p.skillLife.discovered.filter(d=>!api.skillById(d.id).passive).map(d=>d.id),byPhase=[0,1,2].map(b=>acquired.filter(id=>api.skillById(id).band===b));
 const latest=byPhase.map(ids=>ids.at(-1)).filter(Boolean);const saved=sim.exportState();
 const r={name,skills:p.skillLife.discovered.map(d=>({id:d.id,name:api.skillById(d.id).name,route:d.route,reasons:d.reasons})),latest:fight(saved,p.id,latest),alternatives:[]};
 for(const a of byPhase[0])for(const b of byPhase[1])for(const c of byPhase[2])r.alternatives.push(fight(saved,p.id,[a,b,c]));
 r.alternatives.sort((a,b)=>Number(b.won)-Number(a.won)||b.health-a.health||a.elapsed-b.elapsed);
 r.best=r.alternatives[0]||r.latest;assert.deepEqual(fight(saved,p.id,latest),r.latest,'Each matchup must start from the exact same independent save');
 assert.ok(r.skills.length>=3);assert.ok(r.skills.every(d=>d.reasons.length));
 out.lives.push({...r,alternatives:undefined});
 const world={format:'AERIN-portable-1',version:'0.6.0',profile:{owner:p.owner,name:p.name,mode:'normal',settingsVersion:5,uiExplained:true},world:saved};
 fs.mkdirSync(root+'/tests/skills/generated',{recursive:true});fs.writeFileSync(root+'/tests/skills/generated/life-'+i+'.json',JSON.stringify(world));
}
for(const mode of ['combat','craft','mixed']) {
 const sets=new Set(),counts=[],routes={main:0,cross:0,deviation:0};
 for(let seed=1;seed<=96;seed++) {
  const c=new api.BloodlineSkills.Catalog(definitions),s=api.BloodlineSkills.create(seed,'same-life');
  for(let j=0;j<48;j++) {
   const a=mode==='combat'||mode==='mixed'&&j%3===0?{tags:['combat','rhythm','tension'],kind:'contact'}:mode==='craft'||j%3===1?{tags:['craft','weight','rhythm'],kind:'observe'}:{tags:['explore','light','precision'],kind:'explore'};
   c.observe(s,{...a,at:j*5,text:a.kind,context:a.kind},{age:18,known:s.discovered.map(d=>d.id)});
  }
  sets.add(s.discovered.map(d=>d.id).sort((a,b)=>a-b).join(','));counts.push(s.discovered.length);for(const d of s.discovered)routes[d.route]++;
 }
 const result={mode,seeds:96,unique:sets.size,mean:counts.reduce((a,b)=>a+b)/counts.length,min:Math.min(...counts),max:Math.max(...counts),routes};out.diversity.push(result);assert.ok(sets.size>=10,JSON.stringify(result));
}
// The same learned pool, not a stronger skill granted to one comparison.
const x=life(api,115);x.sim.receiveItem(x.p,'stone');activity(x.sim,x.p,'observe',120);activity(x.sim,x.p,'study',120);activity(x.sim,x.p,'care',120);
const ds=x.p.skills.filter(id=>api.BL_SKILL_CATALOG.byId.has(id)),phases=[0,1,2].map(b=>ds.filter(id=>api.skillById(id).band===b));
for(const kind of ['crawler','soldier','elite']) {const results=[];for(const a of phases[0])for(const b of phases[1])for(const c of phases[2])results.push(fight(x.sim.exportState(),x.p.id,[a,b,c],kind));results.sort((a,b)=>Number(b.won)-Number(a.won)||b.health-a.health||a.elapsed-b.elapsed);out.matchups.push({kind,best:results[0],worst:results.at(-1),tested:results.length});}
fs.writeFileSync(root+'/docs/skills/life-results.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));

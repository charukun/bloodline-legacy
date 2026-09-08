import test from 'node:test';
import assert from 'node:assert/strict';
import {motionRuntime} from './skill-motion-harness.mjs';
const api=await motionRuntime();
const {artPose,SkillMotion,book,player,renderer,CM01,VillageArt}=api;
const active=[...book.values()].filter(s=>!s.passive&&api.skillById(s.id));
const attack=(id,start=1,duration=1)=>({...player(),attackSkill:id,currentSkill:id,action:'attack',actionStarted:start,actionUntil:start+duration});
const delta=(a,b)=>Math.max(...Object.keys(a).filter(k=>typeof a[k]==='number'&&typeof b[k]==='number').map(k=>Math.abs(a[k]-b[k])));

test('every retained skill has continuous charge/release, hit boundaries and finite poses',()=>{
 for(const sk of active){
  const p=attack(sk.id),charge={...p,action:'charge',autoFight:'dummy',pendingSkill:{id:sk.id,started:0,at:1}};
  assert(delta(artPose(charge,1),artPose(p,1))<1e-7,sk.name+' release');
  for(let hit=1;hit<(sk.hits||1);hit++){
   const t=1+hit/sk.hits;assert(delta(artPose(p,t-1e-7),artPose(p,t+1e-7))<.001,sk.name+' chained beat');
  }
  for(let i=0;i<=100;i++)assert(Object.values(artPose(p,1+i/100)).filter(v=>typeof v==='number').every(Number.isFinite),sk.name);
 }
});

test('retained basic attacks use fists/thrust/heavy/kick instead of the slash fallback',()=>{
 for(const [id,shape]of [[4000,'thrust'],[4004,'thrust'],[4003,'slam'],[4010,'kick'],[4101,'thrust'],[4320,'judgement'],[4330,'eclipse']])assert.equal(SkillMotion.shape(book.get(id)),shape);
 const small=artPose(attack(60000),1),large=artPose(attack(60002),1);
 assert(large.y<small.y,'finisher uses a deeper loaded stance');
 assert(delta(artPose(attack(60010),1.43),artPose(attack(60050),1.43))>.01,'same family retains authored weight differences');
});

test('contact keys survive render sampling rate and do not lag behind a .43 hit',()=>{
 for(const id of [4000,4001,60000,60010,60020,60102]){
  const p=attack(id),contact=1+.43/(book.get(id).hits||1),palettes=[];
  for(const hz of [30,60,120]){
   const r=renderer(),cm=new CM01.Character(r);
   for(let t=1;t<contact;t+=1/hz){r.frame++;cm.update(p,t);}
   r.frame++;cm.update(p,contact);palettes.push(cm.transforms[11]);
  }
  assert(palettes.every(m=>m.every((v,i)=>Math.abs(v-palettes[0][i])<.002)),`hand timing ${id}`);
 }
});

test('leap lands at contact and kick keeps the support foot on the ground',()=>{
 const p=attack(60072);assert(artPose(p,1.27).air);assert(!artPose(p,1.43).air);assert(artPose(p,1.43).y<0);
 for(const id of [60020,60072,60002,60102]){
  const r=renderer(),cm=new CM01.Character(r),p=attack(id);
  for(let i=0;i<=120;i++){
   const t=1+i/120;r.frame++;cm.update(p,t);
   for(const f of cm.footDebug){assert(f.error<.035,`${id}: reach ${f.error}`);if(!f.swing)assert(Math.abs(f.soleY-f.floor)<.035,`${id}: sole`);}
   if(id===60020&&i===52)assert(cm.footDebug.find(f=>f.side===-1).swing===false,'kick support stays planted at impact');
  }
 }
});

test('world foot anchors follow collision-clipped snapshots without moving a planted sole',()=>{
 const r=renderer(),cm=new CM01.Character(r);let last=[];
 for(let i=0;i<=100;i++){
  const t=i/60,charge=t<.5,p={...attack(60010,.5),x:Math.min(.16,Math.max(0,t-.38)*2),autoFight:'dummy'};
  if(charge)Object.assign(p,{action:'charge',pendingSkill:{id:60010,started:0,at:.5},attackStep:{moved:p.x}});
  r.frame++;cm.update(Object.freeze(p),t);
  for(let j=0;j<cm.footDebug.length;j++){const a=last[j],b=cm.footDebug[j];if(a&&!a.swing&&!b.swing)assert(Math.hypot(a.actual[0]-b.actual[0],a.actual[2]-b.actual[2])<.012,'planted foot skated');}
  last=structuredClone(cm.footDebug);
 }
});

test('legacy ages and races retain grounded finite attack legs',()=>{
 for(const age of [7,14,24,75])for(const race of [0,1,2,3])for(const id of [60002,60021,60031,60072]){
  const r=renderer(),art=new VillageArt(r),p={...attack(id),age,race};
  for(let i=0;i<=30;i++){
   r.parts=[];art.doll(p,1+i/30,false);assert(r.parts.every(q=>q.m.every(Number.isFinite)));
   const feet=art.skillFeet.get(p.id).debug;
   assert(feet.every(f=>f.error<.035),`${id}/${age}/${race}: ${feet.map(f=>f.error)}`);
  }
 }
});

test('rig equipment reaches the authored matrix without an extra state crossfade',()=>{
 const r=renderer(),rig=new api.RigRenderer(r),p=player(),from=api.rModel(0,1,0),to=api.rModel(.4,1.2,.5,1,1,1,.8);
 rig.begin(p,0);rig.capture('blade',from,'#ffffff',0,1);rig.end();
 r.frame++;rig.begin(attack(4001),1);rig.capture('blade',to,'#ffffff',0,1);rig.end();
 const palette=rig.records.get(p.id).palette;
 assert(to.every((v,i)=>Math.abs(palette[i]-v)<1e-6),'weapon would lag behind the hand and its trail');
});

test('legacy recovery and idle keep the last grounded soles instead of restoring floating rest legs',()=>{
 const r=renderer(),art=new VillageArt(r),p={...attack(60002),age:14};
 for(let i=0;i<=90;i++){
  const t=1+i/60;
  if(t>2)Object.assign(p,{action:t<2.3?'recover':'idle',actionStarted:2,actionUntil:2.3});
  r.parts=[];art.doll(p,t,false);
  for(const foot of art.skillFeet.get(p.id).debug)if(!foot.swing)assert(Math.abs(foot.soleY-foot.floor)<.035,'recovery sole left ground');
 }
});

test('a hitstop pauses an in-progress foot plant without modifying the attack clock',()=>{
 const p={...attack(60010),action:'charge',pendingSkill:{id:60010,started:0,at:1}},feet=[];
 for(const t of [0,.02,.04])SkillMotion.foot(p,artPose(p,t),t,1,feet);
 const before=JSON.stringify(feet[0].anchor);p.hitstopUntil=.2;
 for(const t of [.06,.08,.10])SkillMotion.foot(p,artPose(p,t),t,1,feet);
 assert.equal(JSON.stringify(feet[0].anchor),before);
 assert.equal(p.pendingSkill.at,1);
});

test('pose and foot sampling leave the actual simulation, events and serialization untouched',()=>{
 const sim=new api.Simulation({seed:7349}),p=sim.addPlayer('motion',{owner:'motion'});sim.releaseFromParent(p);p.age=24;p.gender=0;
 const dummy=sim.getRoom(p).actors.find(a=>a.kind==='dummy');p.x=dummy.x;p.z=dummy.z-1.1;
 const r=renderer(),cm=new CM01.Character(r);let hits=0;
 for(let i=0;i<180;i++){
  sim.tick(1/30);const before=JSON.stringify(sim.exportState()),events=JSON.stringify(sim.events);
  const snapshot=Object.freeze(JSON.parse(JSON.stringify(p)));r.frame++;artPose(snapshot,sim.time);cm.update(snapshot,sim.time);
  assert.equal(JSON.stringify(sim.exportState()),before);assert.equal(JSON.stringify(sim.events),events);
  hits+=sim.events.filter(e=>e.type==='hit'&&e.t===sim.time).length;
 }
 assert(hits>0,'real contact path exercised');
});

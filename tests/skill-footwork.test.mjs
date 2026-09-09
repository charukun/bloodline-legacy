import test from 'node:test';
import assert from 'node:assert/strict';
import {motionRuntime} from './skill-motion-harness.mjs';
import {tempoCombat} from './skill-tempo-harness.mjs';
const api=await motionRuntime(null,null,true);
const xyz=m=>Array.from(m.slice(12,15));
const delta=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test('real connected actions carry their plants across all four bodies and frame rates',t=>{
 for(let race=0;race<4;race++)for(const hz of [30,60,120]){
  const {sim,p}=tempoCombat(api,[60070,60121,60032],race),r=api.renderer(),c=new api.Travelers.Character(r,race);r.traversalMap=sim.getRoom(p).map;
  let old=null,maxError=0,maxSlip=0,steps=0,rootTravel=0,load=null;
  for(let i=0;i<hz*5;i++){
   sim.tick(1/hz);r.currentSnapshot=sim.snapshot(p.id);r.frame++;const before=JSON.stringify(p);c.update(p,sim.time);assert.equal(JSON.stringify(p),before);assert(c.palette.every(Number.isFinite));
   for(const f of c.footDebug){maxError=Math.max(maxError,f.error);const previous=old?.find(g=>g.side===f.side);if(!f.swing&&previous&&!previous.swing)maxSlip=Math.max(maxSlip,delta(f.actual,previous.actual));if(f.swing)steps++;}
   const clock=api.SkillMotion.clock(p,sim.time);if(clock?.sk.id===60070&&clock.stage==='charge')load=xyz(c.transforms[1]);
   if(load&&clock?.sk.id===60070&&clock.stage==='attack'&&clock.beat>.38&&clock.beat<.50)rootTravel=Math.max(rootTravel,delta(load,xyz(c.transforms[1])));
   old=structuredClone(c.footDebug);
  }
  assert.equal(sim.events.filter(e=>e.type==='skillconnection').length,2);assert(steps>10);assert(rootTravel>.20,'the torso still attacks from its loaded position');assert(maxError<.025,'leg cannot reach its target');assert(maxSlip<.006,'planted sole moves between frames');
  t.diagnostic(JSON.stringify({race,hz,rootTravel,maxError,maxSlip}));
 }
});

test('same sword clip chains alternate the leading foot without resetting planted feet',()=>{
 const r=api.renderer(),c=new api.Travelers.Character(r,0);let key='',leads=[],old=null,maxSlip=0;
 for(let i=0;i<api.review.sequence('golden').duration*120;i++){
  const {p,t}=api.review.sample(api.player(),'golden',i/120);r.frame++;c.update(p,t);const d=c.state.drive;
  if(d?.key&&d.key!==key){key=d.key;leads.push(d.lead);}
  for(const f of c.footDebug){const b=old?.find(g=>g.side===f.side);if(b&&!b.swing&&!f.swing)maxSlip=Math.max(maxSlip,delta(f.actual,b.actual));}old=structuredClone(c.footDebug);
 }
 assert.deepEqual(leads,[1,-1,1]);assert(maxSlip<.003);
});

test('the displayed pelvis respects existing body spacing and scenery bounds',()=>{
 for(const wall of [false,true]){
  const r=api.renderer(),c=new api.Travelers.Character(r,0),p={...api.player(),x:wall?12.99:0,z:-38,room:'front',action:'charge',combo:{total:1},attackSkill:4001,pendingSkill:{id:4001,started:0,at:.5}};
  const enemy={id:'target',kind:'dummy',alive:true,x:p.x,z:p.z+.82};
  r.currentSnapshot={room:{id:'front',kind:'front',stage:1},players:[p],actors:wall?[]:[enemy]};
  for(let i=0;i<=180;i++){
   const t=i/120;if(t>=.5){p.pendingSkill=null;p.action='attack';p.actionStarted=.5;p.actionUntil=1.5;}r.frame++;const snapshot=JSON.stringify(r.currentSnapshot);c.update(p,t);assert.equal(JSON.stringify(r.currentSnapshot),snapshot);
   const root=c.transforms[0];if(wall)assert(root[12]<=13.00001,'pelvis crossed the wall');else assert(Math.hypot(root[12]-enemy.x,root[14]-enemy.z)>=.81999,'pelvis enters the target collision hull');
   assert(c.footDebug.every(f=>f.error<.025),'blocking the body broke its foot contact');
  }
 }
});

test('hitstop freezes the entire stepping body; interruption and room change clear choreography',()=>{
 const r=api.renderer(),c=new api.Travelers.Character(r,0),p={...api.player(),room:'one',action:'charge',combo:{total:1},attackSkill:4001,pendingSkill:{id:4001,started:0,at:.5}};
 for(let i=0;i<=24;i++){r.frame++;c.update(p,i/60);}const at=c.transforms.map(x=>Array.from(x));
 for(let i=1;i<=6;i++){r.frame++;c.update({...p,hitstopUntil:1,pendingSkill:{id:4001,started:i/60,at:.5+i/60}},.4+i/60);}
 for(let j=0;j<at.length;j++)assert(c.transforms[j].every((v,i)=>Math.abs(v-at[j][i])<1e-5),'paused body or foot moved');
 r.frame++;c.update({...p,pendingSkill:null,action:'hit',hitReactUntil:1},.6);assert.equal(c.state.drive,null);
 r.frame++;c.update({...p,room:'two',pendingSkill:null,action:'idle',combo:null},.62);assert.equal(c.state.drive,null);assert.equal(c.state.room,'two');
});

test('multi-hit skills carry the body into each next beat without a root jump',()=>{
 for(const id of [4200,4204,4209]){
  const r=api.renderer(),c=new api.Travelers.Character(r,0),hits=api.skillById(id).hits,p={...api.player(),weapon:0,action:'attack',attackSkill:id,actionStarted:0,actionUntil:hits,combo:{total:2}};
  for(let beat=1;beat<hits;beat++){
   for(let i=0;i<120;i++){r.frame++;c.update(p,beat-1+i/120);}r.frame++;c.update(p,beat-1e-5);const before=xyz(c.transforms[1]);r.frame++;c.update(p,beat);assert(delta(before,xyz(c.transforms[1]))<.002,`${id}: body resets at beat ${beat}`);
  }
 }
});

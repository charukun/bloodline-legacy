import test from 'node:test';
import assert from 'node:assert/strict';
import {motionRuntime} from './skill-motion-harness.mjs';
const api=await motionRuntime(null,null,true),{Travelers,renderer,player,review}=api;
const pos=m=>Array.from(m.slice(12,15));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function trace(race,hz,blocked,visit){
 const r=renderer(),c=new Travelers.Character(r,race);c.groundAt=()=>0;
 for(let i=0;i<review.sequence('golden').duration*hz;i++){
  const t=i/hz,{p}=review.sample(player(),'golden',t);Object.assign(p,{race,gender:[0,1,0,1][race]});if(blocked)p.z=Math.min(p.z,.13);
  const before=JSON.stringify(p);r.frame++;c.update(Object.freeze(p),t);assert.equal(JSON.stringify(p),before);visit(c,p,t);
 }
}
test('all four traveler rigs actually consume three clips on the shared hit clock',()=>{
 for(let race=0;race<4;race++)for(let total=1;total<=3;total++){
  const r=renderer(),art=new api.VillageArt(r),p={...player(),race,gender:[0,1,0,1][race],combo:{total},action:'attack',attackSkill:4001,actionStarted:1,actionUntil:2};
  r.rigs=new api.RigRenderer(r);r.weaponTips=new Map();r.put=(type,m,color,surf,alpha)=>r.rigs.pending&&r.rigs.capture(type,m,color,surf,alpha);
  r.frame++;art.doll(p,1.43,true);const c=r.characterMaster;assert(c instanceof Travelers.Character);assert(r.weaponTips.get(p.id)?.every(Number.isFinite),'actual hand-attached blade supplies the effect path');assert.equal(c.clipDebug.name,['diagonal','horizontal','chop'][total-1]);assert(Math.abs(c.clipDebug.u-c.clipDebug.contact)<1e-6);assert.equal(c.asset.bind.length,race===3?17:16);
 }
});
test('four body proportions preserve arms, chest clearance and foot plants through chaining and blocked steps',t=>{
 for(let race=0;race<4;race++)for(const blocked of [false,true]){
  let prev=null,minClear=Infinity,maxError=0,maxSlip=0,maxWrist=0,samples=0;
  trace(race,120,blocked,(c,p,time)=>{
   assert(c.palette.every(Number.isFinite));maxError=Math.max(maxError,...c.footDebug.map(f=>f.error));
   for(let j=0;j<c.footDebug.length;j++){const f=c.footDebug[j],old=prev?.feet[j];if(!f.swing&&old&&!old.swing)maxSlip=Math.max(maxSlip,Math.hypot(f.actual[0]-old.actual[0],f.actual[2]-old.actual[2]));}
   if(c.clipDebug){samples++;const m=c.transforms[1],origin=pos(m),body=c.asset.body;
    for(const [a,e,h]of [[3,4,5],[6,7,8]]){
     for(const [i,j]of [[a,e],[e,h]])assert(Math.abs(distance(pos(c.transforms[i]),pos(c.transforms[j]))-distance(c.asset.bind[i],c.asset.bind[j]))<.002);
     for(let u=0;u<=1;u+=.125){const E=pos(c.transforms[e]),H=pos(c.transforms[h]),v=E.map((x,k)=>x*(1-u)+H[k]*u-origin[k]),local=[0,1,2].map(j=>v.reduce((sum,x,k)=>sum+x*m[j*4+k],0));minClear=Math.min(minClear,Math.hypot(local[0]/(.36*body[0]),(local[1]-.09*body[1])/(.35*body[1]),local[2]/(.29*body[2])));}
    }
   }
   const wrist=Array.from(c.transforms[5].slice(0,3));if(prev)maxWrist=Math.max(maxWrist,Math.acos(Math.min(1,Math.max(-1,wrist.reduce((s,v,k)=>s+v*prev.wrist[k],0)))));
   prev={feet:structuredClone(c.footDebug),wrist};
  });
  t.diagnostic(JSON.stringify({race,blocked,minClear,maxError,maxSlip,maxWrist,samples}));
  assert(samples>450);assert(minClear>1.02,'forearm enters shirt clearance');assert(maxError<.025,'foot unreachable');assert(maxSlip<.003,'planted foot slips');assert(maxWrist<.6,'wrist flips');
 }
});
test('unsupported skills clear old clips; guard, damage, loss and activity retain their pose routes',()=>{
 for(let race=0;race<4;race++)for(const change of [{weapon:3},{guard:true},{seated:true},{lifeState:'downed'},{traversal:{kind:'vault'}},{rescueTarget:'other'},{activity:{kind:'fish'}},{statuses:{poison:{until:100}}},{wounds:{rightArm:{severity:'lost'}}},{attackSkill:60002}]){
  const r=renderer(),c=new Travelers.Character(r,race),p={...player(),race,gender:[0,1,0,1][race],action:'attack',attackSkill:4001,actionStarted:1,actionUntil:2};r.frame++;c.update(p,1.1);assert(c.clipDebug);r.frame++;c.update({...p,...change},1.2);assert.equal(c.clipDebug,null);r.frame++;c.update({...p,...change,action:'recover',actionStarted:2,actionUntil:3},2.1);assert.equal(c.clipDebug,null);assert(c.palette.every(Number.isFinite));
 }
});

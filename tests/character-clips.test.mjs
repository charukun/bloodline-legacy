import test from 'node:test';
import assert from 'node:assert/strict';
import {motionRuntime} from './skill-motion-harness.mjs';
const api=await motionRuntime(),{CM01,renderer,player,review}=api;
const position=m=>Array.from(m.slice(12,15));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function trace(hz,visit,blocked=false){
 const r=renderer(),cm=new CM01.Character(r);cm.groundAt=()=>0;
 const base=player(),duration=review.sequence('golden').duration;
 for(let i=0;i<duration*hz;i++){
  const t=i/hz,{p}=review.sample(base,'golden',t);
  if(blocked&&t>=1.05)p.z=Math.min(p.z,.13);
  r.frame++;cm.update(Object.freeze(p),t);visit(cm,p,t);
 }
}
test('baked motion preserves limb lengths and keeps forearms outside the moving chest through chains',()=>{
 let samples=0;
 trace(120,(cm,p,t)=>{
  assert(cm.palette.every(Number.isFinite));
  if(!cm.clipDebug)return;samples++;
  const chest=cm.transforms[3],origin=position(chest);
  for(const [a,e,h] of [[9,10,11],[14,15,16]]){
   for(const [i,j]of [[a,e],[e,h]])assert(Math.abs(distance(position(cm.transforms[i]),position(cm.transforms[j]))-distance(CM01.asset.bind[i],CM01.asset.bind[j]))<.004,`arm stretch ${t}`);
   for(let u=0;u<=1;u+=.125){
    const elbow=position(cm.transforms[e]),hand=position(cm.transforms[h]),relative=elbow.map((v,k)=>v*(1-u)+hand[k]*u-origin[k]);
    // Torso proxy includes jacket + forearm thickness, in the moving chest basis.
    const local=[0,1,2].map(j=>relative.reduce((sum,v,k)=>sum+v*chest[j*4+k],0)/Math.hypot(...chest.slice(j*4,j*4+3)));
    assert(Math.hypot(local[0]/.385,(local[1]+.19)/.37,local[2]/.285)>1.04,`chest intersection ${t}`);
   }
  }
 });
 assert(samples>600,'whole approach/charge/cuts/recovery sampled');
});
test('flat-ground plants remain fixed across clip changes and collision-shortened lunges',()=>{
 for(const blocked of [false,true]){let previous=null,count=0;
  trace(120,cm=>{
   for(let j=0;j<cm.footDebug.length;j++){
    const f=cm.footDebug[j],old=previous?.[j];assert(f.error<.025,'unreachable sole');
    if(!f.swing){assert(Math.abs(f.soleY-f.floor)<.002);if(old&&!old.swing){assert(Math.hypot(f.actual[0]-old.actual[0],f.actual[2]-old.actual[2])<.002,'planted sole jumped');count++;}}
   }
   previous=structuredClone(cm.footDebug);
  },blocked);
  assert(count>200);
 }
});
test('three cuts reach their authored contacts on the existing simulation hit clock',()=>{
 for(const total of [1,2,3])for(const hz of [30,60,120]){
  const r=renderer(),cm=new CM01.Character(r);cm.groundAt=()=>0;
  const p={...player(),combo:{total},action:'attack',attackSkill:4001,currentSkill:4001,actionStarted:1,actionUntil:2};
  for(let t=1;t<1.43;t+=1/hz){r.frame++;cm.update(p,t);}
  r.frame++;cm.update(p,1.43);
  assert.equal(cm.clipDebug.name,['diagonal','horizontal','chop'][total-1]);
  assert(Math.abs(cm.clipDebug.u-cm.clipDebug.contact)<1e-6);
 }
 // Sampling around impact must keep the time warp fast and differentiable.
 const r=renderer(),cm=new CM01.Character(r),p={...player(),action:'attack',attackSkill:4001,actionStarted:1,actionUntil:2};
 const values=[];for(const t of [1.42999,1.43,1.43001]){r.frame++;cm.update(p,t);values.push(cm.clipDebug.u);}
 const [before,at,after]=values;assert((at-before)/.00001>.8);assert(Math.abs((at-before)-(after-at))<1e-8);
});
test('guard, activities, injury, other weapons and non-slash skills retain the existing pose route',()=>{
 for(const extra of [{lifeState:'downed'},{traversal:{kind:'vault'}},{rescueTarget:'casualty'},{guard:true},{seated:true},{activity:{kind:'fish'}},{weapon:3},{statuses:{poison:{until:100}}},{wounds:{rightArm:{severity:'lost'}}},{action:'attack',attackSkill:60002,actionStarted:1,actionUntil:2}]){
  const r=renderer(),cm=new CM01.Character(r);r.frame++;cm.update({...player(),...extra},1.2);assert.equal(cm.clipDebug,null,JSON.stringify(extra));assert(cm.palette.every(Number.isFinite));
 }
 assert.equal(CM01.eligible({...player(),age:14},true),false);assert.equal(CM01.eligible({...player(),race:2},true),false);
});
test('review travel uses the actual skill distance and includes approach',()=>{
 const seq=review.sequence('golden');
 assert.equal(seq.segments[0].distance,api.skillById(4001).travel);
 const s=seq.segments[0],{p}=review.sample(player(),'golden',s.release+.001);
 assert.equal(p.z,s.distance);assert.equal(review.sample(player(),'golden',.35).p.action,'run');
});

test('wrist orientation stays continuous when the retargeted elbow passes through extension',()=>{
 let previous=null;
 trace(240,(cm,p,t)=>{
  const m=cm.transforms[11],direction=[m[0],m[1],m[2]],length=Math.hypot(...direction),normal=direction.map(v=>v/length);
  if(previous){const angle=Math.acos(Math.max(-1,Math.min(1,normal.reduce((sum,v,i)=>sum+v*previous[i],0))));assert(angle<.35,`wrist spun ${angle} rad at ${t}`);}
  previous=normal;
 });
});
test('a non-clip skill clears the preceding cut before its recovery',()=>{
 const r=renderer(),cm=new CM01.Character(r),p={...player(),action:'attack',attackSkill:4001,actionStarted:1,actionUntil:2};
 r.frame++;cm.update(p,1.2);assert(cm.clipDebug);
 p.attackSkill=60002;r.frame++;cm.update(p,1.3);assert.equal(cm.clipDebug,null);
 Object.assign(p,{action:'recover',actionStarted:2,actionUntil:3});r.frame++;cm.update(p,2.01);assert.equal(cm.clipDebug,null);
});

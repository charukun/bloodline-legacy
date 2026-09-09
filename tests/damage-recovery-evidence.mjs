/* Exact runtime palettes for a moving silhouette review; neutral offline shade. */
import fs from 'node:fs';
import {motionRuntime} from './skill-motion-harness.mjs';
const out=process.argv[2]||'verification/damage-recovery';fs.mkdirSync(out,{recursive:true});
const all=[];
for(const revision of ['b0174532818b078a9bc59dec83c11b9e06b00bad',null]){
 const api=await motionRuntime(revision),cases=[];
 for(const name of ['side impact','attack interrupted','opposite rehit','guard']){
  const r=api.renderer(),cm=new api.CM01.Character(r),frames=[];let p={...api.player(),x:0,z:0};
  if(name==='attack interrupted')Object.assign(p,{action:'attack',attackSkill:60010,actionStarted:.4,actionUntil:1.6});
  for(let i=0;i<120;i++){
   const t=.5+i/60;
   if(i===30||name==='opposite rehit'&&i===45){const blocked=name==='guard';Object.assign(p,{action:blocked?'guard':'hit',guard:blocked,hitGuard:blocked,actionStarted:t,actionUntil:t+.85,hitReactAt:t-.085,hitReactUntil:t+(blocked?.28:.72),hitMotionId:i,hitDir:i===45?-Math.PI/2:Math.PI/2,hitStrength:blocked?.32:1,hitSeverity:'heavy',hitPart:blocked?'leftArm':'torso'});}
   r.frame++;cm.update(p,t);if(i%2===0)frames.push({t,palette:Array.from(cm.palette)});
  }
  cases.push({name,frames});
 }
 const a=api.CM01.asset.lods[0];all.push({version:revision?'before':'after',cases,attrs:Object.fromEntries(Object.entries(a.attrs).map(([k,v])=>[k,Array.from(v)])),indices:Array.from(a.indices)});
}
fs.writeFileSync(out+'/poses.json',JSON.stringify(all));

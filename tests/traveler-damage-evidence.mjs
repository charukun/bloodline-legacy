/* Runtime geometry/palettes under neutral offline shading; not browser QA. */
import fs from 'node:fs';
import {travelerRuntime,BASE} from './traveler-damage-harness.mjs';
const out=process.argv[2]||'verification/traveler-damage';fs.mkdirSync(out,{recursive:true});const all=[];
for(const revision of [BASE,null]){
 const api=travelerRuntime(revision),cases=[];
 for(let race=0;race<4;race++){
  const {sim,p,source}=api.fixture(race),r=api.renderer(),cm=new api.Travelers.Character(r,race),frames=[],part=['torso','head','leftLeg','rightArm'][race];
  source.x=race%2?-1:0;source.z=race%2?4:5.2;
  for(let i=0;i<120;i++){
   if(i===6)Object.assign(p,{action:'attack',actionStarted:sim.time,actionUntil:sim.time+.65,attackSkill:4001});
   if(i===20)sim.inflictWound(p,part,'light',source,1);
   if(i===44&&race===3){source.x=p.x+1;source.z=p.z;sim.reactToHit(p,source,'leftArm','light',.32,true);sim.impact(source,p,'leftArm',false);}
   sim.tick(1/60);r.frame++;cm.update(structuredClone(p),sim.time);
   if(i%2===0)frames.push({t:sim.time,palette:Array.from(cm.palette),feet:structuredClone(cm.footDebug),x:p.x,z:p.z});
  }
  const a=cm.asset.lods[1];cases.push({name:['Human / torso, interrupted attack','Elf / side hit to head','Dwarf / knee and balance','Fox / opposite guard contact'][race],frames,attrs:Object.fromEntries(['POSITION','NORMAL','COLOR_0','JOINTS_0','WEIGHTS_0','_REGION'].map(k=>[k,Array.from(a.attrs[k])])),indices:Array.from(a.indices)});
 }
 all.push({version:revision?'BEFORE':'AFTER',cases});
}
fs.writeFileSync(out+'/poses.json',JSON.stringify(all));

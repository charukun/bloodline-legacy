/* Actual game geometry/material/shader export. Offline EGL diagnostic, not Browser QA. */
import path from 'node:path';
import {loadScene,writeScene,repository} from './export_scene.mjs';
const out=process.argv[2]||'verification/current/combat-life';
for(const kind of ['goblin','crawler','maw','mushroom','wraith','boss']){
 const actorCases=[0,1,2,3].map((level,i)=>({kind,x:(i-1.5)*3.6,z:15,dir:.12,action:'idle',seals:4-level,
  wounds:level?{torso:{severity:level>1?'heavy':'light'},head:{severity:level>1?'heavy':'light'},...(level===3?{rightArm:{severity:'lost'}}:{})}:{},
  damageMarks:level?{torso:{hits:level,depth:level>1?3:.4},head:{hits:level,depth:level>1?3:.4},...(level===3?{rightArm:{hits:3,depth:5}}:{})}:{}}));
 const scene=await loadScene(repository,{width:1200,height:700,x:0,z:15,zoom:17,yaw:.12,pitch:.72,time:10,actorCases,weather:'rain',isolatedMaterials:true});
 await writeScene(scene,path.join(out,kind));console.log(kind);
}

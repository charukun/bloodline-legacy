// Captures actual CM01 pose palettes/equipment for OFFLINE review, not browser evidence.
import fs from 'node:fs';
import {motionRuntime} from '../tests/skill-motion-harness.mjs';
const [out,revision='',assetPath='',key='golden']=process.argv.slice(2);
if(!out)throw Error('Usage: node tools/capture-character-motion.mjs OUTPUT.json [REV] [GLB] [CLIP]');
const api=await motionRuntime(revision||null,assetPath||null),r=api.renderer(),art=new api.VillageArt(r);
r.rigs=new api.RigRenderer(r);r.weaponTips=new Map();
r.put=(type,m,c,surf,alpha)=>r.rigs.pending&&r.rigs.capture(type,m,c,surf,alpha);
const frames=[],geometry={},base=api.player(),seq=api.review.sequence(key),hz=60;
for(let i=0;i<=Math.ceil(seq.duration*hz);i++){
 const sample=api.review.sample(base,key,Math.min(seq.duration-1e-5,i/hz));
 const p=sample.p;r.frame++;r.currentTime=sample.t;r.rigs.active.length=0;
 art.doll(p,sample.t,true);const cm=r.characterMaster,rec=r.rigs.records.get(p.id);
 const parts=rec.parts.map((part,j)=>{if(!geometry[part.type]){const g=api.rGeometry(part.type);geometry[part.type]={positions:Array.from(g.positions),normals:Array.from(g.normals)};}return {type:part.type,m:Array.from(rec.palette.slice(j*24,j*24+16)),c:part.c};});
 frames.push({t:sample.t,label:sample.label,p:{x:p.x,z:p.z,action:p.action},palette:Array.from(cm.palette),transforms:cm.transforms.map(m=>Array.from(m)),parts,clip:cm.clipDebug,feet:cm.footDebug});
}
fs.writeFileSync(out,JSON.stringify({hz,key,duration:seq.duration,revision:revision||'working-tree',assetPath:assetPath||'public/assets/character/young-human-male-cm01.glb',geometry,frames}));
console.log(JSON.stringify({out,frames:frames.length,duration:seq.duration}));

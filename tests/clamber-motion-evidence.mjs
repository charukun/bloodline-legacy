// Native diagnostic from real Simulation and Traveler palettes, not browser evidence.
import fs from 'node:fs';
import {motionRuntime} from './skill-motion-harness.mjs';
const out=process.argv[2]||'verification/current/clamber';fs.mkdirSync(out,{recursive:true});
const api=await motionRuntime(null,null,true),metrics=[];
for(const scenario of ['clamber','vault','ledge']){
 const sim=new api.Simulation({seed:13}),p=sim.addPlayer(scenario,{owner:scenario}),room=sim.getRoom(p);room.actors=[];room.waveAt=1e9;
 Object.assign(p,{prologue:false,age:24,gender:0,introUntil:-100,releaseAt:-100,farewellStage:3,stun:0,cooldown:0,weapon:-1,x:12,z:-27.2,supportHeight:0});
 let o=room.map.traversables.find(o=>o.id==='fence:12');if(scenario==='vault')sim.learn(p,60905);
 if(scenario==='ledge'){o=room.map.traversables.find(o=>o.id==='north:lower');p.x=o.x;p.z=-18.55;}
 const origin={x:p.x,z:p.z};room.map.traversables=room.map.traversables.map(o=>({...o,x:o.x-origin.x,z:o.z-origin.z}));room.map.houses=[];room.map.schools=[];p.x=0;p.z=0;o=room.map.traversables.find(x=>x.id===o.id);
 // Keep the same relative village geometry in the exported close-up.
 const r=api.renderer(),c=new api.Travelers.Character(r,0),art=new api.ArtDirector(r);r.traversalMap=room.map;
 const geometry={},frames=[];let started=false;
 for(let i=0;i<150;i++){
  if(i===12){started=sim.tryTraversal(p,room,0,scenario==='ledge'?1:-1);if(!started)throw Error('no traversal');}
  sim.tick(1/60);r.frame++;r.parts=[];c.update(p,sim.time);art.terrainLedge(o);
  const parts=r.parts.map(x=>({...x,c:api.rColor(x.c)}));for(const {type} of parts)if(!geometry[type]){const g=api.rGeometry(type);geometry[type]={positions:Array.from(g.positions),normals:Array.from(g.normals)};}
  frames.push({t:sim.time,p:JSON.parse(JSON.stringify(p)),palette:Array.from(c.palette),parts,hand:c.traversalHandDebug});
 }
 const asset=c.restAsset.lods[0];fs.writeFileSync(out+'/'+scenario+'.json',JSON.stringify({hz:60,asset:{attrs:Object.fromEntries(Object.entries(asset.attrs).map(([k,a])=>[k,Array.from(a)])),indices:Array.from(asset.indices)},geometry,frames}));
 metrics.push({scenario,started,contacts:frames.flatMap(f=>f.hand||[]).filter(h=>h.amount>.95).length,maxHandError:Math.max(0,...frames.flatMap(f=>f.hand||[]).filter(h=>h.amount>.95).map(h=>Math.hypot(...h.target.map((v,i)=>v-h.actual[i]))))});
}
fs.writeFileSync(out+'/metrics.json',JSON.stringify(metrics,null,2)+'\n');console.log(metrics);

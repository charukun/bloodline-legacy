/* CPU only: actual simulation, collision and traveler bone palette, no GPU. */
import {travelerRuntime,BASE} from './traveler-damage-harness.mjs';
const result={base:BASE,node:process.version,characters:33,composition:'1 traveler + 32 nearby approaching actors',warmupFrames:60,sampleFrames:180,runs:3,limitations:'Node CPU; not device FPS, GPU or multiplayer latency.'};
for(const revision of [BASE,null]){
 const api=travelerRuntime(revision),runs=[];
 for(let run=0;run<3;run++){
  const {sim,p}=api.fixture(),room=sim.makeRoom('front');p.room=room.id;p.x=0;p.z=-10;room.actors=Array.from({length:32},(_,i)=>{const a=sim.actor(i%3===0?'guard':'soldier',Math.sin(i*2.4)*(3+i*.1),-10+Math.cos(i*2.4)*(3+i*.1));a.cooldown=1e9;return a;});room.waveAt=1e9;
  const r=api.renderer(),cm=new api.Travelers.Character(r,0),samples=[],simulation=[],pose=[];
  for(let i=0;i<240;i++){
   if(i%45===0)sim.reactToHit(p,{x:p.x+1,z:p.z},'torso','heavy',1);
   // Reset only spatial setup each second, outside measured work, keeping a
   // comparable density of active approach checks in both implementations.
   if(i%60===0)room.actors.forEach((a,j)=>{a.x=Math.sin(j*2.4)*(3+j*.1);a.z=-10+Math.cos(j*2.4)*(3+j*.1);});
   const start=performance.now();sim.tick(1/60);const mid=performance.now();r.frame++;cm.update(p,sim.time);const end=performance.now();
   if(i>=60){samples.push(end-start);simulation.push(mid-start);pose.push(end-mid);}
  }
  const stats=a=>{a.sort((a,b)=>a-b);return{p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)]};};runs.push({total:stats(samples),simulation:stats(simulation),pose:stats(pose)});
 }
 result[revision?'before':'after']=runs;
}
console.log(JSON.stringify(result,null,2));

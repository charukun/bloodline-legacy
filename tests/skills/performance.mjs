import fs from 'node:fs';import assert from 'node:assert/strict';import {runtime,life,definitions,root} from './harness.mjs';
const api=runtime(),results={runtime:process.version,platform:process.platform,kind:'CPU simulation and candidate processing only; no render or device FPS claim'};
const percentile=(xs,p)=>[...xs].sort((a,b)=>a-b)[Math.min(xs.length-1,Math.floor(xs.length*p))];
for(const baseline of [true,false]) {
 const a=runtime(baseline),times=[];
 for(let run=0;run<4;run++) {const {sim,p,room}=life(a,91);room.actors=[];room.waveAt=1e9;p.lifespan=10000;
  for(let i=0;i<900;i++)sim.tick(1/30);
  for(let i=0;i<1800;i++){const t=performance.now();sim.tick(1/30);if(run>0)times.push(performance.now()-t);}
 }
 results[baseline?'baseTick':'skillTick']={samples:times.length,median:percentile(times,.5),p95:percentile(times,.95),p99:percentile(times,.99),max:Math.max(...times)};
}
const synthetic=Array.from({length:10000},(_,i)=>({...definitions[i%definitions.length],id:100000+i,key:'scale.'+i,family:'scale.'+Math.floor(i/3)}));
const before=performance.now(),c=new api.BloodlineSkills.Catalog(synthetic);results.indexMs=performance.now()-before;
const s=api.BloodlineSkills.create(91,'large'),times=[];s.experience={craft:5,combat:4,weight:4};s.journal=[{at:0,kind:'observe',tags:['craft','weight'],text:'鍛冶',context:'forge'},{at:5,kind:'contact',tags:['combat'],text:'稽古',context:'dummy'}];
for(let i=0;i<120;i++){const t=performance.now();c.pool(s,{tags:['craft']},{known:[],age:18});times.push(performance.now()-t);}
results.tenThousandCandidates={samples:times.length,median:percentile(times,.5),p95:percentile(times,.95),p99:percentile(times,.99),max:Math.max(...times)};
assert.ok(results.skillTick.p95<2,'Skill-only idle tick CPU regression');
fs.writeFileSync(root+'/docs/skills/performance-results.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));

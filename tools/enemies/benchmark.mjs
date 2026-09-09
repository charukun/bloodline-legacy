// Node CPU-only pose cost. This is not game FPS or a mobile browser result.
import fs from 'node:fs/promises';
import {harness,actor} from '../../tests/enemies/harness.mjs';
const {api}=harness(),q=(v,p)=>[...v].sort((a,b)=>a-b)[Math.floor((v.length-1)*p)];
const results=[];
for(const count of [2,8,24]){
 const states=Array.from({length:count},()=>({})),actors=states.map((_,i)=>({...actor(i%2?'elite':'soldier'),id:'bench-'+i,action:'run'})),times=[];
 for(let frame=0;frame<900;frame++){const start=performance.now();for(let i=0;i<count;i++){actors[i].x=frame/60*1.2;api.pose(actors[i],frame/60,states[i]);}if(frame>=300)times.push(performance.now()-start);}
 results.push({actors:count,frames:times.length,p50Ms:q(times,.5),p95Ms:q(times,.95),p99Ms:q(times,.99),maxMs:Math.max(...times),rawMs:times});
}
const output=process.argv[2]||'docs/enemies/evidence/pose-cpu.json';await fs.writeFile(output,JSON.stringify({runtime:process.version,scope:'Node pose sampling only, no equipment/GPU/game/browser',results},null,2)+'\n');console.log(results.map(({rawMs,...r})=>r));

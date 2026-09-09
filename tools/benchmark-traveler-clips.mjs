// CPU pose sampling only. WebGL calls are stubbed; results are NOT device FPS.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {motionRuntime} from '../tests/skill-motion-harness.mjs';
const [base,output]=process.argv.slice(2);
if(!/^[0-9a-f]{40}$/.test(base||'')||!output)throw Error('Usage: node tools/benchmark-traveler-clips.mjs BASE_SHA OUTPUT.json');
const result={kind:'Node VM CPU pose only, GL calls stubbed; not device FPS',node:process.version,baseline:base,results:[]};
for(const [label,revision]of [['before',base],['after',null]]){
 const a=await motionRuntime(revision,null,true);
 if(revision)await a.CM01.load(execFileSync('git',['show',revision+':public/assets/character/young-human-male-cm01.glb'],{maxBuffer:16*1024*1024}).toString('base64'));
 const duration=a.review.sequence('golden').duration,values=[];
 for(let round=0;round<4;round++){
  const r=a.renderer(),cm=new a.Travelers.Character(r);cm.groundAt=()=>0;
  for(let i=0;i<duration*60;i++){const {p,t}=a.review.sample(a.player(),'golden',i/60);r.frame++;cm.update(p,t);if(round>0)values.push(cm.metrics.solveMs);}
 }
 values.sort((a,b)=>a-b);result.results.push({label,samples:values.length,medianMs:values[Math.floor(values.length*.5)],p95Ms:values[Math.floor(values.length*.95)]});
}
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(result);

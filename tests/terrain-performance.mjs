// Bounded CPU diagnostic for the shared movement path, not game/device FPS.
import fs from 'node:fs';import vm from 'node:vm';import {execFileSync} from 'node:child_process';
import {definitions} from './skills/harness.mjs';
const base=process.argv[2]||'8c5a03e0bee563452d21f9ce9c5571271f017b58',out=process.argv[3];
const report={base,method:'one adult on the unchanged central road; 300 warm-up and 1000 moveWalk calls per run; 3 alternating runs; Node CPU only',runs:[]};
for(let run=0;run<3;run++)for(const variant of ['before','after']){
 const read=f=>variant==='before'?execFileSync('git',['show',base+':src/'+f],{encoding:'utf8'}):fs.readFileSync('src/'+f,'utf8');
 const c=vm.createContext({console,performance,structuredClone});vm.runInContext('const BL_SKILL_DEFINITIONS='+JSON.stringify(definitions)+';'+['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js'].map(read).join('\n')+'\nthis.Simulation=Simulation;',c);
 const sim=new c.Simulation({seed:13}),p=sim.addPlayer('cpu',{owner:'cpu'}),r=sim.getRoom(p);r.actors=[];
 Object.assign(p,{prologue:false,age:24,stun:0,cooldown:0,supportHeight:0});const samples=[];
 for(let i=0;i<1300;i++){p.x=0;p.z=0;const t=performance.now();sim.moveWalk(p,r,.03,.05);const ms=performance.now()-t;if(i>=300)samples.push(ms);}
 samples.sort((a,b)=>a-b);report.runs.push({run,variant,p50:samples[500],p95:samples[950],p99:samples[990],max:samples.at(-1)});
}
if(out)fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

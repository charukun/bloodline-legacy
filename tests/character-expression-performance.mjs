/* CPU-only paired pose diagnostic; no claim about native GPU frame rates. */
import fs from 'node:fs';import {motionRuntime} from './skill-motion-harness.mjs';
const base=process.env.CHARACTER_BASE_SHA,api={before:await motionRuntime(base,null,true),after:await motionRuntime(null,null,true)};
const report={base,method:'3 alternating pairs, 120 warm-up + 600 measured whole traveler update calls; wounded moving fox, 17 bones. WebGL uploads are stubbed. CPU-only; not device FPS.',runs:[]};
for(let pair=0;pair<3;pair++)for(const version of pair%2?['after','before']:['before','after']){
 const a=api[version],r=a.renderer(),c=new a.Travelers.Character(r,3),times=[];
 for(let i=0;i<720;i++){const p={id:'perf',kind:'player',race:3,gender:1,age:24,prologue:false,alive:true,x:0,z:4+i*2/60,dir:0,action:'run',weapon:-1,armor:0,wounds:{rightArm:{severity:'heavy'},rightLeg:{severity:'heavy'}},statuses:{},appearanceSeed:16};r.frame++;const start=performance.now();c.update(p,10+i/60);if(i>=120)times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);report.runs.push({pair,version,p50:times[300],p95:times[570],max:times[599],bones:c.asset.bind.length,vertices:c.asset.lods.map(l=>l.attrs.POSITION.length/3),triangles:c.asset.lods.map(l=>l.indices.length/3)});
}
fs.mkdirSync(new URL('../docs/character/expression/evidence/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../docs/character/expression/evidence/cpu.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));

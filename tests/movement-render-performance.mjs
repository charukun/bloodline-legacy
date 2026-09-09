/* Paired CPU submission check using real authored scenery and drawBatches.
 * GL calls are recorded/no-op: these are NOT GPU, browser or device FPS. */
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadScene} from './export_scene.mjs';
const base=process.argv[2]||'c53f9b2c918ff71525b76ea4b20c8b530429a26e';
const code=execFileSync('git',['show',base+':src/render/renderer-base.js'],{encoding:'utf8'});
const Before=vm.runInNewContext(code+';Renderer',{Float32Array,Math});
const scene=await loadScene(undefined,{characters:false,gameplayCamera:true,width:540,height:960}),r=scene.r;
const after=r.drawBatches,before=Before.prototype.drawBatches;
const positions=Array.from({length:120},(_,i)=>({x:Math.sin(i/70)*8,z:16-i/60*3}));
let hash=null,uploads=0,draws=0,triangles=0;
Object.assign(r.gl,{
 bindVertexArray(type){hash?.update(type);},
 bufferData(target,data){uploads+=data.byteLength;hash?.update(Buffer.from(data.buffer,data.byteOffset,data.byteLength));},
 drawArraysInstanced(mode,start,count,n){draws++;triangles+=count/3*n;hash?.update(`${count}:${n};`);}
});
const set=p=>{Object.assign(r.camera,p);r.matrix();r.stats={calls:0,triangles:0,instances:0,lodInstances:0};};
const render=(fn,shadow=false)=>fn.call(r,r.static,r.program,shadow);
const trace=fn=>{
 hash=createHash('sha256');uploads=draws=triangles=0;
 for(const p of [...positions,{x:-24,z:5},{x:25,z:-30},{x:0,z:-55}]){
  set(p);render(fn);render(fn,true);
 }
 const result={hash:hash.digest('hex'),uploads,draws,triangles};hash=null;return result;
};
const traceBefore=trace(before),traceAfter=trace(after);assert.deepEqual(traceAfter,traceBefore,'ordered GL geometry/instance submissions must remain byte-identical');
const stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};
for(let i=0;i<30;i++){set(positions[i]);render(before);render(after);}
const runs=[];
for(let run=0;run<3;run++){
 const samples={before:{main:[],shadow:[],movement:[]},after:{main:[],shadow:[],movement:[]}};
 let shadowPosition={x:1e9,z:1e9};
 for(const p of positions){
  const shadow=Math.hypot(p.x-shadowPosition.x,p.z-shadowPosition.z)>1.7;if(shadow)shadowPosition=p;
  for(const name of run%2?['after','before']:['before','after']){
   set(p);const start=performance.now();render(name==='before'?before:after);const mid=performance.now();
   if(shadow)render(name==='before'?before:after,true);const end=performance.now();
   samples[name].main.push(mid-start);samples[name].movement.push(end-start);if(shadow)samples[name].shadow.push(end-mid);
  }
 }
 runs.push(Object.fromEntries(Object.entries(samples).map(([name,groups])=>[name,Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,stats(v)]))])));
}
const result={base,node:process.version,backend:'Node CPU / GL submission capture, no GPU',viewport:[540,960],seed:7349,staticInstances:[...r.static.values()].reduce((n,a)=>n+a.length,0),warmupFrames:30,sampleFramesPerRun:120,runs,trace:traceAfter,geometryUnchanged:true,limitations:['No browser compositor, WebGL driver, GPU rendering or Pixel Fold timing.','Scene stays on the same village assets; 3 paired runs, no gameplay or visual quality settings reduced.']};
const output=process.argv[3];if(output)await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({geometryUnchanged:true,runs},null,2));

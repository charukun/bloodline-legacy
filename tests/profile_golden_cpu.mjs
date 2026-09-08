/* CPU-only diagnostic. Fake GL sinks exclude the driver and GPU, explicitly.
 * Each process profiles one checkout to avoid retaining another scene in heap.
 */
import {loadScene} from './export_scene.mjs';
const scene=await loadScene(process.argv[2]),r=scene.r;
r.gl.bufferData=()=>{};r.gl.drawArraysInstanced=()=>{};
const draws=()=>{r.stats={calls:0,triangles:0,instances:0,lodInstances:0};
 for(const [map,shadow]of [[r.dynamic,true],[r.static,false],[r.dynamic,false],[r.groundFX,false],[r.fxBatches,false]])r.drawBatches(map,{},shadow);};
for(let i=0;i<10;i++)draws();
const runs=[];
for(let run=0;run<3;run++){const values=[];for(let i=0;i<60;i++){const t=performance.now();draws();values.push(performance.now()-t);}const sorted=[...values].sort((a,b)=>a-b);runs.push({frames:values.length,mean_ms:values.reduce((a,b)=>a+b)/values.length,p50_ms:sorted[29],p95_ms:sorted[56],p99_ms:sorted[59],raw_ms:values});}
global.gc?.();const before=process.memoryUsage();
const rows=[];for(let i=0;i<8;i++){r.static.clear();r.art.village(scene.snapshot.map);rows.push([...r.static.values()].reduce((a,b)=>a+b.length,0));}
global.gc?.();const after=process.memoryUsage();
console.log(JSON.stringify({backend:'Node.js / actual drawBatches / fake GL sink; not Browser submit or GPU time',runs,heap:{gc_available:!!global.gc,before,after,rebuilt_scene_counts:rows,note:'Entire diagnostic process; includes retained export copies. No Browser heap or leak conclusion.'},meshBytes:scene.meshBytes,staticInstances:rows[0]},null,2));

// CPU pose comparison with real combat snapshots and the collision-query scene.
// Rendering is stubbed; this is not a mobile GPU or browser FPS measurement.
import fs from 'node:fs';
import {motionRuntime} from '../tests/skill-motion-harness.mjs';
import {tempoCombat} from '../tests/skill-tempo-harness.mjs';
const [base,out]=process.argv.slice(2);if(!/^[a-f0-9]{40}$/.test(base)||!out)throw Error('BASE_SHA OUTPUT.json required');
const before=await motionRuntime(base,null,true),after=await motionRuntime(null,null,true),{sim,p}=tempoCombat(after,[60070,60121,60032]),map=sim.getRoom(p).map,snapshots=[];
for(let i=0;i<300;i++){sim.tick(1/60);snapshots.push(JSON.parse(JSON.stringify(sim.snapshot(p.id))));}
const values={before:[],after:[]};
for(let round=0;round<5;round++)for(const [label,a]of round%2?[['after',after],['before',before]]:[['before',before],['after',after]]){
 const r=a.renderer(),c=new a.Travelers.Character(r,0);r.traversalMap=map;
 for(const snapshot of snapshots){r.frame++;r.currentSnapshot=snapshot;c.update(snapshot.player,snapshot.t);if(round>0)values[label].push(c.metrics.solveMs);}
}
const data={kind:'Node VM CPU poses and collision queries; GL stubbed, not device FPS',baseline:base,node:process.version,results:Object.entries(values).map(([label,v])=>{v.sort((a,b)=>a-b);return {label,samples:v.length,medianMs:v[Math.floor(v.length*.5)],p95Ms:v[Math.floor(v.length*.95)]};})};fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data));

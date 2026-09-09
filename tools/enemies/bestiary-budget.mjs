// Geometry and CPU construction measurements. No browser/device FPS claim.
import fs from 'node:fs/promises';
import {harness} from '../../tests/enemies/harness.mjs';
const {run,ctx}=harness();
const report=run(`(()=>{
 EnemyCreatures.install();const forms=Object.values(ENEMY_FORMS).flat(),results=[];
 const renderer=()=>({frame:0,dynamic:new Map(),fxBatches:new Map(),weaponTips:new Map(),put(type,m,c,surface=0,alpha=1,target=this.dynamic){const rows=target.get(type)||[];rows.push(m);target.set(type,rows);},blob(){}});
 const total=r=>[...r.dynamic].reduce((n,[type,rows])=>n+rGeometry(type).count/3*rows.length,0);
 for(const f of forms){
  const p={id:'budget',kind:f.kind,enemyForm:f.id,alive:true,action:'idle',x:0,z:0,wounds:{},statuses:{},elite:f.kind==='elite'},r=renderer(),a=new VillageArt(r),before=renderer(),old=new VillageArt(before);
  ENEMY_PREVIOUS_MONSTER.call(old,p,1.2);
  if(EnemySentinel.eligible(p)){const rec=EnemySentinel.pose(p,1.2);a.sentinelEquipment(p,rec);}else EnemyCreatures.draw(a,p,1.2);
  results.push({id:f.id,name:f.name,kind:f.kind,previousFamilyTriangles:total(before),triangles:total(r)+(EnemySentinel.eligible(p)?EnemySentinel.asset.indices.length/3:0),rigidMeshTypes:r.dynamic.size,parts:[...r.dynamic.values()].reduce((n,rows)=>n+rows.length,0)});
 }
 const cpu=[],hostile=forms.filter(f=>!['stag','mushroom'].includes(f.kind));
 for(const count of [2,8,24]){
  const r=renderer(),a=new VillageArt(r),records=Array.from({length:count},()=>({})),actors=records.map((_,i)=>({id:'b'+i,kind:hostile[i%hostile.length].kind,enemyForm:hostile[i%hostile.length].id,alive:true,action:'run',x:0,z:0,wounds:{},statuses:{}})),times=[];
  for(let frame=0;frame<240;frame++){
   const start=performance.now();r.frame=frame;r.dynamic.clear();r.fxBatches.clear();
   for(let i=0;i<count;i++){const p=actors[i];p.x=frame/60*1.2;if(EnemySentinel.eligible(p)){const rec=EnemySentinel.pose(p,frame/60,records[i]);a.sentinelEquipment(p,rec);}else EnemyCreatures.draw(a,p,frame/60);}
   if(frame>=60)times.push(performance.now()-start);
  }
  const sorted=[...times].sort((a,b)=>a-b);cpu.push({actors:count,frames:times.length,p50Ms:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],p99Ms:sorted[Math.floor(sorted.length*.99)],rawMs:times});
 }
 return{forms:results,cpu,sharedCreatureMeshes:['enemy:body','enemy:head','enemy:shell','enemy:snout'].map(id=>({id,triangles:rGeometry(id).count/3}))};
})()`);
const output=process.argv[2]||'docs/enemies/evidence/bestiary-budget.json';
await fs.writeFile(output,JSON.stringify({scope:'Node full-detail geometry construction and pose sampling; excludes GPU, browser, scenery, combat and draw submission',runtime:process.version,...report},null,2)+'\n');
console.log({minTriangles:Math.min(...report.forms.map(f=>f.triangles)),maxTriangles:Math.max(...report.forms.map(f=>f.triangles)),cpu:report.cpu.map(({rawMs,...r})=>r)});

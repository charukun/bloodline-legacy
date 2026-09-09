// Native JS pose/batch construction only: never a browser/device FPS claim.
import fs from 'node:fs/promises';
import {harness} from '../../tests/enemies/harness.mjs';
const h=harness();
const report=h.run(`(()=>{
 const scenarios=['healthy','critical','crawl'],rows=[],quantile=(a,q)=>[...a].sort((x,y)=>x-y)[Math.floor(a.length*q)];
 for(const scenario of scenarios){const r={quality:'medium',frame:0,dynamic:new Map(),fxBatches:new Map(),weaponTips:new Map(),put(type,m){const rows=this.dynamic.get(type)||[];rows.push(m);this.dynamic.set(type,rows);},blob(){}},a=new VillageArt(r),records=[];
  const actors=Array.from({length:24},(_,i)=>({id:'budget-'+i,kind:i%2?'maw':'soldier',enemyForm:i%2?'moss-wolf':'soldier',hp:scenario==='critical'?20:100,hpMax:100,x:0,z:0,alive:true,action:'run',dir:0,statuses:{},wounds:scenario==='crawl'?{rightLeg:{severity:'lost'},leftLeg:{severity:'lost'}}:{}}));
  const times=[];for(let f=0;f<160;f++){r.frame=f;r.dynamic.clear();r.fxBatches.clear();const start=performance.now();for(let i=0;i<actors.length;i++){const p=actors[i];p.x=f/60*3.1*injuryModifiers(p).move*enemyCondition(p).move;
   if(i%2)EnemyCreatures.draw(a,p,f/60);else {records[i]??={};const rec=EnemySentinel.pose(p,f/60,records[i]);a.sentinelEquipment(p,rec);a.sentinelScars(p,rec);}}
   if(f>=60)times.push(performance.now()-start);
  }
  rows.push({scenario,actors:24,samples:times.length,p50Ms:quantile(times,.5),p95Ms:quantile(times,.95),rawMs:times,rigidBatchTypes:r.dynamic.size,rigidTriangles:[...r.dynamic].reduce((n,[id,items])=>n+rGeometry(id).count/3*items.length,0),skinTriangles:12*EnemySentinel.asset.indices.length/3});
 }
 return rows;
})()`);
const result={scope:'Node pose and batch construction for 12 soldiers + 12 wolves; excludes GPU, world, combat, browser. Separate actor scenarios, not a before/after code benchmark.',runtime:process.version,newTextures:0,newMeshes:0,newBones:0,newDrawPasses:0,rows:report};
await fs.writeFile(process.argv[2]||'docs/enemies/evidence/weakness-budget.json',JSON.stringify(result,null,2)+'\n');console.log(report.map(({rawMs,...r})=>r));

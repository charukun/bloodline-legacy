// CPU/geometry only. No browser/device FPS inference.
import fs from 'node:fs/promises';
import {harness} from '../../tests/enemies/harness.mjs';
const h=harness();
const report=h.run(`(()=>{
 const forms=Object.values(ENEMY_FORMS).flat(),parts=EnemyDamage.parts;
 const renderer=quality=>({quality,frame:0,dynamic:new Map(),fxBatches:new Map(),weaponTips:new Map(),put(type,m,c,surface=0,alpha=1,target=this.dynamic){const rows=target.get(type)||[];rows.push(m);target.set(type,rows);},blob(){}});
 const make=(f,id,stage)=>({id,kind:f.kind,enemyForm:f.id,hpMax:100,hp:stage==='clean'?100:22,alive:true,action:'run',x:0,z:0,wounds:{},damageMarks:{},statuses:{}});
 const draw=(r,a,p,time,rec={})=>{if(EnemySentinel.eligible(p)){EnemySentinel.pose(p,time,rec);a.sentinelEquipment(p,rec);a.sentinelScars(p,rec);}else EnemyCreatures.draw(a,p,time);};
 const rows=[];
 for(const f of forms)for(const quality of ['low','medium'])for(const stage of ['clean','heavy']){
  const r=renderer(quality),a=new VillageArt(r),p=make(f,'budget',stage);draw(r,a,p,1.35);
  const marks=[...r.dynamic].filter(([type])=>['enemy:stain','enemy:split','enemy:break-rim'].includes(type));
  rows.push({form:f.id,quality,stage,triangles:[...r.dynamic].reduce((n,[type,items])=>n+rGeometry(type).count/3*items.length,0)+(EnemySentinel.eligible(p)?EnemySentinel.asset.indices.length/3:0),damageTriangles:marks.reduce((n,[type,items])=>n+rGeometry(type).count/3*items.length,0),damageMeshTypes:marks.length});
 }
 const cpu=[],hostile=forms.filter(f=>!['stag','mushroom'].includes(f.kind));
 for(const count of [2,8,24])for(const stage of ['clean','heavy'])for(const quality of count===24?['medium','low']:['medium']){
  const r=renderer(quality),a=new VillageArt(r),actors=Array.from({length:count},(_,i)=>make(hostile[i%hostile.length],'cpu-'+i,stage)),records=actors.map(()=>({})),times=[];
  for(let frame=0;frame<300;frame++){
   const start=performance.now();r.frame=frame;r.dynamic.clear();r.fxBatches.clear();
   for(let i=0;i<count;i++){actors[i].x=frame/60*1.2;draw(r,a,actors[i],frame/60,records[i]);}
   if(frame>=120)times.push(performance.now()-start);
  }
  const sorted=[...times].sort((a,b)=>a-b),q=f=>sorted[Math.floor(sorted.length*f)];cpu.push({actors:count,stage,quality,frames:times.length,p50Ms:q(.5),p95Ms:q(.95),p99Ms:q(.99),rawMs:times});
 }
 return {rows,cpu,meshes:['enemy:stain','enemy:split','enemy:break-rim'].map(id=>{const g=rGeometry(id);return{id,triangles:g.count/3,bytes:g.positions.byteLength+g.normals.byteLength};})};
})()`);
const out=process.argv[2]||'docs/enemies/evidence/damage-budget.json';
await fs.writeFile(out,JSON.stringify({scope:'Node full-detail pose and geometry construction, excludes GPU/browser/world/combat/draw submission; heavy is 22% remaining HP with empty wounds/marks; wear is global',runtime:process.version,...report},null,2)+'\n');
console.log({maxDamageTriangles:Math.max(...report.rows.map(r=>r.damageTriangles)),meshes:report.meshes,cpu:report.cpu.map(({rawMs,...r})=>r)});

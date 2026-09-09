// Paired scene construction, alternating old-family and new-fauna draws.
// Node CPU only: this is neither a browser frame nor a device FPS measurement.
import fs from 'node:fs/promises';
import {harness} from '../../tests/enemies/harness.mjs';
const h=harness();
const result=h.run(`(()=>{
 const ids=EnemyFauna.ids,rows=[],quantile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor(a.length*p)];
 const make=(fresh,hurt)=>{
  const r={frame:0,quality:'medium',dynamic:new Map(),fxBatches:new Map(),put(type,m,c,s=0,alpha=1,target=this.dynamic){const b=target.get(type)||[];b.push(m);target.set(type,b);},blob(){}};
  const actors=Array.from({length:24},(_,i)=>{const f=Object.values(ENEMY_FORMS).flat().find(f=>f.id===ids[i%ids.length]);return {id:'paired-'+i,kind:f.kind,enemyForm:fresh?f.id:f.kind,alive:true,action:'run',x:0,z:0,hp:hurt?20:100,hpMax:100,wounds:hurt?{leftLeg:{severity:'lost'}}:{},statuses:{}};});
  return {r,a:new VillageArt(r),actors,times:[]};
 };
 const frame=(scene,n)=>{const {r,a,actors}=scene,start=performance.now();r.frame=n;r.dynamic.clear();r.fxBatches.clear();for(const p of actors){p.x=n/60*1.2;EnemyCreatures.draw(a,p,n/60);}if(n>=60)scene.times.push(performance.now()-start);};
 for(const hurt of [false,true]){
  const old=make(false,hurt),fresh=make(true,hurt);
  for(let n=0;n<180;n++)for(const s of n%2?[old,fresh]:[fresh,old])frame(s,n);
  const report=s=>({actors:s.actors.length,samples:s.times.length,p50Ms:quantile(s.times,.5),p95Ms:quantile(s.times,.95),p99Ms:quantile(s.times,.99),meshTypes:s.r.dynamic.size,triangles:[...s.r.dynamic].reduce((n,[type,b])=>n+rGeometry(type).count/3*b.length,0),rawMs:s.times});
  rows.push({state:hurt?'20% HP and left leg group lost':'healthy',oldFamily:report(old),newFauna:report(fresh)});
 }
 const geometry=ids.map(id=>{const f=Object.values(ENEMY_FORMS).flat().find(f=>f.id===id),s=make(true,false);s.r.dynamic.clear();EnemyCreatures.draw(s.a,{...s.actors[0],enemyForm:id,kind:f.kind},0);return{id,name:f.name,triangles:[...s.r.dynamic].reduce((n,[type,b])=>n+rGeometry(type).count/3*b.length,0),meshTypes:s.r.dynamic.size};});
 return {rows,geometry};
})()`);
const report={scope:'24 actors, alternating paired scenes, 60 warm-up + 120 sampled frames. Existing family forms versus new constructions on the same runtime. Excludes GPU, world, combat, browser and draw submission.',runtime:process.version,newExternalAssets:0,newMeshes:0,newTextures:0,newBones:0,newDrawPasses:0,...result};
await fs.writeFile(process.argv[2]||'docs/enemies/evidence/fauna-budget.json',JSON.stringify(report,null,2)+'\n');
console.log({geometry:report.geometry,rows:report.rows.map(r=>({state:r.state,oldP50:r.oldFamily.p50Ms,newP50:r.newFauna.p50Ms,oldP95:r.oldFamily.p95Ms,newP95:r.newFauna.p95Ms}))});

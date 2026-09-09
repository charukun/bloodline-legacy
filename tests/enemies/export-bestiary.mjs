// Actual geometry/material/animation export. Independent EGL diagnostic only.
import fs from 'node:fs/promises';
import path from 'node:path';
import {loadScene,writeScene,repository} from '../export_scene.mjs';
const out=process.argv[2]||'verification/current/bestiary',family=process.argv[3]||'goblin',time=Number(process.argv[4]??'1.35'),pose=process.argv[5]||'idle';
const scene=await loadScene(repository,{enemyReview:true,characters:false,width:1800,height:600,x:0,z:-34,y:family==='other'?3.1:family==='elite'?2.4:family==='soldier'?1.9:1.4,zoom:process.argv[6]==='weakness'?10.5:family==='other'?13:family==='elite'?10:8.3,yaw:.10,pitch:.40,time,weather:'clear',quality:'medium',isolatedMaterials:true});
const damage=process.argv[6]||'auto',part=process.argv[7]||'torso';
const r=scene.r,api=r.enemyAPI,stages=['clean','light','medium','heavy','depleted'],cases=[{hp:100,broken:'none'},{hp:50,broken:'none'},{hp:20,broken:'none'},{hp:100,broken:'rightArm'},{hp:100,broken:'rightLeg'},{hp:100,broken:'bothLegs'}],selected=Object.values(api.forms).flat().find(f=>f.id===family),forms=damage==='weakness'?cases.map(()=>selected):damage==='stages'?stages.map(()=>selected):family==='other'?[...api.forms.boss,...api.forms.stag,...api.forms.mushroom]:api.forms[family];
if(!forms)throw Error('Unknown family '+family);
const skins=[],stats=[];
for(const[fIndex,form]of forms.entries()){
 const p={...scene.sim.actor(form.kind,0,0),id:['stages','weakness'].includes(damage)?'damage-gallery':'gallery-'+fIndex,enemyForm:form.id,x:(fIndex-(forms.length-1)/2)*(damage==='weakness'?3.3:4.4),z:-34,dir:['stages','weakness'].includes(damage)?.85:.10,guard:false,action:'idle',wounds:{},statuses:{}};
 if(pose==='attack')Object.assign(p,{action:time<1.35?'windup':'attack',...(time<1.35?{telegraph:{started:0,at:1.35}}:{actionStarted:1.35,actionUntil:2.1})});
 if(pose==='run')p.action='run';if(pose==='death')Object.assign(p,{alive:false,deathAt:0});if(pose==='lost')p.wounds={rightArm:{severity:'lost'},leftLeg:{severity:'lost'}};
 r.art.root=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);r.art.target=r.dynamic;
 if(damage==='weakness')api.review.vitality(p,cases[fIndex].hp,cases[fIndex].broken);else api.review.damage(p,damage==='stages'?stages[fIndex]:damage,part);
 const before=[...r.dynamic.values()].reduce((n,rows)=>n+rows.length,0);
 if(api.sentinel.eligible(p)){
  const rec=api.sentinel.pose(p,time,{phase:time*2});r.art.sentinelEquipment(p,rec);r.art.sentinelScars(p,rec);r.blob(p.x,p.z,.7,.5,.31,r.fxBatches);
  skins.push({palette:Array.from(rec.palette),cloth:rec.config.cloth,metal:rec.config.metal,variation:api.sentinel.variation(p),damageBody:[rec.damage.parts.torso.amount,rec.damage.parts.head.amount,rec.damage.wear],damageLimbs:['rightArm','leftArm','rightLeg','leftLeg'].map(k=>rec.damage.parts[k].amount),loss:['rightArm','leftArm','rightLeg','leftLeg'].map(k=>p.wounds?.[k]?.severity==='lost'?1:0)});
 }else{
  if(pose==='run'){r.enemyCreatures??=new Map();r.enemyCreatures.set(p.id,{phase:time*5,time,x:p.x,z:p.z});}
  api.creatures.draw(r.art,p,time);
 }
 stats.push({id:form.id,name:form.name,damage:damage==='stages'?stages[fIndex]:damage,part,vitalityPercent:Math.round(p.hp/p.hpMax*100),brokenParts:Object.entries(p.wounds||{}).filter(([,v])=>v.severity==='lost').map(([k])=>k),parts:[...r.dynamic.values()].reduce((n,rows)=>n+rows.length,0)-before});
}
let current,rows,mesh;const originalGeometry=r.geometry.bind(r);
Object.assign(r.gl,{bindVertexArray(v){mesh=v;},bufferData(_t,a){rows=Array.from(a);},drawArraysInstanced(_m,_s,count,instances){current.push({mesh,rows,count,instances});}});
r.stats={calls:0,triangles:0,instances:0,lodInstances:0};
for(const[name,map,shadow]of [['dynamicShadow',r.dynamic,true],['dynamic',r.dynamic,false],['fx',r.fxBatches,false]]){current=scene.passes[name]=[];r.drawBatches(map,{},shadow);}
for(const pass of Object.values(scene.passes))for(const batch of pass){if(scene.geometries[batch.mesh])continue;const g=originalGeometry(batch.mesh);scene.geometries[batch.mesh]={positions:Array.from(g.positions),normals:Array.from(g.normals),count:g.count};}
if(skins.length)scene.enemies={shaders:{vertex:api.sentinel.VS,fragment:api.sentinel.FS,depth:api.sentinel.DS},attrs:Object.fromEntries(Object.entries(api.sentinel.asset.attrs).map(([k,v])=>[k,Array.from(v)])),indices:Array.from(api.sentinel.asset.indices),skins};
const report={family,time,pose,damage,part,forms:stats,rigidTriangles:scene.passes.dynamic.reduce((n,b)=>n+b.count/3*b.instances,0),skinTriangles:skins.length*api.sentinel.asset.indices.length/3,mainCalls:scene.passes.dynamic.length+skins.length,shadowCalls:scene.passes.dynamicShadow.length+skins.length};
const directory=path.join(out,family+'-'+pose+(damage==='auto'?'':'-'+part+'-'+damage));
await writeScene(scene,directory);await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2));console.log(report);

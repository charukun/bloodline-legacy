import fs from 'node:fs/promises';
import path from 'node:path';
import {loadScene,writeScene,repository} from '../export_scene.mjs';
import {harness,actor} from './harness.mjs';
const {api,run}=harness(),equipment=run('VillageArt.prototype.sentinelEquipment'),scars=run('VillageArt.prototype.sentinelScars');
const out=process.argv[2]||'verification/current/enemies';
const mode=process.argv[3]||'after',caseName=process.argv[4]||'idle';
const t={idle:2,windup:.70,contact:1.35,recovery:1.65,hit:.18,death:.7,run:.23,lost:2}[caseName]??2;
const actors=['soldier','elite'].map((kind,i)=>({...actor(kind),x:(i-.5)*4,z:-34,dir:.15,
 ...(caseName==='windup'?{action:'windup',telegraph:{started:0,at:1.35}}:{}),
 ...(['contact','recovery'].includes(caseName)?{action:'attack',actionStarted:1.35,actionUntil:2.10}:{}),
 ...(caseName==='hit'?{action:'hit',hitReactAt:0,hitReactUntil:.7,hitSeverity:'heavy',hitDir:.8}:{}),
 ...(caseName==='death'?{alive:false,deathAt:0}:{}),...(caseName==='run'?{action:'run'}:{}),
 ...(caseName==='lost'?{wounds:{rightArm:{severity:'lost'},leftLeg:{severity:'lost'}}}:{})}));
const options={width:1100,height:760,x:0,z:-33,zoom:10.5,yaw:.32,pitch:.48,time:t,weather:'clear',quality:'medium',characters:mode==='before',actorCases:actors};
if(process.env.ENEMY_ISOLATED)options.isolatedMaterials=true;
if(process.env.ENEMY_LOW){options.quality='low';options.width=393;options.height=650;options.zoom=9;}
const scene=await loadScene(repository,options),r=scene.r;
if(mode==='after'){
 const skins=[];
 for(const p of actors){const rec=api.pose(p,t,{phase:.35});r.art.sentinelEquipment=equipment;r.art.target=r.dynamic;r.art.sentinelEquipment(p,rec);r.art.sentinelScars=scars;r.art.sentinelScars(p,rec);r.blob(p.x,p.z,.7,.5,.31,r.fxBatches);skins.push({palette:Array.from(rec.palette),cloth:rec.config.cloth,metal:rec.config.metal,variation:api.variation(p),loss:['rightArm','leftArm','rightLeg','leftLeg'].map(k=>p.wounds?.[k]?.severity==='lost'?1:0),sockets:Object.fromEntries(Object.entries(rec.sockets).map(([k,v])=>[k,Array.from(v)]))});}
 let current,rows,mesh;const originalGeometry=r.geometry.bind(r);
 Object.assign(r.gl,{bindVertexArray(v){mesh=v;},bufferData(t,a){rows=Array.from(a);},drawArraysInstanced(_m,_s,count,instances){current.push({mesh,rows,count,instances});}});
 for(const[name,map,shadow]of [['dynamicShadow',r.dynamic,true],['dynamic',r.dynamic,false],['fx',r.fxBatches,false]]){current=scene.passes[name]=[];r.drawBatches(map,{},shadow);}
 for(const pass of Object.values(scene.passes))for(const batch of pass){if(scene.geometries[batch.mesh])continue;const g=originalGeometry(batch.mesh);scene.geometries[batch.mesh]={positions:Array.from(g.positions),normals:Array.from(g.normals),count:g.count};}
 scene.enemies={shaders:{vertex:api.VS,fragment:api.FS,depth:api.DS},attrs:Object.fromEntries(Object.entries(api.asset.attrs).map(([k,v])=>[k,Array.from(v)])),indices:Array.from(api.asset.indices),skins};
}
await writeScene(scene,path.join(out,mode+'-'+caseName));console.log(mode,caseName);

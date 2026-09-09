/* Exports actual CM01/legacy poses for the existing native EGL diagnostic. No browser. */
import fs from 'node:fs';
import {motionRuntime} from './skill-motion-harness.mjs';
const out=process.argv[2]||'verification/current/life-pose';fs.mkdirSync(out,{recursive:true});
const api=await motionRuntime(),all=[],camera=Array.from(api.rMultiply(api.rOrtho(-2.6,2.6,-2.6,2.6,.1,30),api.rLookAt([5,4,7],[0,1.25,.5])));
for(const kind of ['cm01','legacy','soldier'])for(const part of ['downed','carried','vault']){
 const r=api.renderer();r.canvas.height=600;r.viewHeight=5;
 const cm=kind==='cm01'?new api.CM01.Character(r):null,art=new api.ArtDirector(r),frames=[];
 for(let i=0;i<=75;i++){
  const t=1+i/60,p={...api.player(),id:kind,kind:kind==='soldier'?'guard':'player',z:0,dir:0,armor:1,shield:false,age:24,action:part};
  if(part==='downed')Object.assign(p,{lifeState:'downed',downedAt:1});
  if(part==='carried')Object.assign(p,{lifeState:kind==='soldier'?'active':'carried',downedAt:0,baseY:kind==='soldier'?0:1.32,...(kind==='soldier'?{rescueTarget:'casualty',action:'idle'}:{})});
  if(part==='vault'){const u=Math.min(1,(t-1)/.68);Object.assign(p,{traversal:{progress:u,kind:'vault'},verticalOffset:Math.sin(Math.PI*u)*1.16,supportHeight:0});}
  r.frame++;r.parts=[];if(cm)cm.update(p,t);else {art.doll(p,t,false);if(part==='carried'&&kind==='legacy')art.doll({...api.player(),id:'carrier',kind:'guard',z:0,dir:0,action:'idle',rescueTarget:p.id},t,false);}
  const index=[0,.12,.28,.5,.68,1.1].findIndex(a=>Math.abs(t-1-a)<1/120);if(index<0)continue;
  if(cm){const a=api.CM01.asset.lods[0],attrs=Object.fromEntries(Object.entries(a.attrs).map(([k,v])=>[k,Array.from(v)]));frames.push({index,t,cm:true,palette:Array.from(cm.palette),attrs,indices:Array.from(a.indices)});}
  else {const geometries={};for(const {type} of r.parts){if(geometries[type])continue;const g=api.rGeometry(type);geometries[type]={p:Array.from(g.positions),n:Array.from(g.normals)};}frames.push({index,t,vertices:r.parts.map(p=>p.type),matrices:r.parts.map(p=>p.m),colors:r.parts.map(p=>api.rColor(p.c)),geometries});}
 }
 all.push({kind,part,frames});
}
fs.writeFileSync(out+'/after.json',JSON.stringify({camera,all}));

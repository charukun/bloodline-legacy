/* Offline pose diagnostic: real meshes/poses, neutral material, no Browser QA. */
import fs from 'node:fs';import vm from 'node:vm';import {execFileSync} from 'node:child_process';
import {compileCatalog} from '../tools/skill-catalog.mjs';
import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=new URL('../',import.meta.url),out=pathToFileURL(path.resolve(process.argv[2]||'verification/damage-motion')+'/');fs.mkdirSync(out,{recursive:true});
const definitions=compileCatalog(JSON.parse(fs.readFileSync(new URL('src/skills/catalog-source.json',root))));
const files=['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','legacy/render_math.js','legacy/motion.js','legacy/art.js','render/tilt-shift.js','render/shaders.js','character/rig.js','character/golden-master.runtime.js'];
class Image{set src(_){queueMicrotask(()=>this.onload());}}
for(const variant of ['before','after']){
 const context=vm.createContext({console,performance,structuredClone,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,URL,atob,Image,queueMicrotask});
 let code='const BL_SKILL_DEFINITIONS='+JSON.stringify(definitions)+';class VillageArt extends Object {};const AssetBank={load:async()=>{}};';
 for(const f of files)code+='\n'+(variant==='before'?execFileSync('git',['show','4b9693364c5687ffc04bf57101c80394738fe59c:src/'+f],{cwd:root,encoding:'utf8'}):fs.readFileSync(new URL('src/'+f,root),'utf8'));
 vm.runInContext(code+'\nthis.API={ArtDirector,CM01,rModel,rColor,rGeometry,rMultiply,rOrtho,rLookAt,hitPose};',context);
 const api=context.API;await api.CM01.load(fs.readFileSync(new URL('public/assets/character/young-human-male-cm01.glb',root)).toString('base64'));
 const gl=new Proxy({},{get:(_,k)=>k.startsWith('create')?()=>({}):()=>{}});
 const view=api.rLookAt([5,3.4,7],[0,1.4,0]);
 // Correct image center: symmetric orthographic projection around look-at.
 const camera=Array.from(api.rMultiply(api.rOrtho(-1.9,1.9,-1.9,1.9,.1,30),view));
 const all=[];
 for(const kind of ['cm01','legacy','soldier'])for(const part of ['torso','head','leftLeg']){
  let vertices=[],matrices=[],colors=[];const r={gl,programOf:()=>({}),frame:0,sceneKey:'village-test',static:new Map(),dynamic:new Map(),fxBatches:new Map(),canvas:{height:600},viewHeight:5,camera:{zoom:5},blob(){},add(){},put(type,m,c){matrices.push(Array.from(m));vertices.push(type);colors.push(api.rColor(c));}};
  const cm=kind==='cm01'?new api.CM01.Character(r):null,art=new api.ArtDirector(r);let serial=0;
  const p={id:kind,kind:kind==='soldier'?'soldier':'player',alive:true,age:24,gender:0,race:0,prologue:false,x:0,z:0,dir:0,action:'idle',wounds:{},statuses:{},weapon:0,armor:1,shield:false,appearanceSeed:4};
  const frames=[];
  for(let i=0;i<=100;i++){
   const t=.8+i/60;let q={...p};if(t>=1){Object.assign(q,{action:'hit',actionStarted:1,actionUntil:1.85,hitReactAt:.915,hitReactUntil:1.72,hitMotionId:1,hitSeverity:'heavy',hitStrength:1,hitPart:part,hitDir:Math.PI});}
   r.frame++;vertices=[];matrices=[];colors=[];if(cm)cm.update(q,t);else art.doll(q,t,false);
   const ages=[-.10,0,.12,.28,.50,.76];const index=ages.findIndex(a=>Math.abs(t-1-a)<1/120);
   if(index<0)continue;
   if(cm){const a=api.CM01.asset.lods[0],attrs=Object.fromEntries(Object.entries(a.attrs).map(([k,v])=>[k,Array.from(v)]));frames.push({index,t,cm:true,palette:Array.from(cm.palette),attrs,indices:Array.from(a.indices)});}
   else {const geometries={};for(const type of vertices){if(geometries[type])continue;const g=api.rGeometry(type);geometries[type]={p:Array.from(g.positions),n:Array.from(g.normals)};}frames.push({index,t,vertices,matrices,colors,geometries});}
  }
  all.push({kind,part,frames});
 }
 fs.writeFileSync(new URL(variant+'.json',out),JSON.stringify({camera,all}));
}

import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {compileCatalog} from '../tools/skill-catalog.mjs';

export async function motionRuntime(revision=null,assetPath=null,travelers=false){
 const definitions=compileCatalog(JSON.parse(fs.readFileSync(new URL('../src/skills/catalog-source.json',import.meta.url),'utf8')));
 class DecodedImage{set src(_){queueMicrotask(()=>this.onload());}}
 const context=vm.createContext({console,performance,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,URL,atob,Image:DecodedImage,queueMicrotask});
 vm.runInContext(`const BL_SKILL_DEFINITIONS=${JSON.stringify(definitions)};const AssetBank={load:async()=>{}};`,context);
 for(const file of ['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','legacy/render_math.js','legacy/motion.js','legacy/art.js','render/tilt-shift.js','render/shaders.js','world/environment.js','character/rig.js','character/golden-master.runtime.js'])
  vm.runInContext(revision?execFileSync('git',['show',revision+':src/'+file],{encoding:'utf8'}):fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),context,{filename:file});
 const api=vm.runInContext('({Simulation,skillById,book,artPose,SkillMotion:typeof SkillMotion==="undefined"?null:SkillMotion,CM01,VillageArt,ArtDirector,RigRenderer,rModel,rColor,rGeometry,rMultiply,rOrtho,rLookAt,actionTiming})',context);
 await api.CM01.load(fs.readFileSync(assetPath||new URL('../public/assets/character/young-human-male-cm01.glb',import.meta.url)).toString('base64'));
 if(travelers){
  for(const file of ['character/traveler-model.js','character/traveler-clip-data.js','character/traveler-clips.js','character/traveler-runtime.js']){
   let source;try{source=revision?execFileSync('git',['show',revision+':src/'+file],{encoding:'utf8',stdio:['ignore','pipe','ignore']}):fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');}catch(e){if(file.includes('clip'))continue;throw e;}
   vm.runInContext(source,context,{filename:file});
  }
  api.Travelers=vm.runInContext('Travelers',context);
 }
 vm.runInContext(fs.readFileSync(new URL('../tools/skill-motion-review-runtime.js',import.meta.url),'utf8'),context);
 api.review=vm.runInContext('MotionReview',context);
 const gl=new Proxy({FLOAT:5126,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:k.startsWith('create')?()=>({}):()=>{}});
 const renderer=()=>({gl,programOf:()=>({u:new Map()}),frame:0,sceneKey:'village-test',static:new Map(),canvas:{height:900},viewHeight:16,camera:{zoom:16},dynamic:new Map(),fxBatches:new Map(),blob(){},add(){},put(type,m,c){this.parts.push({type,m:[...m],c});},parts:[]});
 const player=()=>({id:'hero',kind:'player',alive:true,prologue:false,race:0,gender:0,age:24,x:0,z:4,dir:0,weapon:0,armor:0,action:'idle',wounds:{},statuses:{}});
 return {...api,definitions,renderer,player};
}

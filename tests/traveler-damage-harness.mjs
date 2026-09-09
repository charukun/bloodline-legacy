import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {compileCatalog} from '../tools/skill-catalog.mjs';
export const BASE='c82ef19c8cdde1f77c0a7b849f1a632f16760d94';
export function travelerRuntime(revision=null){
 const read=p=>revision?execFileSync('git',['show',revision+':'+p],{encoding:'utf8'}):fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const definitions=compileCatalog(JSON.parse(read('src/skills/catalog-source.json')));
 const context=vm.createContext({console,performance,structuredClone,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,URL,atob});
 vm.runInContext(`const BL_SKILL_DEFINITIONS=${JSON.stringify(definitions)};const AssetBank={load:async()=>{}};`,context);
 for(const f of ['legacy/dialogue','legacy/core','skills/engine','skills/runtime','legacy/render_math','legacy/motion','legacy/art','render/tilt-shift','render/shaders','world/environment','character/rig','character/golden-master.runtime','character/traveler-model','character/traveler-age','character/traveler-expression','character/traveler-runtime']){let source;try{source=read('src/'+f+'.js');}catch(e){if(revision&&(f.endsWith('traveler-expression')||f.endsWith('traveler-age')))continue;throw e;}vm.runInContext(source,context,{filename:f});}
 const api=vm.runInContext('({Travelers,Simulation,damagePose,damageArtPose,hitPose,DamageMotion})',context);
 const gl=new Proxy({FLOAT:5126,UNSIGNED_SHORT:5123,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:k.startsWith('create')?()=>({}):()=>{}});
 api.renderer=()=>({gl,programOf:()=>({}),frame:0,sceneKey:'village-test',static:new Map(),canvas:{height:900},viewHeight:16,camera:{zoom:16}});
 api.fixture=(race=0)=>{const sim=new api.Simulation({seed:13}),p=sim.addPlayer('hero',{owner:'damage-qa',name:'試験',race});Object.assign(p,{race,gender:[0,1,0,1][race],prologue:false,age:24,ageFraction:0,introUntil:-100,releaseAt:-100,farewellStage:3,x:0,z:4,dir:0,action:'idle',autoFight:null,guard:false,weapon:0,armor:0,stun:0,cooldown:0});const room=sim.getRoom(p);room.actors=[];room.waveAt=1e9;sim.time=10;const source=sim.actor('soldier',0,5.2);source.guard=false;source.attackCount=1;return {sim,p,room,source};};
 return api;
}

import fs from 'node:fs';
import vm from 'node:vm';
import {compileCatalog} from '../../tools/skill-catalog.mjs';
export function harness(){
 const ctx=vm.createContext({console,performance,Uint8Array,Uint16Array,Uint32Array,Float32Array,DataView,TextDecoder,atob});
 ctx.BL_SKILL_DEFINITIONS=compileCatalog(JSON.parse(fs.readFileSync(new URL('../../src/skills/catalog-source.json',import.meta.url))));
 for(const f of ['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','legacy/render_math.js','legacy/motion.js','legacy/art.js','render/tilt-shift.js','render/shaders.js','world/environment.js','character/rig.js'])vm.runInContext(fs.readFileSync(new URL('../../src/'+f,import.meta.url),'utf8'),ctx,{filename:f});
 vm.runInContext('const AssetBank={load:async()=>{}}',ctx);
 for(const f of ['enemies/damage.js','enemies/weakness.js','enemies/sentinel.js','enemies/equipment.js','enemies/bestiary.js','enemies/fauna.js'])vm.runInContext(fs.readFileSync(new URL('../../src/'+f,import.meta.url),'utf8'),ctx,{filename:f});
 const api=vm.runInContext('EnemySentinel',ctx);api.load(fs.readFileSync(new URL('../../public/assets/enemies/sentinel.glb',import.meta.url)).toString('base64'));
 return{ctx,api,run:code=>vm.runInContext(code,ctx)};
}
export const actor=(kind='soldier')=>({id:kind+'-qa',kind,alive:true,x:0,z:0,dir:0,elite:kind==='elite',guard:kind==='soldier',action:'idle',wounds:{},statuses:{}});

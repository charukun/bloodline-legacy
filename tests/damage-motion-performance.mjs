/* CPU pose submission diagnostic; excludes GPU and device frame pacing. */
import fs from 'node:fs';import vm from 'node:vm';import {execFileSync} from 'node:child_process';
import {compileCatalog} from '../tools/skill-catalog.mjs';
const root=new URL('../',import.meta.url),read=f=>fs.readFileSync(new URL('src/'+f,root),'utf8');
const defs=compileCatalog(JSON.parse(read('skills/catalog-source.json'))),result={environment:'Node '+process.version,characters:32,runs:3};
for(const version of ['before','after']){
 const ctx=vm.createContext({console,performance});let code='const BL_SKILL_DEFINITIONS='+JSON.stringify(defs)+';';
 for(const f of ['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','legacy/render_math.js','legacy/motion.js','legacy/art.js'])code+='\n'+(version==='before'?execFileSync('git',['show','4b9693364c5687ffc04bf57101c80394738fe59c:src/'+f],{cwd:root,encoding:'utf8'}):read(f));
 code+=`\nconst r={static:new Map(),dynamic:new Map(),fxBatches:new Map(),put(){},blob(){},add(){}};const a=new ArtDirector(r),ps=Array.from({length:32},(_,i)=>({id:'p'+i,kind:i%2?'soldier':'player',alive:true,x:i,z:0,dir:0,age:24,race:0,gender:0,action:'hit',actionUntil:99,hitReactAt:0,hitReactUntil:99,hitDir:Math.PI/2,hitSeverity:'heavy',hitStrength:1,hitMotionId:1,hitPart:'leftLeg',wounds:{},statuses:{},weapon:-1}));\nthis.bench=()=>{const values=[];for(let i=0;i<360;i++){const t=i/60;for(const p of ps){p.hitReactAt=t-.15;p.hitReactUntil=t+.5;}const start=performance.now();for(const p of ps)a.doll(p,t);const elapsed=performance.now()-start;if(i>=60)values.push(elapsed);}values.sort((a,b)=>a-b);return {mean:values.reduce((a,b)=>a+b,0)/values.length,p50:values[150],p95:values[285],p99:values[297]};};`;
 vm.runInContext(code,ctx);result[version]=Array.from({length:3},()=>ctx.bench());
}
console.log(JSON.stringify(result,null,2));

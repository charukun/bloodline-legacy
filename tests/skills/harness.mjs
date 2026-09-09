import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {compileCatalog} from '../../tools/skill-catalog.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const base='9ee25afc5f67e142adc313813b4289d157d47935';
export const read=p=>fs.readFileSync(path.join(root,p),'utf8');
export const definitions=compileCatalog(JSON.parse(read('src/skills/catalog-source.json')));
export function runtime(baseline=false) {
 const ctx=vm.createContext({console,performance,structuredClone,Date,JSON,Math});
 let source=read('src/legacy/dialogue.js')+'\n'+(baseline?execFileSync('git',['show',base+':src/legacy/core.js'],{cwd:root,encoding:'utf8'}):read('src/legacy/core.js'));
 if(!baseline)source+='\nconst BL_SKILL_DEFINITIONS='+JSON.stringify(definitions)+';\n'+read('src/skills/engine.js')+'\n'+read('src/skills/runtime.js');
 source+='\nglobalThis.API={Simulation,skillById,book,makeVillage,staminaMaximum,skillRestriction,actionTiming,effectsOf'+(baseline?'':',BloodlineSkills,BL_SKILL_CATALOG,SkillSystem,facilityStation')+'};';vm.runInContext(source,ctx);return ctx.API;
}
export function life(api,seed=13) {
 const sim=new api.Simulation({seed}),p=sim.addPlayer('test-'+seed,{owner:'family-'+seed,name:'テスト',race:0});
 Object.assign(p,{prologue:false,age:18,ageFraction:0,introUntil:-100,releaseAt:-100,farewellStage:3,stun:0,cooldown:0});return {sim,p,room:sim.getRoom(p)};
}
export function step(sim,seconds) {for(let i=0;i<Math.round(seconds*30);i++)sim.tick(1/30);}
export function activity(sim,p,id,seconds) {
 const r=sim.getRoom(p),a=r.map.schools.find(x=>({forge:'observe',armory:'care',dance:'play',hunter:'track',sword:'study',magic:'read',church:'pray'})[x.id]===id);if(!a)throw Error('Missing activity '+id);
 Object.assign(p,{...station(a),autoFight:null,input:{x:0,z:0}});
 if(!sim.command(p.id,{type:'activity',activity:id}))throw Error('Activity rejected');step(sim,seconds);sim.command(p.id,{type:'activity',activity:id});
}

let stationRuntime;
export function station(s){stationRuntime??=runtime();const a=stationRuntime.facilityStation(s);return {x:a.x,z:a.z+1};}

// OFFLINE palettes from real auto-combat snapshots. No fabricated connection flags.
import fs from 'node:fs';
import {motionRuntime} from '../tests/skill-motion-harness.mjs';
import {tempoCombat} from '../tests/skill-tempo-harness.mjs';
const [out,revision='',raceArg='0',sequence='sword']=process.argv.slice(2);
if(!out)throw Error('Usage: node tools/capture-skill-tempo.mjs OUTPUT.json [REV] [RACE] [sword|mixed|hammer|incompatible]');
const ids=({sword:[60050,60051,60052],mixed:[60070,60121,60032],hammer:[60000,60001,60002],incompatible:[60010,60001,60002]})[sequence];if(!ids)throw Error('Unknown sequence');
const api=await motionRuntime(revision||null,null,true),race=Number(raceArg),{sim,p}=tempoCombat(api,ids,race),r=api.renderer(),art=new api.VillageArt(r);
r.rigs=new api.RigRenderer(r);r.weaponTips=new Map();r.put=(type,m,c,surf,alpha)=>r.rigs.pending&&r.rigs.capture(type,m,c,surf,alpha);
r.traversalMap=sim.getRoom(p).map;
const frames=[],geometry={},hz=60;let ended=null;
for(let i=0;i<600;i++){
 sim.tick(1/hz);const snapshot=JSON.parse(JSON.stringify(p));
 // Keep the real scene coordinates so visual collision queries see the same
 // actors and scenery as the simulation. The exporter centers its floor.
 r.currentSnapshot=JSON.parse(JSON.stringify(sim.snapshot(p.id)));r.frame++;r.currentTime=sim.time;r.rigs.active.length=0;art.doll(snapshot,sim.time,true);
 const cm=r.characterMaster,rec=r.rigs.records.get(p.id);
 const parts=rec.parts.map((part,j)=>{if(!geometry[part.type]){const g=api.rGeometry(part.type);geometry[part.type]={positions:Array.from(g.positions),normals:Array.from(g.normals)};}return {type:part.type,m:Array.from(rec.palette.slice(j*24,j*24+16)),c:part.c};});
 frames.push({t:sim.time,label:(api.skillById(p.attackSkill)?.name||'')+' / '+p.action+(p.skillCast?.linked?' / CONNECTED':''),p:{x:snapshot.x,z:snapshot.z,action:p.action},palette:Array.from(cm.palette),transforms:cm.transforms.map(m=>Array.from(m)),parts,clip:cm.clipDebug,feet:cm.footDebug,drive:cm.state.drive?{lead:cm.state.drive.lead,stage:cm.state.drive.stage,value:[...cm.state.drive.value]}:null,cast:snapshot.skillCast,attackSkill:p.attackSkill});
 if(p.action==='recover'&&ended===null)ended=p.actionUntil;
 if(ended!==null&&sim.time+1/hz>=ended)break;
}
const target=api.Travelers.prepare(race).lods[0],asset={attrs:Object.fromEntries(Object.entries(target.attrs).map(([k,v])=>[k,Array.from(v)])),indices:Array.from(target.indices)};
fs.writeFileSync(out,JSON.stringify({asset,hz,key:sequence,duration:frames.at(-1).t,revision:revision||'working-tree',race,geometry,frames,events:sim.events.filter(e=>['charge','skill','hit','skillconnection','recovery'].includes(e.type)),state:sim.exportState()}));
console.log(JSON.stringify({out,frames:frames.length,connections:sim.events.filter(e=>e.type==='skillconnection').map(e=>[e.from,e.id])}));

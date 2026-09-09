import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {harness,actor} from './enemies/harness.mjs';
const {api,run}=harness();
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
test('source model is reduced and all eight animation states are available',()=>{
 const r=JSON.parse(fs.readFileSync(new URL('../public/assets/enemies/asset-report.json',import.meta.url)));assert(r.runtimeBytes<800000);assert(r.bones===23&&r.runtimePrimitives===1&&r.runtimeTextures===0);assert(api.asset.indices.length/3===5104);assert.equal(Object.keys(api.asset.clips).length,8);
});
test('only the two reviewed humanoid types are replaced',()=>{
 assert(api.eligible(actor()));assert(api.eligible(actor('elite')));for(const k of ['player','guard','dummy','goblin','maw','crawler','wraith','stag','mushroom','boss'])assert(!api.eligible(actor(k)));
});
test('telegraph and recovery meet at the exact authored strike pose without writing simulation',()=>{
 for(const kind of ['soldier','elite'])for(const lost of [false,true]){
  const base=actor(kind);if(lost)base.wounds.rightArm={severity:'lost'};
  const p=freeze({...base,telegraph:{started:3,at:4.35},action:'windup'}),q=freeze({...base,action:'attack',actionStarted:4.35,actionUntil:5.1});
  const a=api.pose(p,4.35),b=api.pose(q,4.35);assert.equal(a.timing.time,b.timing.time);assert.deepEqual(a.palette,b.palette);assert.equal(p.telegraph.at,4.35);
 }
});
test('walk, guard, hit, lost limbs and death produce finite palettes and valid sockets',()=>{
 for(const kind of ['soldier','elite'])for(const action of ['idle','run','guard','windup','attack','hit','death']){
  let rec={};for(let i=0;i<60;i++){let p={...actor(kind),action,x:action==='run'?i*.04:0};const t=i/60;
   if(action==='windup')p.telegraph={started:0,at:1.35};if(action==='attack')Object.assign(p,{actionStarted:0,actionUntil:.75});if(action==='hit')Object.assign(p,{hitReactAt:0,hitReactUntil:.8,hitSeverity:'heavy',hitDir:1});if(action==='death')Object.assign(p,{alive:false,deathAt:0});
   const before=JSON.stringify(p);rec=api.pose(freeze(p),t,rec);assert(rec.palette.every(Number.isFinite));for(const m of Object.values(rec.sockets))assert(m.every(Number.isFinite));assert.equal(JSON.stringify(p),before);
  }
 }
});
test('distance drives run phase; fixed pose clock keeps hitstop stationary',()=>{
 let rec=api.pose(actor(),2);const phase=rec.phase||0;rec=api.pose({...actor(),action:'run'},2.1,rec);assert.equal(rec.phase,phase);rec=api.pose({...actor(),action:'run',x:.5},2.2,rec);assert(rec.phase>phase);
 const p=freeze({...actor(),action:'attack',actionStarted:1,actionUntil:2,renderPoseTime:1.5,hitstopUntil:2});assert.deepEqual(api.pose(p,1.6).palette,api.pose(p,1.7).palette);
});
test('a shield-bearing soldier runs while its persistent gameplay guard flag remains set',()=>{
 const p=freeze({...actor(),guard:true,action:'run'});assert.equal(api.clock(p,2,.4).name,'run');assert.equal(p.guard,true);
});
test('malformed GLB bounds fail instead of loading a blank model',()=>{
 const b=fs.readFileSync(new URL('../public/assets/enemies/sentinel.glb',import.meta.url));const wrong=Buffer.from(b);wrong.writeUInt32LE(b.length+4,8);assert.throws(()=>api.load(wrong.toString('base64')),/invalid GLB/);api.load(b.toString('base64'));
});
test('equipment follows both hand sockets and lost right arm removes the weapon tip',()=>{
 const result=run(`(()=>{const r={dynamic:new Map(),weaponTips:new Map(),put(){}};const art=new VillageArt(r),p={id:'test',kind:'soldier',x:0,z:0,dir:0,alive:true,wounds:{},statuses:{}};const rec=EnemySentinel.pose(p,0);art.sentinelEquipment(p,rec);const armed=r.weaponTips.has(p.id);r.weaponTips.clear();p.wounds.rightArm={severity:'lost'};art.sentinelEquipment(p,rec);return [armed,r.weaponTips.has(p.id)];})()`);assert.deepEqual(Array.from(result),[true,false]);
});
test('GPU geometry is shared; stale enemies release their palettes',()=>{
 let vaos=0,textures=0,deleted=0;const gl=new Proxy({FLOAT:5126,UNSIGNED_SHORT:5123,createVertexArray:()=>({id:++vaos}),createTexture:()=>({id:++textures}),deleteTexture:()=>deleted++,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:k.startsWith('create')?()=>({}):()=>{}});
 const r={gl,frame:0,programOf:()=>({u:new Map()})};const adapter=new api.RendererAdapter(r);
 for(let i=0;i<12;i++)adapter.update({...actor(),id:'enemy-'+i},0);assert.equal(vaos,1);assert.equal(adapter.records.size,12);r.frame=4;adapter.prune();assert.equal(adapter.records.size,0);assert.equal(deleted,12);adapter.dispose();
});
test('authored weapon has completed its downstroke at gameplay impact',()=>{
 for(const kind of ['soldier','elite']){
  const p={...actor(kind),action:'windup',telegraph:{started:0,at:1.35}};
  const before=api.pose(p,1),impact=api.pose(p,1.35),tip=rec=>{const m=rec.sockets.rightHand;return [m[13]+m[5],m[14]+m[6]];};
  assert(tip(impact)[0]<tip(before)[0]-.7);assert(tip(impact)[1]>tip(before)[1]+.5);
 }
});
test('damaged replacement body still submits persistent wound marks',()=>{
 const result=run(`(()=>{let calls=0;const r={dynamic:new Map(),put(){calls++;}},art=new VillageArt(r),p={id:'scar',kind:'soldier',x:0,z:0,dir:0,alive:true,wounds:{head:{severity:'heavy'}},statuses:{}};const rec=EnemySentinel.pose(p,0);art.sentinelScars(p,rec);return calls;})()`);assert(result>=4);
});
test('lost-right-arm attack strikes with the surviving left hand at contact',()=>{
 const p=freeze({...actor(),wounds:{rightArm:{severity:'lost'}},telegraph:{started:0,at:1.35}}),before=api.pose(p,1.08),impact=api.pose(p,1.35);
 assert.equal(impact.timing.time,.5);assert(impact.sockets.leftHand[14]>before.sockets.leftHand[14]+.5);assert(impact.sockets.leftHand[14]>impact.sockets.rightHand[14]+1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {harness,actor} from './enemies/harness.mjs';
const h=harness(),forms=h.run('Object.values(ENEMY_FORMS).flat()');
h.run(`function drawForm(form,time=0,extra={}){
 const batches=[],r={frame:0,dynamic:new Map(),fxBatches:new Map(),weaponTips:new Map(),put(type,m,c,surface){batches.push({type,m:Array.from(m),c,surface});},blob(){}};
 const art=new VillageArt(r),p={id:'shape',kind:form.kind,enemyForm:form.id,x:0,z:0,dir:0,alive:true,action:'idle',wounds:{},statuses:{},...extra};
 let rec;if(EnemySentinel.eligible(p)){rec=EnemySentinel.pose(p,time);art.sentinelEquipment(p,rec);}else{EnemyCreatures.draw(art,p,time);rec=r.enemyCreatures.get(p.id);}
 return {batches,rec,p,r};
}`);
test('31 hostile forms and 2 neutral creatures are available, each with a distinct uncolored construction',()=>{
 assert.equal(forms.filter(f=>!['stag','mushroom'].includes(f.kind)).length,31);assert.equal(forms.length,33);
 const signatures=new Map();
 for(const f of forms){h.ctx.form=f;const out=h.run('drawForm(form)'),scale=out.rec.config.scale;
  assert(out.batches.length>15,f.id);
  const shape=out.batches.map(b=>[b.type,b.m.map((v,i)=>+(i%4===3?v:(v-(i===13?.2:0))/scale[i%4]).toFixed(3))]);
  const signature=createHash('sha256').update(JSON.stringify(shape)).digest('hex');assert(!signatures.has(signature),f.id+' duplicates '+signatures.get(signature));signatures.set(signature,f.id);
  for(const b of out.batches){assert(b.m.every(Number.isFinite));h.ctx.meshType=b.type;const g=h.run('rGeometry(meshType)');assert(g.count>0,f.id+' '+b.type);assert(g.normals.every(Number.isFinite));}
 }
});
test('all forms preserve the strike pose at the existing telegraph/recovery boundary and provide hit sockets',()=>{
 for(const f of forms){h.ctx.form=f;
  const a=h.run('drawForm(form,1.35,{telegraph:{started:0,at:1.35}})'),b=h.run('drawForm(form,1.35,{action:"attack",actionStarted:1.35,actionUntil:2.1})');
  assert.deepEqual(a.batches.map(x=>x.m),b.batches.map(x=>x.m),f.id);
  for(const m of Object.values(a.rec.sockets))assert(Array.from(m).every(Number.isFinite));
 }
});
test('all creature gaits use distance, freeze with hitstop and stay within a bounded record cache',()=>{
 for(const f of forms.filter(f=>!['soldier','elite'].includes(f.kind))){
  h.ctx.form=f;const ok=h.run(`(()=>{const p={...form,enemyForm:form.id,x:0,z:0,alive:true,action:'run'},r={};EnemyCreatures.motion(p,1,r);EnemyCreatures.motion(p,1.1,r);if(r.phase)return false;EnemyCreatures.motion({...p,x:.1},1.2,r);if(!(r.phase>0))return false;const phase=r.phase;EnemyCreatures.motion({...p,x:.2,renderPoseTime:1.2},1.3,r);return phase===r.phase;})()`);assert(ok,f.id);
 }
 const count=h.run(`(()=>{const r={frame:0,dynamic:new Map(),fxBatches:new Map(),put(){},blob(){}},art=new VillageArt(r);for(let i=0;i<60;i++){r.frame=i;EnemyCreatures.draw(art,{id:'e'+i,kind:'crawler',alive:true,action:'idle',x:0,z:0,wounds:{},statuses:{}},i/60);}return r.enemyCreatures.size;})()`);assert(count<=3);
});
test('limb loss removes articulated creature sockets and guard/damage/death states keep finite geometry',()=>{
 for(const f of forms){h.ctx.form=f;
  for(const state of [{action:'guard',guard:true},{hitReactAt:0,hitReactUntil:.7,hitSeverity:'heavy',hitDir:.8},{alive:false,deathAt:0},{wounds:{rightArm:{severity:'lost'},leftLeg:{severity:'lost'}}}]){
   h.ctx.extra=state;const out=h.run('drawForm(form,.4,extra)');assert(out.batches.every(b=>b.m.every(Number.isFinite)),f.id);
   if(state.wounds&&out.r.enemyCreatures){assert(!out.rec.sockets.rightArm,f.id);assert(!out.rec.sockets.leftLeg,f.id);}
  }
 }
});
test('form assignment preserves develop combat stats, RNG, AI and spawn quotas',()=>{
 const source=execFileSync('git',['show','c53f9b2c918ff71525b76ea4b20c8b530429a26e:src/legacy/core.js'],{encoding:'utf8'}),ctx=vm.createContext({console});
 vm.runInContext(fs.readFileSync(new URL('../src/legacy/dialogue.js',import.meta.url),'utf8')+'\n'+source,ctx);
 const baseline=vm.runInContext('new Simulation({seed:7349})',ctx),current=h.run('new Simulation({seed:7349})');
 for(const kind of ['goblin','soldier','elite','crawler','maw','wraith','boss','stag','mushroom','guard','dummy'])for(let i=0;i<9;i++){
  const a=baseline.actor(kind,i*.3,-34,i%3),b=current.actor(kind,i*.3,-34,i%3);
  delete a.name;delete b.name;delete b.enemyForm;assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),kind);
 }
 assert.equal(baseline.rng.getState(),current.rng.getState());
 for(let stage=0;stage<6;stage++){
  const a={actors:[],stage,quota:8,kills:0},b={actors:[],stage,quota:8,kills:0};baseline.spawnFrontWave(a);current.spawnFrontWave(b);
  const clean=room=>JSON.parse(JSON.stringify(room,(key,value)=>['name','enemyForm'].includes(key)?undefined:value));assert.deepEqual(clean(a),clean(b));
 }
});
test('normal front spawns reach every hostile form and new/legacy saves retain their identity',()=>{
 const result=h.run(`(()=>{const s=new Simulation({seed:7349}),seen=new Set();
  for(let pass=0;pass<100;pass++)for(let stage=0;stage<6;stage++){const room={actors:[],stage,quota:8,kills:0};s.spawnFrontWave(room);room.actors.forEach(a=>seen.add(a.enemyForm));}
  const player=s.addPlayer('save-test',{owner:'save-test'}),room=s.getRoom(player);room.actors=[s.actor('soldier',0,-35),s.actor('maw',1,-35)];
  // Village restore also repairs authored ship dummies and clinic staff; keep this assertion on the saved combat actors.
  const combatActors=room=>room.actors.filter(a=>a.shipStation==null&&a.role!=='medic');
  const data=s.exportState(),expected=room.actors.map(a=>a.enemyForm);const restored=combatActors(Simulation.restore(JSON.parse(JSON.stringify(data))).getRoom(player)).map(a=>a.enemyForm);
  const legacy=JSON.parse(JSON.stringify(data));for(const [,r]of legacy.rooms)for(const a of r.actors)delete a.enemyForm;
  const old=combatActors(Simulation.restore(legacy).getRoom(player));
  return {seen:[...seen],expected,restored,old:old.map(a=>({form:enemyForm(a).id,kind:a.kind,hasField:Object.hasOwn(a,'enemyForm')}))};
 })()`);
 assert.equal(result.seen.length,31);assert.deepEqual(result.restored,result.expected);
 for(const a of result.old){assert.equal(a.form,a.kind);assert.equal(a.hasField,false);}
});

test('all enemy rigs and their hit sockets follow raised terrain without changing pose',()=>{
 for(const f of forms){h.ctx.form=f;const a=h.run('drawForm(form,.4)'),b=h.run('drawForm(form,.4,{supportHeight:1.2,verticalOffset:.3})');
  assert.equal(a.batches.length,b.batches.length);
  for(let i=0;i<a.batches.length;i++)for(let k=0;k<16;k++)assert(Math.abs(b.batches[i].m[k]-a.batches[i].m[k]-(k===13?1.5:0))<2e-6,f.id+' mesh height');
  for(const key of Object.keys(a.rec.sockets)){const x=a.rec.sockets[key],y=b.rec.sockets[key],k=x.length===16?13:1;assert(Math.abs(y[k]-x[k]-1.5)<2e-6,f.id+' '+key);}
 }
});

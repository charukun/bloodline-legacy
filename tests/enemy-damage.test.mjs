import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {harness} from './enemies/harness.mjs';
const h=harness();
vm.runInContext(fs.readFileSync(new URL('../tools/enemies/review-scenes.js',import.meta.url),'utf8'),h.ctx);
h.run(`function damageFixture(form,level,part,time=1.35,quality='medium',extra={}){
 const batches=[],r={frame:0,quality,dynamic:new Map(),fxBatches:new Map(),weaponTips:new Map(),put(type,m,c,surface){batches.push({type,m:Array.from(m),c,surface});},blob(){}},art=new VillageArt(r);
 const p=EnemyReview.damage({id:'damage-fixture',kind:form.kind,enemyForm:form.id,hpMax:100,hp:100,x:0,z:0,dir:0,alive:true,action:'idle',wounds:{},statuses:{},...extra},level,part),before=JSON.stringify(p);
 let rec;if(EnemySentinel.eligible(p)){rec=EnemySentinel.pose(p,time);art.sentinelEquipment(p,rec);art.sentinelScars(p,rec);}else{EnemyCreatures.draw(art,p,time);rec=r.enemyCreatures.get(p.id);}
 return{p,rec,batches,weaponTip:r.weaponTips.get(p.id),unchanged:before===JSON.stringify(p),triangles:batches.reduce((n,b)=>n+rGeometry(b.type).count/3,0)};
}`);
const plain=v=>JSON.parse(JSON.stringify(v));
const forms=h.run('Object.values(ENEMY_FORMS).flat()');

test('damage marks and broken surfaces follow raised ground for every enemy form',()=>{
 for(const form of forms){h.ctx.form=form;
  for(const level of ['heavy','lost']){h.ctx.level=level;
   const flat=h.run("damageFixture(form,level,'rightArm')");
   const raised=h.run("damageFixture(form,level,'rightArm',1.35,'medium',{supportHeight:1.2,verticalOffset:.3})");
   assert(flat.unchanged&&raised.unchanged,form.id+' read only');
   assert.equal(raised.batches.length,flat.batches.length,form.id);
   for(let i=0;i<flat.batches.length;i++){
    const a=flat.batches[i],b=raised.batches[i];assert.equal(a.type,b.type);
    for(let k=0;k<16;k++)assert.ok(Math.abs(b.m[k]-a.m[k]-(k===13?1.5:0))<1e-5,form.id+' '+a.type+' ground translation');
   }
  }
 }
});

test('whole-body damage follows lost HP alone, monotonically and within bounds',()=>{
 for(const values of [{},{hp:NaN,hpMax:100},{hp:1,hpMax:Infinity},{hp:100,hpMax:0},{hp:100,hpMax:-10}]){h.ctx.p=values;assert.equal(h.run('EnemyDamage.state(p).wear'),0);}
 let prior=0;
 for(const [hp,stage]of [[120,0],[100,0],[99,1],[82,1],[60,2],[52,2],[30,3],[22,3],[0,3],[-100,3]]){
  h.ctx.p={hp,hpMax:100};const s=h.run('EnemyDamage.state(p)'),amount=Math.max(0,Math.min(1,1-hp/100));
  assert.equal(s.wear,amount);assert(s.wear>=prior);prior=s.wear;
  for(const part of Object.values(s.parts)){assert.equal(part.amount,amount);assert.equal(part.stage,stage);assert.equal(part.lost,false);}
 }
});

test('local hit severity/counts cannot advance whole-body wear; loss is independent of HP',()=>{
 for(const hp of [100,52,0]){
  h.ctx.p={hp,hpMax:100};const clean=plain(h.run('EnemyDamage.state(p)'));
  h.ctx.p.wounds={head:{severity:'heavy'},leftArm:{severity:'light'}};
  h.ctx.p.damageMarks={head:{depth:1000,hits:1000},leftArm:{depth:-10,hits:NaN}};
  assert.deepEqual(plain(h.run('EnemyDamage.state(p)')),clean);
  h.ctx.p.wounds.rightArm={severity:'lost'};clean.parts.rightArm.lost=true;
  assert.deepEqual(plain(h.run('EnemyDamage.state(p)')),clean);
 }
 for(const form of forms){h.ctx.form=form;
  const clean=h.run("damageFixture(form,'auto','torso',1.35,'medium',{hp:100})");
  const local=h.run("damageFixture(form,'auto','torso',1.35,'medium',{hp:100,wounds:{head:{severity:'heavy'}},damageMarks:{head:{depth:5,hits:4}}})");
  assert.deepEqual(plain(local.batches),plain(clean.batches),form.id+' no local persistent marks at full HP');
  const low=h.run("damageFixture(form,'auto','torso',1.35,'medium',{hp:22})");
  assert(low.batches.some(b=>b.type==='enemy:split'),form.id+' low HP alone creates whole-body scars');
  const restored=h.run("damageFixture(form,'auto','torso',1.35,'medium',{hp:100,wounds:{rightArm:{severity:'lost'}}})");
  assert(restored.batches.some(b=>b.type==='enemy:break-rim'),form.id+' restoring HP retains actual break');
  assert.equal(restored.rec.damage.wear,0);
 }
});

test('review vitality, broken part and motion controls are independent in all poses',()=>{
 const result=h.run(`(()=>{
  const sim=new Simulation({seed:7349}),templates=Object.fromEntries(Object.keys(ENEMY_FORMS).map(k=>[k,sim.actor(k,0,0)])),before=JSON.stringify(templates),rows=[];
  for(const pose of ['sequence','idle','attack','run','guard','hit','death'])for(const time of [0,1.4,9.3,11])for(const vitality of [100,52,0])for(const brokenPart of ['none','rightArm','leftLeg']){
   const p=EnemyReview.sample(templates,{form:'all',count:EnemyReview.forms.length,pose,time,vitality,brokenPart}).actors;
   rows.push(...p.map(a=>({ratio:a.hp/a.hpMax,parts:Object.keys(a.wounds),expected:vitality/100,brokenPart})));
  }
  return {rows,unchanged:before===JSON.stringify(templates)};
 })()`);
 assert(result.unchanged);
 for(const row of result.rows){assert(Math.abs(row.ratio-row.expected)<1e-12);assert.deepEqual(Array.from(row.parts),row.brokenPart==='none'?[]:[row.brokenPart]);}
});

test('all catalog forms retain finite, bounded staged marks without mutating actors',()=>{
 for(const form of forms){h.ctx.form=form;
  for(const part of ['head','torso','rightArm','leftArm','rightLeg','leftLeg']){h.ctx.part=part;
   const clean=h.run(`damageFixture(form,'clean',part)`);assert.equal(clean.batches.filter(b=>b.type.startsWith('enemy:')&&['enemy:stain','enemy:split','enemy:break-rim'].includes(b.type)).length,0,form.id);
   for(const level of ['light','medium','heavy','lost']){h.ctx.level=level;
    const out=h.run('damageFixture(form,level,part)'),low=h.run("damageFixture(form,level,part,1.35,'low')");
    assert(out.unchanged,form.id);assert(out.batches.every(b=>b.m.every(Number.isFinite)),form.id+' '+part+' '+level);
    assert(out.batches.some(b=>b.type==='enemy:stain'),form.id+' has visible wear');
    assert(low.triangles<=out.triangles,form.id+' low detail');
    const marks=out.batches.filter(b=>['enemy:stain','enemy:split','enemy:break-rim'].includes(b.type));
    const triangles=marks.reduce((n,b)=>{h.ctx.mesh=b.type;return n+h.run('rGeometry(mesh).count/3');},0);
    assert(triangles<=350,`${form.id} damage geometry budget ${triangles}`);
    if(level==='lost'&&/Arm|Leg/.test(part)){
     assert(out.rec.breaks.length>0,form.id+' '+part+' cap');assert(marks.some(b=>b.type==='enemy:break-rim'));
     if(!['soldier','elite'].includes(form.kind))assert(!out.rec.sockets[part],form.id+' no lost combat socket');
    }else assert.equal(out.rec.breaks.length,0,form.id+' no false dismemberment');
   }
  }
 }
});

test('marks follow moving parts, are deterministic during hitstop and persist through death',()=>{
 for(const form of forms){h.ctx.form=form;
  const still=h.run("damageFixture(form,'heavy','head',.1,'medium',{telegraph:{started:0,at:1.35}})"),moving=h.run("damageFixture(form,'heavy','head',.6,'medium',{telegraph:{started:0,at:1.35}})"),again=h.run("damageFixture(form,'heavy','head',.6,'medium',{telegraph:{started:0,at:1.35}})");
  const marks=x=>x.batches.filter(b=>b.type==='enemy:split').map(b=>b.m);
  assert.deepEqual(marks(moving),marks(again),form.id+' deterministic');assert.notDeepEqual(marks(still),marks(moving),form.id+' articulated');
  const dead=h.run("damageFixture(form,'lost','rightArm',1.35,'medium',{alive:false,deathAt:0})");
  assert(dead.batches.some(b=>b.type==='enemy:break-rim'),form.id+' lasting broken rim');assert(dead.rec.damage.parts.rightArm.lost);
  const frozenA=h.run("damageFixture(form,'heavy','head',.6,'medium',{renderPoseTime:.4})"),frozenB=h.run("damageFixture(form,'heavy','head',.9,'medium',{renderPoseTime:.4})");
  assert.deepEqual(marks(frozenA),marks(frozenB),form.id+' hitstop');
 }
});

test('equipped bones lose shoulder armor and the weapon follows the weakened posture',()=>{
 for(const form of forms.filter(f=>['soldier','elite'].includes(f.kind))){h.ctx.form=form;
  const clean=h.run("damageFixture(form,'clean','torso')"),worn=h.run("damageFixture(form,'heavy','torso')");
  assert(clean.weaponTip?.every(Number.isFinite),form.id);assert(worn.weaponTip?.every(Number.isFinite),form.id+' finite posed weapon');assert.notDeepEqual(clean.weaponTip,worn.weaponTip,form.id+' weapon follows fatigue posture');
  const lost=h.run("damageFixture(form,'lost','rightArm')");
  assert(lost.batches.filter(b=>!b.type.startsWith('enemy:')).length<clean.batches.length,form.id+' removed equipment');
 }
});

test('existing snapshot/save damage data restores identical presentation without advancing RNG',()=>{
 const result=h.run(`(()=>{
  const sim=new Simulation({seed:7349}),player=sim.addPlayer('damage-save',{owner:'damage-save'}),room=sim.getRoom(player);
  room.actors=Object.values(ENEMY_FORMS).flat().map((f,i)=>EnemyReview.damage({...sim.actor(f.kind,i,-34),enemyForm:f.id},['light','medium','heavy','lost'][i%4],'rightArm'));
  const rng=sim.rng.getState(),expected=room.actors.map(EnemyDamage.state),encoded=JSON.stringify(sim.exportState());
  room.actors.forEach(p=>EnemyDamage.state(p));const unchanged=rng===sim.rng.getState()&&encoded===JSON.stringify(sim.exportState());
  const saved=Simulation.restore(JSON.parse(encoded)).getRoom(player).actors.map(EnemyDamage.state);
  return{expected,saved,unchanged};
 })()`);
 assert(result.unchanged);assert.deepEqual(plain(result.saved),plain(result.expected));
});


test('real repeated combat damage matches pinned develop wounds, HP, events and RNG',()=>{
 const ctx=vm.createContext({console,BL_SKILL_DEFINITIONS:h.ctx.BL_SKILL_DEFINITIONS});
 const core=execFileSync('git',['show','8050da52899d5fd3761ca1f51383be2aea80c99d:src/legacy/core.js'],{encoding:'utf8'});
 vm.runInContext(fs.readFileSync(new URL('../src/legacy/dialogue.js',import.meta.url),'utf8')+'\n'+core,ctx);
 for(const f of ['engine','runtime'])vm.runInContext(fs.readFileSync(new URL('../src/skills/'+f+'.js',import.meta.url),'utf8'),ctx);
 const script=`(()=>{const s=new Simulation({seed:7349}),p=s.addPlayer('combat-damage',{owner:'combat-damage'}),room=s.getRoom(p),results=[];
 for(const kind of ['goblin','soldier','elite','crawler','maw','wraith','boss','stag','mushroom']){
 const e=s.actor(kind,0,0);room.actors=[e];
 for(const [part,power]of [['rightArm',.5],['torso',1],['head',2],['leftLeg',3]]){s.time+=1;s.damageActor(e,p,part,power,room);results.push(JSON.parse(JSON.stringify(e)));}
 }return {results,rng:s.rng.getState(),events:s.events};})()`;
 const clean=v=>JSON.parse(JSON.stringify(v,(k,val)=>['enemyForm','name'].includes(k)?undefined:val));
 assert.deepEqual(clean(h.run(script)),clean(vm.runInContext(script,ctx)));
});

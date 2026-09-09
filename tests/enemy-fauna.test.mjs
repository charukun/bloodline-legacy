import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {harness} from './enemies/harness.mjs';
const h=harness();
h.run(`function faunaFrame(id,extra={},time=1.35){
 const f=Object.values(ENEMY_FORMS).flat().find(f=>f.id===id),p={id:'fauna-test',kind:f.kind,enemyForm:id,x:0,z:0,dir:0,alive:true,action:'run',hp:100,hpMax:100,wounds:{},statuses:{},...extra};
 const batches=[],r={frame:0,quality:'medium',dynamic:new Map(),fxBatches:new Map(),enemyCreatures:new Map([[p.id,{time,phase:1.2,x:0,z:0}]]),put(type,m,c,s){batches.push({type,m:Array.from(m),c,s});},blob(){}};
 const a=new VillageArt(r),before=JSON.stringify(p);EnemyCreatures.draw(a,p,time);
 return {batches,rec:r.enemyCreatures.get(p.id),unchanged:before===JSON.stringify(p)};
}`);
const ids=h.run('EnemyFauna.ids');
test('eight authored species appear in the mixed review and have normal spawn identities',()=>{
 h.run(fs.readFileSync(new URL('../tools/enemies/review-scenes.js',import.meta.url),'utf8'));
 assert.equal(ids.length,8);
 const mixed=h.run('EnemyReview.mixed.map(f=>f.id)');assert.equal(mixed.length,41);assert.equal(new Set(mixed).size,41);
 for(const id of ids){assert(mixed.includes(id));h.ctx.id=id;assert(h.run('EnemyCreatures.eligible({kind:Object.values(ENEMY_FORMS).flat().find(f=>f.id===id).kind,enemyForm:id})'));}
});
test('new species remove only the actual lost appendage groups and retain damage anchors',()=>{
 for(const id of ids){h.ctx.id=id;
  for(let mask=0;mask<16;mask++){
   const limbs=['rightArm','leftArm','rightLeg','leftLeg'],wounds=Object.fromEntries(limbs.filter((_,i)=>mask&(1<<i)).map(k=>[k,{severity:'lost'}]));h.ctx.extra={wounds,hp:20};
   const f=h.run('faunaFrame(id,extra)');assert(f.unchanged,id);assert(f.batches.every(b=>b.m.every(Number.isFinite)),id);
   for(const part of ['torso','head',...limbs]){
    if(wounds[part]){assert(!f.rec.sockets[part],id+' '+part);assert(f.rec.breaks.some(b=>b.part===part),id+' break '+part);}
    else{assert(f.rec.sockets[part],id+' socket '+part);assert(f.rec.damageAnchors[part],id+' mark '+part);}
   }
  }
 }
});
test('eight species keep an exact contact pose and hold their complete shape during frozen time',()=>{
 for(const id of ids){h.ctx.id=id;
  const before=h.run('faunaFrame(id,{telegraph:{started:0,at:1.35},action:"windup"})');
  const after=h.run('faunaFrame(id,{action:"attack",actionStarted:1.35,actionUntil:2.1})');assert.deepEqual(before.batches,after.batches,id+' contact');
  const held=h.run('faunaFrame(id,{renderPoseTime:1.35},2)'),same=h.run('faunaFrame(id,{renderPoseTime:1.35},4)');assert.deepEqual(held.batches,same.batches,id+' frozen');
  const anticipation=h.run('faunaFrame(id,{telegraph:{started:0,at:1.35},action:"windup"},1)');assert.notDeepEqual(anticipation.batches,after.batches,id+' visible attack');
 }
});
test('new constructions use shared opaque geometry and fit a 5000-triangle healthy-body budget',()=>{
 h.run('EnemyCreatures.install();EnemyDamage.install()');const start=h.run('RG_CACHE.size');
 for(const id of ids){h.ctx.id=id;const row=h.run(`(()=>{const f=faunaFrame(id);return{triangles:f.batches.reduce((n,b)=>n+rGeometry(b.type).count/3,0),types:new Set(f.batches.map(b=>b.type)).size};})()`);
  assert(row.triangles<=5000,id+' '+row.triangles);assert(row.types<=9,id+' batches');
 }
 const warmed=h.run('RG_CACHE.size');for(let i=0;i<100;i++){h.ctx.id=ids[i%ids.length];h.run('faunaFrame(id,{hp:20,wounds:{rightArm:{severity:"lost"}}})');}
 assert.equal(h.run('RG_CACHE.size'),warmed,'no per-enemy geometry');assert(warmed>=start);
});

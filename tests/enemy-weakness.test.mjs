import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness} from './enemies/harness.mjs';
const h=harness(),plain=v=>JSON.parse(JSON.stringify(v));
vm.runInContext(fs.readFileSync(new URL('../tools/enemies/review-scenes.js',import.meta.url),'utf8'),h.ctx);
const p={id:'weakness',kind:'soldier',hp:100,hpMax:100,x:0,z:0,alive:true,dir:0,action:'run',wounds:{},statuses:{}};

test('enemy fatigue is global; HP and loss derive independent, bounded behavior',()=>{
 for(const kind of ['player','guard','dummy','villager']){h.ctx.p={...p,kind,hp:1};assert.equal(h.run('enemyCondition(p).move'),1);assert.equal(h.run('enemyCondition(p).recovery'),0);}
 let move=1,recovery=0;
 for(const hp of [100,70,50,25,1,0]){h.ctx.p={...p,hp};const c=h.run('enemyCondition(p)');assert(c.move<=move&&c.move>=.84);assert(c.recovery>=recovery);assert.equal(c.legs,0);move=c.move;recovery=c.recovery;}
 h.ctx.p={...p,wounds:{rightLeg:{severity:'lost'},leftLeg:{severity:'lost'}}};assert(h.run('enemyCondition(p).crawl'));
 h.ctx.p.kind='maw';assert(h.run('enemyCondition(p).drag'));assert(!h.run('enemyCondition(p).crawl'));
});

test('remaining HP changes spine/head height; missing legs produce a low crawling body',()=>{
 h.ctx.p={...p,action:'idle'};const healthy=h.run('EnemySentinel.pose(p,1.35)');
 h.ctx.p.hp=20;const weak=h.run('EnemySentinel.pose(p,1.35)');assert(weak.sockets.head[13]<healthy.sockets.head[13]-.12);
 h.ctx.p.hp=100;h.ctx.p.wounds={rightLeg:{severity:'lost'},leftLeg:{severity:'lost'}};
 const crawl=h.run('EnemySentinel.pose(p,1.35)');assert(crawl.sockets.chest[13]<healthy.sockets.chest[13]-.20);assert(crawl.weakness.crawl);
 for(const key of ['rightHand','leftHand'])assert(crawl.sockets[key][13]<crawl.sockets.chest[13],key+' supports below chest');
});

test('all missing-limb combinations keep finite bones, sockets and moving/frozen crawling hands',()=>{
 const parts=['rightArm','leftArm','rightLeg','leftLeg'];
 for(let mask=0;mask<16;mask++)for(const hp of [100,20])for(const action of ['idle','run','attack']){
  h.ctx.p={...p,hp,action,actionStarted:1,actionUntil:3,wounds:Object.fromEntries(parts.filter((_,i)=>mask&(1<<i)).map(k=>[k,{severity:'lost'}]))};
  const before=JSON.stringify(h.ctx.p),a=h.run('EnemySentinel.pose(p,1.2,{phase:.17})');
  assert(a.palette.every(Number.isFinite));for(const s of Object.values(a.sockets))assert(s.every(Number.isFinite));assert.equal(JSON.stringify(h.ctx.p),before);
 }
 h.ctx.p={...p,wounds:{rightLeg:{severity:'lost'},leftLeg:{severity:'lost'}}};
 const a=h.run('EnemySentinel.pose(p,1,{phase:.15})'),b=h.run('EnemySentinel.pose(p,1.1,{phase:.65})');assert.notDeepEqual(Array.from(a.sockets.leftHand),Array.from(b.sockets.leftHand));
 h.ctx.p.renderPoseTime=1;assert.deepEqual(Array.from(h.run('EnemySentinel.pose(p,2,{phase:.15}).palette')),Array.from(h.run('EnemySentinel.pose(p,3,{phase:.15}).palette')));
});

test('fatigued and crawling attacks meet their exact existing impact pose',()=>{
 for(const hp of [100,50,20])for(const broken of ['none','rightArm','rightLeg','bothLegs','rightArmLeftLeg']){
  h.ctx.p={...p,hp};h.ctx.broken=broken;h.run('EnemyReview.vitality(p,p.hp,broken)');
  const before=h.run('EnemySentinel.pose({...p,action:"windup",telegraph:{started:0,at:1.35}},1.35,{phase:.2})');
  const after=h.run('EnemySentinel.pose({...p,action:"attack",actionStarted:1.35,actionUntil:2.1+enemyCondition(p).recovery},1.35,{phase:.2})');
  assert.deepEqual(Array.from(before.palette),Array.from(after.palette),hp+' '+broken);
 }
});

test('all creature forms support weakness/break poses through motion and death with finite geometry',()=>{
 const result=h.run(`(()=>{const rows=[];for(const f of Object.values(ENEMY_FORMS).flat().filter(f=>!['soldier','elite'].includes(f.kind))){
  for(const broken of ['none','rightLeg','bothLegs','rightArmLeftLeg'])for(const action of ['idle','run','attack','death']){
   const r={frame:1,dynamic:new Map(),fxBatches:new Map(),put(type,m){if(!m.every(Number.isFinite))throw Error(f.id+' '+broken);},blob(){}},art=new VillageArt(r);
   const p=EnemyReview.vitality({id:'creature-test',kind:f.kind,enemyForm:f.id,hpMax:100,x:0,z:0,alive:action!=='death',action,actionStarted:0,actionUntil:2,deathAt:0,wounds:{},statuses:{}},20,broken),before=JSON.stringify(p);
   EnemyCreatures.draw(art,p,.7);const rec=r.enemyCreatures.get(p.id);rows.push({same:before===JSON.stringify(p),finite:Object.values(rec.sockets).every(v=>v.every(Number.isFinite))});
  }
 }return rows;})()`);
 assert(result.every(r=>r.same&&r.finite));
});

test('real AI slows with HP, retains existing leg multipliers and extends recovery without extra strikes',()=>{
 const result=h.run(`(()=>{
  function run(hp,broken,near){const sim=new Simulation({seed:7349}),room=sim.makeRoom('front'),enemy=EnemyReview.vitality(sim.actor('goblin',0,-34),hp,broken),target=sim.actor('guard',0,near?-32.5:-26);room.actors=[enemy,target];sim.time=10;enemy.cooldown=0;enemy.stun=0;
   if(near)enemy.telegraph={target:target.id,started:8.65,at:10,dir:0,reach:2.3,arc:1.7};
   const before=target.hp;sim.tickActor(enemy,room,[],.1);const start=enemy.actionStarted,end=enemy.actionUntil,cooldown=enemy.cooldown,after=target.hp;
   if(near){sim.time=10.80;sim.tickActor(enemy,room,[],.1);}
   return {z:enemy.z,start,end,cooldown,before,after,final:target.hp,action:enemy.action};}
  return {clean:run(100,'none',false),weak:run(20,'none',false),leg:run(100,'rightLeg',false),both:run(100,'bothLegs',false),hit:run(100,'none',true),weakhit:run(20,'none',true),crawlhit:run(20,'bothLegs',true)};
 })()`);
 assert(result.weak.z<result.clean.z);assert(result.leg.z<result.weak.z);assert(result.both.z<result.leg.z);
 assert(Math.abs((result.leg.z+34)/(result.clean.z+34)-.48)<1e-6);
 assert.equal(result.hit.start,result.weakhit.start);assert.equal(result.hit.before-result.hit.after,result.weakhit.before-result.weakhit.after);
 assert(result.weakhit.end>result.hit.end);assert(result.weakhit.cooldown>result.hit.cooldown);assert(result.crawlhit.end>result.weakhit.end);
 assert.equal(result.weakhit.after,result.weakhit.final);assert.equal(result.weakhit.action,'attack');
});

test('save restoration preserves derived condition with no added actor fields or RNG consumption',()=>{
 const result=h.run(`(()=>{const sim=new Simulation({seed:7349}),player=sim.addPlayer('weak-save',{owner:'weak-save'}),r=sim.getRoom(player);r.actors=[EnemyReview.vitality(sim.actor('soldier',0,-34),20,'bothLegs')];const before=JSON.stringify(sim.exportState()),rng=sim.rng.getState(),condition=enemyCondition(r.actors[0]);EnemySentinel.pose(r.actors[0],1);return {same:before===JSON.stringify(sim.exportState()),rng:rng===sim.rng.getState(),condition,restored:enemyCondition(Simulation.restore(JSON.parse(before)).getRoom(player).actors[0])};})()`);
 assert(result.same&&result.rng);assert.deepEqual(plain(result.condition),plain(result.restored));
});

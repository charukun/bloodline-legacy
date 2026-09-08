import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx=vm.createContext({console,performance,requestAnimationFrame(){}});
for(const file of ['legacy/dialogue.js','legacy/core.js','render/motion-interpolation.js','legacy/game.js'])
 vm.runInContext(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),ctx);
const {Simulation,Game,MotionInterpolation}=vm.runInContext('({Simulation,Game,MotionInterpolation})',ctx);
const STEP=1/30;
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(smooth=true){
 const sim=new Simulation({seed:7349,mode:'normal'}),p=sim.addPlayer('test',{owner:'test',race:0});
 Object.assign(p,{age:24,prologue:false,introUntil:-100,x:0,z:0,dir:0,action:'idle'});
 const frames=[],game=Object.assign(Object.create(Game.prototype),{
  sim,playerId:p.id,snapshot:sim.snapshot(p.id),screen:'game',lastFrame:1000,lastUI:0,
  accumulator:0,sinceSave:0,seq:sim.seq,mapCache:new Map(),online:false,
  updateMove(){this.command({type:'move',x:1,z:0});},saveWorld(){},
  audio:{setListener(){},updateFootsteps(){},fx(){}},
  ui:{portraitQueue:[],update(){},event(){},toast(){}},
  renderer:{art:{sources:[]},effect(){},render(s){frames.push({x:s.player.x,z:s.player.z,t:s.t});}}
 });
 if(!smooth)game.motionInterpolation={capture(){},reset(){},sample:s=>s};
 return{sim,p,game,frames,motion:new MotionInterpolation()};
}

test('real Game frames remove fixed-tick position stalls without changing Simulation or saves',()=>{
 for(const hz of [30,60,120]){
  const before=fixture(false),after=fixture();
  for(let i=1;i<=hz;i++){
   for(const f of [before,after])f.game.frame(1000+i*1000/hz);
   assert.equal(after.game.frameError,undefined);
   assert.deepEqual(copy(after.sim.exportState()),copy(before.sim.exportState()));
   assert.equal(after.game.snapshot.player,after.p,'authoritative snapshot remains live');
   const frame=after.frames.at(-1),delay=after.p.x-frame.x;
   assert.ok(delay>=-1e-7&&delay<=.20,'bounded to one simulation tick, no prediction');
  }
  const deltas=f=>f.frames.slice(4).map((p,i)=>p.x-f.frames[i+3].x);
  const raw=deltas(before),smooth=deltas(after);
  assert.ok(smooth.every(dx=>dx>0),'no repeated position during steady movement');
  assert.ok(Math.max(...smooth)-Math.min(...smooth)<1e-7,'uniform distance per display frame');
  if(hz>30)assert.ok(raw.some(dx=>dx===0),'baseline repeats its positions between ticks');
 }
});

test('turning and stopping use bounded render poses and keep state/events current',()=>{
 const f=fixture(),{sim,p,motion}=f;
 p.dir=Math.PI-.1;motion.capture(sim,p.id);sim.tick(STEP);p.x+=.1;p.dir=-Math.PI+.1;
 const s=sim.snapshot(p.id),saved=copy(sim.exportState()),a=motion.sample(s,.5);
 assert.ok(Math.abs(a.player.dir-Math.PI)<1e-8,'take the short turn across the angle seam');
 assert.equal(a.t,s.t);assert.equal(a.events,s.events);assert.equal(a.player.action,s.player.action);
 assert.equal(a.players.find(e=>e.id===p.id),a.player);
 assert.notEqual(a.player,p);assert.deepEqual(copy(sim.exportState()),saved);
 // A stopped tick keeps the same coordinates at every display fraction.
 motion.capture(sim,p.id);sim.tick(STEP);
 const stop=sim.snapshot(p.id),x=p.x;
 for(const alpha of [0,.25,.5,.75,1])assert.equal(motion.sample(stop,alpha).player.x,x);
});

test('birth, death, room change, teleport and stale history never blend across discontinuities',()=>{
 const {sim,p,motion}=fixture();motion.capture(sim,p.id);sim.tick(STEP);
 let s=sim.snapshot(p.id);p.x+=20;assert.equal(motion.sample(s,.5).player,p);
 p.x=0;p.alive=false;assert.equal(motion.sample(s,.5).player,p);p.alive=true;
 p.prologue=true;assert.equal(motion.sample(s,.5).player,p);p.prologue=false;
 assert.equal(motion.sample({...s,room:{...s.room,id:'another-room'}},.5).player,p);
 assert.equal(motion.sample({...s,player:{...p,id:'new-life'}},.5).player.id,'new-life');
 const stale={...s,t:s.t+1};assert.equal(motion.sample(stale,.5),stale);
 motion.reset();assert.equal(motion.sample(s,.5),s);
});

test('catch-up frames use the final tick pair; removed actors are pruned and online/portrait paths bypass interpolation',()=>{
 const f=fixture();f.game.frame(1205);assert.equal(f.game.frameError,undefined);
 assert.ok(f.p.x-f.frames.at(-1).x<.20);
 const {sim,p,motion}=f,r=sim.getRoom(p),npc=r.actors[0];
 motion.capture(sim,p.id);sim.tick(STEP);npc.x+=.1;
 const s=sim.snapshot(p.id),n=motion.sample(s,.5).actors.find(e=>e.id===npc.id);
 assert.notEqual(n,npc);assert.ok(Math.abs(n.x-npc.x)>0);
 r.actors=r.actors.filter(e=>e.id!==npc.id);motion.capture(sim,p.id);assert.equal(motion.previous.has(npc.id),false);
 f.game.online=true;f.game.nextNetwork=Infinity;f.game.frame(1220);
 assert.equal(f.frames.at(-1).x,f.p.x);assert.equal(f.game.motionInterpolation.previous.size,0);
 f.game.screen='clan';f.game.clanScene={};f.game.previewCharacter=f.p;f.game.frame(1240);
 assert.equal(f.game.motionInterpolation.previous.size,0);
});

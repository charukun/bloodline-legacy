import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {compileCatalog} from '../tools/skill-catalog.mjs';
const ctx=vm.createContext({console,performance,requestAnimationFrame(){}});
ctx.BL_SKILL_DEFINITIONS=compileCatalog(JSON.parse(fs.readFileSync(new URL('../src/skills/catalog-source.json',import.meta.url),'utf8')));
for(const file of ['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js','render/motion-interpolation.js','legacy/game.js'])vm.runInContext(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),ctx);
const {Simulation,Game,facilityStation}=vm.runInContext('({Simulation,Game,facilityStation})',ctx);
const plain=x=>JSON.parse(JSON.stringify(x)),STEP=1/30;
function fixture(){
 const sim=new Simulation({seed:7349,mode:'normal'}),p=sim.addPlayer('test',{owner:'test'}),steps=[];
 const tick=sim.tick.bind(sim);sim.tick=dt=>{steps.push(dt);tick(dt);};
 const g=Object.assign(Object.create(Game.prototype),{sim,playerId:p.id,profile:{mode:'normal',online:false},screen:'game',lastFrame:1000,lastUI:0,accumulator:0,sinceSave:0,seq:sim.seq,mapCache:new Map(),online:false,
  updateMove(){},saveWorld(){},audio:{setListener(){},updateFootsteps(){},fx(){}},buildingLabels:{update(){}},ui:{portraitQueue:[],update(){},updateWorld(){},event(){},toast(){}},renderer:{art:{sources:[]},effect(){},render(){}}});
 return {g,sim,p,steps};
}
function frames(g,seconds,hz=60){for(let i=1;i<=seconds*hz;i++){const now=1000+i*1000/hz;if(now>g.lastFrame)g.frame(now);}assert.equal(g.frameError,undefined);}

test('every debug speed advances the whole simulation through unchanged 30 Hz steps',()=>{
 for(const speed of [.25,.5,1,2,4])for(const hz of [30,60,120]){
  const {g,sim,steps}=fixture(),reference=new Simulation({seed:7349,mode:'normal'});reference.addPlayer('test',{owner:'test'});
  assert.ok(g.setWorldSpeed(speed));g.lastFrame=1000;frames(g,4,hz);
  assert.ok(Math.abs(sim.time-4*speed)<=STEP+1e-8);assert.ok(steps.every(dt=>dt===STEP));
  for(const dt of steps)reference.tick(dt);
  assert.deepEqual(plain(sim.exportState()),plain(reference.exportState()),'aging, parent dialogue, actors and events share the same clock');
  assert.ok(g.accumulator>=0&&g.accumulator<STEP+1e-8);assert.equal(sim.yearSeconds,60);
 }
});

test('the compressed opening is explicit: one year in 9 world seconds, release at 30, then 60 per year',()=>{
 const {g,sim,p}=fixture();assert.ok(g.setWorldSpeed(4));g.lastFrame=1000;frames(g,2.3);
 assert.equal(p.prologue,true);assert.equal(p.age,1);
 frames(g,7.6);assert.equal(p.prologue,false);assert.equal(p.age,4);assert.ok(p.releaseAt>=30&&p.releaseAt<30+STEP);
 const age=p.age+p.ageFraction;for(let i=0;i<1800;i++)sim.tick(STEP);
 assert.ok(Math.abs(p.age+p.ageFraction-age-1)<1e-8);
});

test('changing speed clears only wall-clock debt and render history; worlds and profiles stay intact',()=>{
 const {g,sim}=fixture(),state=plain(sim.exportState()),profile=plain(g.profile);let resets=0;g.motionInterpolation={reset(){resets++;}};g.accumulator=2;
 assert.ok(g.setWorldSpeed(.5));assert.equal(g.accumulator,0);assert.equal(resets,1);assert.deepEqual(plain(sim.exportState()),state);assert.deepEqual(g.profile,profile);
 for(const speed of [0,-1,Infinity,NaN,8,'2',null])assert.equal(g.setWorldSpeed(speed),false);
 assert.equal(g.worldSpeed(),.5);const fresh=Object.assign(Object.create(Game.prototype),{profile:{...profile,debugWorldSpeed:4}});assert.equal(fresh.worldSpeed(),1,'new sessions always start at normal speed');
});

test('shared sessions never retime the server or tick the local world',()=>{
 const {g,sim,steps}=fixture();g.setWorldSpeed(4);g.online=true;g.nextNetwork=Infinity;g.snapshot=sim.snapshot(g.playerId);g.lastFrame=1000;
 assert.equal(g.worldSpeed(),1);assert.equal(g.setWorldSpeed(.5),false);frames(g,1);assert.equal(steps.length,0);
 g.online=false;g.screen='clan';g.profile.online=true;assert.equal(g.canSetWorldSpeed(),false);assert.equal(g.setWorldSpeed(2),false);
});

test('a long accelerated frame keeps the existing 90-tick budget without a growing catch-up backlog',()=>{
 const {g,steps}=fixture();g.setWorldSpeed(4);g.lastFrame=1000;g.frame(11000);assert.equal(g.frameError,undefined);assert.ok(steps.length<=90);assert.ok(g.accumulator<STEP+1e-8);
 const count=steps.length;g.frame(11050);assert.ok(steps.length-count<=7);assert.ok(g.accumulator<STEP+1e-8);
});


test('skill experience, discovery opportunities and learned techniques match at equal world time',()=>{
 const runs=[];
 for(const speed of [.5,1,2]){
  const f=fixture(),{g,p,sim}=f,room=sim.getRoom(p),discoveries=[];
  Object.assign(p,{prologue:false,age:18,ageFraction:0,introUntil:-100,releaseAt:-100,farewellStage:3});room.actors=[];room.waveAt=Infinity;
  const work=id=>{const school=room.map.schools.find(s=>s.id===({observe:'forge',study:'sword',pray:'church'})[id]);const a=facilityStation(school);Object.assign(p,{x:a.x,z:a.z+1,autoFight:null,input:{x:0,z:0}});assert.ok(sim.command(p.id,{type:'activity',activity:id}));};
  const emit=sim.emit.bind(sim);sim.emit=(type,data)=>{emit(type,data);if(['insight','passive'].includes(type))discoveries.push({type,id:data.id,t:sim.time,wall:(g.lastFrame-1000)/1000});};
  const tick=sim.tick.bind(sim);sim.tick=dt=>{if(f.steps.length===4800)work('study');if(f.steps.length===9600)work('pray');tick(dt);};
  work('observe');g.setWorldSpeed(speed);g.lastFrame=1000;frames(g,860/speed,30);
  assert.ok(p.skillLife.discovered.length>0);assert.ok(discoveries.some(e=>e.type==='insight'),'real active technique learned');assert.ok(discoveries.some(e=>e.type==='passive'),'real passive learned');
  runs.push({speed,discovered:plain(p.skillLife.discovered),experience:plain(p.skillLife.experience),skills:plain(p.skills),passives:plain(p.passives),rng:p.skillLife.rng,opportunity:p.skillLife.lastOpportunity,discoveries});
 }
 const normal=runs.find(r=>r.speed===1);
 for(const r of runs){for(const field of ['discovered','experience','skills','passives','rng','opportunity'])assert.deepEqual(r[field],normal[field],field);
  assert.deepEqual(r.discoveries.map(({wall,...e})=>e),normal.discoveries.map(({wall,...e})=>e));
  r.discoveries.forEach((e,i)=>assert.ok(Math.abs(e.wall*r.speed-normal.discoveries[i].wall)<.08,'real-time learning pace follows the chosen speed'));
 }
 console.log(JSON.stringify({learningComparison:runs.map(r=>({speed:r.speed,worldSeconds:860,realSeconds:860/r.speed,active:r.discoveries.filter(e=>e.type==='insight').length,passive:r.discoveries.filter(e=>e.type==='passive').length,firstDiscoveryRealSeconds:r.discoveries[0]?.wall}))}));
});

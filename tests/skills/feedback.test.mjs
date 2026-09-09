import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {runtime,life,step,activity,read} from './harness.mjs';
const {fixture}=createRequire(import.meta.url)('../ui-fixture.cjs');
const api=runtime(),plain=x=>JSON.parse(JSON.stringify(x));

function combat(){
 const x=life(api,93),{sim,p,room}=x;
 room.waveAt=1e6;const target=sim.actor('dummy',0,-37);room.actors=[target];
 Object.assign(p,{x:0,z:-38,dir:0,autoFight:target.id});
 for(const id of [60000,60001,60002])sim.learn(p,id);
 p.phaseWeights=[{60000:100},{60001:100},{60002:100}];return {...x,target};
}
test('actual combat accents first landed connections, remembers them across reload, and bounds repeat accents',()=>{
 const {sim,p,target}=combat();step(sim,22);
 const events=sim.events.filter(e=>e.type==='skillconnection');assert.ok(events.length>=3);
 const first=events.filter(e=>e.first);assert.equal(new Set(first.map(e=>e.from+':'+e.id)).size,first.length);
 assert.ok(first.some(e=>e.connectionKind==='offbalance'));assert.ok(first.every(e=>e.signal==='discovery'));
 assert.ok(events.some(e=>e.signal==='quiet'));assert.ok(events.every(e=>e.target===target.id&&e.x===target.x&&e.z===target.z));
 const echoes=events.filter(e=>e.signal==='echo');for(let i=1;i<echoes.length;i++)assert.ok(echoes[i].t-echoes[i-1].t>=6);
 const restored=api.Simulation.restore(sim.exportState()),q=restored.players.get(p.id),old=new Set(Object.keys(q.skillLife.connections)),seq=restored.seq;
 const dummy=restored.getRoom(q).actors.find(a=>a.kind==='dummy');Object.assign(q,{x:dummy.x,z:dummy.z-1,dir:0,autoFight:dummy.id});
 step(restored,20);assert.ok(restored.events.some(e=>e.seq>seq&&e.type==='skillconnection'));
 assert.ok(restored.events.filter(e=>e.seq>seq&&e.type==='skillconnection'&&old.has(e.from+':'+e.id)).every(e=>!e.first));
});
test('real activities reveal a crossed memory, never a repeated single task or idle progress',()=>{
 const {sim,p}=life(api,93),captured=[],emit=sim.emit.bind(sim);sim.emit=(type,data)=>{emit(type,data);if(type==='skillglimpse')captured.push({type,...data});};activity(sim,p,'observe',160);
 assert.equal(captured.length,0);
 activity(sim,p,'study',160);
 const glimpses=captured;assert.ok(glimpses.length>0);
 const e=glimpses[0];assert.match(e.text,/道具/);assert.ok(!('id' in e));
 assert.equal(e.sources.length,2);assert.notEqual(...e.sources);
 const saved=plain(p.skillLife.glimpses),s2=api.Simulation.restore(sim.exportState());assert.deepEqual(plain(s2.players.get(p.id).skillLife.glimpses),saved);
 const count=p.skillLife.glimpses.seen.length;step(sim,120);assert.equal(p.skillLife.glimpses.seen.length,count);
 activity(sim,p,'observe',160);activity(sim,p,'study',160);
 assert.equal(captured.filter(e=>e.text===glimpses[0].text).length,1);
});
test('glimpses do not consume any world or discovery randomness or alter learning pace',()=>{
 const a=life(api,19),b=life(api,19),glimpse=api.BloodlineSkills.glimpse;
 for(const x of [a,b]) {
  if(x===b)api.BloodlineSkills.glimpse=()=>null;
  try {activity(x.sim,x.p,'observe',160);activity(x.sim,x.p,'study',160);activity(x.sim,x.p,'care',160);}finally{api.BloodlineSkills.glimpse=glimpse;}
 }
 assert.ok(a.p.skillLife.glimpses.seen.length);
 for(const field of ['discovered','experience','rng','activeInspiration','charge','lastOpportunity'])assert.deepEqual(plain(a.p.skillLife[field]),plain(b.p.skillLife[field]),field);
 assert.equal(a.sim.rng.getState(),b.sim.rng.getState());
});
test('glimpse migration sanitizes unknown records and new lives get an independent memory',()=>{
 const {sim,p}=life(api);delete p.skillLife.glimpses;
 const s=api.Simulation.restore(sim.exportState()),q=s.players.get(p.id);assert.deepEqual(plain(q.skillLife.glimpses),{lastAt:-100,seen:[]});
 q.skillLife.glimpses={lastAt:NaN,seen:['craft-combat','bogus']};
 const r=api.Simulation.restore(s.exportState());assert.deepEqual(plain(r.players.get(p.id).skillLife.glimpses),{lastAt:-100,seen:['craft-combat']});
 const child=r.addPlayer('new',{owner:p.owner});assert.equal(child.skillLife.glimpses.seen.length,0);
});
test('first connection is named once, glimpses stay nonmodal, sounds distinguish first/repeat/silent',t=>{
 const {w,ui,p}=fixture(t,read('src/legacy/ui.js')+'\nwindow.getFeedback=()=>SkillPresentation;');const f=w.getFeedback();
 const base={type:'skillconnection',player:p.id,t:10,first:true,signal:'discovery',connectionKind:'offbalance'};
 assert.ok(f.event(ui,base));assert.match(ui.floatLines.at(-1).text,/崩した/);assert.equal(ui.floatLines.at(-1).life,2.3);
 f.event(ui,{...base,first:false,signal:'echo'});assert.equal(ui.floatLines.length,1);
 f.event(ui,{type:'skillglimpse',player:p.id,t:20,text:'記憶が重なる'});assert.equal(ui.floatLines.length,2);assert.equal(ui.modal,null);
 f.event(ui,{...base,player:'another'});assert.equal(ui.floatLines.length,2);
 const notes=[],audio={enabled:true,ctx:{currentTime:0},tone(...args){notes.push(args);}};
 f.sound(audio,base);assert.equal(notes.length,3);notes.length=0;
 f.sound(audio,{...base,first:false,signal:'echo'});assert.equal(notes.length,1);assert.ok(notes[0][2]<.1);notes.length=0;
 f.sound(audio,{...base,signal:'quiet'});assert.equal(notes.length,0);
});
test('death recap shows actual use, successful pairs and escaped provenance; archive survives restore',async t=>{
 const {w,p,sim,ui,d,g}=fixture(t,read('src/legacy/ui.js')+'\nwindow.getFeedback=()=>SkillPresentation;');
 for(const id of [60000,60001,60002])sim.learn(p,id);
 p.skillUses={60000:20,60001:12,60002:4,60130:100}; // passives cannot define a fighting style
 p.skillLife.connections={'60000:60001':4};
 p.skillLife.discovered=[{id:60000,key:'bl.skill.hammer.opening',family:'hammer',route:'cross',reasons:['鍛冶場で拍子を覚えた','<img src=x onerror=bad()>'],at:10,tags:[]}];
 sim.die(p,'深手');assert.equal(p.legacyChoice.state,'pending');assert.ok(sim.command(p.id,{type:'choose-legacy',skill:60000}));const history=sim.legacy(p.owner).records.at(-1).skillHistory;
 assert.deepEqual(Array.from(history.signature),[60000,60001,60002]);
 const restored=sim.constructor.restore(sim.exportState());assert.deepEqual(plain(restored.legacy(p.owner).records.at(-1).skillHistory),plain(history));
 g.snapshot=g.decorate(sim.snapshot(p.id,sim.seq));const old=w.setTimeout;w.setTimeout=fn=>{fn();return 0;};try{ui.death(p);}finally{w.setTimeout=old;}
 assert.equal(ui.modal,'death');assert.ok(d.querySelector('.skill-life-recap'));assert.match(d.querySelector('.skill-life-recap').textContent,/炉打ち → 鉄返し/);assert.equal(d.querySelectorAll('.skill-life-recap img').length,0);
 assert.ok(d.querySelector('#next-life'));assert.ok(d.querySelector('#view-lineage'));
 const child=sim.addPlayer('child',{owner:p.owner,inherit:[60000]});assert.ok(!child.skills.includes(60000));assert.equal(child.skillLife.connections['60000:60001'],undefined);
});
test('connection VFX is short, uses actual contact coordinates, and emits at most three shared needles',()=>{
 const ctx=vm.createContext({Map,Math,Float32Array,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),skillById:()=>null,RG_CACHE:new Map()});
 vm.runInContext(read('src/render/combat-presentation.js')+'\nglobalThis.FX=CombatPresentation;',ctx);
 const calls=[],r={camera:{x:0,z:0,yaw:0},quality:'high',effects:[],weatherState:{rain:0},art:{sources:[]},add(...args){calls.push(args);},fxBatches:{}};
 const f=new ctx.FX(r),s={t:1,player:{id:'p',room:'r',alive:true,x:0,z:0},actors:[],players:[]};
 r.effects=[{type:'skillconnection',born:1,x:2,z:1,first:true,dir:0,life:.8}];f.update(s);assert.equal(calls.length,3);assert.ok(calls.every(c=>c[0]==='skillfx:needle'));
 calls.length=0;f.update({...s,t:1.25});assert.equal(calls.length,0);assert.equal(r.effects.length,0);
 r.quality='low';r.effects=[{type:'skillconnection',born:2,x:2,z:1,first:true,dir:0,life:.8}];f.update({...s,t:2});assert.equal(calls.length,2);
});

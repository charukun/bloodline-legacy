import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {definitions} from './skills/harness.mjs';
import {createRequire} from 'node:module';
const {fixture,flush}=createRequire(import.meta.url)('./ui-fixture.cjs');

function camera(width=393,height=852,yaw=.42){
 const ctx=vm.createContext({Float32Array,Math,Map,clamp:(n,a,b)=>Math.max(a,Math.min(n,b))});
 vm.runInContext(['legacy/render_math.js','render/renderer-base.js','render/adapter.js'].map(p=>fs.readFileSync(new URL('../src/'+p,import.meta.url),'utf8')).join('\n')+'\nglobalThis.classes={Renderer,SliceRenderer};',ctx);
 const r=Object.assign(Object.create(ctx.classes.SliceRenderer.prototype),{width,height,camera:{x:6.5,z:20,zoom:14,yaw,pitch:.78},shakeOffset:[0,0]});
 r.matrix();return r;
}

test('panel camera slides the fight above the panel, keeps world state and picking aligned, and returns',()=>{
 for(const [width,height]of [[393,852],[740,720],[852,393]])for(const yaw of [.42,-1.25,2.75]){
  const r=camera(width,height,yaw),s={player:{x:6.5,z:21,autoFight:'dummy'},actors:[{id:'dummy',x:7.6,z:20,alive:true}]},original=JSON.stringify([s,r.camera]);
  const focus={x:7.05,z:20.5},before=r.project(focus.x,1.1,focus.z).y;
  r.framePanel(s,1/60,{skillPanelTop:.38});r.matrix();const first=r.project(focus.x,1.1,focus.z).y;
  assert.ok(first<before&&before-first<height*.09,'first frame must slide rather than snap');
  for(let i=1;i<120;i++){r.framePanel(s,1/60,{skillPanelTop:.38});r.matrix();}
  const at=r.project(focus.x,1.1,focus.z);assert.ok(Math.abs(at.y/height-.38*.53)<.001);assert.equal(JSON.stringify([s,r.camera]),original);
  for(const [x,z]of [[6,20],[8,21],[4,18]]){const screen=r.project(x,0,z),world=r.pointToWorld(screen.x,screen.y);assert.ok(Math.hypot(world.x-x,world.z-z)<.00001,'tap picks the ground under the shifted camera');}
  for(let i=0;i<120;i++){r.framePanel(s,1/60,{});r.matrix();}assert.ok(Math.abs(r.project(focus.x,1.1,focus.z).y-before)<.01);
 }
});

test('camera motion is independent of refresh rate, excluded from portraits, and respects reduced motion',()=>{
 const s={player:{x:6.5,z:21},actors:[]},shifts=[];
 for(const fps of [30,60,120]){const r=camera();for(let i=0;i<fps/2;i++)r.framePanel(s,1/fps,{skillPanelTop:.4});shifts.push(r.panelShift);}
 assert.ok(Math.max(...shifts)-Math.min(...shifts)<1e-10);
 const r=camera();r.framePanel(s,.016,{skillPanelTop:.4,reducedMotion:true});assert.ok(r.panelShift>0);r.framePanel(s,.016,{clan:true});assert.equal(r.panelShift,0);
 r.framePanel(s,.016,{skillPanelTop:.4,reducedMotion:true});r.framePanel(s,.016,{portrait:true});assert.equal(r.panelShift,0);
});

test('landscape frames combat left, keeps picking accurate through rotation, and restores both axes',()=>{
 for(const [width,height,left]of [[852,393,.53],[740,720,.53],[1920,1080,.68]])for(const yaw of [.42,-1.25,2.75]){
  const r=camera(width,height,yaw),s={player:{x:6.5,z:21,autoFight:'dummy'},actors:[{id:'dummy',x:7.6,z:20,alive:true}]},original=JSON.stringify([s,r.camera]),focus={x:7.05,z:20.5},before=r.project(focus.x,1.1,focus.z);
  r.framePanel(s,1/60,{skillPanelLeft:left});r.matrix();const first=r.project(focus.x,1.1,focus.z);
  assert.ok(first.x<before.x&&before.x-first.x<width*.09,'horizontal slide starts without snapping');
  const settle=options=>{for(let i=0;i<120;i++){r.framePanel(s,1/60,options);r.matrix();const screen=r.project(6,0,20),ground=r.pointToWorld(screen.x,screen.y);assert.ok(Math.hypot(ground.x-6,ground.z-20)<.00001,'ground picking stays aligned during transition');}};
  settle({skillPanelLeft:left});assert.ok(Math.abs(r.project(focus.x,1.1,focus.z).x/width-left*.5)<.001);
  assert.ok(Math.abs(r.project(focus.x,1.1,focus.z).y-before.y)<.01,'side panel preserves vertical framing');
  r.width=393;r.height=852;settle({skillPanelTop:.38});assert.ok(Math.abs(r.project(focus.x,1.1,focus.z).y/852-.38*.53)<.001);assert.equal(r.panelShiftSide,0);
  r.width=width;r.height=height;settle({skillPanelLeft:left});assert.equal(r.panelShift,0);assert.ok(Math.abs(r.project(focus.x,1.1,focus.z).x/width-left*.5)<.001);
  settle({});const after=r.project(focus.x,1.1,focus.z);assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<.01);assert.equal(JSON.stringify([s,r.camera]),original);
  r.framePanel(s,.016,{skillPanelLeft:left,reducedMotion:true});assert.ok(r.panelShiftSide>0);r.framePanel(s,.016,{portrait:true});assert.equal(r.panelShiftSide,0);
 }
});

test('panel resize updates the active framing axis and closing clears it',async t=>{
 const {ui,g,d,w}=fixture(t);let resize,disconnected=false;
 w.ResizeObserver=class{constructor(fn){resize=fn;}observe(){}disconnect(){disconnected=true;}};
 let width=393,height=852,panelWidth=381,panelHeight=528;
 Object.defineProperties(g.renderer.canvas,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});
 ui.skills();const panel=d.querySelector('.game-panel');
 Object.defineProperties(panel,{offsetWidth:{get:()=>panelWidth},offsetHeight:{get:()=>panelHeight}});
 ui.root.style.paddingBottom='6px';ui.root.style.paddingRight='6px';await flush();
 assert.ok(Math.abs(ui.skillPanelTop-318/852)<.001);assert.equal(ui.skillPanelLeft,null);
 width=852;height=393;panelWidth=392;panelHeight=381;resize();
 assert.equal(ui.skillPanelTop,null);assert.ok(Math.abs(ui.skillPanelLeft-454/852)<.001);
 width=393;height=852;panelWidth=381;panelHeight=528;resize();
 assert.equal(ui.skillPanelLeft,null);assert.ok(ui.skillPanelTop>0);
 ui.closeModal();assert.equal(ui.skillPanelTop,null);assert.equal(ui.skillPanelLeft,null);assert.equal(disconnected,true);
});

test('wheel drag uses the visible circle when a narrow panel letterboxes the SVG',async t=>{
 const {sim,p,ui,d,w,sync}=fixture(t);sim.learn(p,4001);p.phaseWeights[0]={4000:1,4001:1};sync();ui.skills();await flush();
 const svg=d.getElementById('balance-pie');svg.setPointerCapture=()=>{};
 svg.getBoundingClientRect=()=>({left:100,top:200,width:120,height:200});
 const send=(target,type,x,y)=>{const e=new w.MouseEvent(type,{clientX:x,clientY:y,bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:1});target.dispatchEvent(e);};
 const radius=67*120/208;
 send(svg.querySelector('[data-handle]'),'pointerdown',160,300+radius);
 send(svg,'pointermove',160-Math.SQRT1_2*radius,300+Math.SQRT1_2*radius);
 send(svg,'pointerup',160-Math.SQRT1_2*radius,300+Math.SQRT1_2*radius);
 const weights=p.phaseWeights[0];assert.ok(Math.abs(weights[4000]/(weights[4000]+weights[4001])-.625)<.001);
});

test('passives have their own page and inspection never changes active phase weights',async t=>{
 const {sim,p,ui,d,sync}=fixture(t);sim.learn(p,60900);sim.learn(p,700011);sync();ui.skills();await flush();
 assert.equal(d.querySelectorAll('[data-phase]').length,4);assert.ok(d.querySelector('.skill-overview #pie-wrap'));assert.ok(d.querySelector('.skill-overview #skill-detail'));
 const before=JSON.stringify(p.phaseWeights);d.querySelector('[data-phase="3"]').click();d.querySelector('[data-passive="60900"]').click();
 assert.match(d.getElementById('skill-detail').textContent,/炉辺の息/);assert.equal(d.getElementById('balance-pie'),null);assert.equal(d.getElementById('skill-toggle'),null);assert.equal(JSON.stringify(p.phaseWeights),before);
 assert.equal(d.querySelector('#skill-detail [lang="en"]').textContent,definitions.find(d=>d.id===60900).names.en);
 d.querySelector('[data-phase="0"]').click();assert.ok(d.getElementById('balance-pie'));assert.equal(d.getElementById('skill-toggle'),null);
 d.querySelector('[data-phase="1"]').click();ui.describeSkill(700011);const names=definitions.find(d=>d.id===700011).names;assert.equal(d.querySelector('#skill-detail strong').textContent,names.ja);assert.equal(d.querySelector('#skill-detail [lang="en"]').textContent,names.en);assert.equal(JSON.stringify(p.phaseWeights),before);
});

test('combat continues while the panel edits a build, with normal world input available',async t=>{
 const {g,sim,p,ui,d,w,sync}=fixture(t),room=sim.getRoom(p),dummy=room.actors.find(a=>a.kind==='dummy');
 sim.learn(p,4001);p.weapon=0;p.phaseWeights[0]={4000:1,4001:1};Object.assign(p,{x:dummy.x,z:dummy.z+1.1});
 for(let i=0;i<12;i++)sim.tick(1/30);sync();assert.equal(p.autoFight,dummy.id);
 ui.skills();await flush();const start=sim.time;assert.equal(ui.blocksWorldInput(),false);assert.equal(g.renderer.canvas.inert,false);assert.equal(d.querySelector('[role=dialog]').getAttribute('aria-modal'),'false');
 d.querySelector('[data-skill="4000"]').click();assert.equal(p.phaseWeights[0][4000],0);
 for(let i=0;i<70;i++)sim.tick(1/30);sync();assert.ok(sim.time>start+2);assert.ok(sim.events.some(e=>e.type==='hit'&&e.kind==='practice'&&e.t>start));assert.equal(p.autoFight,dummy.id);
 g.installInput();g.renderer.canvas.setPointerCapture=()=>{};g.renderer.canvas.hasPointerCapture=()=>false;
 const event=(target,type)=>{const e=new w.MouseEvent(type,{button:0,clientX:100,clientY:140,bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:1});target.dispatchEvent(e);};
 event(d.querySelector('[data-skill="4001"]'),'pointerdown');assert.ok(!g.pointer,'panel cannot send touch to the world');
 event(g.renderer.canvas,'pointerdown');assert.ok(g.pointer,'upper view still accepts movement');event(g.renderer.canvas,'pointercancel');assert.equal(g.pointer,null);
 ui.body();assert.equal(ui.blocksWorldInput(),true);assert.equal(g.renderer.canvas.inert,true);assert.equal(ui.skillPanelTop,null);ui.closeModal();assert.equal(ui.skillPanelTop,null);
});

test('one tile activation toggles and describes the skill; refresh and phase changes never toggle it again',async t=>{
 const {sim,p,ui,d,sync}=fixture(t);sim.learn(p,4001);sync();ui.skills();await flush();
 const tile=()=>d.querySelector('[data-skill="4001"]');
 assert.equal(tile().getAttribute('aria-pressed'),'false');
 const list=d.querySelector('.skill-list-scroll');list.scrollTop=44;tile().focus();tile().click();
 assert.equal(p.phaseWeights[0][4001],20);assert.equal(tile().getAttribute('aria-pressed'),'true');assert.match(d.getElementById('skill-detail').textContent,/斬る/);
 assert.equal(d.activeElement,tile());assert.equal(d.querySelector('.skill-list-scroll').scrollTop,44);assert.equal(d.querySelector('#skill-toggle,#skill-choice'),null);
 const before=JSON.stringify(p.phaseWeights);
 for(let i=0;i<5;i++){ui.renderSkills();sync();}
 d.querySelector('[data-phase="1"]').click();d.querySelector('[data-phase="0"]').click();assert.equal(JSON.stringify(p.phaseWeights),before);
 tile().click();assert.equal(p.phaseWeights[0][4001],0);assert.equal(tile().getAttribute('aria-pressed'),'false');assert.equal(tile().closest('.skill-cell').classList.contains('enabled'),false);assert.match(d.getElementById('skill-detail').textContent,/斬る/);
 assert.equal(d.querySelector('[data-skill="4000"]').getAttribute('aria-pressed'),'true','reading a different skill must not clear the enabled state of other skills');
});

test('each phase toggle persists through actual save and restore, including an empty phase',t=>{
 const {sim,p,ui,g,d,sync,w,api}=fixture(t);for(const id of [4001,4100,4101])sim.learn(p,id);sync();ui.skills();
 const original=p.phaseWeights.map(w=>Object.fromEntries(p.skills.map(id=>[id,w[id]||0])));
 for(const [phase,id]of [4001,4100,4101].entries()){
  d.querySelector(`[data-phase="${phase}"]`).click();d.querySelector(`[data-skill="${id}"]`).click();assert.equal(p.phaseWeights[phase][id],20);
  const saved=JSON.parse(w.localStorage.getItem('aerin.tactics.v3.world4.normal')),restored=api.Simulation.restore(saved).players.get(p.id);assert.equal(restored.phaseWeights[phase][id],20);
  d.querySelector(`[data-skill="${id}"]`).click();assert.equal(p.phaseWeights[phase][id],0);
  const off=api.Simulation.restore(JSON.parse(w.localStorage.getItem('aerin.tactics.v3.world4.normal'))).players.get(p.id);assert.equal(off.phaseWeights[phase][id],0);
 }
 assert.equal(JSON.stringify(p.phaseWeights),JSON.stringify(original));
});

test('rejected commands leave activation state and saves untouched while allowing the explanation',t=>{
 const {sim,p,ui,g,d,sync}=fixture(t);sim.learn(p,4001);sync();ui.skills();p.lifeState='downed';sync();let saves=0;g.saveWorld=()=>saves++;
 const tile=d.querySelector('[data-skill="4001"]');tile.click();assert.equal(p.phaseWeights[0][4001],0);assert.equal(d.querySelector('[data-skill="4001"]').getAttribute('aria-pressed'),'false');assert.match(d.getElementById('skill-detail').textContent,/斬る/);assert.equal(saves,0);
});

test('online tile activation uses the existing weights transport and reflects the acknowledged snapshot',t=>{
 const {sim,p,ui,g,d,sync}=fixture(t);sim.learn(p,4001);sync();g.online=true;g.live={ready:true};g.commandBuffer=[];ui.skills();
 d.querySelector('[data-skill="4001"]').click();const changes=g.commandBuffer.filter(c=>c.type==='weights');assert.equal(changes.length,1);assert.equal(changes[0].phase,0);assert.equal(changes[0].weights[4001],20);assert.equal(p.phaseWeights[0][4001],0,'UI does not mutate the authoritative player');
 sim.command(p.id,changes[0]);sync();assert.equal(d.querySelector('[data-skill="4001"]').getAttribute('aria-pressed'),'true');assert.equal(d.querySelector('[data-skill="4000"]').getAttribute('aria-pressed'),'true');
});

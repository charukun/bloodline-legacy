import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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

test('passives have their own page and inspection never changes active phase weights',async t=>{
 const {sim,p,ui,d,sync}=fixture(t);sim.learn(p,60900);sync();ui.skills();await flush();
 assert.equal(d.querySelectorAll('[data-phase]').length,4);assert.ok(d.querySelector('.skill-overview #pie-wrap'));assert.ok(d.querySelector('.skill-overview #skill-detail'));
 const before=JSON.stringify(p.phaseWeights);d.querySelector('[data-phase="3"]').click();d.querySelector('[data-passive="60900"]').click();
 assert.match(d.getElementById('skill-detail').textContent,/炉辺の息/);assert.equal(d.getElementById('balance-pie'),null);assert.equal(d.getElementById('skill-toggle'),null);assert.equal(JSON.stringify(p.phaseWeights),before);
 d.querySelector('[data-phase="0"]').click();assert.ok(d.getElementById('balance-pie'));assert.ok(d.getElementById('skill-toggle'));
});

test('combat continues while the panel edits a build, with normal world input available',async t=>{
 const {g,sim,p,ui,d,w,sync}=fixture(t),room=sim.getRoom(p),dummy=room.actors.find(a=>a.kind==='dummy');
 sim.learn(p,4001);p.weapon=0;p.phaseWeights[0]={4000:1,4001:1};Object.assign(p,{x:dummy.x,z:dummy.z+1.1});
 for(let i=0;i<12;i++)sim.tick(1/30);sync();assert.equal(p.autoFight,dummy.id);
 ui.skills();await flush();const start=sim.time;assert.equal(ui.blocksWorldInput(),false);assert.equal(g.renderer.canvas.inert,false);assert.equal(d.querySelector('[role=dialog]').getAttribute('aria-modal'),'false');
 d.querySelector('[data-skill="4000"]').click();d.getElementById('skill-toggle').click();assert.equal(p.phaseWeights[0][4000],0);
 for(let i=0;i<70;i++)sim.tick(1/30);sync();assert.ok(sim.time>start+2);assert.ok(sim.events.some(e=>e.type==='hit'&&e.kind==='practice'&&e.t>start));assert.equal(p.autoFight,dummy.id);
 g.installInput();g.renderer.canvas.setPointerCapture=()=>{};g.renderer.canvas.hasPointerCapture=()=>false;
 const event=(target,type)=>{const e=new w.MouseEvent(type,{button:0,clientX:100,clientY:140,bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:1});target.dispatchEvent(e);};
 event(d.querySelector('[data-skill="4001"]'),'pointerdown');assert.ok(!g.pointer,'panel cannot send touch to the world');
 event(g.renderer.canvas,'pointerdown');assert.ok(g.pointer,'upper view still accepts movement');event(g.renderer.canvas,'pointercancel');assert.equal(g.pointer,null);
 ui.body();assert.equal(ui.blocksWorldInput(),true);assert.equal(g.renderer.canvas.inert,true);assert.equal(ui.skillPanelTop,null);ui.closeModal();assert.equal(ui.skillPanelTop,null);
});

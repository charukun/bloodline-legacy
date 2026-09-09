import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runtime,life,activity,definitions} from './skills/harness.mjs';
const {fixture,flush}=createRequire(import.meta.url)('./ui-fixture.cjs');
const api=runtime(),active=w=>Object.keys(w).filter(id=>w[id]>0);
const phaseIds=phase=>definitions.filter(d=>!d.passive&&d.phase===phase).slice(0,6).map(d=>d.id);

test('each phase accepts five, rejects six atomically, and permits rebalancing and replacement',()=>{
 const {sim,p}=life(api);
 for(const phase of [0,1,2]){
  const ids=phaseIds(phase);assert.equal(ids.length,6);ids.forEach(id=>sim.learn(p,id));
  const weights=Object.fromEntries(ids.map(id=>[id,20])),before=JSON.stringify(p.phaseWeights);
  assert.equal(sim.command(p.id,{type:'weights',phase,weights}),false);assert.equal(JSON.stringify(p.phaseWeights),before);
  weights[ids[5]]=0;assert.equal(sim.command(p.id,{type:'weights',phase,weights}),true);
  weights[ids[0]]=75;assert.equal(sim.command(p.id,{type:'weights',phase,weights}),true);assert.equal(p.phaseWeights[phase][ids[0]],75);
  weights[ids[0]]=0;weights[ids[5]]=20;assert.equal(sim.command(p.id,{type:'weights',phase,weights}),true);assert.equal(active(p.phaseWeights[phase]).length,5);
  assert.ok(ids.every(id=>p.skills.includes(id)));
 }
 assert.deepEqual(p.weights,p.phaseWeights[0]);
});

test('restoring oversized allocations retains learned skills and original weights across reloads',()=>{
 const {sim,p}=life(api);for(const phase of [0,1,2]){const ids=phaseIds(phase);ids.forEach(id=>sim.learn(p,id));p.phaseWeights[phase]=Object.fromEntries(ids.map((id,i)=>[id,i+1]));}
 p.passives=[4061,...definitions.filter(d=>d.passive).map(d=>d.id)];
 const before=JSON.stringify(p.phaseWeights),skills=JSON.stringify(p.skills),passives=JSON.stringify(p.passives);
 const s=api.Simulation.restore(JSON.parse(JSON.stringify(sim.exportState()))),q=s.players.get(p.id);
 assert.equal(JSON.stringify(q.phaseWeightsBeforeLimit),before);assert.equal(JSON.stringify(q.skills),skills);assert.equal(JSON.stringify(q.passives),passives);
 for(const phase of [0,1,2]){assert.equal(active(q.phaseWeights[phase]).length,5);assert.equal(q.phaseWeights[phase][phaseIds(phase)[0]],0);}
 const again=api.Simulation.restore(JSON.parse(JSON.stringify(s.exportState()))).players.get(p.id);
 assert.equal(JSON.stringify(again.phaseWeightsBeforeLimit),before);assert.equal(JSON.stringify(again.phaseWeights),JSON.stringify(q.phaseWeights));
});

test('weapon changes teach their technique without replacing a full chosen set',()=>{
 const {sim,p,room}=life(api),rack=room.map.schools.find(s=>s.id==='armory'),ids=phaseIds(0).slice(0,5);
 ids.forEach(id=>sim.learn(p,id));p.phaseWeights[0]=Object.fromEntries(ids.map(id=>[id,7]));Object.assign(p,{x:rack.x,z:rack.z+3});
 assert.equal(sim.command(p.id,{type:'equip',slot:'weapon',value:0}),true);assert.ok(p.skills.includes(4001));assert.equal(p.phaseWeights[0][4001],0);assert.equal(active(p.phaseWeights[0]).length,5);
 p.phaseWeights[0][ids[0]]=0;assert.equal(sim.command(p.id,{type:'equip',slot:'weapon',value:0}),true);assert.equal(p.phaseWeights[0][4001],1);assert.equal(active(p.phaseWeights[0]).length,5);
});

test('consciousness keeps all learned choices visible and opens a slot only after removal',async t=>{
 const {sim,p,ui,d,sync}=fixture(t),ids=phaseIds(0);ids.forEach(id=>sim.learn(p,id));p.phaseWeights[0]=Object.fromEntries(ids.map((id,i)=>[id,i<5?20:0]));sync();ui.skills();await flush();
 assert.ok(ids.every(id=>d.querySelector(`[data-skill="${id}"]`)));assert.equal(d.querySelectorAll('.phase-capacity i.lit').length,5);
 d.querySelector(`[data-skill="${ids[5]}"]`).click();assert.equal(d.getElementById('skill-toggle'),null);
 assert.equal(p.phaseWeights[0][ids[5]],0);
 d.querySelector(`[data-skill="${ids[0]}"]`).click();assert.equal(d.getElementById('skill-toggle'),null);
 d.querySelector(`[data-skill="${ids[5]}"]`).click();assert.equal(d.getElementById('skill-toggle'),null);
 assert.equal(active(p.phaseWeights[0]).length,5);assert.equal(p.phaseWeights[0][ids[0]],0);assert.ok(p.phaseWeights[0][ids[5]]>0);
});

test('wardrobe inspects five physical slots, discards the selected item and retains selection without a remote rack',async t=>{
 const {p,ui,d,sync}=fixture(t);p.inventory=['stone','bell'];sync();ui.body();await flush();
 assert.equal(d.querySelectorAll('[data-body-slot]').length,5);assert.equal(d.querySelector('.game-panel').classList.contains('parchment'),false);assert.equal(d.querySelector('.equipped-list'),null);
 d.querySelector('[data-body-slot="item1"]').click();assert.match(d.getElementById('wardrobe-detail').textContent,/鈴/);assert.equal(d.querySelector('[data-discard="0"]'),null);
 d.querySelector('[data-discard="1"]').click();await flush();assert.deepEqual(Array.from(p.inventory),['stone']);assert.equal(d.activeElement.dataset.bodySlot,'item1');assert.equal(d.querySelector('[data-discard]'),null);
 d.querySelector('[data-body-slot="armor"]').click();assert.equal(d.getElementById('open-rack'),null);assert.equal(d.activeElement.dataset.bodySlot,'armor');
 ui.closeModal();ui.body();await flush();assert.equal(ui.modal,'body');assert.equal(d.querySelector('[data-body-slot="armor"]').getAttribute('aria-pressed'),'true');
});

test('wardrobe frames the character on both orientations and releases framing and input on close',async t=>{
 const {ui,g,d,w}=fixture(t);let resize;w.ResizeObserver=class{constructor(fn){resize=fn;}observe(){}disconnect(){}};
 let width=393,height=852;Object.defineProperties(g.renderer.canvas,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});
 ui.body();await flush();assert.ok(ui.skillPanelTop>0);assert.equal(ui.skillPanelLeft,null);assert.equal(ui.blocksWorldInput(),true);assert.equal(g.renderer.canvas.inert,true);
 width=852;height=393;resize();assert.ok(ui.skillPanelLeft>0);assert.equal(ui.skillPanelTop,null);
 d.querySelector('.panel-close').click();assert.equal(ui.skillPanelLeft,null);assert.equal(ui.skillPanelTop,null);assert.equal(g.renderer.canvas.inert,false);assert.equal(ui.blocksWorldInput(),false);
});

test('devotion grows from real prayer, preserves its witness on reload and is not granted by craft',()=>{
 const {sim,p}=life(api,13);activity(sim,p,'observe',180);assert.ok(!p.passives.includes(60904));
 activity(sim,p,'pray',540);assert.ok(p.passives.includes(60904));const discovery=p.skillLife.discovered.find(d=>d.id===60904);assert.ok(discovery);assert.ok(discovery.reasons.some(r=>r.includes('祈')));
 const q=api.Simulation.restore(JSON.parse(JSON.stringify(sim.exportState()))).players.get(p.id);assert.ok(q.passives.includes(60904));assert.deepEqual(JSON.parse(JSON.stringify(q.skillLife.discovered.find(d=>d.id===60904))),JSON.parse(JSON.stringify(discovery)));
});

test('devotion enables existing miracles and slightly improves actual blessing outcomes without certainty',()=>{
 const {sim,p,room}=life(api),ward=api.skillById(4321);assert.match(api.skillRestriction(p,ward),/理/);
 p.passives=[60904];assert.equal(api.skillRestriction(p,ward),'');sim.rng=()=>.61;sim.performStrike(p,room,ward);assert.equal(p.wardCharges,3);
 p.wardCharges=0;p.passives=[4061];sim.performStrike(p,room,ward);assert.equal(p.wardCharges,0,'existing small faith keeps its .58 chance');
 p.passives=[60904];sim.rng=()=>.95;sim.performStrike(p,room,ward);assert.equal(p.wardCharges,0);assert.equal(sim.events.at(-1).type,'miracleQuiet');
});

test('devotion is described as an always learned passive, independent of the three active limits',async t=>{
 const {sim,p,ui,d,sync}=fixture(t);sim.learn(p,60904);sync();const before=JSON.stringify(p.phaseWeights);ui.skills();await flush();d.querySelector('[data-phase="3"]').click();d.querySelector('[data-passive="60904"]').click();
 assert.match(d.getElementById('skill-detail').textContent,/篤い信仰/);assert.match(d.getElementById('skill-detail').textContent,/奇跡/);assert.equal(d.getElementById('skill-toggle'),null);assert.equal(d.querySelector('.phase-capacity'),null);assert.equal(JSON.stringify(p.phaseWeights),before);
});

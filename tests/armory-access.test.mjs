import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,flush} from './ui-fixture.cjs';
function atRack(f){const rack=f.g.snapshot.map.schools.find(s=>s.id==='armory');Object.assign(f.p,f.g.station(rack));f.sync();return rack;}

test('wardrobe only inspects physical gear and belongings, with no rack shortcut even at the armory',t=>{
 const f=fixture(t);for(const nearby of [false,true]){
  if(nearby)atRack(f);f.ui.body();
  for(const slot of ['weapon','armor','shield']){f.d.querySelector(`[data-body-slot="${slot}"]`).click();assert.equal(f.d.getElementById('open-rack'),null);assert.equal(f.d.querySelector('#wardrobe-choice button'),null);assert.equal(f.d.querySelector('[data-slot]'),null);}
  f.ui.closeModal();
 }
});

test('only the physical armory opens the rack, and closing returns to the same facility button',async t=>{
 const f=fixture(t);f.ui.body();assert.equal(f.ui.rack(),false);assert.equal(f.ui.modal,'body');f.ui.closeModal();
 atRack(f);const button=f.d.querySelector('[data-facility="armory"][data-context="rack"]');assert.ok(button);button.focus();button.click();await flush();
 assert.equal(f.ui.modal,'rack');assert.equal(f.ui.navigation.length,0);f.d.querySelector('[data-slot="weapon"][data-value="0"]').click();assert.equal(f.p.weapon,0);
 f.d.querySelector('.panel-close').click();await flush();assert.equal(f.ui.modal,null);assert.equal(f.d.activeElement,button);
});

test('distance and room changes close the rack, and stale buttons cannot equip remotely',t=>{
 for(const departure of ['distance','room']){
  const f=fixture(t);atRack(f);f.d.querySelector('[data-context="rack"]').click();const gear=f.d.querySelector('[data-slot="weapon"][data-value="0"]');
  if(departure==='distance')f.p.x+=20;else{const front=f.sim.makeRoom('front');f.p.room=front.id;}
  f.sync();assert.equal(f.ui.modal,null);assert.equal(f.d.querySelector('[data-slot]'),null);gear.click();assert.equal(f.p.weapon,-1);
  assert.equal(f.g.command({type:'equip',slot:'weapon',value:0}),false);assert.equal(f.ui.rack(),false);
 }
});

test('a departed facility button cannot reopen the rack before the HUD refresh catches up',t=>{
 const f=fixture(t);atRack(f);const button=f.d.querySelector('[data-context="rack"]');f.p.x+=20;
 button.click();assert.equal(f.ui.modal,null);assert.equal(f.p.weapon,-1);
});

test('life-state transitions revoke rack access while preserving the seven-year equipment restriction',t=>{
 for(const state of ['downed','carried','recovering']){
  const f=fixture(t);atRack(f);f.ui.rack();f.p.lifeState=state;f.sync();assert.notEqual(f.ui.modal,'rack');assert.equal(f.ui.rack(),false);
 }
 const f=fixture(t);atRack(f);f.p.age=6;f.sync();f.ui.rack();assert.equal(f.d.querySelector('[data-slot="weapon"]').disabled,true);
 f.p.age=7;f.sync();assert.equal(f.d.querySelector('[data-slot="weapon"]').disabled,false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './ui-fixture.cjs';

test('facility activity buttons appear below the player and still start/stop the real activity',t=>{
 const {p,g,d,sim,sync}=fixture(t),school=g.snapshot.map.schools.find(s=>s.id==='sword');
 p.x=school.x;p.z=school.z;sync();const group=d.querySelector('[data-anchor=feet]'),button=group.querySelector('[data-context=activity]');
 assert.ok(group);assert.equal(d.querySelector('#context [data-context=activity]'),null);assert.match(button.textContent,/指南書/);
 button.click();assert.equal(p.activity,'study');sync();assert.match(group.textContent,/やめる/);group.querySelector('button').click();assert.equal(p.activity,null);
 assert.equal(sim.getRoom(p).id,p.room);
});

test('armory actions share one anchor and preserve rack distance and age validation',t=>{
 const {p,g,d,sync}=fixture(t),school=g.snapshot.map.schools.find(s=>s.id==='armory');p.x=school.x;p.z=school.z+3;p.age=6;sync();
 const group=d.querySelector('[data-anchor=feet]');assert.equal(group.querySelectorAll('button').length,2);assert.equal(d.querySelector('#context [data-context=rack]'),null);
 group.querySelector('[data-context=rack]').click();assert.equal(g.ui.modal,'rack');assert.equal(d.querySelector('[data-slot=weapon]').disabled,true);g.ui.closeModal();
 p.age=7;sync();group.querySelector('[data-context=rack]').click();assert.equal(d.querySelector('[data-slot=weapon][data-value="0"]').disabled,false);
});

test('facility transforms follow fractional camera movement without changing labels or allocating nodes',t=>{
 const {p,g,ui,d,w,sync}=fixture(t),school=g.snapshot.map.schools.find(s=>s.id==='church');p.x=school.x;p.z=school.z;sync();
 const node=d.querySelector('[data-anchor=feet]'),button=node.querySelector('button');g.renderer.width=1000;g.renderer.height=800;
 let camera=.125;g.renderer.project=(x,y,z)=>({x:500+x*2+camera,y:350-y*20,visible:true});ui.positionFacilityActions(g.snapshot);const transform=node.style.transform;
 camera=.25;ui.positionFacilityActions(g.snapshot);assert.notEqual(node.style.transform,transform);assert.equal(node.querySelector('button'),button);
 const observer=new w.MutationObserver(()=>{});observer.observe(node,{subtree:true,childList:true,attributes:true,characterData:true});for(let i=0;i<100;i++)ui.positionFacilityActions(g.snapshot);assert.equal(observer.takeRecords().length,0);observer.disconnect();
});

test('facility buttons hide immediately out of range, offscreen, in menus, and on death',t=>{
 const {p,g,ui,d,sync}=fixture(t),school=g.snapshot.map.schools.find(s=>s.id==='magic');p.x=school.x;p.z=school.z;sync();const node=d.querySelector('[data-anchor=feet]');
 p.x+=20;ui.positionFacilityActions(g.snapshot);assert.equal(node.style.display,'none');p.x=school.x;
 g.renderer.project=()=>({x:-1,y:200,visible:true});ui.positionFacilityActions(g.snapshot);assert.equal(node.style.display,'none');
 g.renderer.project=()=>({x:300,y:200,visible:true});ui.positionFacilityActions(g.snapshot);assert.equal(node.style.display,'');
 ui.modal='skills';ui.positionFacilityActions(g.snapshot);assert.equal(node.style.display,'none');ui.modal=null;
 p.alive=false;ui.positionFacilityActions(g.snapshot);assert.equal(node.style.display,'none');p.alive=true;p.prologue=true;ui.positionFacilityActions(g.snapshot);assert.equal(node.style.display,'none');
});

test('departed facilities are removed; physical boarding has no reservation button while pickup remains available',t=>{
 const {p,g,d,sim,sync}=fixture(t);p.x=0;p.z=24;sync();assert.equal(d.querySelector('[data-context=boat]'),null);assert.equal(d.querySelector('#context [data-context=boat]'),null);
 sim.getRoom(p).items=[{id:'near',item:'stone',x:0,z:24,ready:0}];sync();assert.ok(d.querySelector('[data-context=pickup]'));
 p.x=0;p.z=0;sync();assert.equal(d.querySelector('[data-anchor=feet]'),null);
 g.ui.showGame();sync();assert.equal(d.querySelectorAll('#facility-actions').length,1);assert.equal(g.ui.facilityGroups.size,d.querySelectorAll('[data-anchor]').length);
});

test('facility projection does not mutate the simulation or saved state',t=>{
 const {p,g,ui,sim,sync}=fixture(t),school=g.snapshot.map.schools.find(s=>s.id==='hunter');p.x=school.x;p.z=school.z;sync();const before=JSON.stringify(sim.exportState());
 for(let i=0;i<20;i++)ui.positionFacilityActions(g.snapshot);assert.equal(JSON.stringify(sim.exportState()),before);
});

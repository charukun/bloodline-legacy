import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture,flush} from './ui-fixture.cjs';

const step=(sim,n)=>{for(let i=0;i<n;i++)sim.tick(1/30);};
test('carried flick runs faster, stops on tap, exhausts safely and keeps the automatic release',t=>{
 const {g,p,sim,w}=fixture(t),canvas=g.renderer.canvas;sim.getRoom(p).actors=[];
 Object.assign(p,{prologue:true,age:0,x:0,z:0,releaseAt:100,introUntil:112,lastInput:0});
 g.installInput();canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
 const pointer=(type,x,y)=>{const e=new w.MouseEvent(type,{button:0,clientX:x,clientY:y,bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:7});canvas.dispatchEvent(e);};
 g.command({type:'move',x:0,z:1});step(sim,15);const walked=p.z;p.z=0;
 pointer('pointerdown',100,100);pointer('pointermove',100,155);pointer('pointerup',100,170);
 assert.ok(p.dash);step(sim,15);assert.ok(p.z>walked*1.65);assert.equal(p.action,'dash');assert.ok(p.stamina<100);
 pointer('pointerdown',100,100);pointer('pointerup',100,100);assert.equal(p.dash,null);assert.equal(Math.hypot(p.input.x,p.input.z),0);
 g.command({type:'dash',x:0,z:1});p.stamina=.1;step(sim,2);assert.equal(p.dash,null);assert.equal(p.action,'idle');
 p.stamina=100;g.command({type:'dash',x:0,z:1});p.releaseAt=sim.time+.2;step(sim,8);assert.equal(p.prologue,false);assert.equal(p.dash,null);assert.equal(p.age,4);assert.equal(p.inventory.length,0);
});

test('station gates reject broad radii and backsides, allow reachable fronts, and stop remote activity',t=>{
 const {api,sim,p,g,sync,d}=fixture(t),r=sim.getRoom(p);r.actors=[];
 const actions={sword:'study',magic:'read',church:'pray',armory:'care',forge:'observe',hunter:'track',dance:'play'};
 for(const s of r.map.schools){
  const a=api.facilityStation(s);assert.ok(a);Object.assign(p,{x:s.x+3.8,z:s.z+1,activity:null});
  assert.equal(g.command({type:'activity',activity:actions[s.id]}),false,s.id+' broad radius');sync();assert.equal(d.querySelector('[data-context=activity]'),null);
  Object.assign(p,{x:a.x,z:a.z-.4});assert.equal(g.command({type:'activity',activity:actions[s.id]}),false,s.id+' behind');
  Object.assign(p,{x:a.x,z:a.z+1.5});sim.bound(p,r);assert.ok(api.atFacilityStation(p,s),s.id+' collision hull permits access');
  assert.equal(g.command({type:'activity',activity:actions[s.id]}),true,s.id);assert.ok(Math.cos(p.dir)<-.99,s.id+' faces its equipment');sync();assert.equal(d.querySelector('[data-context=activity]').dataset.facility,s.id);
  p.x+=2.6;step(sim,1);assert.equal(p.activity,null,s.id+' moved away');
 }
 // The church facade and authored courtyard lectern have exact world anchors.
 const church=api.facilityStation({id:'church',x:3,z:-10});assert.equal(church.x,3);assert.equal(church.z,-9.64);
 for(const x of [-6.5,6.5]){const a=api.facilityStation({id:'sword',x,z:17.7});assert.equal(a.x,x+Math.sign(x)*1.65);assert.equal(a.z,18.55);}
});

test('mother teaches the facility on arrival with brief warm lines and no boundary chatter',t=>{
 const {api,sim,p,g}=fixture(t),r=sim.getRoom(p);r.actors=[];
 Object.assign(p,{prologue:true,age:0,motherUntil:0,motherNextAt:0,releaseAt:100});
 for(const id of ['church','magic','sword','armory']){
  const school=r.map.schools.find(s=>s.id===id);Object.assign(p,g.station(school));sim.time+=4;sim.tickMother(p,1/30);
  assert.equal(p.motherText,api.MOTHER_LINES[id][0]);assert.ok(p.motherUntil-sim.time<=3.5);
  const count=sim.events.filter(e=>e.type==='mother').length;
  for(let i=0;i<30;i++){p.x+=(i%2?1:-1)*.02;sim.tickMother(p,1/30);}
  assert.equal(sim.events.filter(e=>e.type==='mother').length,count);
 }
 for(const lines of Object.values(api.MOTHER_LINES))for(const line of lines){assert.ok([...line].length<=27,line);assert.ok(!line.includes('\n'));}
 assert.ok(api.MOTHER_LINES.cradle.some(s=>s.includes('大好き')));
 const saved=api.Simulation.restore(sim.exportState());assert.ok(saved.players.get(p.id).motherTopicsAt.church>=0);
});

test('hints prioritize danger, fatigue and wounds, update in place, and restore focus',async t=>{
 const {g,p,ui,d,api,sim,sync}=fixture(t);p.age=4;p.z=-33;p.stamina=12;p.health=65;p.wounds.torso={severity:'light',healsAt:8};sync();
 assert.deepEqual(Array.from(api.uiJourneyHints(g.snapshot),h=>h.id),['young','rest','wounds']);
 const button=d.getElementById('hud-hints');button.focus();const before=JSON.stringify(sim.exportState());button.click();await flush();
 assert.equal(ui.modal,'hints');assert.equal(d.querySelectorAll('[data-hint]').length,3);assert.equal(JSON.stringify(sim.exportState()),before);
 Object.assign(p,{x:0,z:0,age:18,health:100,stamina:100,staminaCap:100,wounds:{},skillLife:{...p.skillLife,unread:[60000]}});sync();
 assert.equal(d.querySelector('[data-hint]').dataset.hint,'discovery');assert.equal(d.querySelector('[data-hint=young]'),null);
 p.rescueTarget='friend';p.stamina=0;sync();assert.equal(d.querySelector('[data-hint]').dataset.hint,'carry');assert.equal(d.querySelector('[data-hint=rest]'),null);
 d.querySelector('.panel-close').click();await flush();assert.equal(d.activeElement,button);assert.equal(ui.blocksWorldInput(),false);
});

test('replayed discovery events do not restart celebration or change learning',t=>{
 const {p,ui,sim,d,w,sync}=fixture(t);let now=1000;w.performance.now=()=>now;
 const e={type:'insight',id:60000,player:p.id,seq:55};const before=JSON.stringify(sim.exportState());ui.event(e);
 const first=ui.skillRevealEvent;now=1900;ui.event(e);assert.equal(ui.skillRevealEvent,first);assert.equal(d.querySelectorAll('.revelation-rays i').length,12);
 ui.event({...e,id:60900,type:'passive',seq:56});assert.equal(ui.skillRevealEvent.ids.length,2);assert.equal(JSON.stringify(sim.exportState()),before);
 now=6000;sync();assert.equal(ui.skillRevealEvent,null);
});

test('the lineage exposes the actual embedded build identity to deployment verification',t=>{
 const {d,ui,w}=fixture(t);w.eval("globalThis.BUILD_INFO={environment:'dev',commit:'1234567890abcdef',displayVersion:'v0.6.0-dev · 1234567'}");ui.showClan();
 const host=d.querySelector('.lineage-theatre-host'),node=host.shadowRoot.querySelector('[data-build-version]');
 assert.equal(node.textContent,'v0.6.0-dev · 1234567');assert.match(node.title,/1234567890abcdef/);
 ui.settings();assert.equal(d.querySelector('.build-plaque [data-build-version]').textContent,node.textContent);
});

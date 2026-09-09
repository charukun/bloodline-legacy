import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './ui-fixture.cjs';

test('confirmed local wound highlights only the struck part and shows one short pain line',t=>{
 const {g,p,sim,ui,d,sync}=fixture(t);sim.time=10;
 sim.inflictWound(p,'leftArm','light',{id:'enemy',x:0,z:1});
 g.snapshot=sim.snapshot(p.id,0);const e=sim.events.findLast(e=>e.type==='wound');ui.event(e);sync();
 assert.equal(d.querySelectorAll('#wound-mark [data-impact]').length,1);
 assert.equal(d.querySelector('#wound-mark [data-impact]').dataset.part,'leftArm');
 assert.equal(d.querySelectorAll('.pain-callout').length,1);
 assert.match(d.querySelector('.pain-callout').textContent,/っ|くっ/);
 assert.equal(p.speech,'');assert.equal(p.lastChat,-10);
 sim.time+=1.2;sync();assert.equal(d.querySelectorAll('[data-impact],.pain-callout').length,0);
 assert.equal(d.querySelector('#wound-mark [data-part="leftArm"]').getAttribute('fill'),'#d2ae61');
});

test('rehits are bounded, severe pain preempts light pain, and remote/guard events cannot impersonate damage',t=>{
 const {g,p,sim,ui,d,sync}=fixture(t);sim.time=10;g.snapshot.t=10;
 const event=(seq,part,severity='light',extra={})=>({seq,type:'wound',player:p.id,part,severity,upgraded:true,...extra});
 ui.event(event(100,'head'));const first=ui.damageFeedback.bark;
 for(let i=101;i<120;i++)ui.event(event(i,'head'));
 assert.equal(ui.damageFeedback.parts.size,1);assert.equal(ui.damageFeedback.bark,first);
 ui.event(event(120,'torso','heavy'));assert.equal(ui.damageFeedback.bark.level,2);
 ui.event(event(121,'leftLeg','lost',{player:'remote'}));ui.event(event(122,'rightArm','heavy',{type:'guarded'}));
 sync();assert.equal(d.querySelectorAll('#wound-mark [data-impact]').length,2);
 assert.equal(d.querySelectorAll('.pain-callout').length,1);
 ui.event(event(120,'leftLeg','fatal'));assert.equal(ui.damageFeedback.parts.size,2,'duplicate delivery ignored');
 ui.showGame();sync();assert.equal(d.querySelectorAll('#wound-mark [data-impact],.pain-callout').length,0);
});

test('part pulse survives wound SVG replacement and never destroys the existing chat bubble',t=>{
 const {g,p,sim,ui,d,sync}=fixture(t);sim.time=10;Object.assign(p,{speech:'ここで待とう',speechUntil:15});g.snapshot.t=10;
 ui.event({seq:100,type:'wound',player:p.id,part:'rightLeg',severity:'heavy',upgraded:true});
 p.wounds.rightLeg={severity:'heavy'};sync();
 assert.equal(d.querySelector('#wound-mark [data-part="rightLeg"]').dataset.impact,'injury');
 assert.equal(d.querySelector('.speech-bubble').textContent,'ここで待とう');
 assert(d.querySelector('.pain-callout'));
 p.wounds.leftArm={severity:'light'};sim.time=10.2;sync();
 assert(d.querySelector('#wound-mark [data-part="rightLeg"]').style.getPropertyValue('--hit-pulse'));
});

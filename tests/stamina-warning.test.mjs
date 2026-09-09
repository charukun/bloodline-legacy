import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './ui-fixture.cjs';

test('stamina warning starts before empty, escalates, uses hysteresis and clears on rest or death',t=>{
 const {p,ui,d,sync}=fixture(t);p.stamina=30;sync();assert.equal(d.querySelector('.stamina-orb').dataset.fatigue,'1');
 p.stamina=14;sync();assert.equal(d.querySelector('.stamina-orb').dataset.fatigue,'2');
 p.stamina=19;sync();assert.equal(d.querySelector('.stamina-orb').dataset.fatigue,'2');
 p.stamina=43;sync();assert.equal(d.querySelector('.stamina-orb').dataset.fatigue,'0');
 p.stamina=p.staminaCap=30;sync();assert.equal(ui.staminaFeedback.level,1);p.seated=true;sync();assert.equal(ui.staminaFeedback.level,0);p.seated=false;p.alive=false;sync();assert.equal(ui.staminaFeedback.level,0);
});
test('breath is short, local and rate limited; player speech, input and notifications are unchanged',t=>{
 const {g,p,ui,d,sync}=fixture(t);const sounds=[];g.audio.fx=e=>sounds.push(e);p.stamina=10;sync();
 assert.equal(sounds.length,1);assert.equal(sounds[0].type,'breath');const feedback=ui.staminaFeedback;
 const now=feedback.nextBreath-8;for(let i=0;i<40;i++)feedback.sample(p,now+1);assert.equal(feedback.nextBreath,now+8);
 assert.equal(feedback.sample(p,now+8).sound,true);assert.equal(p.speech,'');assert.equal(p.lastChat,-10);
 p.speech='ありがとう';p.speechUntil=100;sync();assert.equal(d.querySelector('.breath-callout'),null);assert.ok(d.querySelector('.speech-bubble'));
 p.speechUntil=-1;ui.damageFeedback={bark:{text:'っ！',until:-1},paint(){}};sync();assert.ok(d.querySelector('.breath-callout'),'expired speech and pain do not suppress later breath');
 p.lifeState='downed';sync();assert.equal(ui.staminaFeedback.level,0);
});
test('clinic action uses the player feet and real treatment command; guards have a rescue button',t=>{
 const {g,p,sim,d,sync}=fixture(t);Object.assign(p,{x:8,z:-23,health:30});sync();const b=d.querySelector('[data-context=treatment]');assert.ok(b);assert.equal(b.closest('[data-anchor]').dataset.anchor,'feet');b.click();assert.equal(p.seated,true);
 p.seated=false;const r=sim.getRoom(p),guard=r.actors.find(a=>a.kind==='guard'&&!a.role);Object.assign(guard,{x:8,z:-24});sim.killActor(guard,null,r);sync();const rescue=d.querySelector('[data-rescue]');assert.equal(rescue.dataset.rescue,guard.id);rescue.click();assert.equal(p.rescueTarget,guard.id);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {fixture,flush}=createRequire(import.meta.url)('./ui-fixture.cjs');

test('settings change the session clock in place and keep the selected control accessible',async t=>{
 const {g,ui,d,sim}=fixture(t),before=JSON.stringify(sim.exportState());ui.settings();
 const details=d.querySelector('.world-speed-settings');assert.equal(details.open,false);details.open=true;
 assert.equal(d.querySelectorAll('[data-world-speed]').length,5);d.querySelector('[data-world-speed="0.5"]').click();await flush();
 assert.equal(g.worldSpeed(),.5);assert.equal(d.querySelector('.world-speed-settings').open,true);assert.equal(d.querySelector('[data-world-speed="0.5"]').getAttribute('aria-pressed'),'true');assert.equal(d.activeElement.dataset.worldSpeed,'0.5');
 assert.equal(JSON.stringify(sim.exportState()),before);assert.equal(g.profile.debugWorldSpeed,undefined);assert.match(d.querySelector('.world-speed-settings').textContent,/この起動中のみ/);
});

test('shared-world settings cannot change the local debug clock even after opting out for the next life',t=>{
 const {g,ui,d,w}=fixture(t);g.online=true;g.profile.online=true;ui.settings();
 assert.ok([...d.querySelectorAll('[data-world-speed]')].every(b=>b.disabled));assert.match(d.querySelector('.world-speed-settings').textContent,/変更できません/);
 const checkbox=d.getElementById('online-mode');checkbox.checked=false;checkbox.dispatchEvent(new w.Event('change'));
 assert.ok([...d.querySelectorAll('[data-world-speed]')].every(b=>b.disabled));assert.equal(g.worldSpeed(),1);
});

test('death first explains the loss and actual cause; no timer or snapshot update skips the acknowledgement',async t=>{
 const {p,sim,g,ui,d,sync}=fixture(t);sim.learn(p,4001);sim.die(p,'寿命');sync();await flush();
 assert.match(d.querySelector('.death-name').textContent,/リオは亡くなりました/);assert.match(d.querySelector('#death-cause').textContent,/寿命/);assert.equal(d.querySelector('[data-bequest],.skill-life-recap,#next-life'),null);
 const next=d.getElementById('death-continue');assert.equal(d.activeElement,next);assert.equal(d.querySelector('[role=dialog]').getAttribute('aria-describedby'),'death-cause');
 for(let i=0;i<20;i++)ui.update(g.snapshot);assert.equal(d.getElementById('death-continue'),next);assert.equal(sim.legacy(p.owner).records.length,0);
 next.click();assert.equal(d.getElementById('death-continue'),null);assert.ok(d.querySelector('[data-bequest]'));assert.equal(p.legacyChoice.state,'pending');
});

test('being incapacitated is not presented as death; the finishing blow is explained separately',t=>{
 const {p,sim,d,sync}=fixture(t);sim.downPlayer(p,'深手');sync();assert.equal(d.getElementById('death-cause'),null);
 sim.die(p,'トドメを受けた');sync();assert.match(d.getElementById('death-cause').textContent,/深手で動けなくなったところに、トドメ/);assert.equal(p.alive,false);
});

test('sacrifice, old or missing death records receive factual, escaped explanations',t=>{
 const {p,sim,g,ui,d,sync}=fixture(t);sim.die(p,'禁術に命を捧げた');sync();assert.match(d.getElementById('death-cause').textContent,/禁術で残りの寿命を使い果たしました/);
 for(const cause of ['<img src=x onerror=bad()>','']){p.cause=cause;ui.deathShown='';sync();assert.equal(d.querySelector('#death-cause img'),null);assert.equal(d.getElementById('death-cause').textContent,cause?'死因：'+cause:'死因の記録は残っていません。');}
 const stale=d.getElementById('death-continue'),child=sim.addPlayer('child',{owner:'another'});g.snapshot=g.decorate(sim.snapshot(child.id));stale.click();assert.equal(ui.deathAcknowledged,undefined);
});

test('restoring a pending death shows its cause before resuming the existing choice',t=>{
 const {p,sim,g,ui,d,sync}=fixture(t);sim.die(p,'寿命');sync();d.getElementById('death-continue').click();
 const restored=sim.constructor.restore(sim.exportState());g.sim=restored;g.snapshot=g.decorate(restored.snapshot(p.id));ui.deathAcknowledged=undefined;ui.showGame();ui.update(g.snapshot);
 assert.match(d.getElementById('death-cause').textContent,/寿命/);d.getElementById('death-continue').click();assert.ok(d.querySelector('[data-bequest]'));assert.equal(restored.players.size,1);assert.equal(restored.legacy(p.owner).records.length,0);
});

test('a new life gets its own acknowledgement and the death notice never prompts inheritance',t=>{
 const {p,sim,g,ui,d,sync}=fixture(t);sim.die(p,'寿命');sync();d.getElementById('death-continue').click();
 const child=sim.addPlayer('child',{owner:'another',name:'ルカ'});g.playerId=child.id;sim.die(child,'寿命');g.snapshot=g.decorate(sim.snapshot(child.id));ui.update(g.snapshot);
 assert.match(d.querySelector('.death-name').textContent,/ルカは亡くなりました/);assert.ok(d.getElementById('death-continue'));
 ui.event({type:'death',player:child.id});assert.match(d.getElementById('toasts').textContent,/命を落とした/);assert.doesNotMatch(d.getElementById('toasts').textContent,/遺す技|後世/);
});

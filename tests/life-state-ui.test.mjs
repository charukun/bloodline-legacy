import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {fixture}=createRequire(import.meta.url)('./ui-fixture.cjs');
test('death choice uses the deceased player command and commits one actual learned skill',t=>{
 const {sim,p,g,ui,d,sync}=fixture(t);sim.learn(p,4001);p.skillUses[4000]=90;sim.die(p,'寿命');sync();d.getElementById('death-continue').click();
 assert.equal(d.querySelectorAll('[data-bequest]').length,2);assert.equal(d.querySelector('#next-life'),null);
 const command=d.querySelector('[data-bequest="4001"]');command.click();command.click();assert.equal(sim.legacy(p.owner).records.length,0);const confirm=d.getElementById('bequest-confirm');confirm.click();confirm.click();
 assert.equal(sim.legacy(p.owner).records.length,1);assert.equal(sim.legacy(p.owner).records[0].skill,4001);assert.ok(d.querySelector('#next-life'));assert.equal(d.querySelectorAll('[data-bequest]').length,0);
});
test('returning to the clan and Game.start resumes a pending bequest instead of creating a life',async t=>{
 const {sim,p,g,d}=fixture(t);sim.die(p,'寿命');g.profile.uiExplained=true;g.renderer.effects=[];g.renderer.camera={};g.toClan();
 assert.ok(g.canResume());const button=g.ui.lineageView.home.scope.querySelector('#begin-life');assert.equal(button.textContent,'遺す技を選ぶ');button.click();await new Promise(resolve=>setTimeout(resolve,20));g.ui.update(g.snapshot);d.getElementById('death-continue').click();assert.equal(g.snapshot.player.id,p.id);assert.ok(d.querySelector('[data-bequest]'));assert.equal(sim.players.size,1);
});
test('nearby rescue button dispatches a validated claim, then offers to put the casualty down',t=>{
 const {sim,p,g,d,sync}=fixture(t),q=sim.addPlayer('casualty',{owner:'other',name:'フィン'});Object.assign(p,{x:0,z:-33});Object.assign(q,{x:0,z:-34,prologue:false,age:18});sim.downPlayer(q,'深手');sync();
 assert.match(d.querySelector('[data-rescue]').textContent,/フィンを救助/);d.querySelector('[data-rescue]').click();sync();assert.equal(q.carrierId,p.id);assert.ok(d.querySelector('[data-drop]'));
 d.querySelector('[data-drop]').click();sync();assert.equal(q.carrierId,null);assert.equal(q.lifeState,'downed');
});
test('casualties see recovery state and cannot use facilities; enemy name has no health gauge',t=>{
 const {sim,p,g,ui,d,sync}=fixture(t),e=sim.actor('maw',p.x+1,p.z);sim.getRoom(p).actors.push(e);p.autoFight=e.id;
 sync();ui.updateWorldLabels(g.snapshot);assert.ok(d.querySelector('.target-label'));assert.equal(d.querySelector('.target-meter'),null);
 sim.downPlayer(p,'深手');sync();assert.match(d.querySelector('#rescue-actions').textContent,/動けない/);assert.equal(d.querySelectorAll('#context button').length,0);assert.ok(d.querySelector('progress'));
});


test('memory tokens inspect without committing, then the chosen seal is the only inherited skill',t=>{
 const {sim,p,d,sync}=fixture(t);for(const id of [4001,4100,60900])sim.learn(p,id);sim.die(p,'寿命');sync();d.getElementById('death-continue').click();
 assert.equal(d.getElementById('bequest-confirm').disabled,true);
 assert.ok(d.querySelectorAll('.bequest-token').length>=3);assert.equal(d.querySelector('.legacy-bequest .full-button'),null);
 for(const id of [4001,4100]){d.querySelector(`[data-bequest="${id}"]`).click();assert.equal(sim.legacy(p.owner).records.length,0);assert.equal(d.querySelectorAll('[data-bequest][aria-pressed=true]').length,1);}
 assert.match(d.getElementById('bequest-detail').textContent,/蹴り崩し/);assert.equal(d.getElementById('bequest-confirm').disabled,false);
 d.getElementById('bequest-confirm').click();assert.equal(sim.legacy(p.owner).records[0].skill,4100);assert.ok(d.getElementById('next-life'));
});

test('scrolling a large memory collection preserves the inspected skill through snapshot refresh',t=>{
 const {sim,p,d,w,ui,g,sync}=fixture(t);for(let id=4000;id<4400&&p.skills.length<40;id++)sim.learn(p,id);sim.die(p,'寿命');sync();d.getElementById('death-continue').click();
 const tokens=d.querySelectorAll('[data-bequest]'),last=tokens[tokens.length-1];assert.ok(tokens.length>20);const id=Number(last.dataset.bequest);last.focus();last.click();d.querySelector('.legacy-bequest').scrollTop=600;
 for(let i=0;i<10;i++)ui.update(g.snapshot);
 assert.equal(d.activeElement,last);assert.equal(d.querySelector('.legacy-bequest').scrollTop,600);assert.equal(last.getAttribute('aria-pressed'),'true');assert.equal(p.legacyChoice.state,'pending');
 d.getElementById('bequest-confirm').click();assert.equal(p.legacyChoice.skill,id);
});

test('online confirmation sends once, can recover after a missing reply and finishes from authoritative state',t=>{
 const {sim,p,g,ui,d,w,sync}=fixture(t);sim.learn(p,4001);sim.die(p,'寿命');sync();d.getElementById('death-continue').click();g.online=true;g.live={ready:true};g.commandBuffer=[];
 const original=w.setTimeout;let retry;w.setTimeout=(fn,ms,...args)=>{if(ms===5000)retry=fn;return original(fn,ms,...args);};
 d.querySelector('[data-bequest="4001"]').click();const confirm=d.getElementById('bequest-confirm');confirm.click();confirm.click();assert.equal(g.commandBuffer.length,1);assert.equal(p.legacyChoice.state,'pending');assert.equal(confirm.disabled,true);
 retry();assert.equal(confirm.disabled,false);g.commandBuffer=[];confirm.click();assert.equal(g.commandBuffer.length,1);assert.ok(sim.command(p.id,g.commandBuffer[0]));sync();
 assert.ok(d.getElementById('next-life'));assert.equal(sim.legacy(p.owner).records.length,1);retry();assert.equal(d.querySelector('[data-bequest]'),null);
});

test('rejected confirmation and leaving the panel cannot accidentally record a skill',t=>{
 const {sim,p,g,ui,d,sync}=fixture(t);sim.learn(p,4001);sim.die(p,'寿命');sync();d.getElementById('death-continue').click();d.querySelector('[data-bequest="4001"]').click();g.command=()=>false;
 const confirm=d.getElementById('bequest-confirm');confirm.click();assert.equal(p.legacyChoice.state,'pending');assert.equal(confirm.disabled,false);assert.equal(sim.legacy(p.owner).records.length,0);ui.closeModal();assert.equal(sim.legacy(p.owner).records.length,0);
});

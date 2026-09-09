import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {fixture}=createRequire(import.meta.url)('./ui-fixture.cjs');
test('death choice uses the deceased player command and commits one actual learned skill',t=>{
 const {sim,p,g,ui,d,sync}=fixture(t);sim.learn(p,4001);p.skillUses[4000]=90;sim.die(p,'寿命');sync();
 assert.equal(d.querySelectorAll('[data-bequest]').length,2);assert.equal(d.querySelector('#next-life'),null);
 const command=d.querySelector('[data-bequest="4001"]');command.click();command.click();
 assert.equal(sim.legacy(p.owner).records.length,1);assert.equal(sim.legacy(p.owner).records[0].skill,4001);assert.ok(d.querySelector('#next-life'));assert.equal(d.querySelectorAll('[data-bequest]').length,0);
});
test('returning to the clan and Game.start resumes a pending bequest instead of creating a life',async t=>{
 const {sim,p,g,d}=fixture(t);sim.die(p,'寿命');g.profile.uiExplained=true;g.renderer.effects=[];g.renderer.camera={};g.toClan();
 assert.ok(g.canResume());const button=g.ui.lineageView.home.scope.querySelector('#begin-life');assert.equal(button.textContent,'遺す技を選ぶ');button.click();await new Promise(resolve=>setTimeout(resolve,20));g.ui.update(g.snapshot);assert.equal(g.snapshot.player.id,p.id);assert.ok(d.querySelector('[data-bequest]'));assert.equal(sim.players.size,1);
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

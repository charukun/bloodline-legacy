import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{fixture,flush}=require('./ui-fixture.cjs');
const settle=async()=>{await flush();await flush();await flush();};
function ready(t,first=false){
 const x=fixture(t),{g,sim,p}=x;g.screen='clan';g.renderer.camera={};g.renderer.effects=[];g.profile.race=0;g.profile.name='';g.profile.uiExplained=true;
 if(first){sim.removePlayer(p.id);g.playerId=null;g.snapshot=null;}
 x.ui.showClan();x.root=x.ui.lineageView.home.scope;return x;
}
function input(x,selector,value){const n=x.root.querySelector(selector);n.value=value;n.dispatchEvent(new x.w.Event('input',{bubbles:true}));}

test('first-play buttons pass through original onboarding and start exactly one newborn',async t=>{
 const x=ready(t,true),{g,ui,root,d,sim}=x;g.profile.uiExplained=false;
 root.querySelector('[data-origin-race="3"]').click();input(x,'#origin-name','灯');
 root.querySelector('#begin-life').click();root.querySelector('#begin-life').click();await settle();
 assert.equal(ui.modal,'onboarding');assert.equal(sim.players.size,0);assert.equal(root.querySelector('#dialog').open,false,'native overlay cannot obscure onboarding');
 const pageCount=d.querySelectorAll('.guide-pages i').length;
 for(let i=0;i<pageCount;i++)d.getElementById('guide-next').click();await settle();
 assert.equal(g.screen,'game');assert.equal(sim.players.size,1);const next=g.snapshot.player;
 assert.equal(next.name,'灯');assert.equal(next.age,0);assert.equal(next.gen,1);assert.equal(next.race,3);assert.deepEqual(Array.from(next.inherit),[]);
 assert.equal(root.childNodes.length,0,'clan decoder/listeners are disposed at game entry');assert.equal(ui.modal,null);
 const saved=JSON.parse(x.w.localStorage.getItem('aerin.tactics.v3.world.normal'));const restored=x.api.Simulation.restore(saved);assert.equal(restored.players.get(next.id).name,'灯');
});
test('archive selection starts generation 1001 with one experience, without granting a learned skill',async t=>{
 const x=ready(t,true),{g,sim,ui}=x,legacy=sim.legacy(g.profile.owner);legacy.generation=1001;legacy.archive=[4001,4002];legacy.records=[{id:'old',gen:4,name:'先人',skills:[4001],appearance:{race:0}}];ui.renderClan();
 assert.equal(x.root.querySelector('#memory-controls').hidden,false);x.root.querySelector('[data-memory-id="4001"]').click();assert.deepEqual(Array.from(g.profile.inherit),[]);x.root.querySelector('#begin-life').click();assert.equal(x.root.querySelector('#dialog').open,true);assert.equal(sim.players.size,0);
 x.root.querySelector('[data-birth-race="1"]').click();input(x,'#life-name','新たな命');x.root.querySelector('#confirm-birth').click();await settle();
 const p=g.snapshot.player;assert.equal(p.gen,1001);assert.equal(p.race,1);assert.equal(p.name,'新たな命');assert.deepEqual(Array.from(p.inherit),[4001]);assert.ok(!p.skills.includes(4001));assert.equal(legacy.records.length,1);assert.equal(sim.players.size,1);
});
test('surviving player resumes unchanged regardless of stale next-life profile choices',async t=>{
 const {g,p,sim,root}=ready(t);g.profile.race=3;g.profile.name='使わない';g.profile.inherit=[4001];const count=sim.players.size,signature=JSON.stringify(p);
 assert.equal(root.querySelector('#prologue-controls').hidden,true);root.querySelector('#begin-life').click();await settle();assert.equal(g.playerId,p.id);assert.equal(JSON.stringify(p),signature);assert.equal(sim.players.size,count);assert.equal(g.screen,'game');
});
test('death records and draft selection survive state refresh without limiting generations',async t=>{
 const {g,p,sim,ui}=ready(t);sim.die(p,'老衰');sim.command(p.id,{type:'choose-legacy',skill:4000});const legacy=sim.legacy(p.owner);legacy.archive=[4000,4001];legacy.records.push({id:'memory',gen:22,name:'遺した人',skills:[4001]});legacy.generation=23;ui.renderClan();const root=ui.lineageView.home.scope;
 root.querySelector('#find-memory').click();root.querySelector('[data-choose-id="4001"]').click();assert.deepEqual(Array.from(g.profile.inherit),[4001]);
 ui.renderClan();assert.deepEqual(Array.from(ui.lineageView.home.getDraft().inherit===4001?[4001]:[]),[4001]);root.querySelector('#close-dialog').click();root.querySelector('#skip-inherit').click();assert.deepEqual(Array.from(g.profile.inherit),[]);root.querySelector('#confirm-birth').click();await settle();assert.equal(g.snapshot.player.gen,23);assert.deepEqual(Array.from(g.snapshot.player.inherit),[]);
});
test('missing donor record and duplicate donors do not duplicate selectable skills',t=>{
 const x=ready(t,true),l=x.sim.legacy(x.g.profile.owner);l.generation=9;l.archive=[4001,4002];l.records=[{id:'a',gen:1,name:'一',skills:[4001]},{id:'b',gen:4,name:'二',skills:[4001]}];x.ui.renderClan();x.root.querySelector('#find-memory').click();
 assert.equal(x.root.querySelectorAll('.index-row').length,2);assert.match(x.root.querySelector('#library-results').textContent,/人物の記録なし/);x.root.querySelector('[data-choose-id="4002"]').click();assert.deepEqual(Array.from(x.g.profile.inherit),[4002]);assert.equal(l.records.length,2);
});
test('archive changes before confirmation are revalidated without creating a player',async t=>{
 const x=ready(t,true),l=x.sim.legacy(x.g.profile.owner);l.generation=2;l.archive=[4001];l.records=[{id:'a',gen:1,name:'前世',skills:[4001]}];x.ui.renderClan();x.root.querySelector('[data-memory-id="4001"]').click();x.root.querySelector('#begin-life').click();l.archive=[];x.root.querySelector('#confirm-birth').click();await settle();
 assert.equal(x.sim.players.size,0);assert.match(x.root.querySelector('#start-error').textContent,/継承の記録が変わりました/);assert.equal(x.root.querySelector('#confirm-birth').disabled,false);
});
test('failed online join keeps the actual save and draft; offline retry succeeds',async t=>{
 const x=ready(t,true);x.g.profile.online=true;x.g.checkServer=async()=>{x.g.serverAvailable=false;};x.ui.lineageView.refreshClan();x.root=x.ui.lineageView.home.scope;
 input(x,'#origin-name','残す名前');x.root.querySelector('#begin-life').click();await settle();assert.equal(x.g.screen,'clan');assert.equal(x.sim.players.size,0);assert.equal(x.g.profile.name,'残す名前');assert.equal(x.root.querySelector('#dialog').open,true);assert.match(x.root.querySelector('#dialog-content').textContent,/村に入れませんでした/);
 x.root.querySelector('#close-dialog').click();x.root.querySelector('#settings').click();x.root.querySelector('#game-settings').click();x.d.getElementById('online-mode').checked=false;x.d.getElementById('online-mode').dispatchEvent(new x.w.Event('change'));x.ui.closeModal();await settle();x.root=x.ui.lineageView.home.scope;x.root.querySelector('#begin-life').click();await settle();assert.equal(x.g.screen,'game');assert.equal(x.g.snapshot.player.name,'残す名前');
});
test('online resume token takes precedence over newborn setup without fabricating a character',t=>{
 const x=ready(t,true);x.g.profile.online=true;x.w.localStorage.setItem('aerin.tactics.v3.online.token.normal','"session-token"');x.g.profile.mode='normal';x.ui.renderClan();x.root=x.ui.lineageView.home.scope;
 assert.equal(x.root.querySelector('#prologue-controls').hidden,true);assert.equal(x.root.querySelector('#begin-life').textContent,'旅を続ける');assert.match(x.root.querySelector('#person-name').textContent,/続いている旅/);assert.equal(x.root.querySelectorAll('.ancestor').length,0);
});
test('native dialog Escape closes one layer; gameplay shortcuts never leak through shadow events',async t=>{
 const x=fixture(t);x.g.installInput();x.ui.settings();x.ui.lineage();await settle();const root=x.ui.lineageView.modalView.scope;
 root.querySelector('#help').click();root.querySelector('#close-dialog').dispatchEvent(new x.w.KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,composed:true,cancelable:true}));assert.equal(root.querySelector('#dialog').open,false);assert.equal(x.ui.modal,'lineage');
 root.querySelector('#begin-life').dispatchEvent(new x.w.KeyboardEvent('keydown',{key:'r',code:'KeyR',bubbles:true,composed:true,cancelable:true}));assert.equal(x.g.keys.size,0);assert.equal(!!x.p.seated,false);
 root.querySelector('#return-game').click();assert.equal(x.ui.modal,'settings');assert.equal(root.childNodes.length,0);
});

test('resume, historical browsing and inheritance never mix two people in the main stage',t=>{
 const x=ready(t),l=x.sim.legacy(x.p.owner);x.p.gen=5;x.p.name='ニール';l.generation=5;l.archive=[4000];l.records=[{id:'ancestor',gen:4,name:'リアン',age:14,skills:[4000],appearance:{race:3}}];x.ui.renderClan();
 const root=x.root,scene=()=>root.querySelector('#scene').textContent;
 assert.match(scene(),/ニール/);assert.doesNotMatch(scene(),/リアン|享年/);assert.equal(root.querySelector('#history-controls').hidden,true);
 root.querySelector('#open-index').click();assert.match(scene(),/リアン/);assert.doesNotMatch(scene(),/ニール|第5代/);assert.equal(root.querySelector('#begin-life').textContent,'今の人生へ戻る');assert.equal(root.querySelector('#memory-controls').hidden,true);
 root.querySelector('#begin-life').click();assert.match(scene(),/ニール/);assert.doesNotMatch(scene(),/リアン/);assert.equal(x.sim.players.size,1);
});
test('timeline, card order and keyboard arrows all increase generations to the right',t=>{
 const x=ready(t),l=x.sim.legacy(x.p.owner);l.records=[6,2,4,1,5,3].map(gen=>({id:'g'+gen,gen,name:'世代'+gen,skills:[4000]}));l.archive=[4000];x.ui.renderClan();x.root.querySelector('#open-index').click();
 const dial=x.root.querySelector('#time-dial');dial.value='0';dial.dispatchEvent(new x.w.Event('input'));
 const generations=()=>[...x.root.querySelectorAll('.ancestor-copy small')].map(n=>n.textContent);
 assert.deepEqual(generations(),['第1代','第2代','第3代']);assert.equal(x.root.querySelector('#generation').textContent,'第1代');
 const card=x.root.querySelector('[data-record=g1]');card.dispatchEvent(new x.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(x.root.querySelector('#generation').textContent,'第2代');assert.equal(dial.value,'1');
 x.root.querySelector('#older').click();assert.deepEqual(generations(),['第4代','第5代','第6代']);assert.equal(dial.value,'3');assert.equal(x.root.querySelector('#generation').textContent,'第4代');
 x.root.querySelector('#newer').click();assert.equal(dial.value,'0');
});
test('previewing another memory cannot silently replace the committed inheritance',t=>{
 const x=ready(t,true),l=x.sim.legacy(x.g.profile.owner);l.generation=6;l.archive=[4001,4002];l.records=[{id:'a',gen:1,name:'一',skills:[4001]},{id:'b',gen:4,name:'四',skills:[4002]}];x.ui.renderClan();
 assert.equal(x.root.querySelector('#memory-controls').hidden,false);assert.equal(x.root.querySelectorAll('[data-memory-id]').length,2);assert.equal(x.root.querySelector('[aria-pressed=true][data-memory-id]'),null);
 x.root.querySelector('[data-memory-id="4001"]').click();assert.deepEqual(Array.from(x.g.profile.inherit),[]);x.root.querySelector('#begin-life').click();assert.deepEqual(Array.from(x.g.profile.inherit),[4001]);
 x.root.querySelector('#close-dialog').click();x.root.querySelector('[data-memory-id="4002"]').click();assert.deepEqual(Array.from(x.g.profile.inherit),[4001]);assert.match(x.root.querySelector('#command-detail').textContent,/まだ変更していません/);
 x.root.querySelector('#begin-life').click();assert.deepEqual(Array.from(x.g.profile.inherit),[4002]);assert.equal(x.sim.players.size,0);
});
function confirmClear(x){x.root.querySelector('#settings').click();x.root.querySelector('#clear-lineage').click();return x.root.querySelector('#confirm-clear');}
test('clear cancellation preserves the save; confirmation clears only this family and survives restore',async t=>{
 const x=ready(t),l=x.sim.legacy(x.g.profile.owner);l.generation=5;l.archive=[4001];l.records=[{id:'old',gen:4,name:'先祖',skills:[4001]}];x.p.inventory=['bell'];
 const other=x.sim.addPlayer('other',{owner:'another-family',name:'隣人'});x.sim.legacy(other.owner).archive=[4002];x.g.profile.quality='low';x.g.profile.lineageMotion=false;x.g.profile.inherit=[4001];x.ui.renderClan();
 const before=JSON.stringify(x.sim.exportState()),settings={quality:x.g.profile.quality,sound:x.g.profile.sound,lineageMotion:x.g.profile.lineageMotion};
 confirmClear(x);assert.match(x.root.querySelector('#dialog-content').textContent,/所持品・装備・成長/);x.root.querySelector('#cancel-clear').click();assert.equal(JSON.stringify(x.sim.exportState()),before);
 const confirm=confirmClear(x);confirm.click();confirm.click();assert.equal(x.g.sim.players.has(x.p.id),false);assert.equal(x.g.sim.players.get(other.id).name,'隣人');assert.deepEqual(Array.from(x.g.sim.legacy(other.owner).archive),[4002]);
 assert.equal(x.g.getLegacy().generation,1);assert.equal(x.g.getLegacy().records.length,0);assert.deepEqual(Array.from(x.g.profile.inherit),[]);assert.equal(x.root.querySelector('#prologue-controls').hidden,false);
 for(const [key,val] of Object.entries(settings))assert.equal(x.g.profile[key],val);
 const keys=Object.keys(x.w.localStorage),backup=keys.find(k=>k.includes('backup.lineage.'));assert.ok(backup);assert.equal(JSON.parse(x.w.localStorage.getItem(backup)).world.players.length,2);
 const saved=JSON.parse(x.w.localStorage.getItem('aerin.tactics.v3.world.normal')),restored=x.api.Simulation.restore(saved);assert.equal(restored.players.has(x.p.id),false);assert.equal(restored.legacy(x.g.profile.owner).generation,1);
 x.root.querySelector('#begin-life').click();await settle();assert.equal(x.g.snapshot.player.gen,1);assert.equal(x.g.snapshot.player.age,0);assert.deepEqual(Array.from(x.g.snapshot.player.inherit),[]);
});
test('clear aborts on backup failure and rolls back a partial save without touching the live world',t=>{
 const x=ready(t),before=JSON.stringify(x.sim.exportState()),store=x.w.Storage.prototype,write=store.setItem;
 x.g.saveWorld();const original=x.w.localStorage.getItem('aerin.tactics.v3.world.normal');
 let failOn='backup';store.setItem=function(key,value){if(failOn==='backup'&&key.includes('backup.lineage.'))throw Error('quota');if(failOn==='profile'&&key.endsWith('.profile')){failOn='none';throw Error('quota');}return write.call(this,key,value);};
 t.after(()=>store.setItem=write);
 confirmClear(x).click();assert.equal(JSON.stringify(x.sim.exportState()),before);assert.equal(x.root.querySelector('#clear-error').hidden,false);assert.equal(x.root.querySelector('#confirm-clear').disabled,false);
 failOn='profile';x.root.querySelector('#confirm-clear').click();assert.equal(JSON.stringify(x.sim.exportState()),before);assert.equal(x.w.localStorage.getItem('aerin.tactics.v3.world.normal'),original);assert.equal(x.root.querySelector('#prologue-controls').hidden,true);
});
test('online or active gameplay cannot clear server state or remove local storage tokens',t=>{
 const x=ready(t);x.g.profile.online=true;x.ui.renderClan();x.root=x.ui.lineageView.home.scope;x.w.localStorage.setItem('aerin.tactics.v3.online.token.normal','"existing-token"');
 x.root.querySelector('#settings').click();assert.equal(x.root.querySelector('#clear-lineage').disabled,true);assert.throws(()=>x.ui.lineageView.clear(),/サーバー/);assert.match(x.w.localStorage.getItem('aerin.tactics.v3.online.token.normal'),/existing-token/);
 x.g.profile.online=false;x.g.screen='game';assert.throws(()=>x.ui.lineageView.clear(),/一族へ戻る/);assert.equal(x.sim.players.has(x.p.id),true);
});

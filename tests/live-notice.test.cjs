const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {fixture,flush}=require('./ui-fixture.cjs');
const target={application:'Bloodline Legacy',environment:'dev',mode:'game',commit:'b'.repeat(40),htmlSha256:'c'.repeat(64),live:{}};
function noticeFixture(t){
 const f=fixture(t),{w,g}=f;w.Response=Response;w.AbortSignal=AbortSignal;
 w.fetch=async()=>Response.json(target);
 w.eval(fs.readFileSync(path.join(__dirname,'../src/live/contract.mjs'),'utf8').replace(/^export /gm,'')+
  '\nconst LIVE_BUILD={};const BUILD_INFO={commit:"'+ 'a'.repeat(40)+'",environment:"dev"};\n'+
  fs.readFileSync(path.join(__dirname,'../src/live/client.js'),'utf8')+'\nwindow.TestLiveUpdate=LiveUpdate;');
 g.live=new w.TestLiveUpdate(g);return {...f,live:g.live};
}
test('routine update uses the Settings marker and inline controls; Later keeps the update accessible',async t=>{
 const {live,ui,d,g}=noticeFixture(t);await live.check();
 assert.equal(d.querySelector('.live-update-notice'),null,'no persistent message covers gameplay');
 assert.equal(ui.notices.active,null,'routine updates do not occupy gameplay toasts');
 let settings=d.querySelector('[data-menu=settings]');assert.equal(settings.dataset.liveNotice,'更新');
 settings.click();const card=d.querySelector('#live-update-slot .live-update-notice');assert(card);
 assert.match(card.textContent,/新しいバージョンがあります/);assert.equal(card.querySelector('button').textContent,'保存して更新する');
 card.querySelector('button:last-child').click();assert.equal(ui.modal,null);assert.equal(live.requested,undefined);
 ui.showGame();settings=d.querySelector('[data-menu=settings]');assert.equal(settings.dataset.liveNotice,'更新');
 settings.click();assert(d.querySelector('#live-update-slot .live-update-notice'));
});
test('requesting update closes Settings before checking safety, through its normal UI lifecycle',async t=>{
 const {live,ui,d,g}=noticeFixture(t);await live.check();const settings=d.querySelector('[data-menu=settings]');settings.focus();settings.click();await flush();let requests=0;
 live.update=()=>{requests++;assert.equal(ui.modal,null);assert.equal(g.renderer.canvas.inert,false);};
 d.querySelector('.live-update-actions button').click();assert.equal(requests,1);assert.equal(live.requested,true);
 assert.equal(d.activeElement,settings);
});
test('combat queues the update and a real Settings action can cancel it without saving or reload',async t=>{
 const {live,ui,d,g}=noticeFixture(t);await live.check();g.snapshot.player.combo={};let saves=0;g.saveWorld=()=>{saves++;return true;};
 ui.settings();d.querySelector('.live-update-actions button').click();assert.equal(ui.modal,null);
 assert.equal(live.requested,true);assert.equal(live.noticeState.kind,'waiting');assert.equal(saves,0);
 ui.settings();await live.check();assert.match(d.querySelector('.live-update-notice p').textContent,/安全に保存できるまで待っています/);
 assert.equal(d.querySelector('.live-update-actions button').disabled,true);
 d.querySelector('.live-update-actions button:last-child').click();assert.equal(live.requested,false);assert.equal(live.updateTimer,null);
 assert.equal(live.noticeState.kind,'available');assert.equal(saves,0);
});
test('version polls never erase required-update or failed-update explanations',async t=>{
 const {live,ui,d}=noticeFixture(t);live.fail({status:426,data:{progressProtected:true}});await live.check();ui.settings();
 assert.equal(live.noticeState.kind,'required');assert.match(d.querySelector('.live-update-notice p').textContent,/プレイを再開するには/);
 assert.equal(d.querySelector('.live-update-actions button:last-child').hidden,true);
 live.show('更新に失敗しました。',true,'error');await live.check();assert.equal(live.noticeState.kind,'error');
});
test('clan Options carries the marker into Settings and clearing it restores the original accessible name',async t=>{
 const {live,ui,d,g}=noticeFixture(t);await live.check();g.screen='clan';ui.showClan();const scope=ui.lineageView.home.scope;
 const options=scope.querySelector('#settings');assert.equal(options.dataset.liveNotice,'更新');options.click();
 scope.querySelector('#game-settings').click();assert.equal(ui.modal,'settings');assert(d.querySelector('#live-update-slot .live-update-notice'));
 live.clearNotice();assert.equal(options.hasAttribute('data-live-notice'),false);assert.equal(options.getAttribute('aria-label'),'一族のオプション');
 assert.equal(d.querySelector('#live-update-slot').children.length,0);
});

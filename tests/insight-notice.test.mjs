import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './ui-fixture.cjs';

function noticeFixture(t){
 const f=fixture(t);let now=1000;f.w.performance.now=()=>now;
 const reveal=(id=60000,player=f.p.id)=>f.ui.event({type:id===60900?'passive':'insight',id,player,t:f.sim.time,discovery:{reasons:['鍛冶場で覚えた拍子']}});
 return {...f,reveal,clock:n=>{now=n;f.sync();}};
}

test('insight and passive discovery show only one small noninteractive label on consciousness',t=>{
 const {ui,d,w,p,reveal}=noticeFixture(t),style=d.createElement('style');style.textContent=fs.readFileSync(new URL('../src/skills/skills.css',import.meta.url),'utf8');d.head.appendChild(style);
 for(const id of [60000,60900]){
  reveal(id);const badge=d.getElementById('skill-revelation'),button=d.querySelector('[data-menu="skills"]');
  assert.equal(badge.parentElement,button);assert.equal(badge.textContent,id===60900?'心得':'閃き');assert.equal(badge.getAttribute('role'),'status');
  assert.equal(d.querySelectorAll('#skill-revelation').length,1);assert.equal(badge.querySelector('button,a,[tabindex]'),null);
  assert.equal(d.querySelector('.reveal-open,.reveal-memory,.reveal-name,.reveal-english'),null);assert.equal(ui.modal,null);assert.equal(ui.blocksWorldInput(),false);
  const css=w.getComputedStyle(badge);assert.equal(css.width,'36px');assert.equal(css.height,'18px');assert.equal(css.position,'absolute');assert.equal(css.pointerEvents,'none');assert.equal(w.getComputedStyle(button).position,'relative');
 }
 assert.equal(p.skills.includes(60900),false,'presentation cannot grant a skill');
});

test('the notice expires after 2.2 seconds while the unread glow waits for manual inspection',t=>{
 const {p,sim,ui,d,sync,reveal,clock}=noticeFixture(t);sim.learn(p,60000);p.skillLife.unread=[60000];sync();reveal();
 const badge=d.getElementById('skill-revelation'),button=d.querySelector('[data-menu="skills"]');
 clock(3199);assert.ok(badge.classList.contains('visible'));clock(3200);assert.ok(!badge.classList.contains('visible'));assert.equal(badge.textContent,'');assert.ok(button.classList.contains('has-insight'));assert.equal(ui.modal,null);
 button.click();assert.equal(ui.modal,'skills');assert.equal(d.querySelector('[role="dialog"]').getAttribute('aria-label'),'意識');assert.equal(p.skillLife.unread.length,0);sync();assert.ok(!button.classList.contains('has-insight'));
 d.querySelector('[data-skill="60000"]').click();assert.ok(d.getElementById('skill-detail').textContent.length>0);
});

test('manual opening clears the brief notice immediately and retains learned details and weights',t=>{
 const {p,sim,ui,d,reveal,sync}=noticeFixture(t);sim.learn(p,60000);p.skillLife.unread=[60000];p.skillLife.discovered.push({id:60000,key:'bl.skill.hammer.opening',reasons:['鍛冶場で覚えた拍子']});sync();const weights=JSON.stringify(p.phaseWeights);reveal();
 d.querySelector('[data-menu="skills"]').click();assert.equal(ui.skillRevealEvent,null);assert.ok(!d.getElementById('skill-revelation').classList.contains('visible'));
 assert.equal(JSON.stringify(p.phaseWeights),weights);d.querySelector('[data-skill="60000"]').click();assert.match(d.getElementById('skill-detail').textContent,/鍛冶場で覚えた拍子/);assert.ok(p.phaseWeights[0][60000]>0);const selected=JSON.stringify(p.phaseWeights);ui.describeSkill(60000);assert.equal(JSON.stringify(p.phaseWeights),selected);assert.equal(p.skillLife.unread.length,0);
});

test('the label follows the existing dock through menus and a rebuilt HUD, without a screen overlay',t=>{
 const {ui,d,reveal,sync}=noticeFixture(t);reveal();const badge=d.getElementById('skill-revelation');ui.body();assert.ok(ui.root.contains(badge));ui.closeModal();assert.ok(ui.hud.contains(badge));assert.equal(d.querySelector('body > .skill-revelation'),null);
 ui.showGame();sync();assert.equal(d.getElementById('skill-revelation'),badge);assert.ok(badge.isConnected);assert.equal(badge.parentElement.dataset.menu,'skills');
});

test('consecutive discoveries share a notice; foreign events do not replace it; death clears it',t=>{
 const {ui,d,p,reveal,clock}=noticeFixture(t);reveal();const badge=d.getElementById('skill-revelation');clock(2000);reveal(60900);reveal(60001,'other-player');
 assert.equal(ui.skillRevealEvent.id,60900);assert.equal(d.querySelectorAll('#skill-revelation').length,1);clock(3200);assert.ok(badge.classList.contains('visible'));clock(4200);assert.ok(!badge.classList.contains('visible'));
 reveal();ui.event({type:'death',player:p.id});assert.equal(ui.skillRevealEvent,null);assert.ok(!badge.classList.contains('visible'));
});

test('a discovery leaves combat actions, world input and saved state intact',t=>{
 const {p,sim,g,ui,reveal,sync}=noticeFixture(t),room=sim.getRoom(p),dummy=room.actors.find(a=>a.kind==='dummy');Object.assign(p,{x:dummy.x,z:dummy.z+1.1});
 for(let i=0;i<12;i++)sim.tick(1/30);sync();const before=JSON.stringify(sim.exportState());reveal();sync();assert.equal(JSON.stringify(sim.exportState()),before);assert.equal(ui.blocksWorldInput(),false);assert.equal(!!g.renderer.canvas.inert,false);
 const start=sim.time;for(let i=0;i<80;i++)sim.tick(1/30);sync();assert.equal(p.autoFight,dummy.id);assert.ok(sim.events.some(e=>e.type==='hit'&&e.kind==='practice'&&e.t>start));
});

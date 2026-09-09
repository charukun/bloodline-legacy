import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,flush} from './ui-fixture.cjs';

test('healing progress keeps anatomy DOM stable, then updates the open wound view when the injury heals',async t=>{
 const {g,p,sim,ui,d,w,sync}=fixture(t),room=sim.getRoom(p);room.actors=[];room.waveAt=1e9;
 Object.assign(p,{x:0,z:6,health:50,lastHurtAt:-100,wounds:{torso:{severity:'light',since:p.age,healsAt:p.age+.2}}});sync();
 assert.ok(g.command({type:'sit',active:true}));d.getElementById('wound-mark').click();await flush();
 assert.equal(ui.modal,'wounds');assert.equal(p.seated,true);
 const mark=d.querySelector('#wound-mark .anatomy'),figure=d.querySelector('.wounds-figure .anatomy'),button=d.querySelector('.panel-close');button.focus();
 const observer=new w.MutationObserver(()=>{});observer.observe(mark,{subtree:true,childList:true,attributes:true});observer.observe(figure,{subtree:true,childList:true,attributes:true});
 for(let i=0;i<60;i++){sim.tick(1/30);sync();}
 assert.ok(p.wounds.torso);assert.equal(d.querySelector('#wound-mark .anatomy'),mark);assert.equal(d.querySelector('.wounds-figure .anatomy'),figure);
 assert.equal(observer.takeRecords().length,0);observer.disconnect();
 for(let i=0;i<60;i++){sim.tick(1/30);sync();}await flush();
 assert.equal(p.wounds.torso,undefined);assert.match(d.querySelector('.wound-list').textContent,/傷は、ない/);
 assert.equal(d.querySelector('#wound-mark [data-part="torso"]').getAttribute('fill'),'#b4c7a2');assert.equal(ui.modal,'wounds');assert.equal(d.activeElement.className,'panel-close');
 assert.ok(p.health>50);assert.equal(p.seated,true);assert.equal(sim.events.filter(e=>e.type==='healed').length,1);
});

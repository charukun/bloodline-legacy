import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './ui-fixture.cjs';

test('settings names the existing coordinate, shows the current village and normalizes the selected destination',t=>{
 const {ui,g,p,sim,d,w,api}=fixture(t),home=sim.getRoom(p),target=sim.makeRoom('village');g.saveProfile=()=>api.Game.prototype.saveProfile.call(g);ui.settings();
 assert.equal(d.querySelector('label[for="room-code"]').textContent,'村の座標');assert.equal(d.getElementById('village-coordinate').textContent,home.code);assert.doesNotMatch(ui.root.textContent,/合言葉/);
 const input=d.getElementById('room-code');input.value='  '+target.code.toLowerCase()+'  ';input.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(g.profile.villageCode,target.code);assert.equal(input.value,target.code);assert.equal(JSON.parse(w.localStorage.getItem('aerin.tactics.v3.profile')).villageCode,target.code);
 const friend=sim.addPlayer('coordinate-friend',{owner:'another',villageCode:g.profile.villageCode});assert.equal(friend.room,target.id);assert.equal(p.room,home.id,'changing the destination cannot teleport the current life');
 const restored=api.Simulation.restore(sim.exportState());assert.equal(restored.getRoom(restored.players.get(friend.id)).code,target.code);
});

test('blank remains automatic village selection and invalid / abandoned coordinates never fall back silently',t=>{
 const {ui,g,sim,d,w}=fixture(t);ui.settings();const input=d.getElementById('room-code');input.value='   ';input.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(g.profile.villageCode,'');
 assert.ok(sim.addPlayer('automatic',{owner:'automatic',villageCode:g.profile.villageCode}).room);
 assert.throws(()=>sim.addPlayer('unknown',{villageCode:'NO-SUCH-COORDINATE'}),/座標/);
 const abandoned=sim.makeRoom('village');abandoned.abandoned=true;assert.throws(()=>sim.addPlayer('abandoned',{villageCode:abandoned.code}),/廃村/);
});

test('the front room and clan screen do not present their code as the current village',t=>{
 const {ui,g,d}=fixture(t);g.snapshot.room={kind:'front',code:'FRONT-CODE'};ui.settings();assert.equal(d.getElementById('village-coordinate'),null);assert.ok(d.getElementById('room-code'));
 g.screen='clan';ui.closeModal();ui.settings();assert.equal(d.getElementById('village-coordinate'),null);
});

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {fixture,flush} = require('./ui-fixture.cjs');
test('lineage stays still on irrelevant age and equipment changes; history remains readable',async t=>{
 const {ui,p,g,w,sync,sim}=fixture(t);sim.legacy(p.owner).records=[{id:'old',name:'先人',skills:[4000]}];ui.lineage();await flush();const root=ui.lineageView.modalView.scope;root.querySelector('#life-details').click();
 const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,childList:true,attributes:true,characterData:true});for(let i=0;i<10;i++)ui.update(g.snapshot);assert.equal(observer.takeRecords().length,0);
 p.age=18;p.weapon=2;sync();assert.equal(observer.takeRecords().length,0);assert.equal(root.querySelector('#dialog').open,true);observer.disconnect();
});
test('bottom dock contains exactly consciousness, wardrobe and settings in order; map stays available',async t=>{
 const {ui,d,g}=fixture(t),buttons=[...d.querySelectorAll('.hud-bottom button')];
 assert.deepEqual(buttons.map(b=>b.dataset.menu),['skills','body','settings']);
 assert.deepEqual(buttons.map(b=>b.textContent),['意識','身支度','設定']);
 for(const b of buttons){b.click();await flush();assert.equal(ui.modal,b.dataset.menu);assert.equal(b.getAttribute('aria-expanded'),'true');assert.ok(d.querySelector('[role=dialog]').contains(b));assert.equal(b.closest('[inert]'),null);assert.equal(g.renderer.canvas.inert,b.dataset.menu!=='skills');b.click();assert.equal(ui.modal,null);assert.equal(b.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,b);assert.ok(ui.hud.contains(b));}
 d.getElementById('mini-map').click();assert.equal(ui.modal,'map');assert.ok(d.getElementById('large-map'));
});
test('dock switches sections without stacking; active parent also closes a nested page',async t=>{
 const {ui,d}=fixture(t),dock=ui.hudDock,body=dock.querySelector('[data-menu=body]'),settings=dock.querySelector('[data-menu=settings]');
 body.click();d.getElementById('open-rack').click();assert.equal(ui.modal,'rack');assert.equal(ui.navigation.length,1);body.click();assert.equal(ui.modal,null);
 for(let i=0;i<8;i++){body.click();settings.click();assert.equal(ui.modal,'settings');assert.equal(ui.navigation.length,0);d.getElementById('lineage-nav').click();assert.equal(ui.modal,'lineage');settings.click();assert.equal(ui.modal,null);}
 assert.equal(d.querySelectorAll('.hud-bottom').length,1);assert.equal(ui.hudDock,dock);await flush();assert.equal(d.activeElement,settings);
});
test('first life opens without invented ancestors; native race, name and settings work',async t=>{
 const {ui,g,d,p,sim,w}=fixture(t);sim.players.delete(p.id);g.playerId=null;g.snapshot=null;g.screen='clan';g.profile.race=0;g.profile.name='';ui.showClan();const root=ui.lineageView.home.scope;
 assert.equal(root.querySelectorAll('[data-origin-race]').length,4);assert.equal(root.querySelector('#history-controls').hidden,true);assert.equal(root.querySelector('#begin-life').textContent,'人生を始める');
 const before=JSON.stringify(sim.exportState());root.querySelector('[data-origin-race="2"]').click();assert.equal(g.profile.race,2);assert.equal(g.previewCharacter.race,2);assert.equal(JSON.stringify(sim.exportState()),before);
 const name=root.querySelector('#origin-name');name.value='新しい名';name.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(g.profile.name,'新しい名');
 const settings=root.querySelector('#settings');settings.focus();settings.click();await flush();assert.equal(ui.modal,'settings');ui.closeModal();await flush();assert.equal(root.activeElement,settings);assert.equal(ui.clan.inert,false);
});
test('new life still starts through Game.start with one actual inherited skill',async t=>{
 const {g,sim,p,ui,d}=fixture(t);sim.die(p,'老衰');g.screen='clan';g.profile.uiExplained=true;g.profile.race=1;g.profile.name='次の灯';g.renderer.effects=[];g.renderer.camera={};
 sim.legacy(p.owner).archive=[4000];g.profile.inherit=[4000];ui.showClan();await g.start();
 const next=g.snapshot.player;assert.equal(g.screen,'game');assert.notEqual(next.id,p.id);assert.equal(next.race,1);assert.equal(next.name,'次の灯');assert.deepEqual(Array.from(next.inherit),[4000]);assert.equal(next.gen,2);assert.equal(d.querySelectorAll('.hud-bottom button').length,3);
});
test('historical equipment is shown in details; gameplay inventory is absent from lineage',t=>{
 const {ui,sim,p}=fixture(t),legacy=sim.legacy(p.owner);p.inventory=['stone','bell'];legacy.archive=[4000];legacy.records=[{id:'old',name:'先人',gen:1,age:42,skills:[4000],uses:19,appearance:{race:2,age:42,weapon:2,armor:2,shield:true}},{id:'unknown',name:'記録のみ',skills:[]}];ui.lineage();const root=ui.lineageView.modalView.scope;
 assert.equal(root.querySelectorAll('.ancestor').length,2);assert.equal(root.querySelector('.book-inventory'),null);assert.ok(root.querySelector('[data-record="unknown"] .missing-portrait'));
 root.querySelector('#life-details').click();assert.match(root.querySelector('#dialog-content').textContent,/大剣.*重鎧/s);assert.equal(root.querySelector('#detail-choose'),null);
});
test('living character browsing never edits inheritance or creates another life',async t=>{
 const {ui,sim,p,g}=fixture(t),legacy=sim.legacy(p.owner);legacy.archive=[4000,4001];legacy.records=[{id:'a',name:'一',gen:1,skills:[4000]},{id:'b',name:'二',gen:2,skills:[4001]}];ui.lineage();const root=ui.lineageView.modalView.scope,before=JSON.stringify(sim.exportState());
 root.querySelector('[data-record="a"]').click();root.querySelector('#open-index').click();assert.equal(root.querySelectorAll('[data-choose-id]').length,0);root.querySelector('#close-dialog').click();root.querySelector('#begin-life').click();await flush();
 assert.equal(ui.modal,null);assert.equal(JSON.stringify(sim.exportState()),before);assert.equal(g.profile.inherit.length,0);
});
test('1000 generations remain reachable with bounded DOM and disposable views',t=>{
 const {ui,sim,p}=fixture(t),legacy=sim.legacy(p.owner);legacy.archive=[4000];legacy.records=Array.from({length:1000},(_,i)=>({id:'past'+i,name:'先人'+i,gen:i+1,skills:[4000],appearance:{race:i%4}}));ui.lineage();let root=ui.lineageView.modalView.scope;
 assert.equal(root.querySelectorAll('.ancestor').length,3);const dial=root.querySelector('#time-dial');dial.value='0';dial.dispatchEvent(new root.ownerDocument.defaultView.Event('input'));assert.match(root.querySelector('#generation').textContent,/第1代/);
 root.querySelector('#open-index').click();assert.equal(root.querySelectorAll('.index-row').length,6);const search=root.querySelector('#legacy-search');search.value='１０００代';search.dispatchEvent(new root.ownerDocument.defaultView.Event('input'));assert.equal(root.querySelectorAll('.index-row').length,1);assert.match(root.querySelector('#library-results').textContent,/先人999/);
 for(let i=0;i<6;i++){const old=root;ui.lineage();root=ui.lineageView.modalView.scope;assert.equal(old.childNodes.length,0);}ui.closeModal();assert.equal(root.childNodes.length,0);assert.ok(ui.portraitQueue.every(q=>q.node.isConnected));
});
test('lineage help opens on demand and closing it returns focus',t=>{
 const {ui}=fixture(t);ui.lineage();const root=ui.lineageView.modalView.scope,help=root.querySelector('#help');assert.equal(root.querySelector('#dialog').open,false);help.focus();help.click();assert.match(root.querySelector('#dialog-title').textContent,/血脈の系譜/);root.querySelector('#close-dialog').click();assert.equal(root.querySelector('#dialog').open,false);assert.equal(root.activeElement,help);
});
test('Tilt-Shift has strength controls only and preserves lineage suspension',t=>{
 const {ui,g,d}=fixture(t);ui.settings();assert.equal(d.querySelector('[data-diorama-mode]'),null);assert.equal(d.querySelector('[data-diorama-dof="off"]'),null);assert.equal(g.renderer.diorama.mode,'tilt-shift');d.querySelector('[data-diorama-dof="strong"]').click();assert.equal(g.renderer.diorama.dof,'strong');d.getElementById('lineage-nav').click();assert.equal(g.renderer.diorama.suspended,true);ui.closeModal();assert.equal(g.renderer.diorama.suspended,false);
});
test('wounds cannot be presented as good health even at health=100',t=>{
 const {p,api}=fixture(t);
 for(const [severity,expected] of [['light','負傷'],['heavy','重傷'],['lost','欠損あり']]){p.wounds={head:{severity}};assert.equal(api.uiCondition(p,0).text,expected);}
 p.health=10;assert.equal(api.uiCondition(p,0).text,'危篤');
});
test('status expiry, rest and fatigue are derived without changing the player',t=>{
 const {p,api}=fixture(t);p.statuses={poison:{until:5}};const before=JSON.stringify(p);
 assert.equal(api.uiCondition(p,4).text,'不調');assert.equal(api.uiActiveStatuses(p,4),'毒');assert.equal(api.uiActiveStatuses(p,5),'');assert.equal(JSON.stringify(p),before);
 p.statuses={};p.seated=true;assert.equal(api.uiCondition(p,7).text,'休息');p.seated=false;p.stamina=2;assert.equal(api.uiCondition(p,7).text,'疲労');
});
test('life notification survives simultaneous discoveries in either arrival order',t=>{
 const {api}=fixture(t);for(const reverse of [false,true]){
 const q=new api.UINoticeQueue(), events=[{key:'age:7',parts:['7歳になった'],priority:3},{key:'discovery',prefix:'新たな学び · ',parts:['殴る'],priority:1},{key:'discovery',prefix:'新たな学び · ',parts:['蹴り崩し'],priority:1}];
 for(const e of reverse?events.reverse():events)q.enqueue(e,0);
 assert.equal(q.text(),'7歳になった');q.tick(4201);assert.match(q.text(),/殴る/);assert.match(q.text(),/蹴り崩し/);assert.equal(q.pending.length,0);
 }
});
test('notice queue remains bounded and duplicate notices are not stacked',t=>{
 const {api}=fixture(t),q=new api.UINoticeQueue();for(let i=0;i<50;i++)q.enqueue({key:'n'+i,parts:['n'+i],priority:1},0);assert.equal(q.pending.length,3);
 q.enqueue({key:'n0',parts:['n0'],priority:1},2);assert.equal(q.active.parts.length,1);
});
test('pickup presents item name, then sends the existing command and respects two slots',t=>{
 const {p,sim,ui,d,g,sync}=fixture(t),r=sim.getRoom(p);r.items=[{id:'near-item',item:'stone',x:0,z:0,ready:0}];sync();
 let b=d.querySelector('[data-context="pickup"]');assert.ok(b);assert.match(b.textContent,/小石/);assert.equal(b.disabled,false);b.click();assert.equal(p.inventory[0],'stone');
 r.items[0].ready=0;p.inventory.push('bell');sync();b=d.querySelector('[data-context="pickup"]');assert.equal(b.disabled,true);assert.match(b.textContent,/満杯/);b.click();assert.equal(p.inventory.length,2);assert.equal(g.command({type:'pickup',id:'near-item'}),false);
});
test('inventory shows two stable slots, current equipment in text, and discard updates only one slot',t=>{
 const {p,ui,d}=fixture(t);p.inventory=['stone','bell'];ui.body();assert.equal(d.querySelectorAll('.inventory-slot').length,2);assert.match(d.querySelector('.wardrobe-slots').textContent,/素手/);
 d.querySelector('[data-body-slot="item0"]').click();d.querySelector('[data-discard="0"]').click();assert.deepEqual(Array.from(p.inventory),['bell']);assert.equal(d.querySelectorAll('.inventory-slot.filled').length,1);
});
test('equipment age and rack-distance rules are enforced by real Simulation commands',t=>{
 const {p,sim,g,ui,d,sync}=fixture(t),rack=g.snapshot.map.schools.find(a=>a.id==='armory');p.x=rack.x;p.z=rack.z+3;p.age=6;sync();ui.rack();
 assert.equal(d.querySelector('[data-slot="weapon"]').disabled,true);assert.equal(g.command({type:'equip',slot:'weapon',value:0}),false);
 p.age=7;sync();assert.equal(d.querySelector('[data-slot="weapon"][data-value="0"]').disabled,false);d.querySelector('[data-slot="weapon"][data-value="0"]').click();assert.equal(p.weapon,0);assert.match(d.querySelector('[data-slot="weapon"][data-value="0"]').textContent,/装備中/);
 p.x+=50;sync();assert.equal(d.querySelector('[data-slot="weapon"][data-value="1"]').disabled,true);assert.equal(g.command({type:'equip',slot:'weapon',value:1}),false);assert.equal(p.weapon,0);
});
test('modal navigation restores parent, scroll and focus and isolates the background',async t=>{
 const {ui,g,d}=fixture(t),trigger=d.querySelector('[data-menu="body"]');trigger.focus();trigger.click();await flush();assert.equal(ui.modal,'body');assert.equal(g.renderer.canvas.inert,true);assert.equal(d.getElementById('hud').inert,true);
 d.querySelector('.panel-content').scrollTop=90;const rack=d.getElementById('open-rack');rack.focus();rack.click();await flush();assert.equal(ui.modal,'rack');assert.equal(ui.navigation.length,1);
 d.querySelector('.panel-back').click();await flush();assert.equal(ui.modal,'body');assert.equal(d.activeElement.id,'open-rack');assert.equal(d.querySelector('.panel-content').scrollTop,90);
 d.querySelector('.panel-close').click();assert.equal(ui.modal,null);assert.equal(d.activeElement,trigger);assert.equal(g.renderer.canvas.inert,false);
});
test('Escape returns one level; Tab stays inside modal; rerender does not grow navigation',async t=>{
 const {ui,d,w}=fixture(t);ui.settings();await flush();const button=d.getElementById('lineage-nav');button.focus();button.click();await flush();
 d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await flush();assert.equal(ui.modal,'settings');assert.equal(d.activeElement.id,'lineage-nav');
 d.querySelector('.panel-back').focus();d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(d.activeElement.dataset.menu,'settings');
 const toggle=d.getElementById('sound-toggle');toggle.focus();toggle.click();await flush();assert.equal(ui.navigation.length,0);assert.equal(d.activeElement.id,'sound-toggle');
});
test('keyboard typing and pointer down during modal cannot begin game movement or rest',t=>{
 const {g,ui,d,w,p}=fixture(t);g.installInput();ui.talk();const input=d.getElementById('chat-text');input.focus();
 for(const code of ['KeyW','KeyR','Space','KeyD']){input.dispatchEvent(new w.KeyboardEvent('keydown',{key:code.slice(-1),code,bubbles:true}));input.dispatchEvent(new w.KeyboardEvent('keyup',{key:code.slice(-1),code,bubbles:true}));}
 g.renderer.canvas.dispatchEvent(new w.MouseEvent('pointerdown',{button:0,bubbles:true}));assert.equal(g.keys.size,0);assert.ok(!g.pointer);assert.equal(p.seated,false);assert.equal(p.input.x,0);assert.equal(p.input.z,0);
});
test('talk uses surrounding speech and preserves the existing wake behavior',t=>{
 const {g,p,ui,d,sim}=fixture(t);g.command({type:'sit',active:true});assert.equal(p.seated,true);ui.talk();assert.equal(p.seated,false);assert.match(d.querySelector('[role="dialog"]').getAttribute('aria-label'),/周囲/);
 d.querySelector('[data-say="ありがとう"]').click();assert.equal(p.speech,'ありがとう');assert.equal(ui.modal,null);assert.ok(sim.events.some(e=>e.type==='speech'&&e.text==='ありがとう'));
});
test('world labels show only the engaged target and are removed after disengagement',t=>{
 const {g,p,ui,d,sim,sync}=fixture(t),r=sim.getRoom(p);const a=sim.actor('goblin',1,0),b=sim.actor('goblin',2,0);r.actors=[a,b];sync();assert.equal(d.querySelectorAll('.target-label').length,0);
 p.autoFight=a.id;sync();assert.equal(d.querySelectorAll('.target-label').length,1);const node=d.querySelector('.target-label');sync();assert.equal(d.querySelector('.target-label'),node);
 p.autoFight=null;sync();assert.equal(d.querySelectorAll('.target-label').length,0);
});
test('combo phase and skill share a callout and status text follows real status data',t=>{
 const {p,d,sync}=fixture(t);p.combo={band:1};p.pendingSkill={id:4100};p.statuses={poison:{until:20}};sync();assert.match(d.querySelector('.combat-callout').textContent,/破.*蹴り崩し/);assert.equal(d.querySelector('.status-caption').textContent,'毒');
 p.combo=null;p.statuses={};sync();assert.equal(d.querySelector('.combat-callout'),null);assert.equal(d.querySelector('.status-caption'),null);
});
test('static snapshot causes zero redundant HUD and world-label DOM mutations',t=>{
 const {w,d,g,ui}=fixture(t);ui.update(g.snapshot);const observer=new w.MutationObserver(()=>{});observer.observe(d.getElementById('hud'),{subtree:true,attributes:true,childList:true,characterData:true});observer.observe(d.getElementById('world-labels'),{subtree:true,attributes:true,childList:true,characterData:true});
 for(let i=0;i<100;i++)ui.update(g.snapshot);assert.equal(observer.takeRecords().length,0);observer.disconnect();
});
test('presentation updates cannot mutate game state or save payload',t=>{
 const {sim,g,ui}=fixture(t);const before=JSON.stringify(sim.exportState());for(let i=0;i<20;i++)ui.update(g.snapshot);assert.equal(JSON.stringify(sim.exportState()),before);
});
test('skill toggle and keyboard pie adjustment use existing weight commands and preserve focus',async t=>{
 const {sim,p,ui,g,d,w}=fixture(t);sim.learn(p,4001);p.phaseWeights[0]={4000:1,4001:1};ui.skills();await flush();
 const detail=d.querySelector('[data-skill="4000"]');detail.focus();detail.click();assert.match(d.getElementById('skill-detail').textContent,/殴る/);
 const handle=d.querySelector('[data-handle="0"]');assert.ok(handle);handle.focus();handle.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));assert.equal(p.phaseWeights[0][4000],51);assert.equal(p.phaseWeights[0][4001],49);assert.equal(d.activeElement.dataset.handle,'0');
 const btn=d.querySelector('[data-skill="4001"]');btn.focus();btn.click();assert.equal(p.phaseWeights[0][4001],49,'reading the description does not change the build');const toggle=d.getElementById('skill-toggle');toggle.focus();toggle.click();assert.equal(p.phaseWeights[0][4001],0);assert.equal(d.activeElement.id,'skill-toggle');
});
test('lineage renders only actual lives and safely escapes imported names',t=>{
 const {sim,p,ui}=fixture(t),legacy=sim.legacy(p.owner);legacy.archive=[4000];legacy.records=[{id:'past',gen:2,age:42,name:'<script>unsafe</script>',skills:[4000],cause:'老衰'},{id:'unknown',name:'記録だけ',skills:[]}];ui.lineage();const root=ui.lineageView.modalView.scope;
 assert.equal(root.querySelectorAll('.ancestor').length,2);assert.equal(root.querySelectorAll('script').length,0);assert.match(root.querySelector('#archive').textContent,/世代未記録/);assert.match(root.querySelector('#archive').textContent,/第2代/);root.querySelector('#life-details').click();assert.match(root.querySelector('#dialog-content').textContent,/老衰/);
});
test('real save/restore retains inventory, equipment, wounds, age and recorded lineage',t=>{
 const {sim,p,g,api}=fixture(t);p.inventory=['stone','bell'];p.weapon=0;p.armor=1;p.shield=true;p.wounds={head:{severity:'light',healsAt:25}};sim.legacy(p.owner).records.push({id:'ancestor',name:'前の命',gen:1,age:60,skills:[4000]});sim.legacy(p.owner).archive=[4000];
 g.saveWorld();const saved=JSON.parse(g.renderer.canvas.ownerDocument.defaultView.localStorage.getItem('aerin.tactics.v3.world.normal'));assert.ok(saved);
 const restored=api.Simulation.restore(saved),rp=restored.players.get(p.id);for(const key of ['age','inventory','weapon','armor','shield','wounds'])assert.equal(JSON.stringify(rp[key]),JSON.stringify(p[key]));assert.equal(restored.legacy(p.owner).records[0].name,'前の命');
});
test('showGame invalidates caches across repeated lives and restores all HUD nodes',t=>{
 const {ui,g,d}=fixture(t);for(let i=0;i<5;i++){ui.showGame();ui.update(g.snapshot);assert.ok(d.querySelector('#wound-mark svg'));assert.equal(d.getElementById('age').textContent,'17歳');assert.equal(d.getElementById('player-name').textContent,'リオ');}
});
test('new onboarding can close and call done once, while settings help returns to settings',async t=>{
 const {ui,d}=fixture(t);let calls=0;ui.onboarding(()=>calls++);await flush();d.querySelector('.panel-close').click();assert.equal(calls,1);assert.equal(ui.modal,null);
 ui.settings();await flush();d.getElementById('help-nav').click();await flush();d.querySelector('.panel-back').click();await flush();assert.equal(ui.modal,'settings');
});
test('existing 480ms long press rests; pointercancel clears pending rest; moving wakes',async t=>{
 const {g,w,p}=fixture(t),canvas=g.renderer.canvas;g.installInput();let capture=null;canvas.setPointerCapture=id=>{capture=id};canvas.hasPointerCapture=id=>capture===id;canvas.releasePointerCapture=()=>{capture=null};
 const pointer=(type,id)=>{const e=new w.MouseEvent(type,{button:0,clientX:150,clientY:300,bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:id});canvas.dispatchEvent(e);};
 pointer('pointerdown',1);pointer('pointercancel',1);await new Promise(r=>setTimeout(r,500));assert.equal(p.seated,false);assert.equal(g.pointer,null);
 pointer('pointerdown',2);await new Promise(r=>setTimeout(r,500));assert.equal(p.seated,true);pointer('pointerup',2);assert.equal(p.seated,true);assert.equal(g.walkTarget,null);g.command({type:'move',x:1,z:0});assert.equal(p.seated,false);
});
test('opening a modal cancels an already pending long press',async t=>{
 const {g,w,ui,p}=fixture(t),canvas=g.renderer.canvas;g.installInput();canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
 const e=new w.MouseEvent('pointerdown',{button:0,clientX:100,clientY:300,bubbles:true});Object.defineProperty(e,'pointerId',{value:1});canvas.dispatchEvent(e);assert.ok(g.pointer);ui.body();await new Promise(r=>setTimeout(r,500));assert.equal(p.seated,false);assert.equal(g.pointer,null);
});
test('skill restrictions refresh when shield equipment changes without closing the menu',t=>{
 const {sim,p,ui,d,sync}=fixture(t);sim.learn(p,4013);ui.skills();ui.describeSkill(4013);assert.match(d.getElementById('skill-detail').textContent,/盾が必要/);p.shield=true;sync();assert.doesNotMatch(d.getElementById('skill-detail').textContent,/盾が必要/);
});

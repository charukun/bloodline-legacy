import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './ui-fixture.cjs';

const position=node=>{
 const m=/translate3d\(([-\d.]+)px,([-\d.]+)px,0\)/.exec(node.style.transform);
 assert.ok(m,'uses fractional world projection');return {x:+m[1],y:+m[2]};
};

test('all seven facility actions emit authored phrases that rise and fade without restarting the node',t=>{
 const {p,g,sim,ui,d,sync}=fixture(t);sim.getRoom(p).actors=[];
 const activities={sword:'study',magic:'read',church:'pray',forge:'observe',dance:'play',hunter:'track',armory:'care'};
 for(const [id,activity] of Object.entries(activities)){
  const school=g.snapshot.map.schools.find(a=>a.id===id);p.x=school.x;p.z=school.z+1;p.activity=null;
  const seq=sim.seq;assert.equal(g.command({type:'activity',activity}),true);
  for(let i=0;i<28;i++)sim.tick(1/30);
  const event=sim.snapshot(p.id,seq).events.find(e=>e.type==='progress');assert.ok(event,id+' emits a real phrase');
  ui.event(event);sync();const shown=ui.floatLines.find(e=>e.seq===event.seq)?.shown??ui.floatLines.at(-1).shown;
  ui.updateWorldLabels(g.snapshot,shown+250);const node=d.querySelector('.progress-float');assert.ok(node,id);assert.equal(node.textContent,event.text);
  const first=position(node);ui.updateWorldLabels(g.snapshot,shown+1250);assert.equal(d.querySelector('.progress-float'),node);assert.ok(position(node).y<first.y);
  const next=position(node);ui.updateWorldLabels(g.snapshot,shown+1251);assert.ok(position(node).y<next.y,'motion continues between simulation ticks');
  assert.equal(node.style.opacity,'1');ui.updateWorldLabels(g.snapshot,shown+4300);assert.ok(+node.style.opacity<.5);
  ui.updateWorldLabels(g.snapshot,shown+4700);assert.equal(d.querySelector('.progress-float'),null);
 }
});

test('floating phrases restart on repeated text, respect reduced motion, and disappear with the speaker',t=>{
 const {p,g,ui,d}=fixture(t);const event={type:'progress',player:p.id,room:p.room,text:'もう一度、頁をひらく。',t:g.snapshot.t};
 ui.event(event);let shown=ui.floatLines.at(-1).shown;ui.updateWorldLabels(g.snapshot,shown+4300);const node=d.querySelector('.progress-float');assert.ok(+node.style.opacity<1);
 ui.event(event);shown=ui.floatLines.at(-1).shown;ui.updateWorldLabels(g.snapshot,shown+300);assert.equal(d.querySelector('.progress-float'),node);assert.equal(node.style.opacity,'1');
 ui.reducedMotion=true;ui.updateWorldLabels(g.snapshot,shown+400);const first=position(node);ui.updateWorldLabels(g.snapshot,shown+1400);assert.deepEqual(position(node),first);
 g.renderer.project=()=>({x:-1,y:300,visible:true});ui.updateWorldLabels(g.snapshot,shown+1500);assert.equal(d.querySelector('.progress-float'),null);
 g.renderer.project=()=>({x:300,y:300,visible:true});p.alive=false;ui.updateWorldLabels(g.snapshot,shown+1600);assert.equal(d.querySelector('.progress-float'),null);
});

test('the parent bubble stays on one side through carried direction changes and camera tracking',t=>{
 const {p,g,ui,d,sync}=fixture(t);Object.assign(p,{prologue:true,age:0,motherText:'いっしょに歩こう。',motherUntil:100});
 let camera=0;g.renderer.width=800;g.renderer.height=700;g.renderer.project=(x,y,z)=>({x:400+x*20+camera,y:450-y*20+z,visible:true});
 p.x=p.z=0;sync();const node=d.getElementById('mother-dialogue'),side=node.dataset.side;
 let before=position(node);
 for(const dir of [Math.PI/2,-Math.PI/2,Math.PI,0,-Math.PI/2,Math.PI/2]){
  p.dir=dir;p.x+=.01;p.z+=.01;camera+=.125;sync();assert.equal(node.dataset.side,side);
  const after=position(node);assert.ok(Math.abs(after.x-before.x)<1,'no bubble-width jump');before=after;
 }
 g.renderer.project=(x,y,z)=>({x:400-x*20,y:450-y*20+z,visible:true});ui.updateWorld(g.snapshot);assert.notEqual(node.dataset.side,side,'camera rotation may move the bubble');
});

test('screen-edge placement has a dead band instead of alternating at the midpoint',t=>{
 const {p,g,ui,d,sync}=fixture(t);Object.assign(p,{prologue:true,age:0,x:0,z:0,motherText:'ここから見ておいで。',motherUntil:100});
 let center=163;g.renderer.width=330;g.renderer.height=700;g.renderer.project=(x,y,z)=>({x:center+x*20,y:400-y*20,visible:true});sync();
 const node=d.getElementById('mother-dialogue');Object.defineProperty(node,'offsetWidth',{value:180});node._speechSize=null;const side=node.dataset.side;
 for(const x of [164,166,169,165,167,164]){center=x;ui.updateWorld(g.snapshot);assert.equal(node.dataset.side,side);}
 center=250;ui.updateWorld(g.snapshot);assert.equal(node.dataset.side,'left');center=60;ui.updateWorld(g.snapshot);assert.equal(node.dataset.side,'right');
});

test('carried movement reaches its automatic release without any leave button',t=>{
 const {p,g,sim,d,sync}=fixture(t);Object.assign(p,{prologue:true,age:0,x:0,z:10,releaseAt:sim.time+.5,introUntil:sim.time+12.5});
 sync();assert.equal(d.querySelector('#leave-arms, #carry-controls, [data-gift]'),null);
 assert.equal(g.command({type:'move',x:1,z:0}),true);for(let i=0;i<16;i++)sim.tick(1/30);sync();
 assert.equal(p.prologue,false);assert.equal(p.age,4);assert.ok(p.introX>0);assert.equal(d.querySelector('#leave-arms'),null);
});

test('skill adoption and passive state use leaf seals while retaining names, allocation, and accessible state',t=>{
 const {p,g,sim,ui,d}=fixture(t);sim.learn(p,4001);sim.learn(p,4060);p.phaseWeights[0]={4000:1,4001:0};ui.skills();
 const off=d.querySelector('[data-skill="4001"]'),on=d.querySelector('[data-skill="4000"]');
 assert.doesNotMatch(d.getElementById('skills-content').textContent,/未採用|採用中|常時有効/);
 assert.match(off.getAttribute('aria-label'),/未採用/);assert.ok(off.querySelector('.selection-seal:not(.lit)'));assert.ok(on.querySelector('.selection-seal.lit'));assert.match(on.textContent,/100%/);
 off.click();d.getElementById('skill-toggle').click();assert.ok(p.phaseWeights[0][4001]>0);assert.ok(d.querySelector('[data-skill="4001"] .selection-seal.lit'));
 d.querySelector('[data-phase="3"]').click();assert.equal(ui.phase,3);assert.equal(d.querySelector('#balance-pie'),null);
 assert.ok(d.querySelector('[data-passive="4060"] .selection-seal.lit'));assert.doesNotMatch(d.getElementById('skills-content').textContent,/常時有効|常に働く力/);assert.equal(d.getElementById('skill-toggle'),null);
 const tabs=[...d.querySelectorAll('[role="tab"]')];assert.equal(tabs.length,4);assert.equal(tabs.filter(b=>b.getAttribute('aria-selected')==='true').length,1);assert.ok(tabs.every(b=>b.querySelector('.phase-ribbon-label')));
 d.querySelector('[data-phase="0"]').click();assert.equal(ui.phase,0);assert.ok(d.querySelector('#balance-pie'));
});

test('equipment and lineage choices use symbols while retaining the actual selection commands',t=>{
 const {p,g,sim,ui,d,sync}=fixture(t),school=g.snapshot.map.schools.find(s=>s.id==='armory');p.x=school.x;p.z=school.z+3;sync();ui.rack();
 d.querySelector('[data-slot="weapon"][data-value="0"]').click();assert.equal(p.weapon,0);assert.doesNotMatch(d.getElementById('game-panel').textContent,/装備中|選択中/);assert.ok(d.querySelector('[data-slot="weapon"][data-value="0"] .selection-seal.lit'));
 ui.closeModal();sim.removePlayer(p.id);g.playerId=null;g.snapshot=null;g.screen='clan';g.profile.race=0;ui.showClan();
 let root=ui.lineageView.home.scope;root.querySelector('[data-origin-race="2"]').click();assert.equal(g.profile.race,2);assert.equal(root.querySelector('[data-origin-race="2"]').getAttribute('aria-pressed'),'true');
 const legacy=sim.legacy(g.profile.owner);legacy.archive=[4000,4001];legacy.records=[{id:'old',gen:1,name:'先人',skills:[4000],appearance:{race:0}}];ui.renderClan();root=ui.lineageView.home.scope;
 root.querySelector('#find-memory').click();let choice=root.querySelector('[data-choose-id="4000"]');assert.equal(choice.getAttribute('aria-pressed'),'false');assert.equal(choice.textContent,'');assert.ok(choice.querySelector('svg'));choice.click();
 assert.equal(g.profile.inherit[0],4000);const stamp=root.querySelector('#selected-stamp');assert.equal(stamp.hidden,false);assert.equal(stamp.textContent,'');assert.ok(stamp.getAttribute('aria-label'));
 root.querySelector('#close-dialog').click();root.querySelector('#find-memory').click();choice=root.querySelector('[data-choose-id="4000"]');assert.equal(choice.getAttribute('aria-pressed'),'true');assert.doesNotMatch(root.querySelector('#library-results').textContent,/選択中/);
});

test('projection and selection presentation leave the simulation and saved records intact',t=>{
 const {p,g,sim,ui,sync}=fixture(t);Object.assign(p,{prologue:true,motherText:'おかえり。',motherUntil:100});sync();
 ui.event({type:'progress',player:p.id,room:p.room,text:'頁をめくる。',t:g.snapshot.t});const before=JSON.stringify(sim.exportState());
 for(let i=0;i<40;i++)ui.updateWorld(g.snapshot);assert.equal(JSON.stringify(sim.exportState()),before);
});

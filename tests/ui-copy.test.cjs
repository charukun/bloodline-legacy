const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./ui-fixture.cjs');

test('first weapon emits a named insight; equipping it again does not invent a discovery',t=>{
 const {p,g,sim,ui,d,sync}=fixture(t),rack=g.snapshot.map.schools.find(s=>s.id==='armory');
 p.x=rack.x;p.z=rack.z+3;sync();
 let after=sim.seq;assert.equal(g.command({type:'equip',slot:'weapon',value:0}),true);
 const events=sim.events.filter(e=>e.seq>after),save=JSON.stringify(sim.exportState());
 events.forEach(e=>ui.event(e));
 assert.equal(d.getElementById('toasts').textContent,'「斬る」を閃いた');
 assert.equal(JSON.stringify(sim.exportState()),save);
 assert.ok(p.skills.includes(4001));assert.ok(p.phaseWeights[0][4001]>0);
 after=sim.seq;assert.equal(g.command({type:'equip',slot:'weapon',value:0}),true);
 assert.equal(sim.events.filter(e=>e.seq>after&&e.type==='insight').length,0);
});

test('catalog and basic insights merge naturally while life events retain priority',t=>{
 for(const lifeFirst of [true,false]){
  const {p,ui,d,w}=fixture(t);let now=1000;w.performance.now=()=>now;
  const life=()=>ui.event({type:'age',player:p.id,age:7});
  const insight=id=>ui.event({type:'insight',player:p.id,id,t:0});
  if(lifeFirst)life();insight(4001);insight(60000);insight(4001);if(!lifeFirst)life();
  assert.equal(d.getElementById('toasts').textContent,'7歳になった');
  now=5201;ui.paintNotices();const message=d.getElementById('toasts').textContent;
  assert.match(message,/「斬る」・「.+」を閃いた$/);assert.equal((message.match(/斬る/g)||[]).length,1);
  assert.equal(ui.notices.pending.length,0);assert.equal(ui.modal,null);
 }
});

test('passives remain distinct from active insights; notification is bounded and escaped',t=>{
 const {p,ui,d,w}=fixture(t);let now=1000;w.performance.now=()=>now;
 ui.event({type:'passive',player:p.id,id:60900,t:0});assert.match(d.getElementById('toasts').textContent,/^「.+」を身につけた$/);
 ui.event({type:'insight',player:'someone-else',id:4001,t:0});assert.equal(ui.notices.pending.length,0);
 now=5201;ui.paintNotices();
 for(const name of ['<img src=x onerror=bad()>','二つ目','三つ目'])ui.notify({key:'discovery:insight',discoveryKind:'insight',parts:[name],priority:1});
 assert.match(d.getElementById('toasts').textContent,/ほか1つ/);assert.equal(d.getElementById('toasts').querySelector('img'),null);
 assert.equal(ui.notices.pending.length,0);
});

test('automatic phase diagnostics stay offscreen; useful restrictions and unknown errors remain',t=>{
 const {p,ui,d,sim}=fixture(t),before=JSON.stringify(sim.exportState());
 for(const phase of ['序','破','急'])ui.event({type:'notice',player:p.id,text:phase+'の技が出せない'});
 assert.equal(d.getElementById('toasts').textContent,'');assert.equal(ui.notices.active,null);assert.equal(ui.floatLines.length,0);
 assert.equal(JSON.stringify(sim.exportState()),before);
 ui.event({type:'notice',player:p.id,text:'武具棚は、七つになってから'});
 assert.equal(d.getElementById('toasts').textContent,'武具を装備できるのは7歳からです');
 ui.event({type:'notice',player:p.id,text:'保存できません。記録を持ち出してください。'});
 assert.ok(ui.notices.pending.some(n=>n.parts.includes('保存できません。記録を持ち出してください。')));
});

test('pickup distinguishes a gift from an item on the ground',t=>{
 for(const gift of [true,false]){
  const {p,ui,d}=fixture(t);ui.event({type:'pickup',player:p.id,item:'stone',gift});
  assert.equal(d.getElementById('toasts').textContent,'丸い小石'+(gift?'を受け取った':'を拾った'));
 }
});

test('equipment hints and old memories are readable without altering requirements or saved records',t=>{
 const {p,ui,sim,d}=fixture(t);sim.learn(p,4001);sim.learn(p,60000);
 p.skillLife.discovered.push({id:60000,key:'bl.skill.hammer.opening',reasons:['鍛冶場で、道具が打ち返す拍子を見た。手元には鈴があった']});
 ui.skills();const before=JSON.stringify(sim.exportState());
 ui.describeSkill(4001);assert.match(d.querySelector('.skill-restriction').textContent,/を装備すると使える/);
 ui.describeSkill(60000);assert.match(d.querySelector('.skill-memory').textContent,/鍛冶場で、槌を打つリズムを覚えた。手元には鈴があった/);
 assert.equal(JSON.stringify(sim.exportState()),before);
});

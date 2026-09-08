const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

// Exercise the actual standalone download, including its embedded skill catalog.
// Skip GPU startup only; this verifies UI, restore and frame state, not pixels.
function preview(t){
 const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
 const dom=new JSDOM(html,{url:'https://preview.test/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
 w.requestAnimationFrame=()=>{};
 const script=w.document.querySelector('script').textContent;
 assert.ok(script.includes('// Asset decode completes before'));
 w.eval(script.replace('// Asset decode completes before',
  'window.previewAPI={Game,UI,Simulation,BL_SKILL_DEFINITIONS,skillById,artPose};return;\n// Asset decode completes before'));
 const api=w.previewAPI,{Game,UI,Simulation}=api,sim=new Simulation(),p=sim.addPlayer('test',{owner:'test'});
 Object.assign(p,{age:14,prologue:false,introUntil:-100,health:100});
 const rendered=[],g=Object.assign(Object.create(Game.prototype),{
  sim,playerId:p.id,screen:'game',online:false,profile:{owner:'test'},keys:new Set(),mapCache:new Map(),input:{x:0,z:0},
  lastFrame:1000,lastUI:0,accumulator:0,sinceSave:0,seq:sim.seq,
  saveWorld(){},renderPortrait(){return null;},audio:{fx(){},setListener(){},updateFootsteps(){}},
  renderer:{canvas:w.document.getElementById('world'),labels:[],effect(){},project:()=>({visible:false}),
   render(s){rendered.push({action:s.player.action,skill:s.player.attackSkill,pose:api.artPose(s.player,s.t)});}}
 });
 g.snapshot=g.decorate(sim.snapshot(p.id));g.ui=new UI(g);g.ui.showGame();
 t.after(()=>dom.window.close());
 return {api,g,p,w,rendered};
}

test('standalone preview restores a new catalog skill and attacks at age 14',t=>{
 const {api,g,p,w,rendered}=preview(t);
 const def=api.BL_SKILL_DEFINITIONS.find(d=>!d.passive&&d.phase===0&&d.action.weapon<0&&!d.action.requiresPassive&&!d.action.items);
 assert.ok(def);
 p.skills=[def.id];p.phaseWeights=[{[def.id]:1},{},{}];p.weights=p.phaseWeights[0];
 const restored=api.Simulation.restore(JSON.parse(JSON.stringify(g.sim.exportState())));
 g.sim=restored;const player=restored.players.get(p.id),dummy=restored.getRoom(player).actors.find(a=>a.kind==='dummy');
 Object.assign(player,{x:dummy.x,z:dummy.z-1.1,dir:0});
 g.snapshot=g.decorate(restored.snapshot(p.id));g.ui.skills();
 assert.equal(w.document.querySelectorAll('.phase-tabs button').length,4);
 assert.ok(w.document.querySelector(`[data-skill="${def.id}"]`));
 assert.equal(w.document.querySelector('.skill-compatibility'),null);
 for(let i=1;i<=180;i++)g.frame(1000+i*1000/60);
 assert.equal(g.frameError,undefined);
 assert.equal(player.autoFight,dummy.id);
 const attacks=rendered.filter(f=>f.action==='attack'&&f.skill===def.id);
 assert.ok(attacks.length>5,'new catalog skill reaches interpolated render snapshots');
 assert.ok(new Set(attacks.map(f=>JSON.stringify(f.pose))).size>1,'attack pose advances');
});

test('unknown saved skill cannot blank the modal or silently change recorded skills and weights',t=>{
 const {g,p,w}=preview(t);
 p.skills=[4000,999999];p.phaseWeights=[{4000:0,999999:1},{},{}];p.weights=p.phaseWeights[0];
 const before=JSON.stringify({skills:p.skills,weights:p.phaseWeights});
 g.ui.skills();
 assert.equal(w.document.querySelectorAll('.phase-tabs button').length,4);
 assert.ok(w.document.querySelector('[data-skill="4000"]'));
 assert.match(w.document.querySelector('.skill-compatibility').textContent,/記録は保持/);
 assert.equal(JSON.stringify({skills:p.skills,weights:p.phaseWeights}),before);
 assert.equal(g.sim.chooseSkill(p,0),null,'an intentionally disabled valid skill stays disabled');
 p.skills=[999999];g.ui.renderSkills();
 assert.ok(w.document.querySelector('.phase-empty'));
 assert.ok(w.document.querySelector('.skill-compatibility'));
});

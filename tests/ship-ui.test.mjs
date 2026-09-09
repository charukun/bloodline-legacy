import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fixture} from './ui-fixture.cjs';

test('deck prayer uses the feet anchor and real command; nearby dummy selection matches the nearest target',t=>{
 const {g,p,d,sim,sync}=fixture(t),r=sim.getRoom(p),shrine=r.map.ship.shrine;
 Object.assign(p,{x:shrine.x,z:shrine.z+.6,supportHeight:1.2});sync();
 const prayer=d.querySelector('[data-anchor=feet] [data-context=activity]');assert.equal(prayer.dataset.facility,'shipPrayer');prayer.click();assert.equal(p.activity,'pray');
 sync();d.querySelector('[data-context=activity]').click();assert.equal(p.activity,null);
 const second=r.actors.find(a=>a.shipStation===1);Object.assign(p,{x:second.x,z:second.z-.95});sync();
 const practice=d.querySelector('[data-context=practice]');assert.equal(practice.dataset.value,second.id);practice.click();assert.equal(g.walkTarget.z,second.z);assert.equal(g.walkTarget.x,second.x);
});

test('harbour cue shows the shared departure clock, physical boarding, and hides away from port or in menus',t=>{
 const {g,p,d,ui,sync}=fixture(t);p.x=0;p.z=28;sync();const cue=d.querySelector('#ship-notice');
 assert.match(cue.textContent,/出港まで 5.0年/);assert.match(cue.textContent,/桟橋を渡って/);assert.equal(d.querySelector('[data-context=boat]'),null);
 p.z=43;p.supportHeight=1.2;sync();assert.match(cue.textContent,/降りるときは桟橋へ/);
 ui.updateShipNotice({...g.snapshot,boatIn:2});assert.match(cue.textContent,/まもなく/);
 ui.modal='skills';ui.updateShipNotice(g.snapshot);assert.equal(cue.hidden,true);ui.modal=null;p.z=10;sync();assert.equal(cue.hidden,true);
 p.z=28;p.age=14;sync();assert.match(cue.textContent,/15歳/);
});

test('ship speech, progress and foot actions all project above the same raised support surface',t=>{
 const {g,p,ui,d,sync}=fixture(t);Object.assign(p,{x:-3.4,z:39.1,supportHeight:1.2,speech:'無事に帰ろう',speechUntil:20});sync();
 const heights=[];g.renderer.project=(x,y,z)=>{heights.push(y);return{x:220,y:500-y*30,visible:true};};
 ui.floatLines=[{type:'progress',player:p.id,room:p.room,text:'波の音に耳をすませる',shown:performance.now()}];ui.updateWorldLabels(g.snapshot,performance.now());
 assert.ok(heights.some(y=>Math.abs(y-4.35)<1e-6));assert.ok(heights.some(y=>Math.abs(y-4.65)<1e-6));assert.ok(d.querySelector('.progress-float'));
 heights.length=0;ui.positionFacilityActions(g.snapshot);assert.ok(heights.some(y=>Math.abs(y-1.4)<1e-6));
});

test('tap picking intersects the deck and sloped gangway on portrait and landscape cameras',()=>{
 const ctx=vm.createContext({Math,Map,Float32Array});
 const code=['legacy/dialogue.js','legacy/core.js','legacy/render_math.js','render/renderer-base.js'].map(p=>fs.readFileSync(new URL('../src/'+p,import.meta.url),'utf8')).join('\n');
 vm.runInContext(code+'\nglobalThis.api={Renderer,makeVillage,supportHeight};',ctx);
 const {Renderer,makeVillage,supportHeight}=ctx.api;
 for(const [width,height]of [[393,852],[852,393],[1280,800]])for(const yaw of [-.8,.3,1.2]){
  const r=Object.assign(Object.create(Renderer.prototype),{width,height,camera:{x:0,z:42,zoom:20,yaw,pitch:.52},traversalMap:makeVillage(10)});r.matrix();
  for(const [x,z]of [[-3,43],[3,52],[0,31],[0,33.5],[0,28]]){const y=supportHeight(r.traversalMap,x,z),screen=r.project(x,y,z),q=r.pointToWorld(screen.x,screen.y);assert.ok(Math.hypot(q.x-x,q.z-z)<.002,`${width} ${yaw} (${x},${z}) -> ${q.x},${q.z}`);}
 }
});

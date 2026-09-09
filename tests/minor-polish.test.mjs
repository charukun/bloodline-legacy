import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fixture} from './ui-fixture.cjs';

test('carried movement accepts tap, drag and keyboard, cancels safely, and releases at the current location',t=>{
 const {g,p,sim,w,d,sync}=fixture(t),canvas=g.renderer.canvas;
 Object.assign(p,{prologue:true,age:0,x:0,z:10,releaseAt:100,introUntil:112});sim.getRoom(p).actors=[];
 g.installInput();let capture=null;canvas.setPointerCapture=id=>capture=id;canvas.hasPointerCapture=id=>capture===id;canvas.releasePointerCapture=()=>capture=null;
 const pointer=(type,x,y)=>{const e=new w.MouseEvent(type,{button:0,clientX:x,clientY:y,bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:1});canvas.dispatchEvent(e);};
 pointer('pointerdown',2,10);pointer('pointerup',2,10);assert.ok(g.walkTarget);g.updateMove();sim.tick(1/30);assert.ok(p.x>0,'tap moves the carrying parent');
 const x=p.x;pointer('pointerdown',100,100);pointer('pointermove',145,100);sim.tick(1/30);assert.ok(p.x>x);pointer('pointercancel',145,100);assert.equal(p.input.x,0);assert.equal(g.pointer,null);assert.equal(p.dash,null);
 canvas.dispatchEvent(new w.KeyboardEvent('keydown',{code:'KeyD',key:'d',bubbles:true}));g.updateMove();const before=p.x;sim.tick(1/30);assert.ok(p.x>before);canvas.dispatchEvent(new w.KeyboardEvent('keyup',{code:'KeyD',key:'d',bubbles:true}));assert.equal(p.input.x,0);
 const timeoutX=p.x;g.command({type:'move',x:1,z:0});for(let i=0;i<60;i++)sim.tick(1/30);assert.equal(p.input.x,0);assert.ok(p.x>timeoutX);
 sync();assert.equal(d.querySelector('[data-gift]'),null);assert.equal(d.querySelector('#gift-tray'),null);assert.equal(d.getElementById('leave-arms'),null);
 const release={x:p.x,z:p.z};g.command({type:'leaveIntro'}); // Legacy command remains compatible; the UI releases automatically.
 assert.equal(p.prologue,false);assert.equal(p.age,4);assert.equal(p.introX,release.x);assert.equal(p.introZ,release.z);assert.ok(Math.hypot(p.x-release.x,p.z-release.z)<1);assert.equal(p.inventory.length,0);
 const restored=w.testAPI.Simulation.restore(sim.exportState());assert.equal(restored.players.get(p.id).prologue,false);
});

test('walk slides along houses and schools without crossing walls; attack steps still stop',t=>{
 const {p,sim}=fixture(t),r=sim.getRoom(p);r.actors=[];r.map={houses:[{x:0,z:0}],schools:[]};
 Object.assign(p,{x:2,z:0});const moved=sim.moveWalk(p,r,-.35,.35);assert.ok(moved>.34);assert.ok(p.x>=2-1e-6);assert.ok(p.z>.34);
 Object.assign(p,{x:2,z:0});assert.equal(sim.moveAttackStep(p,r,-.35,.35),0);assert.equal(p.z,0);
 Object.assign(p,{x:2,z:0});assert.equal(sim.moveWalk(p,r,-3,0),0);assert.equal(p.x,2,'head-on movement never passes through scenery');
 r.map={houses:[],schools:[{id:'forge',x:0,z:2}]};Object.assign(p,{x:2.5,z:0});sim.moveWalk(p,r,-.3,-.3);assert.ok(p.x>=2.5-1e-6);assert.ok(p.z<-.29);
 r.map={houses:[],schools:[]};Object.assign(p,{x:0,z:0});const a=sim.actor('dummy',.8,0);r.actors=[a];assert.equal(sim.moveWalk(p,r,.4,0),0,'body collision is retained');
});

test('carried walk preserves the release timer, inventory, save compatibility and combat lock',t=>{
 const {p,g,sim,api}=fixture(t);Object.assign(p,{prologue:true,age:0,x:0,z:10,releaseAt:2,introUntil:14});
 const restored=api.Simulation.restore(sim.exportState()),q=restored.players.get(p.id);restored.command(q.id,{type:'move',x:1,z:0});restored.tick(1/30);assert.ok(q.x>0);
 assert.equal(g.command({type:'dash',x:1,z:0}),false);assert.equal(g.command({type:'attack'}),false);assert.equal(g.command({type:'pickup',id:'none'}),false);
 for(let i=0;i<61;i++)sim.tick(1/30);assert.equal(p.prologue,false);assert.equal(p.age,4);assert.equal(p.inventory.length,0);
});

test('speech is small, switches side with the camera view and hides outside the real viewport',t=>{
 const {p,g,ui,d,sync}=fixture(t);let flip=1;
 g.renderer.width=600;g.renderer.height=800;g.renderer.project=(x,y,z)=>({x:300+flip*x*20,y:500-y*25+z,visible:true});
 p.dir=Math.PI/2;p.speech='ここにいるよ';p.speechUntil=100;sync();const node=d.querySelector('.speech-bubble');assert.equal(node.dataset.side,'right');
 flip=-1;ui.updateWorld(g.snapshot);assert.equal(node.dataset.side,'left');
 p.x=30;sync();assert.equal(node.style.display,'none','renderer overscan must not pin speech to the edge');
 p.x=0;sync();assert.equal(node.style.display,'');const before=node.style.transform;p.x=.013;sync();assert.notEqual(node.style.transform,before,'subpixel positions must not be rounded');
 p.speechUntil=-1;sync();assert.equal(d.querySelector('.speech-bubble'),null);
 const css=fs.readFileSync(new URL('../src/ui/interaction.css',import.meta.url),'utf8');assert.match(css,/max-width:min\(196px,55vw\)/);assert.match(css,/font-size:11px;line-height:1.5/);
});

test('mother dialogue follows the same walk-home pose and vanishes with the parent or viewport',t=>{
 const {p,g,ui,d,sim,sync}=fixture(t);g.renderer.width=600;g.renderer.height=800;g.renderer.project=(x,y,z)=>({x:300+x*20,y:500-y*25+z,visible:true});
 Object.assign(p,{releaseAt:0,introUntil:12,introX:0,introZ:10,introHomeX:8,introHomeZ:10,motherText:'おかえり',motherUntil:50});
 sim.time=5;sync();const node=d.getElementById('mother-dialogue'),first=node.style.transform;sim.time=7;sync();assert.notEqual(node.style.transform,first,'follows the departing model');
 p.introHomeX=80;sync();assert.equal(node.style.display,'none');p.introHomeX=8;sim.time=18;sync();assert.equal(node.style.display,'none','no parent model remains');
});

test('pickup lives above its object, follows fractional camera motion, and disappears after collection',t=>{
 const {p,g,sim,d,sync,ui}=fixture(t),r=sim.getRoom(p);r.items=[{id:'near',item:'stone',x:.125,z:0,ready:0}];sync();
 const button=d.querySelector('[data-context=pickup]'),anchor=d.getElementById('world-pickup');assert.ok(button);assert.equal(button.closest('#context'),null);const before=anchor.style.transform;
 g.renderer.project=(x,y,z)=>({x:180+x*5+.125,y:300-y*10,visible:true});ui.updateWorld(g.snapshot);assert.notEqual(anchor.style.transform,before);
 button.click();assert.equal(p.inventory[0],'stone');assert.equal(d.querySelector('[data-context=pickup]'),null);
});

test('every render frame projects labels from the exact interpolated snapshot even between HUD refreshes',t=>{
 const {g,w}=fixture(t),raw=g.snapshot,rendered={...raw,player:{...raw.player,x:.125}};let received=null,drawn=null,hud=0;
 w.requestAnimationFrame=()=>{};g.updateMove=()=>{};g.motionInterpolation={sample:()=>rendered};g.accumulator=0;g.playerId=null;g.lastFrame=100;g.lastUI=100;g.sinceSave=0;
 Object.assign(g.audio,{setListener(){},updateFootsteps(){}});g.renderer.art={sources:[]};g.renderer.render=s=>drawn=s;g.buildingLabels={update(){}};g.ui.update=()=>hud++;g.ui.updateWorld=s=>received=s;g.ui.portraitQueue=[];
 g.frame(110);assert.equal(g.frameError,undefined);assert.equal(hud,0);assert.equal(received,rendered);assert.equal(received,drawn);
});

test('visible titles are unified while persistent save identifiers remain compatible',()=>{
 for(const name of ['src/shell.html','src/legacy/core.js','src/legacy/ui.js','src/ui/lineage.js','src/legacy/game.js','build.mjs']){
  const s=fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');assert.doesNotMatch(s,/継ぎ火の谷|継火のエリン|血の系譜/);
 }
 const game=fs.readFileSync(new URL('../src/legacy/game.js',import.meta.url),'utf8');assert.match(game,/aerin\.tactics\.v3\./);assert.match(game,/AERIN-portable-1/);
});

test('pickup objects use their authoritative positions and disappear on cooldown without affecting portraits',()=>{
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../src/render/renderer-base.js',import.meta.url),'utf8'),ctx);
 const Renderer=vm.runInContext('Renderer',ctx),drawn=[],r=Object.assign(Object.create(Renderer.prototype),{camera:{x:0,z:0},add:(...args)=>drawn.push(args)});
 const s={t:5,room:{kind:'village',items:[{x:1,z:2,item:'stone',ready:0},{x:3,z:4,item:'bell',ready:6}]}};
 const before=JSON.stringify(s);r.drawLooseItems(s);assert.equal(drawn.length,1);assert.equal(drawn[0][1],1);assert.equal(drawn[0][3],2);assert.equal(JSON.stringify(s),before);
 drawn.length=0;r.drawLooseItems(s,{portrait:true});r.drawLooseItems(s,{clan:true});assert.equal(drawn.length,0);
 s.room.items[0].ready=10;r.drawLooseItems(s);assert.equal(drawn.length,0);
});

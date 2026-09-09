import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {createCanvas} from '@napi-rs/canvas';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const context=vm.createContext({});vm.runInContext(read('src/render/skill-silk.js')+'\n'+read('src/render/skill-effects.js'),context);const FX=vm.runInContext('SkillEffects',context);
test('versioned recipes reject invalid imports and preserve deterministic seeking',()=>{
 for(const bad of [{version:2},{family:'__proto__'},{impact:'unknown'},{seed:NaN},{seed:-1},{seed:1.5},{flutter:NaN},{flutter:-1},{flutter:2},{thickness:0},{thickness:5},{thickness:'2'}])assert.throws(()=>FX.resolve(bad));
 assert.equal(FX.resolve({version:1}).thickness,2.2);assert.equal(FX.resolve({version:1}).flutter,.65);
 const r=FX.resolve({family:'thread',path:'orbit',rhythm:'triplet',impact:'pinch',release:'recoil',seed:981});
 const a=JSON.stringify(FX.frame(r,.51));FX.frame(r,1.1);FX.frame(FX.presets[4].recipe,.51);
 assert.equal(JSON.stringify(FX.frame(FX.resolve(JSON.parse(JSON.stringify(r))),.51)),a);
 assert.deepEqual(FX.frame(r,-1).length,0);assert.equal(FX.frame(r,1.5).length,0);
});
test('all supported combinations stay finite and bounded, including low quality',()=>{
 let count=0;
 for(const family of Object.keys(FX.options.family))for(const path of Object.keys(FX.options.path))for(const rhythm of Object.keys(FX.options.rhythm))for(const impact of Object.keys(FX.options.impact))for(const release of Object.keys(FX.options.release)){
  const r=FX.resolve({family,path,rhythm,impact,release});count++;
  for(const quality of ['high','low'])for(const t of [.22,.34,.43,.56,.71,.9,1.25]){
   const frame=FX.frame(r,t,quality);assert(frame.length<=(quality==='low'?160:320));
   for(const p of frame){for(const v of (p.kind==='ribbon'?p.sections.flatMap(s=>[...s.a,...s.b]):p.kind==='line'?[...p.a,...p.b,p.width]:[...p.p,...p.size,p.turn]))assert(Number.isFinite(v));assert(p.alpha>=0&&p.alpha<=1);}
  }
 }
 assert.equal(count,864);
});
test('material families have distinct geometry with identical path, tempo and no color',()=>{
 const signatures=Object.keys(FX.options.family).map(family=>JSON.stringify([.29,.42,.49,.58].map(t=>FX.frame(FX.resolve({family}),t).map(({color,...p})=>p))));
 assert.equal(new Set(signatures).size,6);
});
test('18 stable authored bindings use only real active catalog IDs and distinct recipes',()=>{
 const source=JSON.parse(read('src/skills/catalog-source.json')),ids=source.families.flatMap(f=>f.variants.map(v=>v.id));
 const mapped=ids.map(id=>FX.forSkill(id)).filter(Boolean);assert.equal(mapped.length,18);
 assert.equal(new Set(mapped.map(r=>JSON.stringify({...r,seed:0}))).size,18);
 assert.equal(FX.forSkill(4000),null);assert(Object.isFrozen(mapped[0]));
});
test('ending modes change motion, and sound sources stop and release their graph',()=>{
 const shapes=['vanish','drift','recoil'].map(release=>JSON.stringify(FX.impact(FX.resolve({family:'shadow',release}),.2).map(({alpha,color,...p})=>p)));
 assert.equal(new Set(shapes).size,3);
 for(const preset of FX.presets){
  const sources=[],nodes=[],param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>{const n={connect(){},disconnect(){this.closed=true;}};nodes.push(n);return n;};
  const ctx={currentTime:0,destination:{},createGain:()=>({...node(),gain:param()}),createOscillator:()=>{const o={...node(),frequency:param(),start(t){this.startAt=t;},stop(t){this.stopAt=t;}};sources.push(o);return o;}};
  FX.sound(ctx,preset.recipe,0,.15);assert(sources.length<=2);for(const o of sources){assert(o.stopAt>0&&o.stopAt<.3);o.onended();assert(o.closed);}
 }
});
test('runtime emits composed impacts only after confirmed hits and freezes contact position',()=>{
 const ctx=vm.createContext({});vm.runInContext(`const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const SkillMotion={groundAt:()=>0};`,ctx);
 vm.runInContext(read('src/render/skill-effects.js')+'\n'+read('src/render/combat-presentation.js'),ctx);
 const Presentation=vm.runInContext('CombatPresentation',ctx),target={id:'dummy',x:1,z:2,alive:false,dir:0},r={camera:{x:0,z:0,yaw:0},quality:'low',effects:[],weatherState:{rain:0},art:{sources:[]}},fx=new Presentation(r),draws=[];
 fx.composition=(primitives,point)=>draws.push({primitives,origin:point([0,0,0])});fx.needle=()=>{};
 const s={t:1.05,actors:[target],room:{id:'test'}};fx.update(s);assert.equal(draws.length,0);
 r.effects=[{type:'hit',skill:60082,target:'dummy',born:1,x:1,z:2}];fx.update(s);assert.equal(draws.length,1);assert(draws[0].primitives.length>0);
 target.x=4;s.t=1.15;fx.update(s);assert.deepEqual(draws[1].origin,draws[0].origin);
 s.t=1.6;fx.update(s);assert.equal(r.effects.length,0);
});
test('composition obeys a per-renderer frame budget under concurrent impacts',()=>{
 const ctx=vm.createContext({});vm.runInContext(read('src/render/combat-presentation.js'),ctx);const P=vm.runInContext('CombatPresentation',ctx);
 let draws=0;const p=new P({add(){draws++;},fxBatches:[]});p.needle=()=>draws++;p.compositionBudget=256;
 const primitives=FX.impact(FX.presets[1].recipe,.08);for(let i=0;i<100;i++)p.composition(primitives,v=>v);
 assert.equal(draws,256);assert.equal(p.compositionBudget,0);
});
test('lab controls support edits, scrubbing, comparison and reset without game storage',()=>{
 const html=read('tools/skill-fx-lab/index.html'),can=createCanvas(800,480),dom=new JSDOM(html,{url:'https://effect-lab.invalid',runScripts:'outside-only'}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>can.getContext('2d');w.HTMLElement.prototype.getBoundingClientRect=()=>({width:800,height:480});w.matchMedia=()=>({matches:true});w.ResizeObserver=class{observe(){}};w.requestAnimationFrame=()=>0;
 w.eval(`const FX_LAB_BUILD='test';\n`+read('src/render/skill-silk.js')+'\n'+read('src/render/skill-effects.js')+'\n'+read('tools/skill-fx-lab/renderer.js')+'\n'+read('tools/skill-fx-lab/app.js'));
 const $=id=>w.document.getElementById(id);assert.equal($('presets').children.length,6);
 w.SkillFxLab.seek(.34);
 $('flutter').value='0';$('flutter').dispatchEvent(new w.Event('input'));assert.equal(w.SkillFxLab.getRecipe().flutter,0);assert.equal($('timeline').value,'340');
 $('thickness').value='3';$('thickness').dispatchEvent(new w.Event('input'));assert.equal(w.SkillFxLab.getRecipe().thickness,3);assert.equal($('play').getAttribute('aria-label'),'再生');
 const seed=w.SkillFxLab.getRecipe().seed;$('reseed').click();assert.notEqual(w.SkillFxLab.getRecipe().seed,seed);
 assert.equal(JSON.parse(w.localStorage.getItem('bloodline-skill-fx-lab-v1')).thickness,3);
 $('presets').children[3].click();assert.equal(w.SkillFxLab.getRecipe().family,'thread');
 assert.equal($('silk-controls').disabled,true);
 $('pin').click();$('family').value='stone';$('family').dispatchEvent(new w.Event('change'));assert.equal(w.SkillFxLab.getRecipe().family,'stone');
 $('compare').click();assert.equal($('compare').getAttribute('aria-pressed'),'true');
 $('timeline').value='430';$('timeline').dispatchEvent(new w.Event('input'));assert.equal($('play').getAttribute('aria-label'),'再生');
 $('step').click();assert.equal($('timeline').value,'447');
 $('mono').checked=true;$('mono').dispatchEvent(new w.Event('change'));$('reset').click();assert.equal(w.SkillFxLab.getRecipe().family,'thread');
 assert.equal(w.localStorage.length,1);assert.equal(w.localStorage.key(0),'bloodline-skill-fx-lab-v1');dom.window.close();
});

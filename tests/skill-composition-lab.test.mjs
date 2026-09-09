import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {catalogProgram,compileCatalog} from '../tools/skill-catalog.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const definitions=compileCatalog(JSON.parse(read('src/skills/catalog-source.json')));
test('trial controls compose real skills, execute single/combo combat and round-trip only isolated recipe storage',async()=>{
 const dom=new JSDOM(read('tools/skill-composition-lab.html'),{url:'https://composition.test',runScripts:'outside-only'}),w=dom.window;
 w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 const stub=`const BUILD_INFO={shortCommit:'test'};const AssetBank={load:async()=>{}};function installTerrainGeometry(){};function rModel(){return [];}class SliceRenderer{constructor(){this.art={B(){}};this.static=new Map();this.camera={};this.effects=[];this.combatPresentation={trails:new Map(),forget(){},castSamples:new Map()};}setQuality(){}effect(){}render(){}}`;
 w.eval(catalogProgram(JSON.parse(read('src/skills/catalog-source.json')))+['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js'].map(f=>read('src/'+f)).join('\n')+stub+read('tools/skill-composition-lab.js').split('try{await CompositionLab.start();}')[0]+'\nwindow.start=CompositionLab.start;');
 try{await w.start();assert.equal(w.document.querySelectorAll('#parts select').length,5);const lab=w.CompositionLab,d=w.document;
  for(const value of ['single','return','delay','triple']){d.getElementById('cadence').value=value;d.getElementById('cadence').dispatchEvent(new w.Event('change'));const {p,sim}=lab.getTrial();const id=p.pendingSkill.id;
   const names=definitions.find(d=>d.id===id).names;assert.equal(d.getElementById('name').textContent,names.ja);assert.equal(d.getElementById('name-en').textContent,names.en);assert.match(d.getElementById('phase').textContent,/^編成する段：[序破急]$/);
   for(let i=0;i<480;i++)lab.step(1/120);assert.ok(sim.events.some(e=>e.type==='skillbeat'&&e.id===id));}
  d.getElementById('combo').click();const {sim,p}=lab.getTrial();for(let i=0;i<900;i++)lab.step(1/120);const used=sim.events.filter(e=>e.type==='skill'&&e.player===p.id).map(e=>e.id);assert.ok(new Set(used).size>=3,JSON.stringify(used));
  const draws=new Set();for(let i=0;i<12;i++){d.getElementById('random').click();draws.add(JSON.stringify(lab.getRecipe()));assert.ok(lab.getTrial().p.pendingSkill);}
  assert.ok(draws.size>=10);const prior=JSON.stringify(lab.getRecipe());d.getElementById('random').click();d.getElementById('previous').click();assert.equal(JSON.stringify(lab.getRecipe()),prior);
  d.getElementById('ready').click();const waiting=lab.getTrial();for(let i=0;i<120;i++)lab.step(1/60);assert.ok(waiting.p.focusTarget);assert.equal(waiting.p.pendingSkill,null);assert.equal(waiting.p.action,'idle');assert.equal(waiting.sim.events.filter(e=>e.type==='skill').length,0,'stance preview does not issue an attack');
  for(let weapon=0;weapon<6;weapon++){
   d.getElementById('weapon').value=weapon;d.getElementById('weapon').dispatchEvent(new w.Event('change'));
   const select=d.getElementById('weapon-skill');assert.ok(select.options.length>1);select.value=select.options[1].value;select.dispatchEvent(new w.Event('change'));
   const id=lab.getRecipe().skillId;assert.equal(lab.getTrial().p.weapon,weapon);assert.equal(lab.getTrial().p.pendingSkill.id,id);assert.equal(d.getElementById('parts').disabled,true);
   for(let i=0;i<700;i++)lab.step(1/120);assert.ok(lab.getTrial().sim.events.some(e=>e.type==='skill'&&e.id===id));
   d.getElementById('random-combo').click();assert.equal(lab.getSlots().length,3);for(const r of lab.getSlots())if(r.skillId)assert.ok([...select.options].some(o=>+o.value===r.skillId));
  }
  d.getElementById('effects').checked=false;d.getElementById('effects').dispatchEvent(new w.Event('change'));const without=JSON.stringify(lab.getTrial().sim.exportState());assert.equal(lab.getRenderer().combatPresentation.previewEnabled,false);
  d.getElementById('effects').checked=true;d.getElementById('effects').dispatchEvent(new w.Event('change'));assert.equal(JSON.stringify(lab.getTrial().sim.exportState()),without,'VFX toggle cannot change combat');
  d.getElementById('save').click();const saved=w.localStorage.getItem('bloodline-skill-composition-lab-v1');assert.ok(saved);assert.equal(w.localStorage.length,1);d.getElementById('load').click();assert.equal(JSON.stringify(lab.getRecipe()),JSON.stringify(JSON.parse(saved).selected));
  d.getElementById('recipe').value='{"version":999}';d.getElementById('load').click();assert.ok(d.getElementById('error').textContent);assert.equal(w.localStorage.getItem('bloodline-skill-composition-lab-v1'),saved);
  d.getElementById('recipe').value=JSON.stringify({version:1,selected:definitions.find(d=>d.composition).composition,slots:[0,1,2].map(p=>definitions.find(d=>d.composition&&d.phase===p).composition)});d.getElementById('load').click();assert.equal(lab.getTrial().p.weapon,-1,'old recipe files remain usable');
 }finally{dom.window.close();}
});

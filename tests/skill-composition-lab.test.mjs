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
  d.getElementById('save').click();const saved=w.localStorage.getItem('bloodline-skill-composition-lab-v1');assert.ok(saved);assert.equal(w.localStorage.length,1);d.getElementById('load').click();assert.equal(JSON.stringify(lab.getRecipe()),JSON.stringify(JSON.parse(saved).selected));
  d.getElementById('recipe').value='{"version":999}';d.getElementById('load').click();assert.ok(d.getElementById('error').textContent);assert.equal(w.localStorage.getItem('bloodline-skill-composition-lab-v1'),saved);
 }finally{dom.window.close();}
});

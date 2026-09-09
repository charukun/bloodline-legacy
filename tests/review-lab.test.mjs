import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {catalogProgram} from '../tools/skill-catalog.mjs';
import {runtimeSources,visualAssetNames} from '../tools/runtime-sources.mjs';
import {createReviewModel,reviewLink} from '../src/review/model.mjs';
import {reviewConfiguration,reviewWorkerName} from '../deploy/review-config.mjs';
import {buildReview} from '../tools/build-review-lab.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const context=vm.createContext({console});
vm.runInContext(catalogProgram(JSON.parse(read('src/skills/catalog-source.json')))+['legacy/dialogue.js','legacy/core.js','skills/engine.js','skills/runtime.js'].map(p=>read('src/'+p)).join('\n')+'\nthis.R={Simulation,book,skillById,skillPhase,skillRestriction,ENEMY_FORMS};this.register=art;',context);
const model=createReviewModel(context.R);
test('all runtime skills and enemy forms are discovered without review-only registrations',()=>{
 assert.equal(model.skills().length,[...context.R.book.values()].filter(s=>context.R.skillById(s.id)).length);
 assert.equal(model.enemies().length,1+Object.values(context.R.ENEMY_FORMS).flat().length);
 context.register(991001,'自動登録の試験',{band:0});assert.equal(model.resolveSkill('991001').name,'自動登録の試験');context.R.book.delete(991001);
 const composed=model.skills().find(s=>s.skillKey);assert.equal(model.resolveSkill(composed.skillKey).id,composed.id);
 assert.equal(model.resolveSkill('not-a-skill'),undefined);assert.equal(model.resolveEnemy('not-an-enemy'),undefined);
});
test('every active registered skill starts through real Simulation with explicit fixture prerequisites',()=>{
 for(const skill of model.skills()){
  const t=model.trial({skill:skill.id});
  assert.ok(t.p.skills.includes(skill.id)||t.p.passives.includes(skill.id),skill.id);
  if(!skill.passive)assert.equal(t.p.attackSkill,skill.id,`${skill.id} ${skill.name}`);
 }
});
test('skill versus enemy uses exact form, actual hit/damage and opposing AI; no storage globals exist',()=>{
 const t=model.trial({skill:4001,enemy:'rime-guard',distance:1.6,mode:'combat'});
 assert.equal(t.enemy.enemyForm,'rime-guard');const hp=t.enemy.hp;
 for(let i=0;i<900;i++)model.step(t,1/60);
 assert.ok(t.events.some(e=>e.type==='skill'&&e.id===4001));
 assert.ok(t.enemy.hp<hp||t.enemy.alive===false,'real enemy damage');
 const opposing=model.trial({skill:4000,enemy:'boss',distance:2,mode:'combat'});
 for(let i=0;i<1200;i++)model.step(opposing,1/60);
 assert.ok(opposing.events.some(e=>e.type==='enemySwing'),'opponent AI attacks');
 assert.ok(opposing.p.health<100||Object.keys(opposing.p.wounds).length>0,'opponent AI hits the player');
 assert.ok(t.events.some(e=>e.type==='hit'));
 assert.throws(()=>model.trial({skill:4001,enemy:'missing'}),/この版に敵がありません/);
});
test('sequence executes all three chosen phases and single never starts a second player skill',()=>{
 const t=model.trial({skill:4000,mode:'combo',distance:1.1,slots:[4000,4100,4101]});
 for(let i=0;i<660;i++)model.step(t,1/60);
 assert.deepEqual([...new Set(t.events.filter(e=>e.type==='skill'&&e.player===t.p.id).map(e=>e.id))],[4000,4100,4101]);
 const single=model.trial({skill:4000,mode:'single',distance:1.1});for(let i=0;i<660;i++)model.step(single,1/60);
 assert.equal(single.events.filter(e=>e.type==='skill'&&e.player===single.p.id).length,1);
});
test('links preserve exact IDs and SHA with URL encoding',()=>{
 const url=new URL(reviewLink('https://review.example',{mode:'combat',skill:'bl.skill.foo',enemy:'rime-guard',sha:'a'.repeat(40)}));
 assert.equal(url.pathname,'/review/combat');assert.equal(url.searchParams.get('skill'),'bl.skill.foo');assert.equal(url.searchParams.get('sha'),'a'.repeat(40));
 assert.throws(()=>reviewLink('https://review.example',{mode:'../api/join'}));
});
test('review shares the game source/asset inventory, excludes bootstrap and never embeds binary assets in HTML',()=>{
 const build=read('build.mjs');assert.match(build,/runtimeSources/);assert.match(build,/visualAssetNames/);
 assert.ok(runtimeSources.includes('bootstrap.js'));assert.equal(new Set(runtimeSources).size,runtimeSources.length);
 assert.ok(visualAssetNames.includes('enemies/sentinel.glb'));
 const html=read('src/review/index.html');assert.ok(html.length<15000);assert.doesNotMatch(html,/base64|VISUAL_ASSETS|new Simulation|new Game/);
 assert.doesNotMatch(read('src/review/app.mjs')+read('src/review/model.mjs'),/localStorage|sessionStorage|indexedDB|new Game|\/api\/|serviceWorker/);
});
test('production/staging builds, invalid SHA labels and cross-PR preview identities are rejected',async()=>{
 await assert.rejects(buildReview({environment:'production'}),/cannot be built/);
 await assert.rejects(buildReview({environment:'staging'}),/cannot be built/);
 await assert.rejects(buildReview({commit:'a'.repeat(40)}),/checked-out commit/);
 const a=reviewWorkerName({environment:'preview',pr:81,sha:'a'.repeat(40)}),b=reviewWorkerName({environment:'preview',pr:82,sha:'a'.repeat(40)}),c=reviewWorkerName({environment:'preview',pr:81,sha:'b'.repeat(40)});
 assert.notEqual(a,b);assert.notEqual(a,c);
 const config=reviewConfiguration({environment:'dev',sha:'a'.repeat(40)});assert.equal(config.assets.run_worker_first,true);assert.equal(config.assets.not_found_handling,'none');assert.equal(config.durable_objects,undefined);
 for(const env of ['dev','staging','production'])assert.doesNotMatch(read(`deploy/wrangler.${env}.json`),/bloodline-review|\/review\//);
 assert.doesNotMatch(read('deploy/build.mjs'),/build-review/);
});

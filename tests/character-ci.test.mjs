import test from 'node:test';
import assert from 'node:assert/strict';
import {characterPlan} from '../tools/ci/character-plan.mjs';
const plan=(changedFiles,extra={})=>characterPlan({event:'pull_request',changedFiles,...extra});
test('runtime changes retain head gate; authored assets add validation',()=>{
  for(const p of ['src/character/traveler-runtime.js','src/render/renderer-base.js','src/legacy/game.js','src/ui/core.js','package-lock.json','tests/character-browser.mjs','tools/ci/character-plan.mjs']){
    const r=plan([p]);assert(r.browser,p);assert(!r.full,p);assert.equal(r.mode,'gate');
  }
  assert(!plan(['src/character/traveler-runtime.js']).assets);
  for(const p of ['public/assets/character/new.glb','tests/character_asset_validation.py','tools/generate_character.py'])assert(plan([p]).assets,p);
});
test('unrelated docs and isolated unit tests use general CI; mixed character changes cannot hide',()=>{
  for(const p of ['docs/CI_VALIDATION.md','tests/live-update.test.mjs'])assert(!plan([p]).browser,p);
  assert(plan(['README.md','src/character/new.js']).browser);
});
test('unknown changes and missing or empty diff fail closed',()=>{
  for(const r of [plan(['unknown-file']),plan([]),plan(['README.md'],{diffAvailable:false})])assert(r.browser);
});
test('integrated character changes and explicit review preserve full baseline evidence',()=>{
  assert(plan(['src/character/new.js'],{event:'push'}).full);
  assert(plan(['README.md'],{event:'workflow_dispatch',fullReview:true}).full);
  assert(!plan(['README.md'],{event:'push'}).browser);
  assert(plan([],{event:'push',diffAvailable:false}).full);
});

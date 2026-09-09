import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {validationPlan, testInventory, readChanges} from '../tools/ci/validation-plan.mjs';

const inventory = testInventory();
const plan = (changedFiles, extras = {}) => validationPlan({event:'pull_request',baseBranch:'develop',changedFiles,inventory,...extras});
test('integrated branches, release PRs and manual runs always run the complete suite', () => {
  for (const extras of [{event:'push'},{event:'workflow_dispatch'},{baseBranch:'staging'},{baseBranch:'main'}]) {
    const p=plan(['README.md'],extras); assert.equal(p.scope,'full');assert.deepEqual(p.tests,inventory);
    assert(p.lives && p.runtime && p.glsl);
  }
});
test('unknown shared code, dependency/config changes and absent diff fail closed to full regression', () => {
  for (const files of [[],['src/legacy/core.js'],['src/render/shaders.js'],['package-lock.json'],['.github/workflows/deploy.yml'],['tests/ui-fixture.cjs'],['src/new-module.js'],['src/moved.test.mjs']])
    assert.equal(plan(files).scope,'full');
  assert.equal(plan(['README.md'],{diffAvailable:false}).scope,'full');
});
test('documents can omit simulation tests while styles keep UI, save and update coverage', () => {
  assert.equal(plan(['README.md','docs/COMMON_DEVELOPMENT_POLICY.txt']).scope,'documentation');
  const p=plan(['src/ui/diorama-materials.css']);
  for (const file of ['tests/ui.test.cjs','tests/ui-polish.test.mjs','tests/live-save.test.cjs','tests/live-update.test.mjs']) assert(p.tests.includes(file),file);
  assert(p.tests.length < inventory.length); assert(!p.runtime && !p.lives);
});
test('character changes retain rig, motion, injury and gameplay-boundary tests', () => {
  const p=plan(['src/character/traveler-runtime.js']);
  for (const file of ['tests/character-runtime.test.mjs','tests/traveler-clips.test.mjs','tests/traveler-damage.test.mjs','tests/traversal.test.mjs','tests/skills/combat.test.mjs']) assert(p.tests.includes(file),file);
  assert.equal(p.scope,'character');assert(p.tests.length < inventory.length);
});
test('network changes require compatibility, infrastructure, lifetime and Workers-runtime checks', () => {
  const p=plan(['src/live/contract.mjs','src/server/world.mjs']);
  assert(p.tests.includes('tests/live-update.test.mjs'));assert(p.tests.includes('tests/live-save.test.cjs'));
  assert(p.tests.includes('deploy/infrastructure.test.mjs'));assert(p.runtime && p.lives);
});
test('mixed domains form a deduplicated union and an unknown path escalates the whole PR', () => {
  const css=plan(['src/ui/base.css']),net=plan(['src/live/client.js']);
  const mixed=plan(['src/ui/base.css','src/live/client.js','docs/example.md']);
  assert.deepEqual(mixed.tests,[...new Set([...css.tests,...net.tests])].sort());
  assert.equal(plan(['src/ui/base.css','src/legacy/game.js']).scope,'full');
});
test('new discovered tests are included in full coverage; direct test changes are never ignored', () => {
  const newTest='tests/future.test.mjs';const all=[...inventory,newTest];
  assert.deepEqual(plan([newTest],{inventory:all}).tests,[...new Set(['tests/ci-validation.test.mjs',newTest])].sort());
  assert(plan(['unknown.js'],{inventory:all}).tests.includes(newTest));
  assert.equal(inventory.filter(p=>p==='deploy/infrastructure.test.mjs').length,1);
  assert(!inventory.includes('deploy/build-info.test.mjs'),'build-info is already imported by infrastructure');
});
test('git diff includes both sides of renames and safely handles spaces and invalid refs', t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bloodline-ci-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init');git('config','user.name','CI Fixture');git('config','user.email','fixture@example.invalid');
  fs.mkdirSync(path.join(dir,'src'));fs.writeFileSync(path.join(dir,'src/shared.js'),'a');git('add','.');git('commit','-m','base');const base=git('rev-parse','HEAD');
  fs.mkdirSync(path.join(dir,'docs'));fs.renameSync(path.join(dir,'src/shared.js'),path.join(dir,'docs/renamed file.md'));git('add','-A');git('commit','-m','rename');const head=git('rev-parse','HEAD');
  const diff=readChanges({CI_BASE_SHA:base,CI_HEAD_SHA:head},dir);
  assert(diff.changedFiles.includes('src/shared.js'));assert(diff.changedFiles.includes('docs/renamed file.md'));
  assert.equal(plan(diff.changedFiles).scope,'full');
  assert.equal(readChanges({CI_BASE_SHA:'--bad',CI_HEAD_SHA:head},dir).diffAvailable,false);
});

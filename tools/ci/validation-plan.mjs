import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function testInventory(directory = root) {
  return ['tests', 'tests/skills', 'deploy'].flatMap(dir =>
    fs.readdirSync(path.join(directory, dir))
      .filter(name => /\.test\.(cjs|mjs)$/.test(name))
      // infrastructure.test imports build-info.test; execute that child once.
      .filter(name => dir !== 'deploy' || name === 'infrastructure.test.mjs')
      .map(name => `${dir}/${name}`)).sort();
}

const documentation = p => /^(docs\/.*\.(md|txt)|README\.md|AGENTS\.md|WORK_INSTRUCTIONS\.md|\.github\/PULL_REQUEST_TEMPLATE\.md)$/.test(p);
const styles = p => /^src\/(ui|skills|live)\/.*\.css$/.test(p);
const characters = p => /^(src\/character\/|public\/assets\/character\/|tools\/generate_character\.py$)/.test(p);
const network = p => /^(src\/live\/|src\/server\/|deploy\/(worker|check-rollout|live-runtime\.test)\.mjs$)/.test(p);
const groups = {
  ui: p => /ui|lineage|wardrobe|talk|facility|building|notice|polish|skills-panel|live-save|live-update/.test(p),
  character: p => /character|traveler|damage|motion|combat|stamina|traversal|live-save|shader-compile|tests\/skills\//.test(p),
  network: p => /live-|deploy\/infrastructure/.test(p),
};

// Only explicitly bounded change classes may use a subset. Unknown changes,
// including shared simulation/rendering code, always retain the full suite.
export function validationPlan({event, baseBranch, changedFiles = [], inventory, diffAvailable = true}) {
  const full = reason => ({scope:'full', reason, tests:[...inventory], lives:true, runtime:true, glsl:true});
  if (event !== 'pull_request' || baseBranch !== 'develop') return full('Integrated branches, release PRs and manual runs retain full regression');
  if (!diffAvailable || !changedFiles.length) return full('Diff unavailable or empty; do not guess coverage');
  const selected = new Set(), scopes = new Set();
  for (const file of changedFiles) {
    if (documentation(file)) continue;
    if (inventory.includes(file)) { selected.add(file); scopes.add('test'); continue; }
    let group;
    if (styles(file)) group = 'ui';
    else if (characters(file)) group = 'character';
    else if (network(file)) group = 'network';
    else return full(`Unmapped/shared change: ${file}`);
    const matches = inventory.filter(groups[group]);
    if (!matches.length) return full(`No tests found for ${group}`);
    scopes.add(group); matches.forEach(p => selected.add(p));
  }
  const tests = [...selected].sort();
  // Keep the selector's fail-closed contract in every non-document PR.
  if (tests.length && inventory.includes('tests/ci-validation.test.mjs')) tests.push('tests/ci-validation.test.mjs');
  return {scope:scopes.size?[...scopes].sort().join('+'):'documentation',
    reason:'Bounded PR changes; full regression runs on integrated develop',
    tests:[...new Set(tests)].sort(), lives:scopes.has('network'),
    runtime:scopes.has('network'), glsl:tests.some(p => /shader/.test(p))};
}

export function readChanges(env, cwd = root) {
  const {CI_BASE_SHA:base, CI_HEAD_SHA:head} = env;
  if (![base,head].every(s => /^[a-f0-9]{40}$/.test(s || ''))) return {diffAvailable:false, changedFiles:[]};
  try {
    // Base to checked-out PR merge tree also includes conflict-resolution changes.
    // Disable renames so removal of a shared file cannot masquerade as docs-only.
    const names = execFileSync('git', ['diff','--no-renames','--name-only','-z',base,head,'--'],
      {cwd, encoding:'utf8', maxBuffer:8*1024*1024}).split('\0').filter(Boolean);
    return {diffAvailable:true, changedFiles:names};
  } catch { return {diffAvailable:false, changedFiles:[]}; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const changes = readChanges(process.env);
  const plan = {...validationPlan({event:process.env.GITHUB_EVENT_NAME,baseBranch:process.env.GITHUB_BASE_REF,
    ...changes,inventory:testInventory()}), ...changes, commit:process.env.GITHUB_SHA || null};
  fs.mkdirSync(path.join(root,'deploy/evidence'),{recursive:true});
  fs.writeFileSync(path.join(root,'deploy/evidence/ci-plan.json'),JSON.stringify(plan,null,2)+'\n');
  if (process.env.GITHUB_OUTPUT) for (const key of ['scope','lives','runtime','glsl'])
    fs.appendFileSync(process.env.GITHUB_OUTPUT,`${key}=${plan[key]}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `### Validation scope\n\n${plan.scope}: ${plan.tests.length} test files\n\n${plan.reason}\n\nFull integration coverage remains on develop.\n`);
  console.log(JSON.stringify(plan,null,2));
}

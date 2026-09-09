import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {testInventory} from './validation-plan.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const plan = JSON.parse(fs.readFileSync(path.join(root,'deploy/evidence/ci-plan.json'),'utf8'));
const allowed = new Set(testInventory());
if (!Array.isArray(plan.tests) || plan.tests.some(p => !allowed.has(p))) throw Error('Invalid validation plan');
if (!plan.tests.length && plan.scope !== 'documentation') throw Error('Non-document change has no tests');
if (plan.tests.length) {
  const result = spawnSync(process.execPath, ['--test', ...plan.tests], {cwd:root,stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
} else console.log('Documentation-only PR: game regression is not applicable; build/artifact checks still run.');

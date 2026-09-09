import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {root, sha256} from './build.mjs';
import {buildInfo} from './build-info.mjs';
import {environments} from './config.mjs';
import {liveBuild} from '../tools/archive-simulation.mjs';
import {LiveContract} from '../src/live/contract.mjs';
const environment = process.argv[2];
assert(environments[environment], 'Unknown environment');
const out = path.join(root, 'deploy/out', environment);
const html = await fs.readFile(path.join(out, 'index.html'));
const manifest = JSON.parse(await fs.readFile(path.join(out, 'version.json')));
assert.equal(manifest.environment, environment);
assert.equal(manifest.branch, environments[environment].branch);
assert.equal(manifest.htmlSha256, sha256(html));
assert(html.length < 25*1024*1024, 'Cloudflare per-asset size limit');
if (manifest.mode === 'game') {
  assert.deepEqual(html, await fs.readFile(path.join(root, 'dist/index.html')), 'Game bytes changed');
  const text = html.toString();
  const live=JSON.parse(text.match(/const LIVE_BUILD=([^\n]+);/)?.[1] || 'null');
  assert.deepEqual(live,manifest.live,'Client and server compatibility differ');
  assert.deepEqual(live,{...LiveContract,...await liveBuild(root)},'Rules archive and artifact differ');
  const embedded=JSON.parse(text.match(/const BUILD_INFO=Object\.freeze\(([^\n]+)\);/)?.[1] || 'null');
  assert.deepEqual(embedded,buildInfo(manifest.baseVersion,environment,manifest.commit),'Screen and deployment identity differ');
  const scripts = [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert(scripts.length > 0, 'JavaScript missing');
  for (const [, source] of scripts) execFileSync(process.execPath, ['--check','--input-type=commonjs'], {input:source, stdio:['pipe','inherit','inherit']});
  const assets = JSON.parse(text.match(/const VISUAL_ASSETS=(\{[^\n]+\});/)?.[1] || 'null');
  assert(assets, 'Embedded assets missing');
  assert.deepEqual(Object.keys(assets).sort(), ['village-kit.glb','material-atlas.png',
    'detail-atlas.png','parchment.png','cloth-panel.png','golden-surfaces.png','character/young-human-male-cm01.glb'].sort(),
    'Embedded asset contract changed');
  for (const [name, data] of Object.entries(assets)) assert.deepEqual(Buffer.from(data,'base64'), await fs.readFile(path.join(root,'public/assets',name)), name);
  const glb = Buffer.from(assets['village-kit.glb'],'base64');
  assert.equal(glb.readUInt32LE(0),0x46546c67);
  assert.equal(glb.readUInt32LE(4),2);
  assert.equal(glb.readUInt32LE(8),glb.length);
} else {
  assert.equal(manifest.mode,'holding');
  assert(!html.includes(Buffer.from('VISUAL_ASSETS')), 'Development game leaked into holding page');
}
console.log('Deployment build integrity: PASS');

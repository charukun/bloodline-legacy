import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {buildInfo} from './build-info.mjs';
import {environments} from './config.mjs';
import {liveBuild} from '../tools/archive-simulation.mjs';
import {LiveContract} from '../src/live/contract.mjs';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sha256 = data => createHash('sha256').update(data).digest('hex');

export async function build(environment, commit, projectRoot = root) {
  if (!environments[environment]) throw new Error('Unknown environment');
  if (!/^(?:[a-f0-9]{40}|local-recovery)$/.test(commit)) throw new Error('Invalid commit identity');
  const release = JSON.parse(await fs.readFile(path.join(projectRoot, 'deploy/release.json'), 'utf8'));
  if (typeof release.production !== 'boolean') throw new Error('Explicit production release boolean required');
  const info = buildInfo(release.baseVersion, environment, commit);
  const mode = environment === 'production' && !release.production ? 'holding' : 'game';
  const out = path.join(projectRoot, 'deploy/out', environment);
  // This directory is exclusively generated deployment output.
  await fs.rm(out, {recursive:true, force:true});
  await fs.mkdir(out, {recursive:true});
  let html;
  if (mode === 'game') {
    execFileSync(process.execPath, ['build.mjs'], {cwd:projectRoot, stdio:'inherit', env:{...process.env,BLOODLINE_BUILD_ENV:environment,BLOODLINE_BUILD_COMMIT:commit}});
    html = await fs.readFile(path.join(projectRoot, 'dist/index.html'), 'utf8');
    if (!html.includes('id="world"') || !html.includes('VISUAL_ASSETS')) throw new Error('Unexpected game build; re-audit the latest architecture');
  } else {
    html = '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bloodline Legacy</title><body><h1>Bloodline Legacy / 血脈の系譜</h1><p id="release-pending">正式公開の準備中です。</p><p data-build-version>'+info.displayVersion+'</p></body></html>';
  }
  // The root build embeds the same identity; deploy the tested HTML without rewriting it.
  const bytes = Buffer.from(html);
  await fs.writeFile(path.join(out, 'index.html'), bytes);
  const live=mode==='game'?{...LiveContract,...await liveBuild(projectRoot)}:null;
  const version = {application:'Bloodline Legacy', ...info, mode, live, htmlSha256:sha256(bytes), htmlBytes:bytes.length};
  await fs.writeFile(path.join(out, 'version.json'), JSON.stringify(version, null, 2)+'\n');
  const noindex = environment !== 'production' || mode === 'holding';
  await fs.writeFile(path.join(out, '_headers'), '/*\n  Cache-Control: no-cache\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n'+(noindex ? '  X-Robots-Tag: noindex, nofollow\n' : ''));
  await fs.writeFile(path.join(out, 'robots.txt'), noindex ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n');
  console.log(JSON.stringify(version));
  return version;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build(process.argv[2], process.env.GITHUB_SHA || 'local-recovery');
}

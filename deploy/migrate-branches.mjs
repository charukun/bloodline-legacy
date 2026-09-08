// Initial migration only. Requires an authenticated GitHub CLI; never takes a token argument.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {root, sha256} from './build.mjs';
const repo='charukun/bloodline-legacy';
const base='383a1eef7adde83c22073c74982052b3a75a2b5c';
const mode=process.argv[2]||'--audit';
assert(['--audit','--develop','--verify-develop','--staging'].includes(mode),'Use --audit, --develop, --verify-develop, or --staging');
const api=(endpoint,body)=>JSON.parse(execFileSync('gh',['api',`repos/${repo}${endpoint?'/'+endpoint:''}`,...(body?['--method','POST','--input','-']:[])],
  {input:body?JSON.stringify(body):undefined,encoding:'utf8',stdio:['pipe','pipe','inherit']}));
const manifest=JSON.parse(await fs.readFile(path.join(root,'docs/RECOVERY_SOURCE_SHA256.json')));
const audit={repository:repo,mode,baseline:base,completed:false};
const ref=branch=>api(`git/ref/heads/${branch}`).object.sha;
const tree=sha=>{
  const t=api(`git/trees/${api(`git/commits/${sha}`).tree.sha}?recursive=1`);
  assert(!t.truncated,'Git tree is truncated');
  return t.tree.filter(e=>e.type==='blob');
};
const verify=sha=>{
  const entries=tree(sha), names=new Map(entries.map(e=>[e.path,e]));
  for(const [file,expected] of Object.entries(manifest.files)) {
    const entry=names.get(file); assert(entry,`Missing ${file}`);
    const blob=api(`git/blobs/${entry.sha}`);
    assert.equal(blob.encoding,'base64');
    const bytes=Buffer.from(blob.content.replace(/\s/g,''),'base64');
    assert.equal(sha256(bytes),expected.sha256,`Read-back mismatch: ${file}`);
    assert.equal(bytes.length,expected.bytes,`Size mismatch: ${file}`);
  }
  assert(!entries.some(e=>/(^|\/)(node_modules|dist|out|evidence|\.wrangler)(\/|$)/.test(e.path)), 'Generated files found in Git');
  return {commit:sha,verifiedFiles:Object.keys(manifest.files).length,totalFiles:entries.length};
};
await fs.mkdir(path.join(root,'deploy/evidence/migration'),{recursive:true});
try {
  assert.equal(api('').private,true,'Unexpected repository visibility');
  const original=ref('work/current-handoff'); assert.equal(original,base,'Initial handoff advanced: audit new state before continuing');
  const main=ref('main');
  const pr=api('pulls/1');
  assert.equal(pr.state,'open'); assert.equal(pr.merged,false);
  assert.equal(pr.head.ref,'work/current-handoff'); assert.equal(pr.head.sha,base); assert.equal(pr.base.ref,'main');
  audit.mainBefore=main; audit.pr1={state:pr.state,merged:pr.merged,head:pr.head.sha};
  audit.source=verify(base);
  const diff=api(`compare/${main}...${base}`);
  audit.mainComparison={status:diff.status,aheadBy:diff.ahead_by,behindBy:diff.behind_by,changedFiles:diff.files?.map(f=>f.filename)};
  if(mode==='--develop') {
    // Matching-refs exposes absence without treating arbitrary 404s as absence.
    const existing=api('git/matching-refs/heads/develop').find(r=>r.ref==='refs/heads/develop');
    if(existing) assert.equal(existing.object.sha,base,'Existing develop differs; preserve it and inspect manually');
    else api('git/refs',{ref:'refs/heads/develop',sha:base});
    const actual=ref('develop'); assert.equal(actual,base);
    audit.develop=verify(actual);
    audit.sourceOfTruth='develop';
  }
  if(mode==='--staging') {
    const dev=ref('develop');
    audit.develop=verify(dev);
    // Require successful DEV deployment verification for this exact head.
    const runs=api(`actions/workflows/deploy.yml/runs?branch=develop&head_sha=${dev}&event=push&status=success&per_page=20`).workflow_runs;
    assert(runs.length,'No successful deployment workflow at develop HEAD');
    let accepted=null;
    for(const run of runs) {
      const jobs=api(`actions/runs/${run.id}/jobs?per_page=100`).jobs;
      if(jobs.some(j=>j.name==='Deploy and verify dev'&&j.conclusion==='success')) {accepted=run;break;}
    }
    assert(accepted,'DEV deploy+smoke job has not passed for this head');
    const fixed=api('actions/variables/FIXED_URL_DEV').value, u=new URL(fixed);
    assert(u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/'&&u.hostname.startsWith('bloodline-legacy-dev.')&&u.hostname.endsWith('.workers.dev'));
    const v=await fetch(new URL('/version.json',u),{signal:AbortSignal.timeout(15000),cache:'no-store'});
    assert(v.ok); const version=await v.json();
    assert.equal(version.commit,dev); assert.equal(version.environment,'dev'); assert.equal(version.mode,'game');
    const h=await fetch(u,{signal:AbortSignal.timeout(15000),cache:'no-store'});
    assert(h.ok); assert.equal(sha256(Buffer.from(await h.arrayBuffer())),version.htmlSha256);
    assert.equal(ref('develop'),dev,'Develop advanced during verification');
    const existing=api('git/matching-refs/heads/staging').find(r=>r.ref==='refs/heads/staging');
    if(existing) assert.equal(existing.object.sha,dev,'Existing staging differs; use the promotion process');
    else api('git/refs',{ref:'refs/heads/staging',sha:dev});
    assert.equal(ref('staging'),dev); audit.staging=verify(dev);
    audit.devVerificationRun=accepted.html_url;
  }
  if(mode==='--verify-develop') {
    const dev=ref('develop');
    const ancestry=api(`compare/${base}...${dev}`);
    assert(['ahead','identical'].includes(ancestry.status),'Develop must retain the historical handoff ancestry');
    audit.develop=verify(dev);
    assert.equal(ref('develop'),dev,'Develop advanced during read-back');
    audit.sourceOfTruth='develop';
  }
  assert.equal(ref('main'),main,'Main changed during migration; investigate concurrent changes');
  assert.equal(ref('work/current-handoff'),base,'Historical handoff ref changed');
  const after=api('pulls/1'); assert.equal(after.state,'open'); assert.equal(after.merged,false);
  audit.completed=true;
  console.log(JSON.stringify(audit,null,2));
} finally {
  await fs.writeFile(path.join(root,'deploy/evidence/migration',`${mode.slice(2)}.json`),JSON.stringify(audit,null,2)+'\n');
}

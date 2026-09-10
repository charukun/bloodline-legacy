import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GitHub} from './github.mjs';
import {decision, dependencies, REPOSITORY, SHA} from './policy.mjs';

export const marker = batch => `Bloodline-Integration: ${JSON.stringify(batch)}`;
export function readMarker(message) {
  const value=message.match(/^Bloodline-Integration: (\{[^\n]+\})$/m);
  if(!value)return null;
  const b=JSON.parse(value[1]);
  if(!SHA.test(b.base||'') || !Array.isArray(b.prs) || b.prs.length>8 || !b.prs.length || b.prs.some(n=>!Number.isSafeInteger(n)||n<1))throw Error('Invalid integration recovery marker');
  return b;
}
export function order(prs) {
  const byNumber=new Map(prs.map(p=>[p.number,p])), visiting=new Set(), visited=new Set(), cyclic=new Set(), result=[];
  function visit(p, stack=[]) {
    if(visiting.has(p.number)){stack.slice(stack.indexOf(p.number)).forEach(n=>cyclic.add(n));return;}
    if(visited.has(p.number))return;
    visiting.add(p.number);
    let deps=[];try{deps=dependencies(p.body||'');}catch{}
    for(const n of deps)if(byNumber.has(n))visit(byNumber.get(n),[...stack,p.number]);
    visiting.delete(p.number);visited.add(p.number);result.push(p);
  }
  prs.slice().sort((a,b)=>a.number-b.number).forEach(p=>visit(p));
  return {prs:result,cyclic};
}

export async function finalState(api, sha) {
  const dispatches=await api.pages(`actions/workflows/deploy.yml/runs?head_sha=${sha}&event=workflow_dispatch`,'workflow_runs');
  const final=dispatches.filter(r=>r.head_sha===sha && r.display_title===`Integration final ${sha}`).sort((a,b)=>b.id-a.id)[0];
  if(final) {
    if(final.status!=='completed')return {kind:'wait',reason:'Final develop verification running',run:final.html_url};
    const jobs=await api.pages(`actions/runs/${final.id}/jobs?filter=latest`,'jobs');
    if(final.conclusion==='success' && jobs.some(j=>j.name==='Record integrated develop result'&&j.conclusion==='success'))return {kind:'verified',run:final.html_url};
    return {kind:'human',reason:'Final develop verification failed; fix or explicitly rerun the failed workflow',run:final.html_url};
  }
  const commit=await api.repo(`commits/${sha}`), batch=readMarker(commit.commit.message);
  if(batch) {
    const compare=await api.repo(`compare/${batch.base}...${sha}`);
    if(compare.status!=='ahead')throw Error('Recovery baseline is not an ancestor of develop');
    return {kind:'recover',batch,reason:'Merged batch has no final dispatch'};
  }
  const runs=await api.runs(sha,'push');
  for(const [file, names] of Object.entries({
    'deploy.yml':['Build and verify','Deploy and verify dev'],
    'character-visual.yml':['Character build, input and visual evidence'],
    'review-lab.yml':['Build exact Review revision','Publish isolated Review URL'],
  })) {
    const run=runs.find(r=>r.path===`.github/workflows/${file}`);
    if(!run || run.status!=='completed')return {kind:'wait',reason:`Current develop ${file} evidence pending/absent`};
    if(run.conclusion!=='success' || names.some(n=>!run.jobs.some(j=>j.name===n&&j.conclusion==='success')))return {kind:'human',reason:`Current develop ${file} verification not successful`};
  }
  return {kind:'verified',reason:'Current develop full push validation and DEV/Review deployment passed'};
}

async function dispatchFinal(api, sha, batch) {
  if(await api.base()!==sha)throw Error('Develop moved before final dispatch; next invocation must re-evaluate');
  await api.repo('actions/workflows/deploy.yml/dispatches',{method:'POST',body:{ref:'develop',inputs:{integration_sha:sha,integration_base:batch.base,integration_prs:batch.prs.join(',')}}});
}

export async function integrate(api, {apply=false,maxBatch=8}={}) {
  const report={mode:apply?'apply':'audit',repository:REPOSITORY,event:process.env.GITHUB_EVENT_NAME||'local',decisions:[],merged:[],startedAt:new Date().toISOString()};
  const base=await api.base();report.base=base;report.final=base;
  const [repo, protection, open, state]=await Promise.all([api.repo(''),api.protection(),api.pages('pulls?state=open&base=develop'),finalState(api,base)]);
  report.defaultBranch=repo.default_branch;report.protection=protection;report.previousFinal=state;
  const sorted=order(open.filter(p=>!p.draft));
  // Audits always inspect the queue, even if activation/previous verification is blocked.
  if(!apply) {
    for(const p of sorted.prs) {
      try {
        const s=await api.snapshot(p.number,base,protection);s.dependencyCycle=sorted.cyclic.has(p.number);
        report.decisions.push({pr:p.number,head:s.pr.head.sha,...decision(s),checks:s.checks,runs:s.runs});
      }catch(e){report.decisions.push({pr:p.number,kind:'human',reason:`UNKNOWN: ${e.message}`});}
    }
    return report;
  }
  if(state.kind==='recover') {
    await dispatchFinal(api,base,state.batch);report.recovered=true;return report;
  }
  if(state.kind!=='verified'){report.blocked=state.reason;return report;}
  if(!protection.known){report.blocked='Branch protection UNKNOWN; no merge';return report;}
  if(!repo.allow_merge_commit){report.blocked='Merge commits required for durable batch recovery';return report;}
  let current=base;
  try {
    for(const p of sorted.prs) {
      if(report.merged.length>=Math.min(8,maxBatch))break;
      if(await api.base()!==current)throw Error('Develop changed outside this integration batch');
      const freshProtection=await api.protection();
      const s=await api.snapshot(p.number,current,freshProtection);s.dependencyCycle=sorted.cyclic.has(p.number);
      const d=decision(s);report.decisions.push({pr:p.number,base:current,head:s.pr.head.sha,...d,checks:s.checks,runs:s.runs});
      if(d.kind!=='merge')continue;
      const rechecked=await api.checks(s.pr.head.sha,freshProtection);
      if(!rechecked.evidence.ok)throw Error(`Checks changed before merge: ${rechecked.evidence.reason}`);
      // Snapshot may take time; metadata, head, base and hold labels must still match.
      const fresh=await api.repo(`pulls/${p.number}`);
      if(await api.base()!==current || fresh.head.sha!==s.pr.head.sha || fresh.updated_at!==s.pr.updated_at || fresh.draft || fresh.state!=='open' || fresh.base.ref!=='develop' || fresh.mergeable!==true || fresh.mergeable_state!=='clean')throw Error('PR or develop changed after review; re-evaluate on next event');
      const batch={base,prs:[...report.merged.map(m=>m.pr),p.number]};
      // The REST merge endpoint enforces protection and expected head. No ref push/bypass.
      const merged=await api.repo(`pulls/${p.number}/merge`,{method:'PUT',body:{sha:fresh.head.sha,merge_method:'merge',commit_title:`Merge pull request #${p.number}`,commit_message:marker(batch)}});
      if(!merged.merged || !SHA.test(merged.sha||''))throw Error('GitHub did not confirm the merge');
      report.merged.push({pr:p.number,head:fresh.head.sha,base:current,sha:merged.sha});
      const commit=await api.repo(`commits/${merged.sha}`);
      const expectedParent=current;current=merged.sha;report.final=current;
      if(commit.parents[0]?.sha!==expectedParent || commit.parents[1]?.sha!==fresh.head.sha)throw Error('Concurrent base change detected in merge parents; stop batch and validate');
      if(d.barrier)break;
    }
  } catch(e) {report.error=e.message;}
  // A crash before this block is recovered from the last merge commit's marker.
  if(report.merged.length) {
    try {await dispatchFinal(api,current,{base,prs:report.merged.map(m=>m.pr)});report.dispatched=true;}
    catch(e){report.error=`${report.error||''} Final dispatch unconfirmed: ${e.message}`.trim();}
  }
  return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.env.GITHUB_REPOSITORY!==REPOSITORY)throw Error('Repository identity mismatch');
  if(!process.env.GH_TOKEN)throw Error('GitHub token unavailable');
  const apply=process.argv.includes('--apply');
  if(apply && (process.env.INTEGRATION_PAUSED==='true' || !['pull_request_target','workflow_run','schedule','workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME)))throw Error('Integration mutation is not enabled for this event');
  const result=await integrate(new GitHub(process.env.GH_TOKEN),{apply});
  fs.mkdirSync('deploy/evidence',{recursive:true});
  fs.writeFileSync('deploy/evidence/integration.json',JSON.stringify(result,null,2)+'\n');
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Automated integration (${result.mode})\n\nBase: ${result.base}\n\nFinal: ${result.final}\n\nMerged: ${result.merged.map(p=>'#'+p.pr).join(', ')||'none'}\n\n${result.blocked||result.error||''}\n\n| PR | Decision | Reason |\n| --- | --- | --- |\n`+result.decisions.map(d=>`| #${d.pr} | ${d.kind} | ${d.reason.replace(/[|\r\n]/g,' ')} |`).join('\n')+'\n\nFull evidence: integration.json artifact.\n');
  console.log(JSON.stringify(result,null,2));
  if(result.error || (apply && (result.previousFinal.kind==='human' || !result.protection.known || result.decisions.some(d=>d.kind==='human'))))process.exitCode=1;
}

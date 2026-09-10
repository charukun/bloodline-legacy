import test from 'node:test';
import assert from 'node:assert/strict';
import {decision,dependencies,checkEvidence,impact,overlap,REPOSITORY,requiredJobs} from '../tools/integration/policy.mjs';
import {integrate,marker,readMarker,order,finalState} from '../tools/integration/controller.mjs';
import {GitHub} from '../tools/integration/github.mjs';
import {assertIntegrationDeployment} from '../deploy/config.mjs';

const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40),H='d'.repeat(40);
const pr=(n=1)=>({number:n,state:'open',draft:false,base:{ref:'develop'},head:{sha:H,repo:{full_name:REPOSITORY}},user:{login:'author'},labels:[],body:'Depends-On: none',mergeable:true,mergeable_state:'clean',updated_at:'now'});
const snapshot=(n=1)=>({pr:pr(n),base:A,protection:{known:true},authorPermission:'write',reviewDecision:null,mergeStateStatus:'CLEAN',files:[{filename:`docs/item-${n}.md`}],filesComplete:true,divergence:[],divergenceComplete:true,dependencies:{},checks:{ok:true}});
const green=()=>Object.entries(requiredJobs).map(([name,jobs])=>({path:`.github/workflows/${name}`,status:'completed',conclusion:'success',jobs:jobs.map(name=>({name,conclusion:'success'}))}));
test('only trusted Ready develop PRs with fully known evidence are eligible',()=>{
  assert.equal(decision(snapshot()).kind,'merge');
  for(const mutate of [s=>s.pr.draft=true,s=>s.pr.base.ref='main',s=>s.pr.base.ref='staging',s=>s.pr.state='closed',s=>s.pr.head.repo.full_name='fork/repo',s=>s.authorPermission='read',s=>s.protection.known=false,s=>s.filesComplete=false,s=>s.divergenceComplete=false,s=>s.unresolvedThreads=true,s=>s.reviewDecision='CHANGES_REQUESTED',s=>s.pr.mergeable=null,s=>s.pr.mergeable=false,s=>s.pr.mergeable_state='unstable',s=>s.pr.mergeable_state='behind',s=>s.mergeStateStatus='BLOCKED',s=>s.pr.labels=[{name:'integration:hold'}]]) {
    const s=snapshot();mutate(s);assert.notEqual(decision(s).kind,'merge');
  }
});
test('CI/policy control changes and concurrent shared impact require base/head-bound review',()=>{
  for(const filename of ['.github/workflows/deploy.yml','tools/integration/controller.mjs','deploy/config.mjs','docs/COMMON_DEVELOPMENT_POLICY.md']) {
    const s=snapshot();s.files=[{filename}];assert.equal(decision(s).kind,'human');s.boundApproval=true;assert.equal(decision(s).kind,'merge');assert(decision(s).barrier);
  }
  const s=snapshot();s.files=[{filename:'src/character/runtime.js'}];s.divergence=[{filename:'src/skills/combat.js'}];assert.equal(decision(s).kind,'human');
  s.divergence=[];assert.equal(decision(s).kind,'merge');assert(decision(s).barrier);
  const renamed=impact([{filename:'docs/safe.md',previous_filename:'src/live/save.js'}]);assert(renamed.domains.includes('save/network'));
  assert(overlap(impact([{filename:'docs/a.md'}]),impact([{filename:'docs/a.md'}])).length);
});
test('dependencies support topology and reject cycles, ambiguous instructions and closed/unmerged PRs',()=>{
  assert.deepEqual(dependencies('Depends-On: #3, #2, #3'),[3,2]);
  assert.deepEqual(dependencies('他PRへの依存なし。'),[]);
  for(const body of ['Depends-On: #1\nDepends-On: #2','Depends-On: https://example.org/1','Depends on #2','依存関係: #2'])assert.throws(()=>dependencies(body));
  const s=snapshot();s.pr.body='Depends-On: #2';s.dependencies[2]={...pr(2),state:'closed',merged:false};assert.equal(decision(s).kind,'human');
  s.dependencies[2]={...pr(2),merged:true,inDevelop:false};assert.equal(decision(s).kind,'wait');s.dependencies[2].inDevelop=true;assert.equal(decision(s).kind,'merge');
  assert.deepEqual(order([{...pr(1),body:'Depends-On: #2'},pr(2)]).prs.map(p=>p.number),[2,1]);
  assert.deepEqual([...order([{...pr(1),body:'Depends-On: #2'},{...pr(2),body:'Depends-On: #1'}]).cyclic].sort(),[1,2]);
});
test('missing, pending, cancelled, skipped and failed current-head checks cannot become green',()=>{
  assert(checkEvidence(green()).ok);
  assert(!checkEvidence([]).ok);
  for(const conclusion of ['failure','cancelled','skipped','neutral','timed_out']) {const r=green();r[0].conclusion=conclusion;assert(!checkEvidence(r).ok);}
  const pending=green();pending[1].status='in_progress';assert(!checkEvidence(pending).ok);
  const skipped=green();skipped[1].jobs[0].conclusion='skipped';assert(!checkEvidence(skipped).ok);
  assert(!checkEvidence(green(),[],['Unknown required check']).ok);
  assert(!checkEvidence(green(),[{context:'external',state:'pending'}]).ok);
  assert(!checkEvidence([...green(),{path:'.github/workflows/extra.yml',status:'completed',conclusion:'failure',jobs:[]}]).ok);
});

class Fixture {
  constructor({count=2}={}) {this.current=A;this.open=Array.from({length:count},(_,i)=>pr(i+1));this.merges=[];this.dispatches=[];this.commits={};this.snapshots=[];this.dispatchRuns=[];this.failDispatch=false;this.state='verified';}
  async base(){return this.current;}
  async protection(){return {known:true};}
  async checks(){return {evidence:{ok:true}};}
  async pages(endpoint){
    if(endpoint.startsWith('pulls?'))return this.open;
    if(endpoint.includes('actions/workflows/deploy.yml/runs'))return this.dispatchRuns;
    if(endpoint.includes('/jobs?'))return [{name:'Record integrated develop result',conclusion:'success'}];
    throw Error(endpoint);
  }
  async runs(){return green().map(r=>({...r,jobs:[...r.jobs,...(r.path.endsWith('/deploy.yml')?[{name:'Deploy and verify dev',conclusion:'success'}]:[])]}));}
  async snapshot(n,base,protection){const s={...snapshot(n),base,protection};this.snapshots.push(s);if(this.mutateSnapshot)this.mutateSnapshot(s);return s;}
  async repo(endpoint,options){
    if(endpoint==='')return {default_branch:'main',allow_merge_commit:true};
    if(endpoint===`commits/${A}`)return {commit:{message:'prior verified baseline'},parents:[]};
    if(endpoint.startsWith('commits/'))return this.commits[endpoint.slice(8)];
    if(endpoint.startsWith('compare/'))return {status:'ahead'};
    if(/^pulls\/\d+$/.test(endpoint))return this.open.find(p=>p.number===Number(endpoint.split('/')[1]));
    if(endpoint.endsWith('/merge')) {
      assert.equal(options.method,'PUT');assert.equal(options.body.sha,H);assert.equal(options.body.merge_method,'merge');
      const n=Number(endpoint.split('/')[1]), next=this.merges.length?C:B;
      this.commits[next]={commit:{message:options.body.commit_message},parents:[{sha:this.current},{sha:H}]};
      this.current=next;this.merges.push(n);return {merged:true,sha:next};
    }
    if(endpoint.endsWith('/dispatches')) {
      this.dispatches.push(options.body);if(this.failDispatch)throw Error('dispatch timed out');return null;
    }
    throw Error(endpoint);
  }
}
test('real controller merges a bounded batch and dispatches exactly one final SHA/base pair',async()=>{
  const api=new Fixture();const r=await integrate(api,{apply:true});
  assert.deepEqual(api.merges,[1,2]);assert.deepEqual(api.snapshots.map(s=>s.base),[A,B]);assert.equal(r.final,C);
  assert.deepEqual(api.dispatches,[{ref:'develop',inputs:{integration_sha:C,integration_base:A,integration_prs:'1,2'}}]);
  assert.deepEqual(readMarker(api.commits[C].commit.message),{base:A,prs:[1,2]});
});
test('audit performs no merge or dispatch even when a ready PR exists',async()=>{
  const api=new Fixture();const r=await integrate(api);assert.equal(r.decisions[0].kind,'merge');assert.deepEqual(api.merges,[]);assert.deepEqual(api.dispatches,[]);
});
test('high-risk boundary ends a batch and final failure/pending prevents further merges',async()=>{
  const api=new Fixture();api.mutateSnapshot=s=>s.files=[{filename:'src/character/runtime.js'}];
  await integrate(api,{apply:true});assert.deepEqual(api.merges,[1]);
  for(const status of ['in_progress','completed']) {
    const a=new Fixture();a.dispatchRuns=[{id:1,head_sha:A,display_title:`Integration final ${A}`,status,conclusion:'failure'}];
    const r=await integrate(a,{apply:true});assert(r.blocked);assert.deepEqual(a.merges,[]);
  }
});
test('crash after merges but before dispatch is recovered without re-merging',async()=>{
  const api=new Fixture();api.failDispatch=true;const first=await integrate(api,{apply:true});assert(first.error);assert.equal(api.current,C);
  api.failDispatch=false;const r=await integrate(api,{apply:true});assert(r.recovered);assert.deepEqual(api.merges,[1,2]);assert.equal(api.dispatches.at(-1).inputs.integration_base,A);
});
test('duplicate wakeups wait on the same dispatched final workflow',async()=>{
  const api=new Fixture();await integrate(api,{apply:true});
  api.dispatchRuns=[{id:7,head_sha:C,display_title:`Integration final ${C}`,status:'queued'}];
  const r=await integrate(api,{apply:true});assert(r.blocked);assert.equal(api.dispatches.length,1);assert.equal(api.merges.length,2);
});
test('PR metadata/head changes and external develop movement abort before mutation',async()=>{
  const api=new Fixture();api.open[0].head={...api.open[0].head,sha:C};
  const r=await integrate(api,{apply:true});assert(r.error);assert.equal(api.merges.length,0);
  const other=new Fixture();other.mutateSnapshot=()=>{other.current=C;};const moved=await integrate(other,{apply:true});assert(moved.error);assert.equal(other.merges.length,0);
});
test('unknown protection and missing final success never authorize a write',async()=>{
  const api=new Fixture();api.protection=async()=>({known:false});const r=await integrate(api,{apply:true});assert(r.blocked);assert.equal(api.merges.length,0);
  const a=new Fixture();a.dispatchRuns=[{id:1,head_sha:A,display_title:`Integration final ${A}`,status:'completed',conclusion:'success'}];a.pages=async(endpoint)=>endpoint.includes('/jobs?')?[]:a.dispatchRuns;
  assert.equal((await finalState(a,A)).kind,'human');
});
test('GitHub transport sends expected head and propagates protection denial without retries',async()=>{
  const calls=[];const api=new GitHub('test-token',async(url,opts)=>{calls.push({url,opts});return new Response('{}',{status:403});});
  await assert.rejects(api.repo('pulls/1/merge',{method:'PUT',body:{sha:H,merge_method:'merge'}}),/403/);
  assert.equal(calls.length,1);assert.equal(JSON.parse(calls[0].opts.body).sha,H);
  const metadata=new GitHub('test-token',async(url)=>{assert.equal(url,`https://api.github.com/repos/${REPOSITORY}`);return Response.json({default_branch:'main'});});
  assert.equal((await metadata.repo('')).default_branch,'main');
});
test('reader exhausts pages, keeps latest same-head workflow attempt and discards other provenance',async()=>{
  const api=new GitHub('test');let pages=0;
  api.repo=async()=>{pages++;return pages===1?Array.from({length:100},(_,i)=>i):[100];};assert.equal((await api.pages('pulls')).length,101);
  api.pages=async(endpoint)=>endpoint.includes('/jobs?')?[]:[{id:1,path:'x',head_sha:H,event:'pull_request',head_repository:{full_name:REPOSITORY}},{id:2,path:'x',head_sha:H,event:'pull_request',head_repository:{full_name:REPOSITORY}},{id:3,path:'y',head_sha:A,event:'pull_request',head_repository:{full_name:REPOSITORY}},{id:4,path:'z',head_sha:H,event:'push',head_repository:{full_name:REPOSITORY}}];
  assert.deepEqual((await api.runs(H)).map(r=>r.id),[2]);
});
test('non-admin protection reader combines enforced classic rules and rulesets, and fails closed on missing evidence',async()=>{
  const api=new GitHub('test');api.graph=async(query)=>{assert(query.includes('refUpdateRule'));assert(!query.includes('branchProtectionRule'));return {repository:{ref:{refUpdateRule:{requiredStatusCheckContexts:['Build and verify']}}}};};
  api.repo=async()=>[{type:'required_status_checks',parameters:{required_status_checks:[{context:'External gate'}]}}];
  const p=await api.protection();assert(p.known);assert.deepEqual(p.requiredContexts,['Build and verify','External gate']);
  api.graph=async()=>({repository:{ref:{refUpdateRule:null}}});assert.equal((await api.protection()).known,false);
  api.graph=async()=>{throw Error('Denied');};assert.equal((await api.protection()).known,false);
});
test('explicit integration deployment cannot target staging/main, stale SHA or non-dispatch event',()=>{
  assert.doesNotThrow(()=>assertIntegrationDeployment('dev','develop','workflow_dispatch',A,A));
  for(const args of [['staging','staging','workflow_dispatch',A,A],['production','main','workflow_dispatch',A,A],['dev','develop','pull_request',A,A],['dev','develop','workflow_dispatch',A,B],['dev','develop','workflow_dispatch','',A]])assert.throws(()=>assertIntegrationDeployment(...args));
  assert.throws(()=>readMarker(marker({base:'main',prs:[1]})));assert.throws(()=>readMarker(marker({base:A,prs:['1; rm']})));
});

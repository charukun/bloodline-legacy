import {REPOSITORY, checkEvidence, dependencies, SHA} from './policy.mjs';

export class GitHub {
  constructor(token, request = fetch) { this.token=token; this.request=request; }
  async api(endpoint, {method='GET',body} = {}) {
    if (!endpoint.startsWith('/') || endpoint.startsWith('//')) throw Error('Invalid API endpoint');
    const r = await this.request(`https://api.github.com${endpoint}`, {method,headers:{Authorization:`Bearer ${this.token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
    if (!r.ok) { const e=Error(`GitHub ${method} ${endpoint}: ${r.status}`);e.status=r.status;throw e; }
    return r.status === 204 ? null : r.json();
  }
  repo(endpoint, options) { return this.api(`/repos/${REPOSITORY}${endpoint?'/'+endpoint:''}`,options); }
  async pages(endpoint, key) {
    const all=[];
    for(let page=1;page<=50;page++) {
      const data=await this.repo(`${endpoint}${endpoint.includes('?')?'&':'?'}per_page=100&page=${page}`);
      const items=key?data[key]:data;
      if(!Array.isArray(items))throw Error('Unexpected paginated response');
      all.push(...items);if(items.length<100)return all;
    }
    throw Error('Pagination incomplete');
  }
  async graph(query, variables) {
    const r=await this.api('/graphql',{method:'POST',body:{query,variables}});
    if(r.errors?.length)throw Error(`GraphQL evidence unavailable: ${r.errors.map(e=>e.message).join('; ')}`);return r.data;
  }
  async base() { return (await this.repo('git/ref/heads/develop')).object.sha; }
  async permission(login) { return (await this.repo(`collaborators/${encodeURIComponent(login)}/permission`)).permission; }
  async protection() {
    try {
      // RefUpdateRule is GitHub's non-admin view of protection enforced on this token.
      // BranchProtectionRule is administration-only and makes GITHUB_TOKEN fail closed forever.
      const data=await this.graph(`query { repository(owner:"charukun",name:"bloodline-legacy") { ref(qualifiedName:"refs/heads/develop") { refUpdateRule { pattern requiredStatusCheckContexts requiredApprovingReviewCount requiresCodeOwnerReviews requiresConversationResolution requiresLinearHistory allowsForcePushes allowsDeletions } } } }`);
      // REST exposes active ruleset rules without requiring administration access.
      const rules=await this.repo('rules/branches/develop');
      const branch=data.repository?.ref?.refUpdateRule;
      if(!branch || !Array.isArray(rules))return {known:false};
      const requiredContexts=[...(branch.requiredStatusCheckContexts||[]),...rules.filter(r=>r.type==='required_status_checks').flatMap(r=>r.parameters.required_status_checks.map(c=>c.context))];
      return {known:true,source:'viewer-enforced RefUpdateRule and active rulesets',administrativeDetails:'UNKNOWN (not used to waive protection)',branch,rules,requiredContexts:[...new Set(requiredContexts)]};
    } catch(e) { return {known:false,error:e.message}; }
  }
  async runs(head, event='pull_request') {
    const raw=await this.pages(`actions/runs?head_sha=${head}&event=${event}`,'workflow_runs');
    const byPath=new Map();
    for(const r of raw.sort((a,b)=>b.id-a.id || b.run_attempt-a.run_attempt)) {
      if(r.head_sha!==head || r.event!==event || r.head_repository?.full_name!==REPOSITORY)continue;
      if(!byPath.has(r.path))byPath.set(r.path,r);
    }
    return Promise.all([...byPath.values()].map(async r=>({...r,
      selfAudit:r.path==='.github/workflows/integration-check.yml' && process.env.GITHUB_EVENT_NAME==='pull_request' && r.id===Number(process.env.GITHUB_RUN_ID),
      jobs:await this.pages(`actions/runs/${r.id}/jobs?filter=latest`,'jobs')})));
  }
  async checks(head, protection) {
    const [runs,allStatuses,checks]=await Promise.all([this.runs(head),this.pages(`commits/${head}/statuses`),this.pages(`commits/${head}/check-runs?filter=latest`,'check_runs')]);
    const latest=new Map();
    for(const s of allStatuses.sort((a,b)=>b.id-a.id))if(!latest.has(s.context))latest.set(s.context,s);
    const evidence=checkEvidence(runs,[...latest.values()],protection.requiredContexts||[]);
    const auditIds=new Set(runs.filter(r=>r.selfAudit).flatMap(r=>r.jobs.map(j=>Number(j.check_run_url?.split('/').pop()))));
    for(const c of checks) {
      if(auditIds.has(c.id))continue;
      if(c.head_sha!==head)return {runs,evidence:{ok:false,reason:'Check revision mismatch'}};
      if(c.status!=='completed')return {runs,evidence:{ok:false,reason:`Pending check ${c.name}`}};
      if(!['success','neutral','skipped'].includes(c.conclusion))return {runs,evidence:{ok:false,failed:true,reason:`Check ${c.name}: ${c.conclusion}`}};
    }
    return {runs,evidence};
  }
  async snapshot(number, base, protection) {
    const pr=await this.repo(`pulls/${number}`);
    const [files, checked, authorPermission, graph, reviews] = await Promise.all([
      this.pages(`pulls/${number}/files`),this.checks(pr.head.sha,protection),this.permission(pr.user.login),
      this.graph(`query($n:Int!) { repository(owner:"charukun",name:"bloodline-legacy") { pullRequest(number:$n) { mergeStateStatus reviewDecision reviewThreads(first:100) { pageInfo { hasNextPage } nodes { isResolved } } } } }`,{n:number}),
      this.pages(`pulls/${number}/reviews`),
    ]);
    const effective=graph.repository.pullRequest;
    const headBase=await this.repo(`compare/${base}...${pr.head.sha}`);
    const divergence=await this.repo(`compare/${headBase.merge_base_commit.sha}...${base}`);
    const dependencyData={};
    let declared=[];try{declared=dependencies(pr.body||'');}catch{}
    for(const n of declared) {
      const dep=await this.repo(`pulls/${n}`);
      dep.inDevelop=false;
      if(dep.merged && SHA.test(dep.merge_commit_sha||'')) {
        const c=await this.repo(`compare/${dep.merge_commit_sha}...${base}`);
        dep.inDevelop=['ahead','identical'].includes(c.status);
      }
      dependencyData[n]=dep;
    }
    const comments=await this.pages(`issues/${number}/comments`);
    const approval=`Integration-Approved: ${pr.head.sha} ${base}`;
    let boundApproval=false;
    for(const c of comments.filter(c=>c.user.type!=='Bot' && c.body.split(/\r?\n/).includes(approval))) {
      if(['admin','maintain','write'].includes(await this.permission(c.user.login)))boundApproval=true;
    }
    const decisive=new Map();
    for(const r of reviews.sort((a,b)=>a.id-b.id))if(['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(r.state))decisive.set(r.user.login,r.state);
    const changesRequested=[...decisive.values()].includes('CHANGES_REQUESTED');
    return {pr,base,protection,authorPermission,files,filesComplete:files.length===pr.changed_files,
      divergence:divergence.files||[],divergenceComplete:Array.isArray(divergence.files)&&divergence.files.length<300,
      mergeStateStatus:effective.mergeStateStatus,reviewDecision:changesRequested?'CHANGES_REQUESTED':effective.reviewDecision,
      unresolvedThreads:effective.reviewThreads.pageInfo.hasNextPage || effective.reviewThreads.nodes.some(t=>!t.isResolved),
      dependencies:dependencyData,boundApproval,runs:checked.runs.map(r=>({id:r.id,path:r.path,head:r.head_sha,conclusion:r.conclusion})),
      checks:checked.evidence};
  }
}

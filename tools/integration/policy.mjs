// Pure decisions. GitHub data is input, never executable instructions.
export const REPOSITORY = 'charukun/bloodline-legacy';
export const SHA = /^[a-f0-9]{40}$/;
export const workflows = ['deploy.yml', 'character-visual.yml', 'review-lab.yml'];
export const requiredJobs = {
  'deploy.yml': ['Build and verify'],
  'character-visual.yml': ['Character build, input and visual evidence'],
  'review-lab.yml': ['Build exact Review revision', 'Publish isolated Review URL'],
};
export function dependencies(body = '') {
  const lines = [...body.matchAll(/^Depends-On:\s*(.*?)\s*$/gmi)];
  if (lines.length > 1) throw Error('Multiple Depends-On declarations');
  if (!lines.length) {
    const text = body.replace(/他PRへの依存なし|依存関係なし|no (?:PR )?dependencies/gi, '');
    if (/depends[ -]on|blocked[ -]by|依存(?:先|関係|あり)|前提PR/i.test(text)) throw Error('Ambiguous dependency declaration; use Depends-On: #123 or none');
    return [];
  }
  const value = lines[0][1];
  if (/^none$/i.test(value)) return [];
  if (!/^#[1-9]\d*(?:\s*,\s*#[1-9]\d*)*$/.test(value)) throw Error('Invalid Depends-On declaration');
  return [...new Set(value.match(/\d+/g).map(Number))];
}
export function paths(files) {
  return [...new Set(files.flatMap(f => [f.filename, f.previous_filename].filter(Boolean)))];
}
export function impact(files) {
  const names = paths(files);
  const domains = new Set();
  for (const p of names) {
    if (/^(\.github\/|tools\/ci\/|tools\/integration\/|deploy\/|package(?:-lock)?\.json$|build\.mjs$|AGENTS\.md$|WORK_INSTRUCTIONS\.md$|docs\/COMMON_DEVELOPMENT_POLICY)/.test(p)) domains.add('control');
    if (/^src\/(live|server)\/|save|storage|migration/i.test(p) && !p.startsWith('docs/')) domains.add('save/network');
    if (/^src\/legacy\/(core|game)\.js$|state|input|registry/.test(p) && !p.startsWith('docs/')) domains.add('state/input/registry');
    if (/^src\/(skills|character)\/|combat|animation|motion/.test(p) && !p.startsWith('docs/')) domains.add('combat/animation');
    if (/^src\/(render|legacy\/art)|shader|renderer/.test(p) && !p.startsWith('docs/')) domains.add('rendering');
  }
  return {paths:names, domains:[...domains].sort(), barrier:domains.size > 0};
}
export function overlap(a, b) {
  return [...a.paths.filter(p => b.paths.includes(p)), ...a.domains.filter(d => b.domains.includes(d)).map(d => `domain:${d}`)];
}
export function decision(s) {
  const stop = (kind, reason) => ({kind, reason});
  const p = s.pr;
  if (p.state !== 'open' || p.draft || p.base.ref !== 'develop') return stop('ignore', 'Not a Ready develop PR');
  if (p.head.repo?.full_name !== REPOSITORY || !['admin','maintain','write'].includes(s.authorPermission)) return stop('human', 'Untrusted source or author');
  if (!SHA.test(p.head.sha) || !SHA.test(s.base)) return stop('human', 'Unknown revision identity');
  if (p.labels.some(l => ['integration:hold','do-not-merge'].includes(l.name))) return stop('human', 'Explicit integration hold');
  if (!s.protection.known) return stop('human', 'Branch protection UNKNOWN; no merge');
  if (s.protection.branch?.requiresLinearHistory || s.protection.rules?.some(r=>r.type==='required_linear_history')) return stop('human', 'Merge commits prohibited by branch protection');
  if (s.reviewDecision === 'CHANGES_REQUESTED') return stop('human', 'Changes requested');
  if (p.mergeable === false || p.mergeable_state === 'dirty') return stop('human', 'Merge conflict');
  if (p.mergeable !== true || ['unknown','behind','blocked','unstable'].includes(p.mergeable_state)) return stop('wait', `GitHub mergeability: ${p.mergeable_state}`);
  if (p.mergeable_state !== 'clean' || s.mergeStateStatus !== 'CLEAN') return stop('wait', 'Effective merge state is not CLEAN');
  if (s.unresolvedThreads) return stop('human', 'Unresolved review threads');
  let deps;
  try { deps = dependencies(p.body || ''); } catch (e) { return stop('human', e.message); }
  for (const n of deps) {
    const dep = s.dependencies[n];
    if (n === p.number || !dep || (dep.state === 'closed' && !dep.merged) || dep.base.ref !== 'develop') return stop('human', `Invalid/closed-unmerged dependency #${n}`);
    if (!dep.merged || !dep.inDevelop) return stop('wait', `Dependency #${n} has not reached develop`);
  }
  if (s.dependencyCycle) return stop('human', 'Dependency cycle');
  if (!s.filesComplete || !s.divergenceComplete) return stop('human', 'Incomplete changed-file evidence');
  const own = impact(s.files), intervening = impact(s.divergence);
  const collisions = overlap(own, intervening);
  if ((own.domains.includes('control') || collisions.length) && !s.boundApproval) return stop('human', own.domains.includes('control') ? 'Automation/CI/policy change requires approval bound to current head and develop' : `Shared impact since branch point: ${collisions.join(', ')}`);
  if (!s.checks.ok) return stop(s.checks.failed ? 'human' : 'wait', s.checks.reason);
  return {kind:'merge', reason:'Ready, protected, current-head checks passed; dependency and impact evidence complete', barrier:own.barrier, impact:own};
}
export function checkEvidence(runs, statuses = [], requiredContexts = []) {
  // Workflow IDs/paths and exact-head run provenance are selected by the reader.
  for (const name of workflows) {
    const run = runs.find(r => r.path === `.github/workflows/${name}`);
    if (!run) return {ok:false,reason:`Missing current-head ${name}`};
    if (run.status !== 'completed') return {ok:false,reason:`Pending ${name}`};
    if (run.conclusion !== 'success') return {ok:false,failed:true,reason:`${name}: ${run.conclusion}`};
    for (const job of requiredJobs[name]) if (!run.jobs.some(j => j.name === job && j.conclusion === 'success')) return {ok:false,failed:true,reason:`Missing successful job ${job}`};
  }
  for (const run of runs) {
    if (run.path === '.github/workflows/integration-check.yml') continue; // This read-only audit cannot wait for itself.
    if (run.status !== 'completed') return {ok:false,reason:`Pending ${run.path}`};
    if (run.conclusion !== 'success') return {ok:false,failed:true,reason:`${run.path}: ${run.conclusion}`};
  }
  for (const s of statuses) if (s.state !== 'success') return {ok:false,failed:['error','failure'].includes(s.state),reason:`Status ${s.context}: ${s.state}`};
  for (const context of requiredContexts) {
    if (!statuses.some(s => s.context === context && s.state === 'success') && !runs.some(r => r.jobs.some(j => j.name === context && j.conclusion === 'success'))) return {ok:false,reason:`Required check absent or not successful: ${context}`};
  }
  return {ok:true,reason:'Current-head workflow and status evidence passed'};
}

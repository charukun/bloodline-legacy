export const environments = Object.freeze({
  dev: {branch: 'develop', worker: 'bloodline-legacy-dev', github: 'development'},
  staging: {branch: 'staging', worker: 'bloodline-legacy-staging', github: 'staging'},
  production: {branch: 'main', worker: 'bloodline-legacy-production', github: 'production'},
});
export function environmentForBranch(branch) {
  return Object.keys(environments).find(e => environments[e].branch === branch) ?? null;
}
export function assertDeployment(environment, branch, event) {
  if (event !== 'push' || environmentForBranch(branch) !== environment) {
    throw new Error('Deployment requires a push to the mapped environment branch');
  }
}

// A narrowly scoped explicit dispatch replaces the push suppressed by GITHUB_TOKEN.
export function assertIntegrationDeployment(environment, branch, event, expected, actual) {
  if (environment !== 'dev' || branch !== 'develop' || event !== 'workflow_dispatch' || !/^[a-f0-9]{40}$/.test(expected || '') || expected !== actual) {
    throw new Error('Integration deployment requires exact final develop SHA');
  }
}

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

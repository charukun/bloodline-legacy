import {environments} from './config.mjs';

// Release numbering is explicit; deployments never increment SemVer.
export function buildInfo(baseVersion, environment, commit) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(baseVersion)) throw Error('Invalid release baseVersion');
  if (environment !== 'local' && !Object.hasOwn(environments, environment)) throw Error('Unknown build environment');
  if (!/^(?:[a-f0-9]{40}|local-recovery)$/.test(commit)) throw Error('Invalid build commit');
  const shortCommit = commit === 'local-recovery' ? 'unbuilt' : commit.slice(0,7);
  const suffix = {dev:'-dev',staging:'-rc',production:'',local:'-local'}[environment];
  return {baseVersion, environment, branch:environments[environment]?.branch ?? null,
    commit, shortCommit, displayVersion:`v${baseVersion}${suffix} · ${shortCommit}`};
}

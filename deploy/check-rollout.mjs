import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function assertSafeRollout(next,previous){
  if(next.environment!==previous.environment)throw Error('Cross-environment rollout rejected');
  if(!previous.live)return; // First deployment of the compatibility foundation.
  if(!next.live||next.mode!=='game')throw Error('Active online worlds cannot be replaced by a holding/legacy client');
  for(const field of ['protocol','snapshot','session'])if(next.live[field]!==previous.live[field])
    throw Error(`A ${field} change needs a retained transport adapter and an expand/contract release; direct cutover rejected`);
  if(next.live.minSave>previous.live.save||next.live.save<previous.live.save)
    throw Error('The candidate cannot read every save written by the deployed release');
  for(const rules of previous.live.supportedRules||[])if(!next.live.supportedRules.includes(rules))
    throw Error('The candidate drops a retained world runtime; destructive rollback rejected');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const target=process.argv[2],next=JSON.parse(await fs.readFile(new URL(`./out/${target}/version.json`,import.meta.url)));
  const url=new URL('/version.json',process.env.FIXED_URL);url.searchParams.set('rollout',next.commit);
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Cannot verify the currently deployed release; deployment held');
  assertSafeRollout(next,await response.json());console.log('Rollout compatibility: PASS');
}

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readChanges, testInventory, validationPlan} from './validation-plan.mjs';

export function characterPlan({event, fullReview=false, changedFiles=[], diffAvailable=true}) {
  const common=validationPlan({event:'pull_request',baseBranch:'develop',changedFiles,diffAvailable,inventory:testInventory()});
  const relevant=common.scope==='full'||common.scope.split('+').some(s=>['character','ui','network'].includes(s))||changedFiles.some(p=>/^(tests\/character|tools\/.*character|tools\/ci\/character-)/.test(p));
  const full=fullReview||(event==='push'&&relevant);
  return {browser:full||relevant, full, mode:full?'functional':'gate',
    assets:full||!diffAvailable||changedFiles.some(p=>/^(public\/assets\/character\/|tools\/(generate_character\.py|requirements-character\.txt)|tests\/character_asset_validation\.py|\.github\/workflows\/character-visual\.yml|tools\/ci\/character-plan\.mjs)$/.test(p))||changedFiles.some(p=>p.startsWith('public/assets/character/')),
    reason:full?'Integrated revision or explicit Full Review':relevant?'Head-only functional Character Gate':'No character/browser impact; general CI owns selected tests'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const changes=readChanges(process.env);
  const plan={...characterPlan({event:process.env.GITHUB_EVENT_NAME,fullReview:process.env.CHARACTER_FULL_REVIEW==='true',...changes}),...changes,head:process.env.GITHUB_SHA};
  fs.mkdirSync('verification/current',{recursive:true});
  fs.writeFileSync('verification/current/plan.json',JSON.stringify(plan,null,2)+'\n');
  if(process.env.GITHUB_OUTPUT)for(const key of ['browser','full','mode','assets'])fs.appendFileSync(process.env.GITHUB_OUTPUT,`${key}=${plan[key]}\n`);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Character: ${plan.reason}\n\nHead: ${plan.head}\n\nBrowser: ${plan.browser}; assets: ${plan.assets}; full: ${plan.full}\n`);
  console.log(JSON.stringify(plan,null,2));
}

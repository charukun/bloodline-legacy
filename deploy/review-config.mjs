export function reviewWorkerName({pr,sha,environment}) {
 if(environment==='dev')return 'bloodline-review-dev';
 if(environment!=='preview'||!Number.isSafeInteger(pr)||pr<1||!/^[a-f0-9]{40}$/.test(sha))throw Error('Invalid review identity');
 return `bl-review-pr-${pr}-${sha.slice(0,16)}`;
}
export function reviewConfiguration({pr,sha,environment}) {
 if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Missing exact head SHA');
 return {name:reviewWorkerName({pr,sha,environment}),main:'review-worker.mjs',compatibility_date:'2026-09-07',workers_dev:true,preview_urls:false,
  assets:{directory:'out/review',binding:'ASSETS',run_worker_first:true,not_found_handling:'none'},
  vars:{REVIEW_ENV:environment,REVIEW_SHA:sha,REVIEW_PR:String(pr||'')}};
}

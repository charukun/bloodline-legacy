import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reviewConfiguration} from './review-config.mjs';
import {reviewLink} from '../src/review/model.mjs';
const {REVIEW_ENV:environment,REVIEW_SHA:sha,CLOUDFLARE_ACCOUNT_ID:account,CLOUDFLARE_API_TOKEN:token,GITHUB_TOKEN:github}=process.env;
const pr=Number(process.env.REVIEW_PR)||null;
if(!account||!token||!github)throw Error('Review deployment credentials unavailable');
const githubAPI=async endpoint=>{const r=await fetch('https://api.github.com/repos/charukun/bloodline-legacy/'+endpoint,{headers:{Authorization:`Bearer ${github}`,Accept:'application/vnd.github+json'}});if(!r.ok)throw Error('GitHub identity lookup failed: '+r.status);return r.json();};
// Reject stale revisions immediately before publishing, not just at build time.
if(environment==='preview'){
 const current=await githubAPI(`pulls/${pr}`);
 if(current.state!=='open'||current.base.ref!=='develop'||current.head.repo.full_name!=='charukun/bloodline-legacy'||current.head.sha!==sha)throw Error('PR changed or closed; this preview was not published');
}else if(environment==='dev'){
 if((await githubAPI('git/ref/heads/develop')).object.sha!==sha)throw Error('Develop changed; this review build was not published');
}else throw Error('Only DEV and PR Review deployments are supported');
const config=reviewConfiguration({pr,sha,environment});
const manifest=JSON.parse(await fs.readFile('deploy/out/review/review/version.json','utf8'));
if(manifest.commit!==sha||manifest.environment!==environment||manifest.pr!==pr)throw Error('Review artifact identity mismatch');
for(const [name,hash] of Object.entries(manifest.hashes)){
 if(name.includes('..')||name.startsWith('/'))throw Error('Invalid artifact path');
 const bytes=await fs.readFile('deploy/out/review/review/'+name);if(createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Review artifact changed: '+name);
}
await fs.writeFile('deploy/review.generated.json',JSON.stringify(config,null,2));
try{execFileSync('deploy/node_modules/.bin/wrangler',['deploy','--config','deploy/review.generated.json'],{stdio:'inherit'});}finally{await fs.rm('deploy/review.generated.json',{force:true});}
const subdomainResponse=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/subdomain`,{headers:{Authorization:`Bearer ${token}`}});
const subdomain=await subdomainResponse.json();if(!subdomain.success||!subdomain.result?.subdomain)throw Error('Cannot resolve deployed Review URL');
const base=`https://${config.name}.${subdomain.result.subdomain}.workers.dev`;
const urls={review:reviewLink(base,{sha}),skills:reviewLink(base,{mode:'skills',skill:4001,sha}),enemies:reviewLink(base,{mode:'enemies',enemy:'soldier',sha}),combat:reviewLink(base,{mode:'combat',skill:4001,enemy:'soldier',sha})};
for(const url of Object.values(urls)){const r=await fetch(url);if(r.status!==401||!r.headers.get('www-authenticate')||r.headers.get('cache-control')!=='no-store')throw Error('Published Review authorization gate failed: '+r.status);}
const result={pr,sha,environment,urls,verification:'Public access denied (401); authenticated interaction requires a repository writer.'};
await fs.mkdir('deploy/evidence',{recursive:true});await fs.writeFile('deploy/evidence/review-published.json',JSON.stringify(result,null,2));
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`## Review Lab\n\nCommit: \`${sha}\`\n\n`+Object.entries(urls).map(([name,url])=>`- [${name}](${url})`).join('\n')+'\n\nGitHub writer authorization required.\n');
if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,`review_url=${urls.review}\n`);
console.log(JSON.stringify(result));

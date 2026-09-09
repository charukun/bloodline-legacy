const {CLOUDFLARE_ACCOUNT_ID:account,CLOUDFLARE_API_TOKEN:token,GITHUB_TOKEN:github}=process.env,pr=Number(process.env.REVIEW_PR);
if(!Number.isSafeInteger(pr)||pr<1||!account||!token||!github)throw Error('Missing cleanup identity');
const current=await fetch(`https://api.github.com/repos/charukun/bloodline-legacy/pulls/${pr}`,{headers:{Authorization:`Bearer ${github}`,Accept:'application/vnd.github+json'}});
if(!current.ok)throw Error('PR lookup failed');if((await current.json()).state!=='closed')throw Error('Only closed PR previews may be deleted');
const base=`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`,headers={Authorization:`Bearer ${token}`};
const response=await fetch(base,{headers}),list=await response.json();if(!list.success)throw Error('Preview listing failed');
const match=new RegExp(`^bl-review-pr-${pr}-[a-f0-9]{16}$`);
for(const worker of list.result.filter(w=>match.test(w.id))){const r=await fetch(base+'/'+worker.id,{method:'DELETE',headers});if(!r.ok)throw Error('Preview cleanup failed');console.log('Deleted '+worker.id);}

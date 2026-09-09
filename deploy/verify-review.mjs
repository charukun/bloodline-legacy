// A newly-created workers.dev hostname can briefly return the platform's 404.
// Authentication failures and exposed content must never be treated as readiness.
export async function verifyReviewAccess(urls,{fetcher=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms)),attempts=20}={}) {
 for(const url of urls){
  let response;
  for(let i=0;i<attempts;i++){
   response=await fetcher(url,{signal:AbortSignal.timeout(10000)});
   if(response.status!==404||i===attempts-1)break;
   await wait(2000);
  }
  if(response.status!==401||!response.headers.get('www-authenticate')||response.headers.get('cache-control')!=='no-store')throw Error(`Published Review authorization gate failed: ${response.status} at ${new URL(url).pathname}`);
 }
}

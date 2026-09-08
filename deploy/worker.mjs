// Deployment adapter only. The handoff has no online game server.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff'};
    if (env.APP_ENV !== 'production') headers['X-Robots-Tag'] = 'noindex, nofollow';
    if (url.pathname === '/api/health' && (request.method === 'GET' || request.method === 'HEAD')) {
      // Deliberately does not impersonate the missing AERIN online server.
      return new Response(request.method === 'HEAD' ? null : JSON.stringify({online:false, environment:env.APP_ENV}),
        {headers:{...headers, 'Content-Type':'application/json; charset=utf-8'}});
    }
    if (url.pathname.startsWith('/api/')) {
      return Response.json({error:'Online backend is not deployed'}, {status:501, headers});
    }
    if (url.pathname === '/favicon.ico') return new Response(null, {status:204, headers});
    // Assets are served first by Cloudflare. Unknown paths remain real 404s.
    return new Response('Not found', {status:404, headers});
  }
};

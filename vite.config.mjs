import { defineConfig } from 'vite';

// Serve the normal standalone build in the supervised, isolated QA preview.
// Production remains build.mjs + the existing deployment workflow.
export default defineConfig({
  root: 'dist',
  plugins: [{name:'review-lab-local-routes',configureServer(server){server.middlewares.use((req,_res,next)=>{if(/^\/review\/(skills|enemies|combat)(?:\?|$)/.test(req.url||''))req.url='/review/index.html'+(req.url.includes('?')?req.url.slice(req.url.indexOf('?')):'');next();});}}],
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
});

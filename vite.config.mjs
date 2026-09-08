import { defineConfig } from 'vite';

// Serve the normal standalone build in the supervised, isolated QA preview.
// Production remains build.mjs + the existing deployment workflow.
export default defineConfig({
  root: 'dist',
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
});

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // Same-origin /api in development, like production (where Vercel rewrites /api to the API).
  server: { proxy: { '/api': 'http://localhost:8000' } },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.js'], css: false },
});

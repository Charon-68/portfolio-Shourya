import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { devCapture, prerenderRoutes, sitemap } from './config/plugins.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), devCapture(), prerenderRoutes(), sitemap()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});

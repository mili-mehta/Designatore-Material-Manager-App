import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('.'),
    }
  },
  // This is the definitive fix. Because index.html uses an importmap to load
  // dependencies from a CDN at runtime, we MUST tell the Vite/Rollup build process
  // NOT to try and bundle these dependencies. This 'external' configuration
  // resolves the "Rollup failed to resolve import" error by aligning the build
  // step with the runtime environment.
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-dom/client',
        '@supabase/supabase-js',
        'jspdf',
        'jspdf-autotable',
        'xlsx',
        'path',
        'vite',
        '@vitejs/plugin-react'
      ]
    }
  }
});
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
  build: {
    rollupOptions: {
      // This tells Vite/Rollup to not bundle these packages,
      // and instead, leave the import statements in the code.
      // The browser will then use the 'importmap' in index.html
      // to resolve these imports from the specified CDN URLs.
      external: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'jspdf',
        'jspdf-autotable',
        'xlsx'
      ]
    }
  }
});
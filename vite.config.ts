import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Designatore-Material-Manager-App/',
  build: {
    outDir: 'docs',
  },
  server: {
    // Respect the PORT environment variable for local development flexibility
    port: Number(process.env.PORT) || 3000,
    host: '0.0.0.0',
  },
  preview: {
    // This is the crucial part for deployment.
    // It tells the preview server (used by Cloud Run) to listen on the port it's assigned.
    port: Number(process.env.PORT) || 8080,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('.'),
    }
  }
});
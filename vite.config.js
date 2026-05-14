import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: './src',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    globals: true,
  },
});

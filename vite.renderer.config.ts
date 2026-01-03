// vite.renderer.config.ts
import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig(async () => {
  const { default: react } = await import('@vitejs/plugin-react');

  return {
    plugins: [react()],
  };
});
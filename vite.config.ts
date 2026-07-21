
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    base: './', // CRITICAL: Ensures assets load using relative paths for APK/Cordova/Capacitor
    define: {
      // Polyfill process.env for the @google/genai SDK compatibility
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
    }
  };
});

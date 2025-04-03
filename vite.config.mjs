import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      // Set up any path aliases you need
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 9877, // Match the current port
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:9876',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    watch: {
      // Don't watch node_modules and Python virtual environment
      ignored: ['**/node_modules/**', '**/server/venv/**', '**/server/**/*.py'],
    },
  },
  build: {
    outDir: 'build', // Keep same output directory as CRA
  },
  // Handle environment variables
  define: {
    'process.env': process.env,
  },
});
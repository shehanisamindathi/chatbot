import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
 
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR off: prevents the endless page-reload loop on local machines.
      hmr: false,
      // Do not watch the embedded DB files, otherwise every API log write reloads the page.
      watch: {
        ignored: ['**/*.json', '**/data/**', '**/db/**', '**/.data/**', '**/node_modules/**'],
      },
    },
  };
});
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { apiProxyPlugin } from './server/api-proxy';

export default defineConfig(({ mode }) => {
    // Load env vars for server-side use only (not exposed to client)
    loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        apiProxyPlugin(), // Secure API proxy - keeps API key server-side
      ],
      // NOTE: API key is intentionally NOT exposed to the client bundle
      // All API calls go through /api/* which is proxied server-side
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

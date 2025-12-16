import type { Plugin, ViteDevServer } from 'vite';
import { loadEnv } from 'vite';

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Vite plugin that creates a server-side proxy for OpenRouter API calls.
 * This keeps the API key secure on the server and never exposes it to the client bundle.
 */
export function apiProxyPlugin(): Plugin {
  let apiKey: string | undefined;

  return {
    name: 'api-proxy',
    configResolved(config) {
      // Load environment variables using Vite's loadEnv
      const env = loadEnv(config.mode, process.cwd(), '');
      apiKey = env.OPENROUTER_API_KEY;
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle our API proxy routes
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        if (req.url === '/api/chat/completions' && req.method === 'POST') {
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Missing OPENROUTER_API_KEY. Set it in .env and restart the dev server.'
            }));
            return;
          }

          // Collect request body
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: body,
              });

              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');

              const responseText = await response.text();
              res.end(responseText);
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: error instanceof Error ? error.message : 'Proxy request failed'
              }));
            }
          });

          req.on('error', () => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Request body read error' }));
          });

          return;
        }

        // Unknown API route
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
      });
    },
  };
}

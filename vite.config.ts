import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import dotenv from 'dotenv';

// Load .env.local variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

function apiMockPlugin() {
  return {
    name: 'api-mock-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const relativePath = parsedUrl.pathname.replace(/^\/api\//, '');
          
          let filePath = path.resolve(__dirname, 'api', `${relativePath}.ts`);
          if (!fs.existsSync(filePath)) {
            // Check if it's an index.ts inside a folder
            filePath = path.resolve(__dirname, 'api', relativePath, 'index.ts');
          }
          if (!fs.existsSync(filePath)) {
            // Try matching subdirectories (e.g. email/send -> api/email/send.ts)
            const parts = relativePath.split('/');
            filePath = path.resolve(__dirname, 'api', ...parts) + '.ts';
          }

          if (fs.existsSync(filePath)) {
            try {
              const module = await server.ssrLoadModule(filePath);
              const handler = module.default;
              
              if (typeof handler === 'function') {
                // Decorate res with standard Vercel response helper methods
                const decoratedRes = Object.assign(res, {
                  status(statusCode) {
                    res.statusCode = statusCode;
                    return this;
                  },
                  json(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return this;
                  },
                  send(data) {
                    res.end(data);
                    return this;
                  }
                });
                
                // Decorate req
                const decoratedReq = Object.assign(req, {
                  query: {},
                  body: null
                });
                
                // Parse query params
                const query = {};
                parsedUrl.searchParams.forEach((val, key) => {
                  query[key] = val;
                });
                decoratedReq.query = query;
                
                // Read request body stream
                const getBody = () => new Promise((resolve) => {
                  let body = '';
                  req.on('data', chunk => { body += chunk; });
                  req.on('end', () => { resolve(body); });
                });
                const rawBody = await getBody();
                if (req.headers['content-type']?.includes('application/json') && typeof rawBody === 'string' && rawBody.trim()) {
                  try {
                    decoratedReq.body = JSON.parse(rawBody);
                  } catch {
                    decoratedReq.body = rawBody;
                  }
                } else {
                  decoratedReq.body = rawBody;
                }

                await handler(decoratedReq, decoratedRes);
                return;
              }
            } catch (err) {
              console.error(`[Vite API Dev Server] Error running ${filePath}:`, err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Internal server error inside dev proxy', error: String(err) }));
              return;
            }
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMockPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // ⚡ Perf: Target modern browsers for smaller bundle output
      target: 'esnext',
      // ⚡ Perf: Increase warning limit for large chunks (xlsx is legitimately large)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          'check-registration': path.resolve(__dirname, 'check-registration.html'),
        },
        output: {
          // ⚡ Perf: Split large vendor libraries into separate chunks
          // Each vendor chunk is cached independently → cache stays valid after app code updates
          manualChunks(id) {
            // React core — loaded first, very rarely changes
            if (
              id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            // Animation library — separate chunk, changes rarely
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // Supabase client — separate chunk, changes rarely
            if (id.includes('node_modules/@supabase/')) {
              return 'vendor-supabase';
            }
            // Icon library — large but cached independently
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // Excel library — large, load only when needed
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            // Other node_modules go into a general vendor chunk
            if (id.includes('node_modules/')) {
              return 'vendor-misc';
            }
          },
        },
      },
    },
  };
});

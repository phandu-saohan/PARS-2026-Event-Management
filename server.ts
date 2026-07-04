import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import handlers
import emailHandler from './api/email';
import zaloHandler from './api/zalo';
import healthHandler from './api/health';
import manifestHandler from './api/manifest';
import sepayCheckHandler from './api/sepay-check';
import sepayWebhookHandler from './api/sepay-webhook';
import tokenRefreshHandler from './api/token-refresh';
import onesignalSendPushHandler from './api/onesignal/send-push';
import whatsappSendHandler from './api/whatsapp/send';
import usersCreateHandler from './api/users/create';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to adapt Express Request/Response to Vercel Request/Response format
const adaptHandler = (handler: any) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      // Adapt Express request queries for vercel compatibility if needed
      // (Express does req.query and req.body natively)
      const adaptedRes: any = res;
      
      // Ensure Vercel response functions are chainable and standard
      if (!adaptedRes.status) {
        adaptedRes.status = (code: number) => {
          res.statusCode = code;
          return adaptedRes;
        };
      }
      if (!adaptedRes.json) {
        adaptedRes.json = (data: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return adaptedRes;
        };
      }
      
      await handler(req, adaptedRes);
    } catch (error: any) {
      console.error('Error handling API request in adapted handler:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };
};

// API Routing with custom rewrites matching vercel.json
app.post('/api/email/send', adaptHandler(emailHandler));
app.post('/api/email/send-resend', adaptHandler(emailHandler));
app.post('/api/email/send-cloudflare', adaptHandler(emailHandler));
app.post('/api/email/test-connection', adaptHandler(emailHandler));
app.get('/api/email/track-open', adaptHandler(emailHandler));
app.get('/api/email/track-click', adaptHandler(emailHandler));
app.use('/api/email', adaptHandler(emailHandler));

app.post('/api/zalo/send', adaptHandler(zaloHandler));
app.post('/api/zalo/verify-token', adaptHandler(zaloHandler));
app.post('/api/zalo/refresh-token', adaptHandler(zaloHandler));
app.use('/api/zalo', adaptHandler(zaloHandler));

app.use('/api/health', adaptHandler(healthHandler));
app.use('/api/manifest', adaptHandler(manifestHandler));
app.use('/api/sepay-check', adaptHandler(sepayCheckHandler));
app.use('/api/sepay-webhook', adaptHandler(sepayWebhookHandler));
app.use('/api/token-refresh', adaptHandler(tokenRefreshHandler));
app.use('/api/onesignal/send-push', adaptHandler(onesignalSendPushHandler));
app.use('/api/whatsapp/send', adaptHandler(whatsappSendHandler));
app.use('/api/users/create', adaptHandler(usersCreateHandler));

// Serve React static frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to React app index.html for SPA routing (for any non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Production Express server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import { config } from './config';
import { db } from './database/db';
import { apiRouter } from './routes/api';
import { requestLogger, rateLimiter } from './middleware/auth';

import path from 'path';

export const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.use(requestLogger);
app.use('/api/', rateLimiter(500, 60000));

// Mount API v1 router
app.use('/api/v1', apiRouter);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    platform: 'Smart Municipal Dustbin Monitoring Platform',
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      telemetry: 'POST /api/v1/bins/telemetry',
      bins: 'GET /api/v1/bins',
      alerts: 'GET /api/v1/alerts',
      analytics: 'GET /api/v1/analytics/summary',
      priority: 'GET /api/v1/priority',
      stream: 'GET /api/v1/stream',
    },
  });
});

export async function startServer() {
  await db.init();

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log('================================================================');
    console.log(' SMART MUNICIPAL DUSTBIN MONITORING PLATFORM - BACKEND READY');
    console.log(` Server listening on: http://0.0.0.0:${config.port} (LAN accessible)`);
    console.log(` Real devices:       BIN_001, BIN_002, BIN_003, BIN_004, BIN_005`);
    console.log(` Demo devices:       60 simulated bins active`);
    console.log(` SSE Live Stream:    http://localhost:${config.port}/api/v1/stream`);
    console.log('================================================================');
  });

  return server;
}

// Start immediately if executed as main file
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer().catch((err) => {
    console.error('[FATAL ERROR] Server failed to start:', err);
    process.exit(1);
  });
}

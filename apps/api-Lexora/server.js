import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { validateEnv } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const envStatus = validateEnv();
  logger.info('env.validated', { environment: envStatus.environment });
  await connectDB();
  http.createServer(app).listen(PORT, () => {
    logger.info('server.started', { port: Number(PORT) });
  });
};

startServer().catch((error) => {
  logger.error('server.start_failed', { error });
  process.exit(1);
});

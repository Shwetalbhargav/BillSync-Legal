import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export function requestContext(req, res, next) {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const started = Date.now();
  res.on('finish', () => {
    logger.info('request.completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - started,
      userId: req.user?.id,
      workspaceId: req.workspaceId,
    });
  });

  next();
}

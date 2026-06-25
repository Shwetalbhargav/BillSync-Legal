import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = Number(err.statusCode || err.status) || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    logger.error('api.error', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error: err,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: isServerError ? 'Internal server error' : err.message,
      statusCode,
      requestId: req.requestId,
    },
  });
}

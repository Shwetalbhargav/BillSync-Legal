const LEVELS = new Set(['debug', 'info', 'warn', 'error']);

function serializeError(error) {
  if (!error) return undefined;
  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    code: error.code,
  };
}

export function log(level, message, meta = {}) {
  const normalizedLevel = LEVELS.has(level) ? level : 'info';
  const payload = {
    ts: new Date().toISOString(),
    level: normalizedLevel,
    service: process.env.SERVICE_NAME || 'lexora-api',
    environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
    message,
    ...meta,
  };
  if (meta.error instanceof Error) payload.error = serializeError(meta.error);
  const line = JSON.stringify(payload);
  if (normalizedLevel === 'error') console.error(line);
  else if (normalizedLevel === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};

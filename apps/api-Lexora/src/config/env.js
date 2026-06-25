const COMMON_REQUIRED = ['MONGODB_URI'];

const PRODUCTION_REQUIRED = [
  'JWT_SECRET',
  'FRONTEND_URL',
  'CORS_ORIGINS',
  'ALLOWED_EXTENSION_IDS',
  'AUTH_COOKIE_SECURE',
  'SECRET_SERVICE_PROVIDER',
  'BACKUP_ENCRYPTION_KEY_REF',
];

const STAGING_REQUIRED = [
  'JWT_SECRET',
  'FRONTEND_URL',
  'CORS_ORIGINS',
  'ALLOWED_EXTENSION_IDS',
];

function configured(name, env) {
  return env[name] !== undefined && String(env[name]).trim() !== '';
}

export function validateEnv(env = process.env) {
  const environment = env.APP_ENV || env.NODE_ENV || 'development';
  const required = [...COMMON_REQUIRED];
  if (environment === 'production') required.push(...PRODUCTION_REQUIRED);
  if (environment === 'staging') required.push(...STAGING_REQUIRED);

  const missing = required.filter((name) => !configured(name, env));
  if (missing.length) {
    const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
    error.code = 'ENV_VALIDATION_FAILED';
    error.missing = missing;
    throw error;
  }

  if (environment === 'production' && env.PAYMENT_MOCK_GATEWAY_ENABLED === 'true') {
    const error = new Error('PAYMENT_MOCK_GATEWAY_ENABLED must not be true in production');
    error.code = 'ENV_VALIDATION_FAILED';
    error.missing = [];
    throw error;
  }

  return { environment, required, missing: [] };
}

export const envContract = {
  common: COMMON_REQUIRED,
  staging: STAGING_REQUIRED,
  production: PRODUCTION_REQUIRED,
};

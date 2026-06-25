// src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { rateLimit } from './middleware/rateLimit.js';
import {
  rejectOwnershipFields,
  runWorkspaceContext,
  sanitizeOwnershipFields,
} from './middleware/workspaceContext.js';
import { requestContext } from './middleware/requestContext.js';

// API routes
import apiRoutes from './routes/index.js';

const app = express();

// Trust proxy & health
app.set('trust proxy', 1);
app.use(requestContext);
app.use(runWorkspaceContext);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.get('/healthz', (req, res) => res.json({ ok: true, requestId: req.requestId }));
app.get('/version', (req, res) => res.json({
  ok: true,
  commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || null,
  branch: process.env.RENDER_GIT_BRANCH || null,
}));

const defaultLocalOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  'https://bill-sync-legal.vercel.app',
  'https://bill-bot-legal.vercel.app',
];

const configuredOrigins = [
  ...defaultLocalOrigins,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.has(normalizedOrigin)) return callback(null, true);
      if (normalizedOrigin.startsWith('chrome-extension://')) {
        const configuredExtensionIds = String(process.env.ALLOWED_EXTENSION_IDS || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        if (configuredExtensionIds.length) {
          const extensionId = normalizedOrigin.replace('chrome-extension://', '');
          if (!configuredExtensionIds.includes(extensionId)) {
            const error = new Error('Extension origin not allowed by CORS');
            error.statusCode = 403;
            return callback(error);
          }
        }
        return callback(null, true);
      }
      const error = new Error('Origin not allowed by CORS');
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
  })
);


// Parsers
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  sanitizeOwnershipFields(req.query);
  next();
});
app.use('/api', rateLimit({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.API_RATE_LIMIT_MAX || 600),
  scope: 'api',
}));
app.use('/api/auth/login', rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60_000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  scope: 'auth',
}));

app.use((req, res, next) => {
  const origin = req.get('origin');
  const method = String(req.method || '').toUpperCase();
  const mutates = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (!mutates || !origin || req.get('authorization')) return next();
  const normalizedOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.has(normalizedOrigin) || normalizedOrigin.startsWith('chrome-extension://')) {
    return next();
  }
  return res.status(403).json({ ok: false, message: 'Origin is not allowed for cookie-authenticated mutations' });
});

app.use((req, res, next) => {
  const origin = String(req.get('origin') || '');
  if (!origin.startsWith('chrome-extension://')) return next();

  const extensionId = String(req.get('x-legal-billables-extension') || '');
  const extensionVersion = String(req.get('x-legal-billables-extension-version') || '');
  if (!extensionId || !extensionVersion) {
    return res.status(403).json({
      ok: false,
      message: 'Chrome extension requests must include extension identity headers',
    });
  }
  req.extensionContext = { extensionId, extensionVersion };
  next();
});

app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/auth/login')
    || req.path.startsWith('/api/auth/desktop-login')
    || req.path.startsWith('/api/auth/desktop-handoff-login')
    || req.path.startsWith('/api/auth/register')
    || req.path.startsWith('/api/auth/password-reset')
  ) {
    return next();
  }
  return rejectOwnershipFields(req, res, next);
});

// Canonical API routes.
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

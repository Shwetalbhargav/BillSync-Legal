import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { validateEnv } from '../config/env.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { securityHeaders } from '../middleware/securityHeaders.js';
import { rejectOwnershipFields } from '../middleware/workspaceContext.js';
import { down, up } from '../migrations/002_workspace_foundation.js';
import { CORE_FEATURES, CORE_MODULES, CORE_PERMISSIONS, CORE_PLANS } from '../modules/workspace/services/workspaceFoundationService.js';

const repoRoot = path.resolve(process.cwd(), '..', '..');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('production hardening release checks', () => {
  test('production environment contract requires security, CORS, secret, and backup settings', () => {
    expect(() => validateEnv({ APP_ENV: 'production', MONGODB_URI: 'mongodb://localhost:27017/lexora' })).toThrow(/CORS_ORIGINS/);

    expect(() => validateEnv({
      APP_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost:27017/lexora',
      JWT_SECRET: 'release-secret',
      FRONTEND_URL: 'https://app.lexora.test',
      CORS_ORIGINS: 'https://app.lexora.test',
      ALLOWED_EXTENSION_IDS: 'extension-id',
      AUTH_COOKIE_SECURE: 'true',
      SECRET_SERVICE_PROVIDER: 'local',
      BACKUP_ENCRYPTION_KEY_REF: 'local-dev-key',
      PAYMENT_MOCK_GATEWAY_ENABLED: 'true',
    })).toThrow(/PAYMENT_MOCK_GATEWAY_ENABLED/);
  });

  test('security headers include browser hardening and HSTS in production', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = mockResponse();
    let nextCalled = false;

    securityHeaders({}, res, () => {
      nextCalled = true;
    });

    process.env.NODE_ENV = previousNodeEnv;
    expect(nextCalled).toBe(true);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
  });

  test('rate limit returns calm 429 response and standard rate headers', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, scope: `release-${Date.now()}` });
    const req = { ip: '127.0.0.1', socket: {}, body: { email: 'owner@example.test' } };
    const first = mockResponse();
    const second = mockResponse();
    let firstNext = false;

    limiter(req, first, () => {
      firstNext = true;
    });
    limiter(req, second, () => {});

    expect(firstNext).toBe(true);
    expect(first.headers['ratelimit-limit']).toBe('1');
    expect(second.statusCode).toBe(429);
    expect(second.body).toEqual({ ok: false, message: 'Too many requests' });
  });

  test('workspace ownership fields are rejected before protected mutations reach controllers', () => {
    const req = {
      method: 'PATCH',
      body: {
        name: 'Client A',
        workspaceId: '64b0000000000000000000aa',
        nested: { firmId: '64b0000000000000000000bb' },
      },
    };
    const res = mockResponse();

    rejectOwnershipFields(req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body.fields).toEqual(['workspaceId', 'nested.firmId']);
  });

  test('workspace foundation migration exposes reversible up/down operations', () => {
    expect(typeof up).toBe('function');
    expect(typeof down).toBe('function');
  });

  test('plan, feature, permission, and module catalogs cover all customer tiers from one repository', () => {
    expect(CORE_PLANS.map((plan) => plan.key)).toEqual(['free', 'solo', 'professional', 'business', 'enterprise']);
    expect(CORE_FEATURES.some((feature) => feature.key === 'enterprise.foundations' && feature.gateBehavior === 'hide')).toBe(true);
    expect(CORE_PERMISSIONS.some((permission) => permission.key === 'enterprise.manage')).toBe(true);

    const planKeys = new Set(CORE_PLANS.map((plan) => plan.key));
    const featureKeys = new Set(CORE_FEATURES.map((feature) => feature.key));
    const permissionKeys = new Set(CORE_PERMISSIONS.map((permission) => permission.key));
    for (const module of CORE_MODULES) {
      expect(planKeys.has(module.requiredPlanKey)).toBe(true);
      expect(module.featureKeys.every((key) => featureKeys.has(key))).toBe(true);
      expect(module.permissionKeys.every((key) => permissionKeys.has(key))).toBe(true);
    }
  });

  test('workspace routes centralize protected mutations through requirePermission', () => {
    const routes = readRepoFile('apps/api-Lexora/src/modules/workspace/routes/workspaceRoutes.js');
    const mutatingRoutes = routes
      .split(/\r?\n/)
      .filter((line) => /router\.(post|put|patch|delete)\('/.test(line) && !line.includes('/invitations/accept'));

    expect(mutatingRoutes.length).toBeGreaterThan(0);
    expect(mutatingRoutes.every((line) => line.includes('requirePermission('))).toBe(true);
  });

  test('attendance route mounting is flag gated in production', () => {
    const routes = readRepoFile('apps/api-Lexora/src/routes/index.js');
    expect(routes).toContain("process.env.ENABLE_ENTERPRISE_MODULES");
    expect(routes).toContain("process.env.NODE_ENV !== 'production'");
    expect(routes).toContain("if (enterpriseModulesEnabled) router.use('/attendance'");
    expect(routes).toContain("router.use('/analytics', analyticsRoutes)");
    expect(routes).toContain("router.use('/revenue', revenueRoutes)");
  });

  test('CI and operations docs include release-critical checks', () => {
    const ci = readRepoFile('.github/workflows/ci.yml');
    const launch = readRepoFile('docs/operations/launch-checklist.md');
    const backup = readRepoFile('docs/operations/backup-recovery.md');

    expect(ci).toContain('Workspace isolation tests');
    expect(ci).toContain('Dependency audit');
    expect(ci).toContain('End-to-end smoke test');
    expect(launch).toContain('/api/ops/readyz');
    expect(launch).toContain('Restore drill completed this month');
    expect(backup).toContain('Monthly Restore Drill');
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { NAVIGATION_PACKAGE, buildNavigationModel } from '../src/index.js';

test('navigation package reuses the module registry navigation model', () => {
  const model = buildNavigationModel({ modules: [{ key: 'dashboard', name: 'Dashboard', routeBase: '/app/dashboard' }], accessByModule: { dashboard: { allowed: true } } });
  assert.equal(model.navigation[0].path, '/app/dashboard');
  assert.equal(NAVIGATION_PACKAGE.tenantBoundary, 'Workspace');
});

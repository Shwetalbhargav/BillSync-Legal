import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNavigationModel, validateModuleDependencies } from '../src/index.js';

test('module registry package validates dependencies and builds dynamic navigation', () => {
  const modules = [
    { key: 'dashboard', name: 'Dashboard', order: 1, permissionKeys: [], dependencies: [], routeBase: '/app/dashboard' },
    { key: 'reports', name: 'Reports', order: 2, permissionKeys: ['report.view'], dependencies: ['dashboard'], routeBase: '/app/reports' },
  ];
  assert.equal(validateModuleDependencies(modules).ok, true);
  const model = buildNavigationModel({
    modules,
    permissions: ['report.view'],
    accessByModule: {
      dashboard: { allowed: true },
      reports: { allowed: false, behavior: 'read_only', reason: 'Reports are read-only.' },
    },
  });
  assert.equal(model.navigation.length, 2);
  assert.equal(model.navigation[1].readOnly, true);
});

test('module registry package blocks modules with missing dependencies', () => {
  const validation = validateModuleDependencies([{ key: 'reports', dependencies: ['finance'] }]);
  assert.equal(validation.ok, false);
  assert.deepEqual(validation.unknownDependencies, [{ moduleKey: 'reports', dependencyKey: 'finance' }]);
});

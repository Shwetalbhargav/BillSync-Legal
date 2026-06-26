import { describe, expect, test } from 'vitest';
import {
  buildNavigationModel,
  validateModuleDependencies,
} from '../modules/workspace/services/moduleNavigationService.js';

function access(allowed = true, behavior = 'enabled') {
  return { allowed, behavior, reason: allowed ? null : 'This module is not available in this workspace.' };
}

const baseModules = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/dashboard',
    permissionKeys: ['workspace.read'],
    dependencies: [],
    navigation: { label: 'Dashboard', path: '/app/dashboard', iconKey: 'layout-dashboard', order: 10 },
    order: 10,
  },
  {
    key: 'billing',
    name: 'Billing',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/billables',
    permissionKeys: ['billing.write'],
    dependencies: ['dashboard'],
    navigation: { label: 'Billing', path: '/app/billables', iconKey: 'circle-dollar-sign', order: 20 },
    order: 20,
  },
  {
    key: 'ai',
    name: 'AI Assistant',
    status: 'active',
    state: 'experimental',
    routeBase: '/app/assistant',
    permissionKeys: ['workspace.read'],
    dependencies: ['dashboard'],
    navigation: { label: 'AI Assistant', path: '/app/assistant', iconKey: 'bot', order: 30 },
    order: 30,
  },
];

describe('module navigation service', () => {
  test('validates unknown module dependencies', () => {
    const validation = validateModuleDependencies([
      ...baseModules,
      { key: 'analytics', dependencies: ['missing-module'] },
    ]);

    expect(validation.ok).toBe(false);
    expect(validation.unknownDependencies).toEqual([{ moduleKey: 'analytics', dependencyKey: 'missing-module' }]);
  });

  test('generates navigation from enabled modules and permissions', () => {
    const model = buildNavigationModel({
      modules: baseModules,
      permissions: ['workspace.read', 'billing.write'],
      accessByModule: {
        dashboard: access(true),
        billing: access(true),
        ai: access(true),
      },
    });

    expect(model.validation.ok).toBe(true);
    expect(model.navigation.map((item) => item.moduleKey)).toEqual(['dashboard', 'billing', 'ai']);
    expect(model.navigation.find((item) => item.moduleKey === 'ai')).toEqual(expect.objectContaining({
      experimental: true,
      state: 'experimental',
    }));
  });

  test('keeps disabled and read-only states explicit while hiding unavailable modules', () => {
    const model = buildNavigationModel({
      modules: baseModules,
      permissions: ['workspace.read', 'billing.write'],
      workspaceModules: {
        billing: { status: 'read_only', reason: 'Billing is paused for review.' },
      },
      accessByModule: {
        dashboard: access(true),
        billing: access(true),
        ai: access(false, 'hide'),
      },
    });

    expect(model.navigation.map((item) => item.moduleKey)).toEqual(['dashboard', 'billing']);
    expect(model.navigation.find((item) => item.moduleKey === 'billing')).toEqual(expect.objectContaining({
      readOnly: true,
      state: 'read_only',
    }));
    expect(model.modules.find((item) => item.key === 'ai')).toEqual(expect.objectContaining({
      state: 'hidden',
      allowed: false,
    }));
  });

  test('disables modules when dependencies are blocked', () => {
    const model = buildNavigationModel({
      modules: baseModules,
      permissions: ['workspace.read', 'billing.write'],
      accessByModule: {
        dashboard: access(false, 'disable'),
        billing: access(true),
        ai: access(true),
      },
    });

    expect(model.modules.find((item) => item.key === 'dashboard').state).toBe('disabled');
    expect(model.modules.find((item) => item.key === 'billing')).toEqual(expect.objectContaining({
      state: 'disabled',
      dependenciesReady: false,
    }));
  });
});

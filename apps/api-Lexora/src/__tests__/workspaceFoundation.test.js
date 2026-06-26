import { expect, test } from 'vitest';
import {
  CORE_FEATURES,
  CORE_MODULES,
  CORE_PERMISSIONS,
  CORE_PLANS,
  CORE_ROLES,
  TENANT_OWNED_COLLECTIONS,
} from '../modules/workspace/services/workspaceFoundationService.js';
import Workspace from '../modules/workspace/models/Workspace.js';
import Plan from '../modules/workspace/models/Plan.js';
import Feature from '../modules/workspace/models/Feature.js';
import Permission from '../modules/workspace/models/Permission.js';
import Role from '../modules/workspace/models/Role.js';
import Policy from '../modules/workspace/models/Policy.js';
import ModuleRegistry from '../modules/workspace/models/ModuleRegistry.js';
import WorkspaceModule from '../modules/workspace/models/WorkspaceModule.js';
import Subscription from '../modules/workspace/models/Subscription.js';
import WorkspaceFeatureOverride from '../modules/workspace/models/WorkspaceFeatureOverride.js';
import { down, up } from '../migrations/002_workspace_foundation.js';

function unique(values) {
  return new Set(values).size === values.length;
}

test('core platform catalog uses stable unique keys', () => {
  expect(unique(CORE_FEATURES.map((item) => item.key))).toBe(true);
  expect(unique(CORE_PERMISSIONS.map((item) => item.key))).toBe(true);
  expect(unique(CORE_ROLES.map((item) => item.key))).toBe(true);
  expect(unique(CORE_MODULES.map((item) => item.key))).toBe(true);
  expect(unique(CORE_PLANS.map((item) => item.key))).toBe(true);
});

test('plans only reference known features and modules', () => {
  const featureKeys = new Set(CORE_FEATURES.map((feature) => feature.key));
  const moduleKeys = new Set(CORE_MODULES.map((module) => module.key));

  expect(CORE_PLANS.map((plan) => plan.key)).toEqual(['free', 'solo', 'professional', 'business', 'enterprise']);
  for (const plan of CORE_PLANS) {
    expect(plan.featureKeys.every((key) => featureKeys.has(key))).toBe(true);
    expect(plan.moduleKeys.every((key) => moduleKeys.has(key))).toBe(true);
    expect(plan.limits).toEqual(expect.objectContaining({
      members: expect.any(Number),
      storageGb: expect.any(Number),
      aiCredits: expect.any(Number),
    }));
  }
});

test('roles only reference known permissions', () => {
  const permissionKeys = new Set(CORE_PERMISSIONS.map((permission) => permission.key));
  expect(permissionKeys.has('invoice.view')).toBe(true);
  expect(permissionKeys.has('invoice.create')).toBe(true);
  expect(permissionKeys.has('invoice.send')).toBe(true);
  expect(permissionKeys.has('payment.record')).toBe(true);
  expect(permissionKeys.has('document.read')).toBe(true);
  expect(permissionKeys.has('document.create')).toBe(true);
  expect(permissionKeys.has('document.share')).toBe(true);
  expect(permissionKeys.has('document.delete')).toBe(true);
  expect(permissionKeys.has('report.view')).toBe(true);
  expect(permissionKeys.has('report.export')).toBe(true);
  expect(permissionKeys.has('report.manage')).toBe(true);
  for (const role of CORE_ROLES) {
    expect(role.permissionKeys.every((key) => permissionKeys.has(key))).toBe(true);
  }
});

test('module registry manifests define plan, feature, permission, dependency, and navigation contracts', () => {
  const moduleKeys = new Set(CORE_MODULES.map((module) => module.key));
  const featureKeys = new Set(CORE_FEATURES.map((feature) => feature.key));
  const permissionKeys = new Set(CORE_PERMISSIONS.map((permission) => permission.key));
  const planKeys = new Set(CORE_PLANS.map((plan) => plan.key));

  for (const module of CORE_MODULES) {
    expect(planKeys.has(module.requiredPlanKey)).toBe(true);
    expect(module.featureKeys.length).toBeGreaterThan(0);
    expect(module.featureKeys.every((key) => featureKeys.has(key))).toBe(true);
    expect(module.permissionKeys.every((key) => permissionKeys.has(key))).toBe(true);
    expect((module.dependencies || []).every((key) => moduleKeys.has(key))).toBe(true);
    expect(module.navigation).toEqual(expect.objectContaining({
      label: expect.any(String),
      path: expect.stringMatching(/^\/app\//),
      iconKey: expect.any(String),
    }));
  }
});

test('tenant-owned coverage map includes current retained legal ERP collections', () => {
  const names = new Set(TENANT_OWNED_COLLECTIONS.map((item) => item.name));
  for (const required of [
    'users',
    'clients',
    'cases',
    'caseassignments',
    'tasks',
    'timeentries',
    'worksessions',
    'billables',
    'invoices',
    'invoicelines',
    'payments',
    'ratecards',
    'matterdocuments',
    'storeddocuments',
    'kpisnapshots',
  ]) {
    expect(names.has(required)).toBe(true);
  }
});

test('workspace foundation models validate the canonical product language', () => {
  expect(new Workspace({ name: 'Acme Legal Workspace' }).validateSync()).toBeUndefined();
  expect(new Plan({ key: 'solo', name: 'Solo' }).validateSync()).toBeUndefined();
  expect(new Feature({ key: 'workspace.core', name: 'Workspace Core' }).validateSync()).toBeUndefined();
  expect(new Permission({ key: 'workspace.read', name: 'View workspace', action: 'read', resource: 'workspace' }).validateSync()).toBeUndefined();
  expect(new Role({ key: 'owner', name: 'Owner' }).validateSync()).toBeUndefined();
  expect(new Policy({ workspaceId: '64b0000000000000000000aa', roleKey: 'owner', permissionKey: 'workspace.manage' }).validateSync()).toBeUndefined();
  expect(new ModuleRegistry({ key: 'dashboard', name: 'Dashboard' }).validateSync()).toBeUndefined();
  expect(new WorkspaceModule({ workspaceId: '64b0000000000000000000aa', moduleKey: 'dashboard' }).validateSync()).toBeUndefined();
  expect(new Subscription({ workspaceId: '64b0000000000000000000aa', planKey: 'professional' }).validateSync()).toBeUndefined();
  expect(new WorkspaceFeatureOverride({ workspaceId: '64b0000000000000000000aa', featureKey: 'ai.assistant', status: 'enabled' }).validateSync()).toBeUndefined();
});

test('workspace foundation migration is reversible', () => {
  expect(typeof up).toBe('function');
  expect(typeof down).toBe('function');
});

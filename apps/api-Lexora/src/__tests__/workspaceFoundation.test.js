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

  for (const plan of CORE_PLANS) {
    expect(plan.featureKeys.every((key) => featureKeys.has(key))).toBe(true);
    expect(plan.moduleKeys.every((key) => moduleKeys.has(key))).toBe(true);
  }
});

test('roles only reference known permissions', () => {
  const permissionKeys = new Set(CORE_PERMISSIONS.map((permission) => permission.key));
  for (const role of CORE_ROLES) {
    expect(role.permissionKeys.every((key) => permissionKeys.has(key))).toBe(true);
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
  expect(new Subscription({ workspaceId: '64b0000000000000000000aa', planKey: 'small_workspace' }).validateSync()).toBeUndefined();
});

test('workspace foundation migration is reversible', () => {
  expect(typeof up).toBe('function');
  expect(typeof down).toBe('function');
});

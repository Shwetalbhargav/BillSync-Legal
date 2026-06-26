import { expect, test } from 'vitest';
import { KpiSnapshot } from '../modules/kpi/models/KpiSnapshot.js';
import { REPORT_PERMISSIONS, requireReportAccess } from '../modules/reports/services/reportAccessService.js';

function reqForRole(role, permission = REPORT_PERMISSIONS.view) {
  return {
    workspaceId: '64b0000000000000000000aa',
    params: {},
    body: {},
    query: {},
    user: {
      id: '64b0000000000000000000cc',
      role,
      commercialRole: role,
      permissions: permission ? [permission] : [],
    },
  };
}

function resRecorder() {
  return {
    statusCode: 200,
    body: null,
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

test('report access allows a workspace member with report view permission', async () => {
  const req = reqForRole('accountant', REPORT_PERMISSIONS.view);
  const res = resRecorder();
  let called = false;

  await requireReportAccess(REPORT_PERMISSIONS.view)(req, res, () => {
    called = true;
  });

  expect(called).toBe(true);
  expect(req.reportAccess.authorization.permissionKey).toBe(REPORT_PERMISSIONS.view);
});

test('report access denies manage when the member only has view permission', async () => {
  const req = reqForRole('viewer', REPORT_PERMISSIONS.view);
  const res = resRecorder();
  let called = false;

  await requireReportAccess(REPORT_PERMISSIONS.manage, { write: true })(req, res, () => {
    called = true;
  });

  expect(called).toBe(false);
  expect(res.statusCode).toBe(403);
  expect(res.body.message).toBe('You do not have access to this area.');
});

test('report access requires an active workspace context', async () => {
  const req = reqForRole('accountant', REPORT_PERMISSIONS.view);
  req.workspaceId = null;
  const res = resRecorder();
  let called = false;

  await requireReportAccess(REPORT_PERMISSIONS.view)(req, res, () => {
    called = true;
  });

  expect(called).toBe(false);
  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe('Choose a workspace before opening reports.');
});

test('KPI snapshots are uniquely scoped within a workspace', () => {
  const indexes = KpiSnapshot.schema.indexes();
  expect(indexes.some(([keys, options]) => (
    keys.workspaceId === 1
      && keys.scope === 1
      && keys.scopeId === 1
      && keys.month === 1
      && options.unique === true
  ))).toBe(true);
});

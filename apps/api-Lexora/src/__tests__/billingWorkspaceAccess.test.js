import { expect, test } from 'vitest';
import { BILLING_PERMISSIONS, requireBillingAccess } from '../modules/billing/services/billingAccessService.js';

function reqForRole(role, permission = BILLING_PERMISSIONS.invoiceView) {
  return {
    workspaceId: '64b0000000000000000000aa',
    params: { id: '64b0000000000000000000bb' },
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
  const res = {
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
  return res;
}

test('billing access allows a workspace member with invoice view permission', async () => {
  const req = reqForRole('accountant', BILLING_PERMISSIONS.invoiceView);
  const res = resRecorder();
  let called = false;

  await requireBillingAccess(BILLING_PERMISSIONS.invoiceView)(req, res, () => {
    called = true;
  });

  expect(called).toBe(true);
  expect(req.billingAccess.authorization.permissionKey).toBe(BILLING_PERMISSIONS.invoiceView);
});

test('billing access denies invoice send when the member lacks that permission', async () => {
  const req = reqForRole('accountant', BILLING_PERMISSIONS.invoiceView);
  const res = resRecorder();
  let called = false;

  await requireBillingAccess(BILLING_PERMISSIONS.invoiceSend, { write: true })(req, res, () => {
    called = true;
  });

  expect(called).toBe(false);
  expect(res.statusCode).toBe(403);
  expect(res.body.message).toBe('You do not have access to this area.');
});

test('billing access requires an active workspace context', async () => {
  const req = reqForRole('owner', BILLING_PERMISSIONS.invoiceSend);
  req.workspaceId = null;
  const res = resRecorder();
  let called = false;

  await requireBillingAccess(BILLING_PERMISSIONS.invoiceSend, { write: true })(req, res, () => {
    called = true;
  });

  expect(called).toBe(false);
  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe('Choose a workspace before opening billing.');
});

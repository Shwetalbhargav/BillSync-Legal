import { expect, test } from 'vitest';
import { DOCUMENT_PERMISSIONS, requireDocumentAccess } from '../modules/documentStorage/services/documentAccessService.js';
import { StoredDocument } from '../modules/documentStorage/models/StoredDocument.js';

function reqForRole(role, permission = DOCUMENT_PERMISSIONS.read) {
  return {
    workspaceId: '64b0000000000000000000aa',
    params: { documentId: '64b0000000000000000000bb' },
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

test('document access allows a workspace member with document read permission', async () => {
  const req = reqForRole('accountant', DOCUMENT_PERMISSIONS.read);
  const res = resRecorder();
  let called = false;

  await requireDocumentAccess(DOCUMENT_PERMISSIONS.read)(req, res, () => {
    called = true;
  });

  expect(called).toBe(true);
  expect(req.documentAccess.authorization.permissionKey).toBe(DOCUMENT_PERMISSIONS.read);
});

test('document access denies create when the member only has read permission', async () => {
  const req = reqForRole('accountant', DOCUMENT_PERMISSIONS.read);
  const res = resRecorder();
  let called = false;

  await requireDocumentAccess(DOCUMENT_PERMISSIONS.create, { write: true })(req, res, () => {
    called = true;
  });

  expect(called).toBe(false);
  expect(res.statusCode).toBe(403);
  expect(res.body.message).toBe('You do not have access to this area.');
});

test('stored document storage references are unique within a workspace', () => {
  const indexes = StoredDocument.schema.indexes();
  expect(indexes.some(([keys, options]) => (
    keys.workspaceId === 1
      && keys.provider === 1
      && keys.storageKey === 1
      && options.unique === true
  ))).toBe(true);
});

import { expect, test } from 'vitest';
import { rejectOwnershipFields, sanitizeOwnershipFields } from '../middleware/workspaceContext.js';
import { signAuthToken, verifyAuthToken } from '../modules/auth/services/authTokenService.js';

test('auth tokens carry the canonical workspace identity', () => {
  const token = signAuthToken({
    _id: '64b000000000000000000001',
    role: 'admin',
    email: 'admin@example.com',
    firmId: '64b0000000000000000000aa',
    tokenVersion: 7,
  });

  const decoded = verifyAuthToken(token);

  expect(decoded.workspaceId).toBe('64b0000000000000000000aa');
  expect(decoded.tokenVersion).toBe(7);
});

test('protected payloads reject caller supplied ownership fields', async () => {
  const req = {
    method: 'POST',
    body: {
      displayName: 'Workspace A Client',
      workspaceId: '64b0000000000000000000aa',
      nested: { ownerUserId: '64b000000000000000000002' },
    },
  };
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
  let nextCalled = false;

  rejectOwnershipFields(req, res, () => {
    nextCalled = true;
  });

  expect(nextCalled).toBe(false);
  expect(res.statusCode).toBe(400);
  expect(res.body.fields).toEqual(['workspaceId', 'nested.ownerUserId']);
});

test('query sanitization removes ownership and NoSQL operator fields recursively', () => {
  const query = {
    status: 'active',
    firmId: '64b0000000000000000000aa',
    name: { $ne: 'foreign workspace' },
    nested: { workspaceId: '64b0000000000000000000bb' },
  };

  sanitizeOwnershipFields(query);

  expect(query).toEqual({
    status: 'active',
    name: {},
    nested: {},
  });
});


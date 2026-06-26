import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTH_PACKAGE } from '../src/index.js';

test('auth package declares its workspace-safe boundary', () => {
  assert.equal(AUTH_PACKAGE.tenantBoundary, 'Workspace');
  assert.equal(AUTH_PACKAGE.name, '@lexora/auth');
});

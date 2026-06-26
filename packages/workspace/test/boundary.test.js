import assert from 'node:assert/strict';
import test from 'node:test';
import { WORKSPACE_PACKAGE } from '../src/index.js';

test('workspace package declares Workspace as the tenant boundary', () => {
  assert.equal(WORKSPACE_PACKAGE.tenantBoundary, 'Workspace');
});

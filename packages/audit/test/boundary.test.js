import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIT_PACKAGE } from '../src/index.js';

test('audit package declares audit event ownership', () => {
  assert.ok(AUDIT_PACKAGE.ownedAreas.includes('audit-events'));
});

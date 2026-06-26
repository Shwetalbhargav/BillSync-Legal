import assert from 'node:assert/strict';
import test from 'node:test';
import { NOTIFICATIONS_PACKAGE } from '../src/index.js';

test('notifications package declares notification ownership', () => {
  assert.ok(NOTIFICATIONS_PACKAGE.ownedAreas.includes('digests'));
});

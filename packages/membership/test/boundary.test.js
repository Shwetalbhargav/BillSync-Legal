import assert from 'node:assert/strict';
import test from 'node:test';
import { MEMBERSHIP_PACKAGE } from '../src/index.js';

test('membership package owns member and invitation contracts', () => {
  assert.ok(MEMBERSHIP_PACKAGE.ownedAreas.includes('invitations'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { INTEGRATIONS_PACKAGE } from '../src/index.js';

test('integrations package declares provider integration ownership', () => {
  assert.ok(INTEGRATIONS_PACKAGE.ownedAreas.includes('provider-connections'));
});

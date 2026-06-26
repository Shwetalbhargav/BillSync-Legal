import assert from 'node:assert/strict';
import test from 'node:test';
import { PAYMENTS_PACKAGE } from '../src/index.js';

test('payments package declares payment state ownership', () => {
  assert.ok(PAYMENTS_PACKAGE.ownedAreas.includes('payment-state'));
});

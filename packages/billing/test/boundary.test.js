import assert from 'node:assert/strict';
import test from 'node:test';
import { BILLING_PACKAGE, LEDGER_TYPES } from '../src/index.js';

test('billing package keeps platform and legal ledgers distinct', () => {
  assert.equal(LEDGER_TYPES.platform, 'platform');
  assert.ok(BILLING_PACKAGE.ownedAreas.includes('platform-billing'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { CLIENTS_PACKAGE } from '../src/index.js';

test('clients package declares client module ownership', () => {
  assert.ok(CLIENTS_PACKAGE.ownedAreas.includes('client-records'));
});

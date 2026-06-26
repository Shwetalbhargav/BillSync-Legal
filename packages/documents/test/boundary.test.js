import assert from 'node:assert/strict';
import test from 'node:test';
import { DOCUMENTS_PACKAGE } from '../src/index.js';

test('documents package declares document ownership', () => {
  assert.ok(DOCUMENTS_PACKAGE.ownedAreas.includes('storage-access'));
});

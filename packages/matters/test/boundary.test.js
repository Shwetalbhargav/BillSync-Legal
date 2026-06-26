import assert from 'node:assert/strict';
import test from 'node:test';
import { MATTERS_PACKAGE } from '../src/index.js';

test('matters package declares matter ownership', () => {
  assert.ok(MATTERS_PACKAGE.ownedAreas.includes('assignments'));
});

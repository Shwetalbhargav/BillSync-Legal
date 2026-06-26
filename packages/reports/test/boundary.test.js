import assert from 'node:assert/strict';
import test from 'node:test';
import { REPORTS_PACKAGE } from '../src/index.js';

test('reports package declares report ownership', () => {
  assert.ok(REPORTS_PACKAGE.ownedAreas.includes('report-export'));
});

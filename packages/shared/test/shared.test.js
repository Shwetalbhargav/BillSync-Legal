import assert from 'node:assert/strict';
import test from 'node:test';
import { containsId, normalizeArray, packageBoundary, uniq } from '../src/index.js';

test('shared helpers normalize ids, arrays, and package metadata', () => {
  assert.equal(containsId([1, '2'], 2), true);
  assert.deepEqual(normalizeArray([' Client.Read ', null, 'MATTER.READ']), ['client.read', 'matter.read']);
  assert.deepEqual(uniq(['a', 'a', 'b']), ['a', 'b']);
  assert.equal(packageBoundary('@lexora/shared').tenantBoundary, 'Workspace');
});

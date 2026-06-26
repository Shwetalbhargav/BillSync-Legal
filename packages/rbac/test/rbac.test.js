import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePermissionKey, scopeMatchesPolicy } from '../src/index.js';

test('rbac package normalizes permission keys and evaluates policy scopes', () => {
  assert.equal(normalizePermissionKey(' Client.Read '), 'client.read');
  assert.equal(scopeMatchesPolicy({
    policy: { scope: 'practice_group', conditions: { practiceGroupKeys: ['disputes'] } },
    userId: 'user-1',
    user: { practiceGroupKey: 'disputes' },
  }), true);
  assert.equal(scopeMatchesPolicy({ policy: { scope: 'unknown' }, userId: 'user-1' }), false);
});

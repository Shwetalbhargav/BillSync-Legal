import assert from 'node:assert/strict';
import test from 'node:test';
import { AI_PACKAGE } from '../src/index.js';

test('ai package declares AI platform ownership', () => {
  assert.ok(AI_PACKAGE.ownedAreas.includes('ai-credits'));
});

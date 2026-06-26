import assert from 'node:assert/strict';
import test from 'node:test';
import { TASKS_PACKAGE } from '../src/index.js';

test('tasks package declares task ownership', () => {
  assert.ok(TASKS_PACKAGE.ownedAreas.includes('task-records'));
});

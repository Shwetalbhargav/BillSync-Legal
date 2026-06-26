import assert from 'node:assert/strict';
import test from 'node:test';
import { createSubscriptionAccessService } from '../src/index.js';

const service = createSubscriptionAccessService({
  features: [
    { key: 'workspace.core', name: 'Workspace Core' },
    { key: 'ai.assistant', name: 'AI Assistant', unavailableMessage: 'AI assistance is not included in the current plan.' },
  ],
  modules: [{ key: 'dashboard' }],
  plans: [
    { key: 'free', name: 'Free', featureKeys: ['workspace.core'], moduleKeys: ['dashboard'], limits: { aiCredits: 0 } },
    { key: 'professional', name: 'Professional', featureKeys: ['workspace.core', 'ai.assistant'], moduleKeys: ['dashboard'], limits: { aiCredits: 500 } },
  ],
  planAliases: { small_workspace: 'professional' },
});

test('subscription package resolves plan aliases and feature gates', () => {
  assert.equal(service.normalizePlanKey('small_workspace'), 'professional');
  assert.equal(service.resolvePlanAccess({ plan: service.getPlanDefinition('free'), featureKey: 'ai.assistant' }).allowed, false);
  assert.equal(service.resolvePlanAccess({ plan: service.getPlanDefinition('professional'), featureKey: 'ai.assistant' }).allowed, true);
});

test('subscription package represents payment trouble as read-only', () => {
  assert.deepEqual(service.subscriptionStatusAccess('past_due'), {
    allowed: false,
    behavior: 'read_only',
    reason: 'Your subscription needs attention. You can review existing information, but new actions are paused.',
  });
});

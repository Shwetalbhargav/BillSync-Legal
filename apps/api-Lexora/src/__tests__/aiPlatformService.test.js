import { expect, test } from 'vitest';
import { AiUsageEvent } from '../modules/ai/models/AiUsageEvent.js';
import {
  AI_CONSUMERS,
  AI_CREDIT_DEPLETED_MESSAGE,
  AI_PERMISSIONS,
  checkAiAccess,
  resolveAiCreditAccess,
} from '../modules/ai/services/aiPlatformService.js';

const WORKSPACE_ID = '64b0000000000000000000aa';
const USER_ID = '64b0000000000000000000cc';

function reqFor(role, permissions = []) {
  return {
    workspaceId: WORKSPACE_ID,
    body: {},
    query: {},
    user: {
      id: USER_ID,
      role,
      commercialRole: role,
      permissions,
    },
  };
}

test('AI platform registers module-specific consumers', () => {
  expect(Object.keys(AI_CONSUMERS).sort()).toEqual(['client', 'court', 'dashboard', 'document', 'invoice', 'matter', 'research']);
  expect(AI_CONSUMERS.client).toEqual(expect.objectContaining({
    moduleKey: 'clients',
    featureKey: 'ai.client_assist',
    permissionKey: AI_PERMISSIONS.client,
  }));
});

test('AI credit access allows and denies with product-safe messaging', () => {
  expect(resolveAiCreditAccess({ limit: 10, used: 8, estimatedCredits: 2 })).toEqual(expect.objectContaining({
    allowed: true,
    remaining: 2,
  }));
  expect(resolveAiCreditAccess({ limit: 10, used: 9, estimatedCredits: 2 })).toEqual(expect.objectContaining({
    allowed: false,
    reason: AI_CREDIT_DEPLETED_MESSAGE,
  }));
});

test('AI access allows a member with the consumer permission', async () => {
  const decision = await checkAiAccess({ req: reqFor('lawyer'), consumerKey: 'client' });
  expect(decision.allowed).toBe(true);
  expect(decision.consumer.key).toBe('client');
  expect(decision.permission.permissionKey).toBe(AI_PERMISSIONS.client);
});

test('AI access denies a missing consumer permission', async () => {
  const decision = await checkAiAccess({ req: reqFor('accountant'), consumerKey: 'research' });
  expect(decision.allowed).toBe(false);
  expect(decision.statusCode).toBe(403);
  expect(decision.state).toBe('permission');
});

test('AI usage is indexed by workspace, member, and module', () => {
  const indexes = AiUsageEvent.schema.indexes();
  expect(indexes.some(([keys]) => keys.workspaceId === 1 && keys.memberId === 1 && keys.createdAt === -1)).toBe(true);
  expect(indexes.some(([keys]) => keys.workspaceId === 1 && keys.moduleKey === 1 && keys.createdAt === -1)).toBe(true);
});

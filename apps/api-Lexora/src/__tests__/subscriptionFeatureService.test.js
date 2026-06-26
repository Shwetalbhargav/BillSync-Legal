import { describe, expect, test } from 'vitest';
import {
  getPlanDefinition,
  normalizePlanKey,
  resolvePlanAccess,
  subscriptionStatusAccess,
} from '../modules/workspace/services/subscriptionFeatureService.js';

describe('subscription feature access service', () => {
  test('normalizes legacy signup plan keys to the canonical plan catalog', () => {
    expect(normalizePlanKey('small_workspace')).toBe('professional');
    expect(getPlanDefinition('small_workspace').key).toBe('professional');
  });

  test('allows features included by the active workspace plan', () => {
    const access = resolvePlanAccess({
      plan: getPlanDefinition('business'),
      subscriptionStatus: 'active',
      featureKey: 'ai.matter_qna',
    });

    expect(access.allowed).toBe(true);
    expect(access.behavior).toBe('enabled');
    expect(access.source).toBe('plan');
    expect(access.limits.aiCredits).toBe(2500);
  });

  test('denies features outside the active workspace plan with product-safe messaging', () => {
    const access = resolvePlanAccess({
      plan: getPlanDefinition('free'),
      subscriptionStatus: 'active',
      featureKey: 'ai.assistant',
    });

    expect(access.allowed).toBe(false);
    expect(access.behavior).toBe('disable');
    expect(access.reason).toBe('AI assistance is not included in the current plan.');
  });

  test('represents past due and cancelled subscriptions as read-only', () => {
    expect(subscriptionStatusAccess('past_due')).toEqual(expect.objectContaining({
      allowed: false,
      behavior: 'read_only',
    }));
    expect(subscriptionStatusAccess('cancelled')).toEqual(expect.objectContaining({
      allowed: false,
      behavior: 'read_only',
    }));
  });

  test('workspace overrides can grant or restrict a feature independent of plan hierarchy', () => {
    const enabled = resolvePlanAccess({
      plan: getPlanDefinition('free'),
      subscriptionStatus: 'active',
      featureKey: 'ai.assistant',
      override: { status: 'enabled', limitOverrides: { aiCredits: 25 }, reason: 'Pilot access' },
    });
    expect(enabled.allowed).toBe(true);
    expect(enabled.source).toBe('workspace_override');
    expect(enabled.limits.aiCredits).toBe(25);

    const readOnly = resolvePlanAccess({
      plan: getPlanDefinition('business'),
      subscriptionStatus: 'active',
      featureKey: 'billing.core',
      override: { status: 'read_only', reason: 'Billing review is paused' },
    });
    expect(readOnly.allowed).toBe(false);
    expect(readOnly.behavior).toBe('read_only');
    expect(readOnly.reason).toBe('Billing review is paused');
  });
});

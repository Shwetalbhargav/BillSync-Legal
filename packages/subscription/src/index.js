import { byKey, packageBoundary } from '../../shared/src/index.js';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const LIMITED_SUBSCRIPTION_STATUSES = new Set(['past_due']);
const CANCELLED_SUBSCRIPTION_STATUSES = new Set(['canceled', 'cancelled']);

export const SUBSCRIPTION_PACKAGE = packageBoundary('@lexora/subscription', [
  'plan-catalog',
  'feature-catalog',
  'workspace-subscription',
  'feature-overrides',
]);

export function createSubscriptionAccessService({
  features = [],
  modules = [],
  plans = [],
  planAliases = {},
} = {}) {
  const featureByKey = byKey(features);
  const moduleByKey = byKey(modules);
  const planByKey = byKey(plans);

  function normalizePlanKey(planKey = 'professional') {
    const key = String(planKey || 'professional').trim().toLowerCase();
    return planAliases[key] || key;
  }

  function getPlanDefinition(planKey = 'professional') {
    return planByKey.get(normalizePlanKey(planKey)) || planByKey.get('professional') || plans[0] || null;
  }

  function publicPlan(plan) {
    if (!plan) return null;
    const obj = typeof plan.toObject === 'function' ? plan.toObject() : plan;
    const definition = getPlanDefinition(obj.key) || {};
    return {
      key: normalizePlanKey(obj.key),
      name: obj.name || definition.name,
      status: obj.status || definition.status,
      featureKeys: obj.featureKeys || definition.featureKeys || [],
      moduleKeys: obj.moduleKeys || definition.moduleKeys || [],
      limits: obj.limits || definition.limits || {},
      usage: obj.usage || definition.usage || definition.limits || {},
      price: obj.price || definition.price || {},
      metadata: obj.metadata || definition.metadata || {},
    };
  }

  function publicFeature(feature) {
    if (!feature) return null;
    const obj = typeof feature.toObject === 'function' ? feature.toObject() : feature;
    const definition = featureByKey.get(obj.key) || {};
    return {
      key: obj.key,
      name: obj.name || definition.name,
      category: obj.category || definition.category || 'platform',
      status: obj.status || definition.status || 'active',
      description: obj.description || definition.description,
      gateBehavior: obj.gateBehavior || definition.gateBehavior || 'disable',
      unavailableMessage: obj.unavailableMessage || definition.unavailableMessage || 'This feature is not included in the current plan.',
      usageMetric: obj.usageMetric || definition.usageMetric || 'none',
      metadata: obj.metadata || definition.metadata || {},
    };
  }

  function publicSubscription(subscription, plan) {
    if (!subscription) return null;
    const obj = typeof subscription.toObject === 'function' ? subscription.toObject() : subscription;
    return {
      id: String(obj._id || obj.id),
      workspaceId: String(obj.workspaceId),
      planKey: normalizePlanKey(obj.planKey),
      status: obj.status,
      source: obj.source,
      startedAt: obj.startedAt,
      currentPeriodStart: obj.currentPeriodStart,
      currentPeriodEnd: obj.currentPeriodEnd,
      canceledAt: obj.canceledAt,
      limits: obj.limitsSnapshot || plan?.limits || {},
      featureKeys: obj.featureKeysSnapshot || plan?.featureKeys || [],
      moduleKeys: obj.moduleKeysSnapshot || plan?.moduleKeys || [],
    };
  }

  function subscriptionStatusAccess(status = 'active') {
    if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) return { allowed: true, behavior: 'enabled', reason: null };
    if (LIMITED_SUBSCRIPTION_STATUSES.has(status)) {
      return {
        allowed: false,
        behavior: 'read_only',
        reason: 'Your subscription needs attention. You can review existing information, but new actions are paused.',
      };
    }
    if (CANCELLED_SUBSCRIPTION_STATUSES.has(status)) {
      return {
        allowed: false,
        behavior: 'read_only',
        reason: 'This subscription is cancelled. Existing records remain available for review.',
      };
    }
    return {
      allowed: false,
      behavior: 'disable',
      reason: 'This workspace does not have an active subscription.',
    };
  }

  function resolvePlanAccess({
    plan,
    subscriptionStatus = 'active',
    feature,
    featureKey,
    module,
    moduleKey,
    override,
  }) {
    const resolvedPlan = publicPlan(plan || getPlanDefinition('professional'));
    const resolvedFeatureKey = String(featureKey || feature?.key || '').toLowerCase();
    const resolvedModuleKey = String(moduleKey || module?.key || '').toLowerCase();
    const featureInfo = publicFeature(feature || featureByKey.get(resolvedFeatureKey));
    const moduleInfo = module || moduleByKey.get(resolvedModuleKey);
    const planFeatureKeys = new Set(resolvedPlan?.featureKeys || []);
    const planModuleKeys = new Set(resolvedPlan?.moduleKeys || []);
    const statusAccess = subscriptionStatusAccess(subscriptionStatus);

    if (!statusAccess.allowed) {
      return {
        allowed: false,
        behavior: statusAccess.behavior,
        source: 'subscription_status',
        reason: statusAccess.reason,
        plan: resolvedPlan,
        feature: featureInfo,
        module: moduleInfo || null,
        limits: resolvedPlan?.limits || {},
      };
    }

    if (override) {
      const obj = typeof override.toObject === 'function' ? override.toObject() : override;
      if (!obj.expiresAt || new Date(obj.expiresAt).getTime() > Date.now()) {
        if (obj.status === 'enabled') {
          return {
            allowed: true,
            behavior: 'enabled',
            source: 'workspace_override',
            reason: obj.reason || null,
            plan: resolvedPlan,
            feature: featureInfo,
            module: moduleInfo || null,
            limits: { ...(resolvedPlan?.limits || {}), ...(obj.limitOverrides || {}) },
          };
        }
        return {
          allowed: false,
          behavior: obj.status === 'read_only' ? 'read_only' : (obj.behavior || featureInfo?.gateBehavior || 'disable'),
          source: 'workspace_override',
          reason: obj.reason || featureInfo?.unavailableMessage || 'This feature is not available for this workspace.',
          plan: resolvedPlan,
          feature: featureInfo,
          module: moduleInfo || null,
          limits: { ...(resolvedPlan?.limits || {}), ...(obj.limitOverrides || {}) },
        };
      }
    }

    const featureAllowed = resolvedFeatureKey ? planFeatureKeys.has(resolvedFeatureKey) : true;
    const moduleAllowed = resolvedModuleKey ? planModuleKeys.has(resolvedModuleKey) : true;
    if (featureAllowed && moduleAllowed) {
      return {
        allowed: true,
        behavior: 'enabled',
        source: 'plan',
        reason: null,
        plan: resolvedPlan,
        feature: featureInfo,
        module: moduleInfo || null,
        limits: resolvedPlan?.limits || {},
      };
    }

    return {
      allowed: false,
      behavior: featureInfo?.gateBehavior || 'disable',
      source: 'plan',
      reason: featureInfo?.unavailableMessage || 'This capability is not included in the current plan.',
      plan: resolvedPlan,
      feature: featureInfo,
      module: moduleInfo || null,
      limits: resolvedPlan?.limits || {},
    };
  }

  return {
    normalizePlanKey,
    getPlanDefinition,
    publicPlan,
    publicFeature,
    publicSubscription,
    subscriptionStatusAccess,
    resolvePlanAccess,
  };
}

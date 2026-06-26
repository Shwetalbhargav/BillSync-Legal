import Feature from '../models/Feature.js';
import ModuleRegistry from '../models/ModuleRegistry.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import WorkspaceFeatureOverride from '../models/WorkspaceFeatureOverride.js';
import WorkspaceModule from '../models/WorkspaceModule.js';
import {
  CORE_FEATURES,
  CORE_MODULES,
  CORE_PLANS,
  PLAN_ALIASES,
} from './workspaceFoundationService.js';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const LIMITED_SUBSCRIPTION_STATUSES = new Set(['past_due']);
const CANCELLED_SUBSCRIPTION_STATUSES = new Set(['canceled', 'cancelled']);

function byKey(items) {
  return new Map(items.map((item) => [item.key, item]));
}

const CORE_FEATURE_BY_KEY = byKey(CORE_FEATURES);
const CORE_MODULE_BY_KEY = byKey(CORE_MODULES);
const CORE_PLAN_BY_KEY = byKey(CORE_PLANS);

export function normalizePlanKey(planKey = 'professional') {
  const key = String(planKey || 'professional').trim().toLowerCase();
  return PLAN_ALIASES[key] || key;
}

export function getPlanDefinition(planKey = 'professional') {
  return CORE_PLAN_BY_KEY.get(normalizePlanKey(planKey)) || CORE_PLAN_BY_KEY.get('professional');
}

export function publicPlan(plan) {
  if (!plan) return null;
  const obj = typeof plan.toObject === 'function' ? plan.toObject() : plan;
  const definition = getPlanDefinition(obj.key);
  return {
    key: normalizePlanKey(obj.key),
    name: obj.name || definition.name,
    status: obj.status || definition.status,
    featureKeys: obj.featureKeys || definition.featureKeys,
    moduleKeys: obj.moduleKeys || definition.moduleKeys,
    limits: obj.limits || definition.limits,
    usage: obj.usage || definition.usage || definition.limits,
    price: obj.price || definition.price,
    metadata: obj.metadata || definition.metadata || {},
  };
}

export function publicFeature(feature) {
  if (!feature) return null;
  const obj = typeof feature.toObject === 'function' ? feature.toObject() : feature;
  const definition = CORE_FEATURE_BY_KEY.get(obj.key) || {};
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

export function publicSubscription(subscription, plan) {
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

export function subscriptionStatusAccess(status = 'active') {
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

export function resolvePlanAccess({
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
  const featureInfo = publicFeature(feature || CORE_FEATURE_BY_KEY.get(resolvedFeatureKey));
  const moduleInfo = module || CORE_MODULE_BY_KEY.get(resolvedModuleKey);
  const planFeatureKeys = new Set(resolvedPlan.featureKeys || []);
  const planModuleKeys = new Set(resolvedPlan.moduleKeys || []);
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
      limits: resolvedPlan.limits || {},
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
          limits: { ...(resolvedPlan.limits || {}), ...(obj.limitOverrides || {}) },
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
        limits: { ...(resolvedPlan.limits || {}), ...(obj.limitOverrides || {}) },
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
      limits: resolvedPlan.limits || {},
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
    limits: resolvedPlan.limits || {},
  };
}

export async function getPlanCatalog() {
  const rows = await Plan.find({ status: { $ne: 'retired' } }).sort({ 'metadata.catalogOrder': 1, key: 1 });
  if (rows.length) return rows.map(publicPlan);
  return CORE_PLANS.map(publicPlan);
}

export async function getFeatureCatalog() {
  const rows = await Feature.find({ status: { $ne: 'retired' } }).sort({ category: 1, key: 1 });
  if (rows.length) return rows.map(publicFeature);
  return CORE_FEATURES.map(publicFeature);
}

export async function getWorkspaceSubscription(workspaceId) {
  const subscription = await Subscription.findOne({
    workspaceId,
    status: { $in: ['active', 'trialing', 'past_due', 'canceled', 'cancelled'] },
  }).sort({ updatedAt: -1 });
  const planKey = normalizePlanKey(subscription?.planKey);
  const plan = await Plan.findOne({ key: planKey, status: { $ne: 'retired' } });
  const fallbackPlan = getPlanDefinition(planKey);
  return {
    subscription,
    plan: publicPlan(plan || fallbackPlan),
  };
}

export async function getWorkspaceFeatureAccess({ workspaceId, featureKey }) {
  const normalizedFeatureKey = String(featureKey || '').trim().toLowerCase();
  const [{ subscription, plan }, feature, override] = await Promise.all([
    getWorkspaceSubscription(workspaceId),
    Feature.findOne({ key: normalizedFeatureKey }),
    WorkspaceFeatureOverride.findOne({ workspaceId, featureKey: normalizedFeatureKey }),
  ]);
  return resolvePlanAccess({
    plan,
    subscriptionStatus: subscription?.status,
    feature: feature || CORE_FEATURE_BY_KEY.get(normalizedFeatureKey),
    featureKey: normalizedFeatureKey,
    override,
  });
}

export async function getWorkspaceModuleAccess({ workspaceId, moduleKey }) {
  const normalizedModuleKey = String(moduleKey || '').trim().toLowerCase();
  const moduleDefinition = CORE_MODULE_BY_KEY.get(normalizedModuleKey);
  const [{ subscription, plan }, moduleRegistry, workspaceModule] = await Promise.all([
    getWorkspaceSubscription(workspaceId),
    ModuleRegistry.findOne({ key: normalizedModuleKey }),
    WorkspaceModule.findOne({ workspaceId, moduleKey: normalizedModuleKey }),
  ]);
  const moduleInfo = moduleRegistry || moduleDefinition;
  const firstFeatureKey = moduleInfo?.featureKeys?.[0];
  const override = firstFeatureKey
    ? await WorkspaceFeatureOverride.findOne({ workspaceId, featureKey: firstFeatureKey })
    : null;

  if (workspaceModule && workspaceModule.status !== 'enabled') {
    const workspaceModuleBehavior = {
      disabled: 'disable',
      hidden: 'hide',
      read_only: 'read_only',
      experimental: 'enabled',
      not_configured: 'disable',
    }[workspaceModule.status] || 'disable';
    return {
      allowed: workspaceModule.status === 'experimental',
      behavior: workspaceModuleBehavior,
      source: 'workspace_module',
      reason: workspaceModule.reason || 'This module is not available for this workspace.',
      plan,
      module: moduleInfo || null,
      limits: plan?.limits || {},
    };
  }

  return resolvePlanAccess({
    plan,
    subscriptionStatus: subscription?.status,
    featureKey: firstFeatureKey,
    module: moduleInfo,
    moduleKey: normalizedModuleKey,
    override,
  });
}

export async function isFeatureEnabled({ workspaceId, featureKey }) {
  const access = await getWorkspaceFeatureAccess({ workspaceId, featureKey });
  return access.allowed;
}

export async function hasPlanAccess({ workspaceId, featureKey, moduleKey }) {
  if (featureKey) return getWorkspaceFeatureAccess({ workspaceId, featureKey });
  if (moduleKey) return getWorkspaceModuleAccess({ workspaceId, moduleKey });
  const { subscription, plan } = await getWorkspaceSubscription(workspaceId);
  return resolvePlanAccess({ plan, subscriptionStatus: subscription?.status });
}

export async function upsertWorkspaceFeatureOverride({
  workspaceId,
  featureKey,
  status,
  behavior,
  limitOverrides,
  reason,
  actorId,
}) {
  const normalizedFeatureKey = String(featureKey || '').trim().toLowerCase();
  const feature = await Feature.findOne({ key: normalizedFeatureKey });
  if (!feature && !CORE_FEATURE_BY_KEY.has(normalizedFeatureKey)) {
    const error = new Error('Choose a known feature.');
    error.statusCode = 400;
    throw error;
  }
  if (!['enabled', 'disabled', 'read_only'].includes(status)) {
    const error = new Error('Choose enabled, disabled, or read-only.');
    error.statusCode = 400;
    throw error;
  }

  const update = {
    status,
    behavior: behavior || (status === 'read_only' ? 'read_only' : 'disable'),
    limitOverrides: limitOverrides || {},
    reason,
    source: actorId ? 'owner' : 'support',
  };
  const row = await WorkspaceFeatureOverride.findOneAndUpdate(
    { workspaceId, featureKey: normalizedFeatureKey },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return row;
}

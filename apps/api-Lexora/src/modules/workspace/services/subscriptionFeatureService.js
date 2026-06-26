import Feature from '../models/Feature.js';
import ModuleRegistry from '../models/ModuleRegistry.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import WorkspaceFeatureOverride from '../models/WorkspaceFeatureOverride.js';
import WorkspaceModule from '../models/WorkspaceModule.js';
import { createSubscriptionAccessService } from '../../../../../../packages/subscription/src/index.js';
import {
  CORE_FEATURES,
  CORE_MODULES,
  CORE_PLANS,
  PLAN_ALIASES,
} from './workspaceFoundationService.js';

const subscriptionAccess = createSubscriptionAccessService({
  features: CORE_FEATURES,
  modules: CORE_MODULES,
  plans: CORE_PLANS,
  planAliases: PLAN_ALIASES,
});
const CORE_FEATURE_BY_KEY = new Map(CORE_FEATURES.map((feature) => [feature.key, feature]));
const CORE_MODULE_BY_KEY = new Map(CORE_MODULES.map((module) => [module.key, module]));

export const {
  normalizePlanKey,
  getPlanDefinition,
  publicPlan,
  publicFeature,
  publicSubscription,
  subscriptionStatusAccess,
  resolvePlanAccess,
} = subscriptionAccess;

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

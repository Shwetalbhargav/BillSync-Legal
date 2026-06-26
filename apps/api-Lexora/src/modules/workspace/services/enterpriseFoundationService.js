import AuditEvent from '../models/AuditEvent.js';
import EnterpriseApiKey from '../models/EnterpriseApiKey.js';
import EnterpriseSetting from '../models/EnterpriseSetting.js';
import EnterpriseUnit from '../models/EnterpriseUnit.js';
import EnterpriseWebhook from '../models/EnterpriseWebhook.js';
import { getWorkspaceFeatureAccess } from './subscriptionFeatureService.js';

export const ENTERPRISE_FEATURE_KEY = 'enterprise.foundations';

export const ENTERPRISE_PERMISSIONS = {
  read: 'enterprise.read',
  manage: 'enterprise.manage',
  audit: 'enterprise.audit',
};

export const ENTERPRISE_SETTING_DEFAULTS = [
  { category: 'sso', displayName: 'Single sign-on', message: 'Single sign-on can be connected when the identity provider is ready.' },
  { category: 'scim', displayName: 'Directory sync', message: 'Directory sync can be connected after identity setup.' },
  { category: 'api_keys', displayName: 'API keys', message: 'API keys are prepared but secure key creation is not enabled yet.' },
  { category: 'webhooks', displayName: 'Webhooks', message: 'Webhook delivery can be connected when event contracts are approved.' },
  { category: 'audit_logs', displayName: 'Audit logs', message: 'Sensitive workspace events will appear here as enterprise actions are connected.' },
  { category: 'data_retention', displayName: 'Data retention', message: 'Retention policies can be configured after policy review.' },
  { category: 'white_label', displayName: 'White label settings', message: 'Workspace branding controls are prepared for later setup.' },
  { category: 'custom_workflows', displayName: 'Custom workflows', message: 'Workflow automation is prepared but not active yet.' },
  { category: 'custom_roles', displayName: 'Custom roles', message: 'Custom role templates will extend the current permission model.' },
];

const ENTERPRISE_UNIT_TYPES = new Set(['department', 'office', 'practice_group']);
const ENTERPRISE_SETTING_CATEGORIES = new Set(ENTERPRISE_SETTING_DEFAULTS.map((setting) => setting.category));

function canReadCollections() {
  return EnterpriseSetting.db?.readyState === 1;
}

function idText(value) {
  return value == null ? '' : String(value);
}

function keyFromName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function enterpriseFeatureHiddenState(reason = 'Enterprise controls are available on Enterprise plans.') {
  return {
    enabled: false,
    state: 'hidden',
    message: reason,
    units: { departments: [], offices: [], practiceGroups: [] },
    settings: ENTERPRISE_SETTING_DEFAULTS.map((setting) => ({ ...setting, status: 'not_configured' })),
    apiKeys: [],
    webhooks: [],
    auditEvents: [],
    backendGaps: enterpriseBackendGaps(),
  };
}

export function enterpriseBackendGaps() {
  return [
    { area: 'Single sign-on', status: 'not_configured', routeNeeded: 'Identity provider setup is not connected yet.' },
    { area: 'Directory sync', status: 'not_configured', routeNeeded: 'Automatic member provisioning is not connected yet.' },
    { area: 'API keys', status: 'not_configured', routeNeeded: 'Key creation and rotation are not connected yet.' },
    { area: 'Webhooks', status: 'not_configured', routeNeeded: 'Event delivery and retry handling are not connected yet.' },
    { area: 'Custom workflows', status: 'not_configured', routeNeeded: 'Workflow execution is not connected yet.' },
  ];
}

export function publicEnterpriseUnit(unit) {
  const obj = typeof unit?.toObject === 'function' ? unit.toObject() : unit;
  if (!obj) return null;
  return {
    id: idText(obj._id || obj.id),
    type: obj.type,
    key: obj.key,
    name: obj.name,
    status: obj.status || 'active',
    parentUnitId: idText(obj.parentUnitId),
    leaderMemberId: idText(obj.leaderMemberId),
    metadata: obj.metadata || {},
  };
}

export function publicEnterpriseSetting(setting) {
  const obj = typeof setting?.toObject === 'function' ? setting.toObject() : setting;
  const fallback = ENTERPRISE_SETTING_DEFAULTS.find((item) => item.category === obj?.category) || {};
  return {
    category: obj?.category || fallback.category,
    displayName: obj?.displayName || fallback.displayName,
    status: obj?.status || 'not_configured',
    provider: obj?.provider || '',
    message: obj?.metadata?.message || fallback.message,
    lastCheckedAt: obj?.lastCheckedAt || null,
    configuration: obj?.configuration || {},
  };
}

export function publicEnterpriseApiKey(apiKey) {
  const obj = typeof apiKey?.toObject === 'function' ? apiKey.toObject() : apiKey;
  if (!obj) return null;
  return {
    id: idText(obj._id || obj.id),
    name: obj.name,
    keyPrefix: obj.keyPrefix || 'Not issued',
    scopes: obj.scopes || [],
    status: obj.status || 'disabled',
    lastUsedAt: obj.lastUsedAt || null,
    expiresAt: obj.expiresAt || null,
  };
}

export function publicEnterpriseWebhook(webhook) {
  const obj = typeof webhook?.toObject === 'function' ? webhook.toObject() : webhook;
  if (!obj) return null;
  return {
    id: idText(obj._id || obj.id),
    name: obj.name,
    url: obj.url || '',
    events: obj.events || [],
    status: obj.status || 'not_configured',
    lastDeliveryAt: obj.lastDeliveryAt || null,
    failureCount: Number(obj.failureCount || 0),
  };
}

export function publicAuditEvent(event) {
  const obj = typeof event?.toObject === 'function' ? event.toObject() : event;
  if (!obj) return null;
  return {
    id: idText(obj._id || obj.id),
    action: obj.action,
    actorId: idText(obj.actorId),
    targetType: obj.targetType,
    targetId: idText(obj.targetId),
    createdAt: obj.createdAt,
    metadata: obj.metadata || {},
  };
}

export async function getEnterpriseFeatureState(workspaceId) {
  if (!workspaceId) return enterpriseFeatureHiddenState('Choose a workspace before opening enterprise controls.');
  if (!canReadCollections()) return { enabled: true, state: 'enabled', source: 'test_fallback' };
  const access = await getWorkspaceFeatureAccess({ workspaceId, featureKey: ENTERPRISE_FEATURE_KEY });
  if (!access.allowed || access.behavior === 'hide') {
    return enterpriseFeatureHiddenState(access.reason || access.feature?.unavailableMessage);
  }
  return { enabled: true, state: access.behavior || 'enabled', source: access.source, limits: access.limits || {} };
}

export async function seedEnterpriseDefaults({ workspaceId }) {
  if (!workspaceId || !canReadCollections()) return [];
  const rows = [];
  for (const setting of ENTERPRISE_SETTING_DEFAULTS) {
    const row = await EnterpriseSetting.findOneAndUpdate(
      { workspaceId, category: setting.category },
      {
        $setOnInsert: {
          displayName: setting.displayName,
          status: 'not_configured',
          configuration: {},
          metadata: { message: setting.message },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    rows.push(row);
  }
  return rows;
}

export async function getEnterpriseOverview({ workspaceId, includeAudit = true }) {
  const featureState = await getEnterpriseFeatureState(workspaceId);
  if (!featureState.enabled) return featureState;

  if (!canReadCollections()) {
    return {
      enabled: true,
      state: 'enabled',
      units: { departments: [], offices: [], practiceGroups: [] },
      settings: ENTERPRISE_SETTING_DEFAULTS.map((setting) => ({ ...setting, status: 'not_configured' })),
      apiKeys: [],
      webhooks: [],
      auditEvents: [],
      backendGaps: enterpriseBackendGaps(),
    };
  }

  const settings = await seedEnterpriseDefaults({ workspaceId });
  const [units, apiKeys, webhooks, auditEvents] = await Promise.all([
    EnterpriseUnit.find({ workspaceId, status: { $ne: 'archived' } }).sort({ type: 1, name: 1 }).lean(),
    EnterpriseApiKey.find({ workspaceId, status: { $ne: 'revoked' } }).sort({ updatedAt: -1 }).limit(25).lean(),
    EnterpriseWebhook.find({ workspaceId }).sort({ updatedAt: -1 }).limit(25).lean(),
    includeAudit
      ? AuditEvent.find({ workspaceId, targetType: { $in: ['enterprise', 'enterprise_unit', 'enterprise_setting', 'enterprise_api_key', 'enterprise_webhook'] } })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean()
      : Promise.resolve([]),
  ]);

  const publicUnits = units.map(publicEnterpriseUnit);
  return {
    enabled: true,
    state: featureState.state,
    units: {
      departments: publicUnits.filter((unit) => unit.type === 'department'),
      offices: publicUnits.filter((unit) => unit.type === 'office'),
      practiceGroups: publicUnits.filter((unit) => unit.type === 'practice_group'),
    },
    settings: settings.map(publicEnterpriseSetting),
    apiKeys: apiKeys.map(publicEnterpriseApiKey),
    webhooks: webhooks.map(publicEnterpriseWebhook),
    auditEvents: auditEvents.map(publicAuditEvent),
    backendGaps: enterpriseBackendGaps(),
  };
}

export async function createEnterpriseUnit({ workspaceId, type, name, key, actorId, metadata }) {
  if (!ENTERPRISE_UNIT_TYPES.has(type)) {
    const error = new Error('Choose department, office, or practice group.');
    error.statusCode = 400;
    throw error;
  }
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    const error = new Error('Enter a name before saving.');
    error.statusCode = 400;
    throw error;
  }
  const normalizedKey = keyFromName(key || normalizedName);
  if (!normalizedKey) {
    const error = new Error('Enter a clear name before saving.');
    error.statusCode = 400;
    throw error;
  }

  const unit = await EnterpriseUnit.findOneAndUpdate(
    { workspaceId, type, key: normalizedKey },
    { $set: { name: normalizedName, status: 'active', metadata: metadata || {} } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await AuditEvent.create({
    workspaceId,
    actorId,
    action: 'enterprise.unit_saved',
    targetType: 'enterprise_unit',
    targetId: unit._id,
    metadata: { type, key: normalizedKey },
  });

  return publicEnterpriseUnit(unit);
}

export async function upsertEnterpriseSetting({ workspaceId, category, status = 'not_configured', provider, configuration = {}, actorId }) {
  if (!ENTERPRISE_SETTING_CATEGORIES.has(category)) {
    const error = new Error('Choose a supported enterprise setting.');
    error.statusCode = 400;
    throw error;
  }
  if (!['not_configured', 'enabled', 'disabled'].includes(status)) {
    const error = new Error('Choose enabled, disabled, or not configured.');
    error.statusCode = 400;
    throw error;
  }
  const fallback = ENTERPRISE_SETTING_DEFAULTS.find((setting) => setting.category === category);
  const setting = await EnterpriseSetting.findOneAndUpdate(
    { workspaceId, category },
    {
      $set: {
        displayName: fallback.displayName,
        status,
        provider,
        configuration,
        lastCheckedAt: new Date(),
        metadata: { message: fallback.message },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await AuditEvent.create({
    workspaceId,
    actorId,
    action: 'enterprise.setting_saved',
    targetType: 'enterprise_setting',
    targetId: setting._id,
    metadata: { category, status },
  });

  return publicEnterpriseSetting(setting);
}

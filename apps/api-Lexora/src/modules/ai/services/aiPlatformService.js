import mongoose from 'mongoose';
import { can, PERMISSION_DENIED_MESSAGE } from '../../workspace/services/rbacPolicyService.js';
import { getWorkspaceFeatureAccess } from '../../workspace/services/subscriptionFeatureService.js';
import { AuditEvent } from '../../workspace/models/AuditEvent.js';
import { AiUsageEvent } from '../models/AiUsageEvent.js';

export const AI_MODULE_KEY = 'ai';
export const AI_CREDIT_DEPLETED_MESSAGE = 'AI credits are used up for this workspace. You can try again after credits renew or ask an owner to adjust the plan.';
export const AI_UNAVAILABLE_MESSAGE = 'AI is not available for this workspace.';

export const AI_PERMISSIONS = {
  use: 'ai.use',
  client: 'ai.client',
  matter: 'ai.matter',
  invoice: 'ai.invoice',
  document: 'ai.document',
  court: 'ai.court',
  research: 'ai.research',
  dashboard: 'ai.dashboard',
  manage: 'ai.manage',
};

export const AI_CONSUMERS = {
  dashboard: {
    key: 'dashboard',
    moduleKey: 'dashboard',
    action: 'assist',
    featureKey: 'ai.dashboard_assist',
    permissionKey: AI_PERMISSIONS.dashboard,
    estimatedCredits: 1,
    sensitive: false,
    label: 'Dashboard AI',
  },
  client: {
    key: 'client',
    moduleKey: 'clients',
    action: 'assist',
    featureKey: 'ai.client_assist',
    permissionKey: AI_PERMISSIONS.client,
    estimatedCredits: 1,
    sensitive: true,
    label: 'Client AI',
  },
  matter: {
    key: 'matter',
    moduleKey: 'matters',
    action: 'answer',
    featureKey: 'ai.matter_assist',
    permissionKey: AI_PERMISSIONS.matter,
    estimatedCredits: 2,
    sensitive: true,
    label: 'Matter AI',
  },
  invoice: {
    key: 'invoice',
    moduleKey: 'billing',
    action: 'draft',
    featureKey: 'ai.invoice_assist',
    permissionKey: AI_PERMISSIONS.invoice,
    estimatedCredits: 1,
    sensitive: true,
    label: 'Invoice AI',
  },
  document: {
    key: 'document',
    moduleKey: 'documents',
    action: 'draft',
    featureKey: 'ai.document_assist',
    permissionKey: AI_PERMISSIONS.document,
    estimatedCredits: 3,
    sensitive: true,
    label: 'Document AI',
  },
  court: {
    key: 'court',
    moduleKey: 'court-sync',
    action: 'assist',
    featureKey: 'ai.court_assist',
    permissionKey: AI_PERMISSIONS.court,
    estimatedCredits: 2,
    sensitive: true,
    label: 'Court AI',
  },
  research: {
    key: 'research',
    moduleKey: 'ai',
    action: 'research',
    featureKey: 'ai.research_assist',
    permissionKey: AI_PERMISSIONS.research,
    estimatedCredits: 2,
    sensitive: true,
    label: 'Research AI',
  },
};

function canReadPlatformCollections() {
  return process.env.NODE_ENV !== 'test' || AiUsageEvent.db?.readyState === 1;
}

function toObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '')) ? new mongoose.Types.ObjectId(value) : value;
}

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

function estimateInputChars(req) {
  const body = req.body || {};
  const query = req.query || {};
  return [
    body.prompt,
    body.input,
    body.question,
    body.instructions,
    body.content,
    body.body,
    query.question,
  ].filter(Boolean).join('\n').length;
}

function getTarget(req) {
  const id = req.body?.caseId || req.body?.clientId || req.body?.invoiceId || req.query?.caseId || null;
  if (!id) return {};
  return {
    targetType: req.body?.caseId || req.query?.caseId ? 'matter' : req.body?.invoiceId ? 'invoice' : 'client',
    targetId: mongoose.Types.ObjectId.isValid(String(id)) ? new mongoose.Types.ObjectId(id) : undefined,
  };
}

export function publicAiConsumer(consumer) {
  return {
    key: consumer.key,
    label: consumer.label,
    moduleKey: consumer.moduleKey,
    action: consumer.action,
    featureKey: consumer.featureKey,
    permissionKey: consumer.permissionKey,
    estimatedCredits: consumer.estimatedCredits,
    sensitive: consumer.sensitive,
  };
}

export function resolveAiCreditAccess({ limit = 0, used = 0, estimatedCredits = 1 }) {
  const remaining = Math.max(Number(limit || 0) - Number(used || 0), 0);
  const allowed = remaining >= Number(estimatedCredits || 0);
  return {
    allowed,
    limit: Number(limit || 0),
    used: Number(used || 0),
    remaining,
    estimatedCredits: Number(estimatedCredits || 0),
    reason: allowed ? null : AI_CREDIT_DEPLETED_MESSAGE,
  };
}

export async function getAiUsageSummary({ workspaceId }) {
  if (!workspaceId || !(await canReadPlatformCollections())) {
    return { limit: 0, used: 0, remaining: 0, periodStart: monthStart(), byModule: [] };
  }
  const featureAccess = await getWorkspaceFeatureAccess({ workspaceId, featureKey: 'ai.assistant' });
  const limit = Number(featureAccess?.limits?.aiCredits || 0);
  const periodStart = monthStart();
  const rows = await AiUsageEvent.aggregate([
    {
      $match: {
        workspaceId: toObjectId(workspaceId),
        status: 'succeeded',
        createdAt: { $gte: periodStart },
      },
    },
    { $group: { _id: '$moduleKey', credits: { $sum: '$credits' }, requests: { $sum: 1 } } },
    { $sort: { credits: -1 } },
  ]);
  const used = rows.reduce((sum, row) => sum + Number(row.credits || 0), 0);
  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    periodStart,
    byModule: rows.map((row) => ({ moduleKey: row._id, credits: row.credits, requests: row.requests })),
  };
}

export async function checkAiAccess({ req, consumerKey }) {
  const consumer = AI_CONSUMERS[consumerKey];
  if (!consumer) {
    return { allowed: false, statusCode: 400, state: 'not_configured', message: 'This AI tool is not configured yet.' };
  }
  if (!req.workspaceId) {
    return { allowed: false, statusCode: 400, state: 'validation', message: 'Choose a workspace before using AI.' };
  }

  let featureAccess = { allowed: true, behavior: 'enabled', limits: { aiCredits: 100000 } };
  if (await canReadPlatformCollections()) {
    featureAccess = await getWorkspaceFeatureAccess({ workspaceId: req.workspaceId, featureKey: consumer.featureKey });
  }
  if (!featureAccess.allowed) {
    return {
      allowed: false,
      statusCode: featureAccess.behavior === 'hide' ? 404 : 403,
      state: featureAccess.behavior === 'read_only' ? 'read_only' : 'unavailable',
      message: featureAccess.reason || AI_UNAVAILABLE_MESSAGE,
      consumer,
      featureAccess,
    };
  }

  const permission = await can(
    req.user?.id,
    req.workspaceId,
    consumer.permissionKey,
    {
      resourceType: 'ai',
      moduleKey: consumer.moduleKey,
      action: consumer.action,
      workspaceId: req.workspaceId,
      matterId: req.body?.caseId || req.query?.caseId,
    },
    { user: req.user },
  );
  if (!permission.allowed) {
    return {
      allowed: false,
      statusCode: 403,
      state: 'permission',
      message: permission.reason || PERMISSION_DENIED_MESSAGE,
      consumer,
      featureAccess,
      permission,
    };
  }

  const summary = await getAiUsageSummary({ workspaceId: req.workspaceId });
  const creditAccess = resolveAiCreditAccess({
    limit: featureAccess?.limits?.aiCredits ?? summary.limit,
    used: summary.used,
    estimatedCredits: consumer.estimatedCredits,
  });
  if (!creditAccess.allowed) {
    return {
      allowed: false,
      statusCode: 402,
      state: 'credit_depleted',
      message: creditAccess.reason,
      consumer,
      featureAccess,
      permission,
      credits: creditAccess,
    };
  }

  return {
    allowed: true,
    consumer,
    featureAccess,
    permission,
    credits: creditAccess,
  };
}

async function recordAiAudit({ req, consumer, usage, status }) {
  if (!consumer.sensitive || !(await canReadPlatformCollections())) return;
  const target = getTarget(req);
  await AuditEvent.create({
    workspaceId: req.workspaceId,
    action: `ai.${consumer.key}.${status}`,
    actorId: req.user?.id,
    targetType: target.targetType || 'ai',
    targetId: target.targetId,
    changes: {
      moduleKey: consumer.moduleKey,
      consumerKey: consumer.key,
      credits: usage?.credits || consumer.estimatedCredits,
    },
    metadata: {
      usageEventId: usage?._id ? String(usage._id) : null,
      sensitive: consumer.sensitive,
    },
  });
}

export async function recordAiUsage({ req, consumer, status = 'succeeded', outputChars = 0, errorCode = null }) {
  if (!req.workspaceId || !req.user?.id) return null;
  if (!(await canReadPlatformCollections())) return null;
  const target = getTarget(req);
  const usage = await AiUsageEvent.create({
    workspaceId: req.workspaceId,
    memberId: req.user?.id,
    moduleKey: consumer.moduleKey,
    consumerKey: consumer.key,
    action: consumer.action,
    featureKey: consumer.featureKey,
    permissionKey: consumer.permissionKey,
    credits: status === 'succeeded' ? consumer.estimatedCredits : 0,
    status,
    inputChars: estimateInputChars(req),
    outputChars,
    requestId: req.id || req.headers?.['x-request-id'],
    targetType: target.targetType,
    targetId: target.targetId,
    metadata: { errorCode },
  });
  await recordAiAudit({ req, consumer, usage, status });
  return usage;
}

export function requireAiAccess(consumerKeyOrResolver) {
  return async (req, res, next) => {
    try {
      const consumerKey = typeof consumerKeyOrResolver === 'function'
        ? consumerKeyOrResolver(req)
        : consumerKeyOrResolver;
      const decision = await checkAiAccess({ req, consumerKey });
      if (!decision.allowed) {
        if (decision.consumer) {
          await recordAiUsage({ req, consumer: decision.consumer, status: 'denied', errorCode: decision.state });
        }
        return res.status(decision.statusCode || 403).json({
          success: false,
          state: decision.state,
          message: decision.message,
          credits: decision.credits,
        });
      }
      req.aiPlatform = decision;
      return next();
    } catch (error) {
      return res.status(500).json({ success: false, state: 'error', message: 'AI could not be checked right now.' });
    }
  };
}

export function sendAiSuccess(req, res, payload, { outputText = '' } = {}) {
  const consumer = req.aiPlatform?.consumer || AI_CONSUMERS.dashboard;
  recordAiUsage({ req, consumer, status: 'succeeded', outputChars: String(outputText || JSON.stringify(payload || '')).length }).catch(() => {});
  return res.json({
    ...payload,
    aiUsage: {
      moduleKey: consumer.moduleKey,
      consumerKey: consumer.key,
      creditsUsed: consumer.estimatedCredits,
      creditsRemaining: Math.max(Number(req.aiPlatform?.credits?.remaining || 0) - Number(consumer.estimatedCredits || 0), 0),
    },
  });
}

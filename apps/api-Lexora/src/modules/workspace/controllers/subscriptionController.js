import {
  getFeatureCatalog,
  getPlanCatalog,
  getWorkspaceFeatureAccess,
  getWorkspaceModuleAccess,
  getWorkspaceSubscription,
  publicSubscription,
  upsertWorkspaceFeatureOverride,
} from '../services/subscriptionFeatureService.js';

function requireWorkspace(req, res) {
  if (req.workspaceId) return true;
  res.status(400).json({ ok: false, message: 'Choose a workspace before checking plan access.' });
  return false;
}

export async function listPlans(req, res) {
  try {
    const plans = await getPlanCatalog();
    res.json({ ok: true, data: plans });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load plan catalog.' });
  }
}

export async function listFeatures(req, res) {
  try {
    const features = await getFeatureCatalog();
    res.json({ ok: true, data: features });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load feature catalog.' });
  }
}

export async function getSubscription(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const { subscription, plan } = await getWorkspaceSubscription(req.workspaceId);
    if (!subscription) {
      return res.json({
        ok: true,
        data: {
          subscription: null,
          plan,
          state: 'not_configured',
          message: 'This workspace does not have a subscription yet.',
        },
      });
    }
    res.json({ ok: true, data: { subscription: publicSubscription(subscription, plan), plan } });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load workspace subscription.' });
  }
}

export async function checkFeatureAccess(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const access = await getWorkspaceFeatureAccess({
      workspaceId: req.workspaceId,
      featureKey: req.params.featureKey,
    });
    res.json({ ok: true, data: access });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to check feature access.' });
  }
}

export async function checkModuleAccess(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const access = await getWorkspaceModuleAccess({
      workspaceId: req.workspaceId,
      moduleKey: req.params.moduleKey,
    });
    res.json({ ok: true, data: access });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to check module access.' });
  }
}

export async function updateFeatureOverride(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const row = await upsertWorkspaceFeatureOverride({
      workspaceId: req.workspaceId,
      featureKey: req.params.featureKey,
      status: req.body?.status,
      behavior: req.body?.behavior,
      limitOverrides: req.body?.limitOverrides,
      reason: req.body?.reason,
      actorId: req.user?.id,
    });
    const access = await getWorkspaceFeatureAccess({
      workspaceId: req.workspaceId,
      featureKey: row.featureKey,
    });
    res.json({ ok: true, data: { override: row, access } });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to update feature access.' });
  }
}

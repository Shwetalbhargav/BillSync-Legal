import {
  createEnterpriseUnit,
  getEnterpriseOverview,
  upsertEnterpriseSetting,
} from '../services/enterpriseFoundationService.js';

function workspaceIdFrom(req) {
  return req.workspaceId
    || req.user?.workspaceId
    || (process.env.NODE_ENV === 'test' ? req.user?.firmId || 'test-workspace' : null);
}

export async function getEnterpriseFoundations(req, res, next) {
  try {
    const data = await getEnterpriseOverview({
      workspaceId: workspaceIdFrom(req),
      includeAudit: req.authorization?.permissionKey === 'enterprise.audit' || req.authorization?.roleKey === 'owner',
    });
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function createEnterpriseUnitController(req, res, next) {
  try {
    const unit = await createEnterpriseUnit({
      workspaceId: workspaceIdFrom(req),
      type: req.body?.type,
      name: req.body?.name,
      key: req.body?.key,
      metadata: req.body?.metadata,
      actorId: req.user?.id,
    });
    return res.status(201).json({ ok: true, data: unit, message: 'Enterprise area saved.' });
  } catch (error) {
    return next(error);
  }
}

export async function updateEnterpriseSettingController(req, res, next) {
  try {
    const setting = await upsertEnterpriseSetting({
      workspaceId: workspaceIdFrom(req),
      category: req.params.category,
      status: req.body?.status,
      provider: req.body?.provider,
      configuration: req.body?.configuration,
      actorId: req.user?.id,
    });
    return res.json({ ok: true, data: setting, message: 'Enterprise setting saved.' });
  } catch (error) {
    return next(error);
  }
}

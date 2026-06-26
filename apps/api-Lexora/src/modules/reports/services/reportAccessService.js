import { can, PERMISSION_DENIED_MESSAGE } from '../../workspace/services/rbacPolicyService.js';
import { getWorkspaceModuleAccess } from '../../workspace/services/subscriptionFeatureService.js';
import { KpiSnapshot } from '../../kpi/models/KpiSnapshot.js';

export const REPORTS_MODULE_KEY = 'reports';
export const REPORT_PERMISSIONS = {
  view: 'report.view',
  export: 'report.export',
  manage: 'report.manage',
};

const MODULE_UNAVAILABLE_MESSAGE = 'Reports are not available for this workspace.';
const MODULE_READ_ONLY_MESSAGE = 'Reports are available for review, but changes are paused for this workspace.';

function canReadPlatformCollections() {
  return process.env.NODE_ENV !== 'test' || KpiSnapshot.db?.readyState === 1;
}

async function getReportModuleDecision(req) {
  if (!canReadPlatformCollections()) {
    return { allowed: true, behavior: 'enabled', reason: null, source: 'test_fallback' };
  }
  return getWorkspaceModuleAccess({ workspaceId: req.workspaceId, moduleKey: REPORTS_MODULE_KEY });
}

export function requireReportAccess(permission, { write = false } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.workspaceId) {
        return res.status(400).json({ ok: false, message: 'Choose a workspace before opening reports.' });
      }

      const moduleDecision = await getReportModuleDecision(req);
      if (!moduleDecision.allowed && moduleDecision.behavior !== 'read_only') {
        return res.status(moduleDecision.behavior === 'hide' ? 404 : 403).json({
          ok: false,
          state: moduleDecision.behavior === 'hide' ? 'hidden' : 'unavailable',
          message: moduleDecision.reason || MODULE_UNAVAILABLE_MESSAGE,
        });
      }
      if (write && moduleDecision.behavior === 'read_only') {
        return res.status(403).json({ ok: false, state: 'read_only', message: moduleDecision.reason || MODULE_READ_ONLY_MESSAGE });
      }

      const decision = await can(
        req.user?.id,
        req.workspaceId,
        permission,
        {
          resourceType: 'report',
          financialOnly: true,
          scope: req.query?.scope || req.body?.scope || 'workspace',
          scopeId: req.query?.scopeId || req.body?.scopeId,
          workspaceId: req.workspaceId,
        },
        { user: req.user },
      );
      if (!decision.allowed) {
        return res.status(403).json({ ok: false, message: decision.reason || PERMISSION_DENIED_MESSAGE });
      }

      req.reportAccess = {
        module: moduleDecision,
        authorization: decision,
        readOnly: moduleDecision.behavior === 'read_only',
      };
      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, message: 'Failed to check report access.' });
    }
  };
}

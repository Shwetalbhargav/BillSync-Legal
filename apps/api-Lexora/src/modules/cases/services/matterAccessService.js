import { can, PERMISSION_DENIED_MESSAGE } from '../../workspace/services/rbacPolicyService.js';
import { getWorkspaceModuleAccess } from '../../workspace/services/subscriptionFeatureService.js';
import { Case } from '../models/Case.js';

export const MATTERS_MODULE_KEY = 'matters';
export const MATTER_PERMISSIONS = {
  read: 'matter.read',
  create: 'matter.create',
  edit: 'matter.edit',
  assign: 'matter.assign',
};

const MODULE_UNAVAILABLE_MESSAGE = 'Matters are not available for this workspace.';
const MODULE_READ_ONLY_MESSAGE = 'Matters are read-only for this workspace.';

function canReadPlatformCollections() {
  return process.env.NODE_ENV !== 'test' || Case.db?.readyState === 1;
}

async function getMatterModuleDecision(req) {
  if (!canReadPlatformCollections()) {
    return { allowed: true, behavior: 'enabled', reason: null, source: 'test_fallback' };
  }
  return getWorkspaceModuleAccess({ workspaceId: req.workspaceId, moduleKey: MATTERS_MODULE_KEY });
}

export function requireMatterAccess(permission, { write = false } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.workspaceId) {
        return res.status(400).json({ ok: false, message: 'Choose a workspace before opening matters.' });
      }

      const moduleDecision = await getMatterModuleDecision(req);
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
          resourceType: 'matter',
          matterId: req.params?.caseId || req.params?.id || req.body?.caseId,
          clientId: req.params?.clientId || req.body?.clientId,
          workspaceId: req.workspaceId,
        },
        { user: req.user },
      );
      if (!decision.allowed) {
        return res.status(403).json({ ok: false, message: decision.reason || PERMISSION_DENIED_MESSAGE });
      }

      req.matterAccess = {
        module: moduleDecision,
        authorization: decision,
        readOnly: moduleDecision.behavior === 'read_only',
      };
      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, message: 'Failed to check matter access.' });
    }
  };
}

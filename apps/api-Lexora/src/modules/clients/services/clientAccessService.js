import { can, PERMISSION_DENIED_MESSAGE } from '../../workspace/services/rbacPolicyService.js';
import { getWorkspaceModuleAccess } from '../../workspace/services/subscriptionFeatureService.js';
import { Client } from '../models/Client.js';

export const CLIENT_MODULE_KEY = 'clients';
export const CLIENT_PERMISSIONS = {
  read: 'client.read',
  create: 'client.create',
  edit: 'client.edit',
  delete: 'client.delete',
};

const MODULE_UNAVAILABLE_MESSAGE = 'Clients are not available for this workspace.';
const MODULE_READ_ONLY_MESSAGE = 'Clients are read-only for this workspace.';

function canReadPlatformCollections() {
  return process.env.NODE_ENV !== 'test' || Client.db?.readyState === 1;
}

async function getClientModuleDecision(req) {
  if (!canReadPlatformCollections()) {
    return { allowed: true, behavior: 'enabled', reason: null, source: 'test_fallback' };
  }
  return getWorkspaceModuleAccess({ workspaceId: req.workspaceId, moduleKey: CLIENT_MODULE_KEY });
}

export function requireClientAccess(permission, { write = false } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.workspaceId) {
        return res.status(400).json({ ok: false, message: 'Choose a workspace before opening clients.' });
      }

      const moduleDecision = await getClientModuleDecision(req);
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
          resourceType: 'client',
          clientId: req.params?.clientId,
          workspaceId: req.workspaceId,
        },
        { user: req.user },
      );
      if (!decision.allowed) {
        return res.status(403).json({ ok: false, message: decision.reason || PERMISSION_DENIED_MESSAGE });
      }

      req.clientAccess = {
        module: moduleDecision,
        authorization: decision,
        readOnly: moduleDecision.behavior === 'read_only',
      };
      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, message: 'Failed to check client access.' });
    }
  };
}

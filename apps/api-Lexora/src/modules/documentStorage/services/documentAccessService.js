import { can, PERMISSION_DENIED_MESSAGE } from '../../workspace/services/rbacPolicyService.js';
import { getWorkspaceModuleAccess } from '../../workspace/services/subscriptionFeatureService.js';
import { StoredDocument } from '../models/StoredDocument.js';

export const DOCUMENT_MODULE_KEY = 'documents';
export const DOCUMENT_PERMISSIONS = {
  read: 'document.read',
  create: 'document.create',
  share: 'document.share',
  delete: 'document.delete',
};

const MODULE_UNAVAILABLE_MESSAGE = 'Documents are not available for this workspace.';
const MODULE_READ_ONLY_MESSAGE = 'Documents are available for review, but changes are paused for this workspace.';

function canReadPlatformCollections() {
  return process.env.NODE_ENV !== 'test' || StoredDocument.db?.readyState === 1;
}

async function getDocumentModuleDecision(req) {
  if (!canReadPlatformCollections()) {
    return { allowed: true, behavior: 'enabled', reason: null, source: 'test_fallback' };
  }
  return getWorkspaceModuleAccess({ workspaceId: req.workspaceId, moduleKey: DOCUMENT_MODULE_KEY });
}

export function documentResource(req, extra = {}) {
  return {
    resourceType: 'document',
    workspaceId: req.workspaceId,
    documentId: req.params?.documentId || req.body?.documentId,
    matterId: req.params?.caseId || req.query?.caseId || req.body?.caseId,
    clientId: req.params?.clientId || req.query?.clientId || req.body?.clientId,
    ...extra,
  };
}

export async function decideDocumentAccess(req, permission, resource = {}) {
  return can(
    req.user?.id,
    req.workspaceId,
    permission,
    documentResource(req, resource),
    { user: req.user },
  );
}

export function requireDocumentAccess(permission, { write = false } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.workspaceId) {
        return res.status(400).json({ ok: false, message: 'Choose a workspace before opening documents.' });
      }

      const moduleDecision = await getDocumentModuleDecision(req);
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

      const decision = await decideDocumentAccess(req, permission);
      if (!decision.allowed) {
        return res.status(403).json({ ok: false, message: decision.reason || PERMISSION_DENIED_MESSAGE });
      }

      req.documentAccess = {
        module: moduleDecision,
        authorization: decision,
        readOnly: moduleDecision.behavior === 'read_only',
      };
      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, message: 'Failed to check document access.' });
    }
  };
}

import { can, PERMISSION_DENIED_MESSAGE } from '../../workspace/services/rbacPolicyService.js';
import { getWorkspaceModuleAccess } from '../../workspace/services/subscriptionFeatureService.js';
import { Invoice } from '../../invoices/models/Invoice.js';

export const BILLING_MODULE_KEY = 'billing';
export const FINANCE_MODULE_KEY = 'finance';

export const BILLING_PERMISSIONS = {
  invoiceView: 'invoice.view',
  invoiceCreate: 'invoice.create',
  invoiceSend: 'invoice.send',
  paymentRecord: 'payment.record',
};

const MODULE_MESSAGES = {
  [BILLING_MODULE_KEY]: {
    unavailable: 'Billing is not available for this workspace.',
    readOnly: 'Billing is available for review, but changes are paused for this workspace.',
    failure: 'Failed to check billing access.',
  },
  [FINANCE_MODULE_KEY]: {
    unavailable: 'Finance tools are not available for this workspace.',
    readOnly: 'Finance tools are available for review, but changes are paused for this workspace.',
    failure: 'Failed to check finance access.',
  },
};

function canReadPlatformCollections() {
  return process.env.NODE_ENV !== 'test' || Invoice.db?.readyState === 1;
}

async function getModuleDecision(req, moduleKey) {
  if (!canReadPlatformCollections()) {
    return { allowed: true, behavior: 'enabled', reason: null, source: 'test_fallback' };
  }
  return getWorkspaceModuleAccess({ workspaceId: req.workspaceId, moduleKey });
}

export function requireBillingAccess(permission, { write = false, moduleKey = BILLING_MODULE_KEY } = {}) {
  return async (req, res, next) => {
    const messages = MODULE_MESSAGES[moduleKey] || MODULE_MESSAGES[BILLING_MODULE_KEY];
    try {
      if (!req.workspaceId) {
        return res.status(400).json({ ok: false, message: 'Choose a workspace before opening billing.' });
      }

      const moduleDecision = await getModuleDecision(req, moduleKey);
      if (!moduleDecision.allowed && moduleDecision.behavior !== 'read_only') {
        return res.status(moduleDecision.behavior === 'hide' ? 404 : 403).json({
          ok: false,
          state: moduleDecision.behavior === 'hide' ? 'hidden' : 'unavailable',
          message: moduleDecision.reason || messages.unavailable,
        });
      }
      if (write && moduleDecision.behavior === 'read_only') {
        return res.status(403).json({
          ok: false,
          state: 'read_only',
          message: moduleDecision.reason || messages.readOnly,
        });
      }

      const decision = await can(
        req.user?.id,
        req.workspaceId,
        permission,
        {
          resourceType: moduleKey === FINANCE_MODULE_KEY ? 'finance' : 'billing',
          financialOnly: true,
          invoiceId: req.params?.invoiceId || req.params?.id || req.params?.invoiceId || req.body?.invoiceId,
          paymentId: req.params?.paymentId || req.params?.id,
          clientId: req.params?.clientId || req.query?.clientId || req.body?.clientId,
          matterId: req.params?.caseId || req.query?.caseId || req.body?.caseId,
          workspaceId: req.workspaceId,
        },
        { user: req.user },
      );
      if (!decision.allowed) {
        return res.status(403).json({ ok: false, message: decision.reason || PERMISSION_DENIED_MESSAGE });
      }

      req.billingAccess = {
        module: moduleDecision,
        authorization: decision,
        readOnly: moduleDecision.behavior === 'read_only',
      };
      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, message: messages.failure });
    }
  };
}

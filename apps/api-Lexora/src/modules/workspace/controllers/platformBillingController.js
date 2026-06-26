import {
  ensureCurrentPlatformInvoice,
  getPlatformBillingOverview,
  recordPlatformPaymentState,
} from '../services/platformBillingService.js';

function requireWorkspace(req, res) {
  if (req.workspaceId) return true;
  res.status(400).json({ ok: false, message: 'Choose a workspace before opening Lexora subscription billing.' });
  return false;
}

export async function getPlatformBilling(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const data = await getPlatformBillingOverview({ workspaceId: req.workspaceId });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Lexora subscription billing could not be loaded right now.' });
  }
}

export async function createCurrentPlatformInvoice(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const invoice = await ensureCurrentPlatformInvoice({ workspaceId: req.workspaceId });
    const data = await getPlatformBillingOverview({ workspaceId: req.workspaceId });
    res.status(201).json({ ok: true, data: { invoice, overview: data } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Subscription invoice could not be prepared.' });
  }
}

export async function recordPlatformPayment(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const result = await recordPlatformPaymentState({
      workspaceId: req.workspaceId,
      platformInvoiceId: req.params.invoiceId,
      status: req.body?.status,
      amountPaise: req.body?.amountPaise,
      failureMessage: req.body?.failureMessage,
      method: req.body?.method,
    });
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Subscription payment state could not be saved.' });
  }
}

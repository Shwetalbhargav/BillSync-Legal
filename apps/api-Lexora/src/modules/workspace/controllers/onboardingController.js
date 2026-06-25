import Workspace from '../models/Workspace.js';
import AuditEvent from '../models/AuditEvent.js';
import { isOwner } from '../roles.js';

const STEP_FIELDS = new Set([
  'account',
  'practice',
  'tax',
  'billing',
  'rate',
  'first_client',
  'first_matter',
  'first_work',
]);

function pickWorkspaceSettings(body = {}) {
  const update = {};
  if (body.practiceName) update.name = String(body.practiceName).trim();
  if (body.contact) update.contact = body.contact;
  if (body.gstin || body.taxName || body.taxRatePct !== undefined || body.taxInclusive !== undefined) {
    update.taxSettings = {
      taxName: body.taxName || 'GST',
      taxRatePct: Number(body.taxRatePct || 0),
      inclusive: Boolean(body.taxInclusive),
    };
    if (body.gstin) update.gstin = String(body.gstin).trim().toUpperCase();
  }
  if (body.address) update.address = body.address;
  if (body.currency) update.currency = String(body.currency).trim().toUpperCase();
  if (body.timezone) update.timezone = String(body.timezone).trim();
  if (body.invoicePrefix) update.invoicePrefix = String(body.invoicePrefix).trim().toUpperCase();
  if (body.paymentInstructions !== undefined) update.paymentInstructions = body.paymentInstructions;
  if (body.paymentTerms) update.paymentTerms = String(body.paymentTerms).trim().toUpperCase();
  if (body.defaultRate !== undefined) update['billingPreferences.defaultRate'] = Number(body.defaultRate);
  if (body.restrictedMatterVisibility !== undefined) update.restrictedMatterVisibility = Boolean(body.restrictedMatterVisibility);
  if (body.workReview) update.workReview = body.workReview;
  return update;
}

export async function getOnboarding(req, res) {
  try {
    const workspace = await Workspace.findById(req.workspaceId);
    if (!workspace) return res.status(404).json({ ok: false, message: 'Workspace not found' });
    res.json({ ok: true, data: { workspace, onboarding: workspace.onboarding || {} } });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load onboarding' });
  }
}

export async function updateOnboarding(req, res) {
  try {
    if (!isOwner(req.user?.commercialRole || req.user?.role)) return res.status(403).json({ ok: false, message: 'Only Owners can update onboarding' });

    const update = pickWorkspaceSettings(req.body);
    const completedSteps = Array.isArray(req.body.completedSteps)
      ? req.body.completedSteps.filter((step) => STEP_FIELDS.has(step))
      : [];
    if (completedSteps.length) update['onboarding.completedSteps'] = completedSteps;
    if (req.body.firstClientId) update['onboarding.firstClientId'] = req.body.firstClientId;
    if (req.body.firstMatterId) update['onboarding.firstMatterId'] = req.body.firstMatterId;
    if (req.body.firstWorkEntryId) update['onboarding.firstWorkEntryId'] = req.body.firstWorkEntryId;
    if (completedSteps.includes('first_work')) update['onboarding.completedAt'] = new Date();

    const workspace = await Workspace.findByIdAndUpdate(req.workspaceId, { $set: update }, { new: true, runValidators: true });
    await AuditEvent.create({
      workspaceId: req.workspaceId,
      actorId: req.user.id,
      action: 'workspace.onboarding_updated',
      targetType: 'workspace',
      targetId: req.workspaceId,
      changes: update,
    });
    res.json({ ok: true, data: { workspace, onboarding: workspace.onboarding || {} } });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message || 'Failed to update onboarding' });
  }
}

export async function updateWorkReview(req, res) {
  try {
    if (!isOwner(req.user?.commercialRole || req.user?.role)) return res.status(403).json({ ok: false, message: 'Only Owners can update work review settings' });
    const workspace = await Workspace.findByIdAndUpdate(
      req.workspaceId,
      { $set: { workReview: { ...req.body } } },
      { new: true, runValidators: true }
    );
    await AuditEvent.create({
      workspaceId: req.workspaceId,
      actorId: req.user.id,
      action: 'workspace.work_review_updated',
      targetType: 'workspace',
      targetId: req.workspaceId,
      changes: req.body,
    });
    res.json({ ok: true, data: workspace.workReview });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message || 'Failed to update work review' });
  }
}

// src/controllers/caseController.js
import mongoose from 'mongoose';
import { Case } from '../models/Case.js';
import { CaseAssignment } from '../models/CaseAssignment.js';
import { Client } from '../../clients/models/Client.js';
import { TimeEntry } from '../../timeEntries/models/TimeEntry.js';
import { Invoice } from '../../invoices/models/Invoice.js';
import { Payment } from '../../payments/models/Payment.js';
import User from '../../users/models/User.js';

// ---------- helpers ----------
const CASE_MUTABLE_FIELDS = [
  'clientId',
  'matterNumber',
  'title',
  'description',
  'status',
  'openedAt',
  'closedAt',
  'leadPartnerId',
  'managingLawyerId',
  'primaryLawyerId',
  'assignedUsers',
  'billingType',
  'fixedFeeAmount',
  'fixedFeeAmountPaise',
  'fixedFeeDescription',
  'case_type',
  'case_type_id',
  'court',
  'caseDetails',
  'importantDates',
];

const USER_REFERENCE_FIELDS = ['leadPartnerId', 'managingLawyerId', 'primaryLawyerId'];
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const PRIVILEGED_MATTER_ROLES = new Set(['admin', 'owner', 'partner']);

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const pickCasePayload = (payload = {}) =>
  CASE_MUTABLE_FIELDS.reduce((acc, field) => {
    if (hasOwn(payload, field)) acc[field] = payload[field];
    return acc;
  }, {});

const validationFailed = (res, errors) =>
  res.status(400).json({
    ok: false,
    message: 'Validation failed',
    errors,
  });

const conflict = (res, message, errors = []) =>
  res.status(409).json({
    ok: false,
    message,
    ...(errors.length ? { errors } : {}),
  });

const notFound = (res, message) => res.status(404).json({ ok: false, message });

const asObjectId = (id) => {
  try { return new mongoose.Types.ObjectId(id); } catch { return null; }
};
const toNumber = (v, d = 0) => (v === undefined || v === null || Number.isNaN(Number(v)) ? d : Number(v));
const parsePositiveInt = (value, fallback, max = MAX_LIMIT) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};
const getPagination = (query = {}) => {
  const page = parsePositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInt(query.limit, DEFAULT_LIMIT);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};
const buildMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: total ? Math.ceil(total / limit) : 0,
});
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const workspaceFilter = (req, extra = {}) => ({ workspaceId: req.workspaceId, ...extra });

// Compute amount for a time entry if not stored
const computeTimeAmount = (te) => {
  if (typeof te.amount === 'number') return te.amount;
  const minutes = toNumber(te.billableMinutes, 0);
  const rate = toNumber(te.rateApplied, 0);
  return +(rate * (minutes / 60)).toFixed(2);
};

const validateCaseReferences = async (payload, req, res) => {
  const errors = [];

  if (hasOwn(payload, 'clientId') && payload.clientId !== null) {
    const clientExists = await Client.exists(workspaceFilter(req, { _id: payload.clientId }));
    if (!clientExists) {
      errors.push({ field: 'clientId', message: 'clientId does not reference an existing client' });
    }
  }

  for (const field of USER_REFERENCE_FIELDS) {
    if (!hasOwn(payload, field) || payload[field] === null) continue;
    const userExists = await User.exists(workspaceFilter(req, { _id: payload[field] }));
    if (!userExists) {
      errors.push({ field, message: `${field} does not reference an existing user` });
    }
  }

  if (hasOwn(payload, 'assignedUsers')) {
    const seen = new Set();
    for (const [index, userId] of (payload.assignedUsers || []).entries()) {
      const key = String(userId);
      if (seen.has(key)) {
        errors.push({ field: 'assignedUsers', message: 'assignedUsers cannot contain duplicates' });
        break;
      }
      seen.add(key);

      const userExists = await User.exists(workspaceFilter(req, { _id: userId }));
      if (!userExists) {
        errors.push({
          field: `assignedUsers[${index}]`,
          message: 'assignedUsers entry does not reference an existing user',
        });
      }
    }
  }

  if (errors.length) {
    validationFailed(res, errors);
    return false;
  }

  return true;
};

const validateCaseDateOrder = ({ openedAt, closedAt }, res) => {
  if (!openedAt || !closedAt) return true;

  const opened = Date.parse(openedAt);
  const closed = Date.parse(closedAt);
  if (Number.isNaN(opened) || Number.isNaN(closed) || opened <= closed) return true;

  validationFailed(res, [{
    field: 'closedAt',
    message: 'closedAt must be greater than or equal to openedAt',
  }]);
  return false;
};

const ensureUniqueCaseTitle = async ({ clientId, title, excludeCaseId, req }, res) => {
  if (!clientId || !title) return true;

  const query = {
    clientId,
    workspaceId: req.workspaceId,
    title: new RegExp(`^${escapeRegex(String(title).trim())}$`, 'i'),
    status: { $ne: 'archived' },
  };
  if (excludeCaseId) query._id = { $ne: excludeCaseId };

  const existing = await Case.exists(query);
  if (!existing) return true;

  conflict(res, 'Case title already exists for this client', [{
    field: 'title',
    message: 'A non-archived case with this title already exists for this client',
  }]);
  return false;
};

const ensureClientExists = async (clientId, req, res) => {
  const exists = await Client.exists(workspaceFilter(req, { _id: clientId }));
  if (!exists) {
    notFound(res, 'Client not found');
    return false;
  }
  return true;
};

const applyStatusLifecycle = (payload, res) => {
  if (!hasOwn(payload, 'status')) {
    return { payload, clearClosedAt: false };
  }

  if (['open', 'pending'].includes(payload.status)) {
    if (hasOwn(payload, 'closedAt')) {
      validationFailed(res, [{
        field: 'closedAt',
        message: 'closedAt is only allowed when status is closed or archived',
      }]);
      return null;
    }

    return { payload, clearClosedAt: true };
  }

  if (['closed', 'archived'].includes(payload.status)) {
    return {
      payload: {
        ...payload,
        closedAt: payload.closedAt ? new Date(payload.closedAt) : new Date(),
      },
      clearClosedAt: false,
    };
  }

  return { payload, clearClosedAt: false };
};

// ---------- CRUD ----------
export const createCase = async (req, res) => {
  try {
    const payload = pickCasePayload(req.body);
    const requesterRole = String(req.user?.role || '').toLowerCase();
    if (!PRIVILEGED_MATTER_ROLES.has(requesterRole) && mongoose.Types.ObjectId.isValid(req.user?.id)) {
      payload.assignedUsers = [...new Set([...(payload.assignedUsers || []).map(String), req.user.id])];
      if (!payload.primaryLawyerId) payload.primaryLawyerId = req.user.id;
    }
    const refsValid = await validateCaseReferences(payload, req, res);
    if (!refsValid) return;

    const uniqueTitle = await ensureUniqueCaseTitle({
      clientId: payload.clientId,
      title: payload.title,
      req,
    }, res);
    if (!uniqueTitle) return;

    const lifecycle = applyStatusLifecycle(payload, res);
    if (!lifecycle) return;
    if (!validateCaseDateOrder(lifecycle.payload, res)) return;

    const doc = await Case.create({ ...lifecycle.payload, workspaceId: req.workspaceId });
    res.status(201).json({ ok: true, data: doc });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const getAllCases = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const q = workspaceFilter(req);
    const requesterId = req.user?.id;
    const requesterRole = String(req.user?.commercialRole || req.user?.role || '').toLowerCase();

    if (req.query.clientId) q.clientId = req.query.clientId;
    if (req.query.status) q.status = req.query.status;
    if (req.query.caseType) q.case_type = new RegExp(`^${escapeRegex(req.query.caseType)}$`, 'i');
    if (req.query.caseTypeId) q.case_type_id = req.query.caseTypeId;
    if (req.query.q) {
      const pattern = new RegExp(escapeRegex(req.query.q), 'i');
      q.$or = [{ title: pattern }, { description: pattern }, { case_type: pattern }];
    }
    if (
      requesterRole === 'lawyer'
      && requesterId
      && mongoose.Types.ObjectId.isValid(requesterId)
    ) {
      q.$and = [
        ...(q.$and || []),
        {
          $or: [
            { leadPartnerId: requesterId },
            { managingLawyerId: requesterId },
            { primaryLawyerId: requesterId },
            { assignedUsers: requesterId },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      Case.find(q)
        .populate('clientId', 'displayName')
        .populate('assignedUsers', 'name role')
        .populate('primaryLawyerId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Case.countDocuments(q),
    ]);
    res.json({ ok: true, data: items, meta: buildMeta({ page, limit }, total) });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch cases' });
  }
};

export const getCaseById = async (req, res) => {
  try {
    const doc = await Case.findOne(workspaceFilter(req, { _id: req.params.caseId }))
      .populate('clientId', 'displayName')
      .populate('assignedUsers', 'name role')
      .populate('primaryLawyerId', 'name');
    if (!doc) return notFound(res, 'Case not found');
    if (String(req.user?.commercialRole || req.user?.role || '').toLowerCase() === 'lawyer') {
      const requesterId = String(req.user?.id || '');
      const allowed = [
        doc.leadPartnerId,
        doc.managingLawyerId,
        doc.primaryLawyerId,
        ...(doc.assignedUsers || []),
      ].some((id) => String(id?._id || id || '') === requesterId);
      if (!allowed) return notFound(res, 'Case not found');
    }
    res.json({ ok: true, data: doc });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch case' });
  }
};

export const updateCase = async (req, res) => {
  try {
    const existing = await Case.findOne(workspaceFilter(req, { _id: req.params.caseId })).select('clientId title openedAt closedAt');
    if (!existing) return notFound(res, 'Case not found');

    const payload = pickCasePayload(req.body);
    const refsValid = await validateCaseReferences(payload, req, res);
    if (!refsValid) return;

    const lifecycle = applyStatusLifecycle(payload, res);
    if (!lifecycle) return;

    const nextPayload = lifecycle.payload;
    const nextClientId = hasOwn(nextPayload, 'clientId') ? nextPayload.clientId : existing.clientId;
    const nextTitle = hasOwn(nextPayload, 'title') ? nextPayload.title : existing.title;
    const uniqueTitle = await ensureUniqueCaseTitle({
      clientId: nextClientId,
      title: nextTitle,
      excludeCaseId: req.params.caseId,
      req,
    }, res);
    if (!uniqueTitle) return;

    const nextOpenedAt = hasOwn(nextPayload, 'openedAt') ? nextPayload.openedAt : existing.openedAt;
    const nextClosedAt = lifecycle.clearClosedAt
      ? null
      : hasOwn(nextPayload, 'closedAt')
        ? nextPayload.closedAt
        : existing.closedAt;
    if (!validateCaseDateOrder({ openedAt: nextOpenedAt, closedAt: nextClosedAt }, res)) return;

    const update = lifecycle.clearClosedAt
      ? { $set: nextPayload, $unset: { closedAt: '' } }
      : nextPayload;

    const updated = await Case.findOneAndUpdate(workspaceFilter(req, { _id: req.params.caseId }), update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return notFound(res, 'Case not found');
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const deleteCase = async (req, res) => {
  try {
    const caseDoc = await Case.findOne(workspaceFilter(req, { _id: req.params.caseId })).select('_id status closedAt');
    if (!caseDoc) return notFound(res, 'Case not found');

    const [timeEntries, invoices, assignments] = await Promise.all([
      TimeEntry.countDocuments(workspaceFilter(req, { caseId: req.params.caseId })),
      Invoice.find(workspaceFilter(req, { caseId: req.params.caseId })).select('_id'),
      CaseAssignment.countDocuments(workspaceFilter(req, { caseId: req.params.caseId })),
    ]);

    const invoiceIds = invoices.map((invoice) => invoice._id);
    const payments = invoiceIds.length
      ? await Payment.countDocuments(workspaceFilter(req, { invoiceId: { $in: invoiceIds } }))
      : 0;

    const details = {
      timeEntries,
      invoices: invoiceIds.length,
      payments,
      assignments,
    };

    if (timeEntries || invoiceIds.length || payments || assignments) {
      const update = { status: 'archived' };
      if (!caseDoc.closedAt) update.closedAt = new Date();

      const archived = await Case.findOneAndUpdate(workspaceFilter(req, { _id: req.params.caseId }), update, {
        new: true,
        runValidators: true,
      });

      return res.json({
        ok: true,
        archived: true,
        message: 'Case has related records and was archived instead of deleted',
        data: archived,
        details,
      });
    }

    await Case.findOneAndDelete(workspaceFilter(req, { _id: req.params.caseId }));
    res.json({ ok: true, deleted: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to delete case' });
  }
};

// ---------- status transition ----------
export const transitionStatus = async (req, res) => {
  try {
    const { status, closedAt } = req.body;

    if (['open', 'pending'].includes(status) && closedAt) {
      return validationFailed(res, [{
        field: 'closedAt',
        message: 'closedAt is only allowed when status is closed or archived',
      }]);
    }

    const update = ['closed', 'archived'].includes(status)
      ? {
        status,
        closedAt: closedAt ? new Date(closedAt) : new Date(),
      }
      : {
        $set: { status },
        $unset: { closedAt: '' },
      };

    const updated = await Case.findOneAndUpdate(workspaceFilter(req, { _id: req.params.caseId }), update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return notFound(res, 'Case not found');
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// ---------- related lists ----------
export const listCaseTimeEntries = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const q = workspaceFilter(req, { caseId: req.params.caseId });

    const [items, total] = await Promise.all([
      TimeEntry.find(q).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      TimeEntry.countDocuments(q),
    ]);
    res.json({ ok: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const listCaseInvoices = async (req, res) => {
  try {
    const items = await Invoice.find(workspaceFilter(req, { caseId: req.params.caseId })).sort({ issueDate: -1 });
    res.json({ ok: true, data: items });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const listCasePayments = async (req, res) => {
  try {
    const invoices = await Invoice.find(workspaceFilter(req, { caseId: req.params.caseId })).select('_id');
    const invoiceIds = invoices.map(i => i._id);
    const items = invoiceIds.length
      ? await Payment.find(workspaceFilter(req, { invoiceId: { $in: invoiceIds } })).sort({ receivedDate: -1 })
      : [];
    res.json({ ok: true, data: items });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// ---------- financial rollup (WIP / Billed / AR) ----------
export const caseRollup = async (req, res) => {
  try {
    const caseId = asObjectId(req.params.caseId);
    const clearedOnly = req.query.clearedOnly !== 'false';

    const wipEntries = await TimeEntry.find({
      workspaceId: req.workspaceId,
      caseId,
      status: { $in: ['submitted', 'approved'] }
    }).select('billableMinutes rateApplied amount');

    const wip = wipEntries.reduce((sum, te) => sum + computeTimeAmount(te), 0);

    const invoices = await Invoice.find({
      workspaceId: req.workspaceId,
      caseId,
      status: { $nin: ['void', 'revised'] }
    }).select('total totalPaise balancePaise');

    const billedPaise = invoices.reduce((s, i) => s + toNumber(i.totalPaise, Math.round(toNumber(i.total, 0) * 100)), 0);
    const outstandingPaise = invoices.reduce((s, i) => s + toNumber(i.balancePaise, 0), 0);
    const billed = billedPaise / 100;

    const invoiceIds = invoices.map(i => i._id);
    const payQuery = workspaceFilter(req, { invoiceId: { $in: invoiceIds } });
    if (clearedOnly) payQuery.status = 'cleared';

    const payments = invoiceIds.length
      ? await Payment.find(payQuery).select('amount amountPaise transactionType')
      : [];
    const collectedPaise = payments.reduce((s, p) => {
      const sign = p.transactionType === 'refund' ? -1 : 1;
      return s + sign * toNumber(p.amountPaise, Math.round(toNumber(p.amount, 0) * 100));
    }, 0);
    const paid = collectedPaise / 100;

    const ar = Math.max(0, outstandingPaise / 100);

    res.json({
      ok: true,
      data: {
        caseId,
        wip: +wip.toFixed(2),
        wipPaise: Math.round(wip * 100),
        billed: +billed.toFixed(2),
        billedPaise,
        collected: +paid.toFixed(2),
        collectedPaise,
        paid: +paid.toFixed(2),
        outstanding: +ar.toFixed(2),
        outstandingPaise,
        ar: +ar.toFixed(2),
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to compute rollup' });
  }
};

// ---------- utility ----------
export const getCasesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const exists = await ensureClientExists(clientId, req, res);
    if (!exists) return;

    const { page, limit, skip } = getPagination(req.query);
    const q = workspaceFilter(req, { clientId });
    if (req.query.status) q.status = req.query.status;
    if (req.query.caseType) q.case_type = new RegExp(`^${escapeRegex(req.query.caseType)}$`, 'i');
    if (req.query.caseTypeId) q.case_type_id = req.query.caseTypeId;
    if (req.query.q) {
      const pattern = new RegExp(escapeRegex(req.query.q), 'i');
      q.$or = [{ title: pattern }, { description: pattern }, { case_type: pattern }];
    }

    const [cases, total] = await Promise.all([
      Case.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Case.countDocuments(q),
    ]);
    res.json({ ok: true, data: cases, meta: buildMeta({ page, limit }, total) });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

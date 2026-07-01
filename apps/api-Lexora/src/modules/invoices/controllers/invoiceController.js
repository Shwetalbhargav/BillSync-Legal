// src/controllers/invoiceController.js
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { InvoiceLine } from '../models/InvoiceLine.js';
import { TimeEntry } from '../../timeEntries/models/TimeEntry.js';
import Billable from '../../billables/models/Billable.js';
import { EmailEntry } from '../../emailEntries/models/EmailEntry.js';
import { buildInvoiceHtml, buildInvoicePdfBuffer, emailInvoice } from '../services/invoiceDeliveryService.js';
import { assertSoloAdvocateReady, buildInvoiceSnapshots } from '../services/invoiceSnapshotService.js';
import { recalcInvoiceTotals } from '../services/invoiceTotalsService.js';
import { nextInvoiceNumber } from '../../finance/sequenceService.js';
import { fromPaise, toPaise } from '../../finance/money.js';

const FINAL_STATUSES = new Set(['finalised', 'sent', 'partial', 'paid', 'overdue', 'void', 'revised']);
const READY_STATUSES = new Set(['approved', 'ready_to_bill']);

function workspaceFilter(req, extra = {}) {
  return req.workspaceId ? { workspaceId: req.workspaceId, ...extra } : extra;
}

function workspaceAggregateMatch(req, extra = {}) {
  if (!req.workspaceId) return extra;
  const workspaceId = mongoose.Types.ObjectId.isValid(req.workspaceId)
    ? new mongoose.Types.ObjectId(req.workspaceId)
    : req.workspaceId;
  return { workspaceId, ...extra };
}

function assertDraft(invoice, res) {
  if (FINAL_STATUSES.has(invoice.status)) {
    res.status(409).json({ error: 'Finalised invoices are immutable. Create a revision or credit instead.' });
    return false;
  }
  return true;
}

/**
 * POST /api/invoices
 * Creates a draft invoice shell. Lines can be added through /:id/lines.
 */
export const createInvoice = async (req, res) => {
  try {
    const {
      clientId,
      caseId,
      currency = 'INR',
      dueDate,
      periodStart,
      periodEnd,
      createdBy,
      templateType = 'standard',
      taxTreatment,
      taxNote,
      taxName,
      taxRatePct,
    } = req.body;

    const invoice = await Invoice.create({
      clientId,
      caseId: caseId || undefined,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
      issueDate: new Date(),
      dueDate: dueDate || undefined,
      currency,
      templateType,
      taxTreatment: taxTreatment || undefined,
      taxNote: taxNote || undefined,
      taxName: taxName || undefined,
      taxRatePct: taxRatePct ?? undefined,
      subtotal: 0,
      subtotalPaise: 0,
      tax: 0,
      taxPaise: 0,
      total: 0,
      totalPaise: 0,
      balancePaise: 0,
      status: 'draft',
      createdBy: createdBy || req.user?.id,
      workspaceId: req.workspaceId,
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

/**
 * PATCH /api/invoices/:id
 */
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id }));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (!assertDraft(invoice, res)) return;

    const allowed = [
      'clientId',
      'caseId',
      'currency',
      'dueDate',
      'periodStart',
      'periodEnd',
      'templateType',
      'taxTreatment',
      'taxNote',
      'taxName',
      'taxRatePct',
      'taxInclusive',
      'pdfUrl',
    ];
    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        invoice[field] = req.body[field] === '' ? undefined : req.body[field];
      }
    }
    await invoice.save();
    const totals = await recalcInvoiceTotals(invoice._id);
    const refreshed = await Invoice.findOne(workspaceFilter(req, { _id: invoice._id })).populate('clientId caseId createdBy');
    res.json({ ...refreshed.toObject(), ...totals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

/**
 * DELETE /api/invoices/:id
 */
export const deleteInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id })).session(session);
    if (!invoice) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (!assertDraft(invoice, res)) {
      await session.abortTransaction();
      return;
    }
    await InvoiceLine.deleteMany(workspaceFilter(req, { invoiceId: invoice._id })).session(session);
    await invoice.deleteOne({ session });
    await session.commitTransaction();
    res.json({ success: true });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/invoices/:id
 */
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id }))
      .populate('clientId caseId createdBy');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const lines = await InvoiceLine.find(workspaceFilter(req, { invoiceId: invoice._id }))
      .populate('timeEntryId');

    res.json({ ...invoice.toObject(), lines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

/**
 * GET /api/invoices
 * Filters: clientId, caseId, status, paymentDue, userId, from, to, dueFrom, dueTo
 */
export const getAllInvoices = async (req, res) => {
  try {
    const { clientId, caseId, status, paymentDue, userId, from, to, dueFrom, dueTo } = req.query;
    const filter = workspaceFilter(req);
    if (clientId) filter.clientId = clientId;
    if (caseId) filter.caseId = caseId;
    if (userId) filter.createdBy = userId;
    if (status) filter.status = status;
    if (paymentDue === 'due') filter.status = { $in: ['sent', 'partial', 'overdue'] };
    if (paymentDue === 'overdue') {
      filter.status = { $nin: ['paid', 'void'] };
      filter.dueDate = { ...(filter.dueDate || {}), $lt: new Date() };
    }
    if (paymentDue === 'paid') filter.status = 'paid';
    if (paymentDue === 'not_due') filter.status = { $in: ['draft', 'sent'] };
    if (from || to) {
      filter.issueDate = {};
      if (from) filter.issueDate.$gte = new Date(from);
      if (to) filter.issueDate.$lte = new Date(to);
    }
    if (dueFrom || dueTo) {
      filter.dueDate = { ...(filter.dueDate || {}) };
      if (dueFrom) filter.dueDate.$gte = new Date(dueFrom);
      if (dueTo) filter.dueDate.$lte = new Date(dueTo);
    }

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .populate('clientId caseId createdBy');

    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

/**
 * POST /api/invoices/from-time
 * Body: { clientId, caseId, timeEntryIds: [] }
 * Generates an invoice from APPROVED TimeEntries, creates InvoiceLine rows, updates TimeEntry.status -> 'billed'.
 */
export const generateFromApprovedTime = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { clientId, caseId, timeEntryIds = [], currency = 'INR', dueDate, periodStart, periodEnd, createdBy, templateType = 'standard', taxTreatment, taxNote } = req.body;

    if (!clientId || !Array.isArray(timeEntryIds) || timeEntryIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'clientId and timeEntryIds[] are required' });
    }

    const entries = await TimeEntry.find(workspaceFilter(req, { _id: { $in: timeEntryIds } })).session(session);
    if (entries.length !== timeEntryIds.length) {
      return res.status(404).json({ error: 'One or more time entries not found' });
    }

    // Validate all entries are approved, belong to the same client/case
    for (const e of entries) {
      if (!READY_STATUSES.has(e.status)) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'All time entries must be Ready to Bill' });
      }
      if (String(e.clientId) !== String(clientId)) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'All time entries must match the provided clientId' });
      }
      if (caseId && String(e.caseId) !== String(caseId)) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'All time entries must match the provided caseId' });
      }
    }

    // Create invoice shell
    const invoice = await Invoice.create([{
      clientId,
      caseId: caseId || entries[0].caseId,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
      issueDate: new Date(),
      dueDate: dueDate || undefined,
      currency,
      templateType,
      taxTreatment: taxTreatment || undefined,
      taxNote: taxNote || undefined,
      subtotal: 0,
      tax: 0,
      total: 0,
      status: 'draft',
      createdBy: createdBy || req.user?.id,
      workspaceId: req.workspaceId,
    }], { session });
    const inv = invoice[0];

    // Create lines
    const linesToInsert = entries.map(e => {
      const qtyHours = Number(((e.billableMinutes || 0) / 60).toFixed(4));
      const rate = Number(e.rateApplied || 0);
      const amount = Number((rate * qtyHours).toFixed(2));
      return {
        invoiceId: inv._id,
        workspaceId: req.workspaceId,
        timeEntryId: e._id,
        lineType: templateType === 'solo_advocate_fee_invoice' ? 'professional_fee' : 'hourly',
        serviceDate: e.workDate || e.date,
        periodLabel: periodStart || periodEnd ? [periodStart, periodEnd].filter(Boolean).join(' to ') : undefined,
        description: e.narrative || 'Professional services',
        qtyHours,
        rate,
        ratePaise: toPaise(rate),
        amount,
        amountPaise: toPaise(amount),
        snapshot: { sourceType: 'time_entry', sourceStatus: e.status, description: e.narrative || 'Professional services', capturedAt: new Date() },
      };
    });
    await InvoiceLine.insertMany(linesToInsert, { session });

    // Roll up totals
    const totals = await recalcInvoiceTotals(inv._id, { session });

    // Mark time entries as billed
    await TimeEntry.updateMany(
      workspaceFilter(req, { _id: { $in: timeEntryIds } }),
      { $set: { status: 'billed' } },
      { session }
    );
    await EmailEntry.updateMany(
      workspaceFilter(req, { 'meta.timeEntryId': { $in: timeEntryIds } }),
      { $set: { status: 'billed', billedAt: new Date() } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ ...inv.toObject(), ...totals });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ error: 'Failed to generate invoice from time' });
  }
};

/**
 * POST /api/invoices/from-billables
 * Body: { clientId, caseId?, billableIds: [] }
 * Generates a draft invoice from APPROVED Billables and marks them billed.
 */
export const generateFromApprovedBillables = async (req, res) => {
  const { clientId, caseId, billableIds = [], currency = 'INR', dueDate, periodStart, periodEnd, createdBy, templateType = 'standard', taxTreatment, taxNote } = req.body;

  if (!clientId || !Array.isArray(billableIds) || billableIds.length === 0) {
    return res.status(400).json({ error: 'clientId and billableIds[] are required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const billables = await Billable.find(workspaceFilter(req, { _id: { $in: billableIds } })).session(session);
    if (billables.length !== billableIds.length) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'One or more billables not found' });
    }

    for (const billable of billables) {
      if (!READY_STATUSES.has(billable.status)) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'All billables must be Ready to Bill before invoicing' });
      }
      if (billable.invoiceId || billable.status === 'billed') {
        await session.abortTransaction();
        return res.status(409).json({ error: 'One or more billables are already billed' });
      }
      if (String(billable.clientId) !== String(clientId)) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'All billables must match the provided clientId' });
      }
      if (caseId && String(billable.caseId) !== String(caseId)) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'All billables must match the provided caseId' });
      }
    }

    const uniqueCaseIds = [...new Set(billables.map((billable) => String(billable.caseId)))];
    const invoiceCaseId = caseId || (uniqueCaseIds.length === 1 ? uniqueCaseIds[0] : undefined);
    const items = billables.map((billable) => {
      const durationMinutes = Number(billable.durationMinutes || 0);
      const rate = Number(billable.rate || 0);
      const amount = Number(
        (billable.amount != null ? billable.amount : rate * (durationMinutes / 60)).toFixed(2)
      );

      return {
        billableId: billable._id,
        description: billable.description || billable.category || 'Professional services',
        durationMinutes,
        rate,
        ratePaise: billable.ratePaise || toPaise(rate),
        amount,
        amountPaise: billable.amountPaise || toPaise(amount),
      };
    });

    const [invoice] = await Invoice.create([{
      clientId,
      caseId: invoiceCaseId,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
      issueDate: new Date(),
      dueDate: dueDate || undefined,
      currency,
      templateType,
      taxTreatment: taxTreatment || undefined,
      taxNote: taxNote || undefined,
      status: 'draft',
      createdBy: createdBy || req.user?.id,
      workspaceId: req.workspaceId,
      items,
    }], { session });

    await InvoiceLine.insertMany(items.map((item) => ({
      invoiceId: invoice._id,
      workspaceId: req.workspaceId,
      billableId: item.billableId,
      description: item.description,
      qtyHours: Number(((item.durationMinutes || 0) / 60).toFixed(4)),
      rate: item.rate,
      ratePaise: item.ratePaise,
      amount: item.amount,
      amountPaise: item.amountPaise,
      snapshot: { sourceType: 'billable', sourceStatus: 'ready_to_bill', description: item.description, capturedAt: new Date() },
    })), { session });

    const totals = await recalcInvoiceTotals(invoice._id, { session });

    await Billable.updateMany(
      workspaceFilter(req, { _id: { $in: billableIds } }),
      {
        $set: {
          status: 'billed',
          invoiceId: invoice._id,
          pushedAt: new Date(),
        },
      },
      { session }
    );
    await EmailEntry.updateMany(
      workspaceFilter(req, { 'meta.billableId': { $in: billableIds } }),
      { $set: { status: 'billed', billedAt: new Date() } },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ ...invoice.toObject(), ...totals });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ error: 'Failed to generate invoice from billables' });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/invoices/from-billables/auto
 * Groups all approved, unbilled billables by client and creates one draft invoice per client.
 * GST is applied by recalcInvoiceTotals from firm tax settings.
 */
export const autoGenerateFromApprovedBillables = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { clientId, currency = 'INR', dueDate, periodStart, periodEnd, createdBy } = req.body || {};
    const billableFilter = workspaceFilter(req, {
      status: { $in: READY_STATUSES },
      $or: [{ invoiceId: { $exists: false } }, { invoiceId: null }],
    });
    if (clientId) billableFilter.clientId = clientId;

    const billables = await Billable.find(billableFilter).sort({ clientId: 1, date: 1 }).session(session);
    if (!billables.length) {
      await session.commitTransaction();
      return res.json({ invoices: [], groupedBillables: 0, message: 'No approved unbilled billables found.' });
    }

    const byClient = billables.reduce((groups, billable) => {
      const key = String(billable.clientId);
      groups.set(key, [...(groups.get(key) || []), billable]);
      return groups;
    }, new Map());

    const createdInvoices = [];
    for (const [groupClientId, groupBillables] of byClient.entries()) {
      const uniqueCaseIds = [...new Set(groupBillables.map((billable) => String(billable.caseId)).filter(Boolean))];
      const invoiceCaseId = uniqueCaseIds.length === 1 ? uniqueCaseIds[0] : undefined;

      const [invoice] = await Invoice.create([{
        clientId: groupClientId,
        caseId: invoiceCaseId,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        issueDate: new Date(),
        dueDate: dueDate || undefined,
        currency,
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'draft',
        createdBy: createdBy || req.user?.id,
        workspaceId: req.workspaceId,
      }], { session });

      const lines = groupBillables.map((billable) => ({
        invoiceId: invoice._id,
        workspaceId: req.workspaceId,
        billableId: billable._id,
        lineType: templateType === 'solo_advocate_fee_invoice' ? 'professional_fee' : 'hourly',
        serviceDate: billable.date,
        periodLabel: periodStart || periodEnd ? [periodStart, periodEnd].filter(Boolean).join(' to ') : undefined,
        description: billable.description || billable.category || 'Professional services',
        qtyHours: Number(((Number(billable.durationMinutes || 0)) / 60).toFixed(4)),
        rate: Number(billable.rate || 0),
        ratePaise: billable.ratePaise || toPaise(billable.rate),
        amount: Number((billable.amount != null ? billable.amount : Number(billable.rate || 0) * (Number(billable.durationMinutes || 0) / 60)).toFixed(2)),
        amountPaise: billable.amountPaise || toPaise(billable.amount != null ? billable.amount : Number(billable.rate || 0) * (Number(billable.durationMinutes || 0) / 60)),
        snapshot: { sourceType: 'billable', sourceStatus: billable.status, description: billable.description || billable.category || 'Professional services', capturedAt: new Date() },
      }));

      await InvoiceLine.insertMany(lines, { session });
      const totals = await recalcInvoiceTotals(invoice._id, { session });
      await Billable.updateMany(
        workspaceFilter(req, { _id: { $in: groupBillables.map((billable) => billable._id) } }),
        { $set: { status: 'billed', invoiceId: invoice._id, pushedAt: new Date() } },
        { session }
      );

      createdInvoices.push({
        ...invoice.toObject(),
        ...totals,
        billableCount: groupBillables.length,
      });
    }

    await session.commitTransaction();
    res.status(201).json({ invoices: createdInvoices, groupedBillables: billables.length });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ error: 'Failed to auto-generate invoices from billables' });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/invoices/:id/send
 * Body: { dueDate?, pdfUrl?, to?, subject?, message? }
 * Sends a PDF invoice by email when a recipient is present and sets status -> 'sent'.
 */
export const sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate, pdfUrl, to, subject, message } = req.body || {};

    const inv = await Invoice.findOne(workspaceFilter(req, { _id: id })).populate('clientId caseId createdBy');
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    if (inv.status === 'void') return res.status(400).json({ error: 'Cannot send a void invoice' });

    if (inv.status === 'draft' || inv.status === 'ready_to_bill') {
      await recalcInvoiceTotals(inv._id);
    }
    const refreshed = await Invoice.findOne(workspaceFilter(req, { _id: id })).populate('clientId caseId createdBy');
    if (dueDate) refreshed.dueDate = new Date(dueDate);
    if (pdfUrl) refreshed.pdfUrl = pdfUrl;
    refreshed.issueDate = refreshed.issueDate || new Date();
    if (!refreshed.invoiceNumber) refreshed.invoiceNumber = await nextInvoiceNumber(req.workspaceId || refreshed.workspaceId);
    const snapshots = await buildInvoiceSnapshots(refreshed, { actorId: req.user?.id });
    if (refreshed.templateType === 'solo_advocate_fee_invoice') assertSoloAdvocateReady(snapshots);
    Object.assign(refreshed, snapshots);
    refreshed.status = 'sent';
    refreshed.sentAt = new Date();
    refreshed.deliveryStatus = 'sent';
    refreshed.deliveryHistory.push({ action: 'send_attempt', at: new Date(), to, status: 'pending' });

    let delivery = null;
    try {
      delivery = await emailInvoice(refreshed, { to, subject, message });
      refreshed.sentTo = delivery.to;
      refreshed.deliveryError = undefined;
      refreshed.deliveryHistory.push({ action: 'sent', at: new Date(), to: delivery.to, status: 'sent' });
    } catch (deliveryError) {
      refreshed.deliveryStatus = 'failed';
      refreshed.deliveryError = deliveryError.message;
      refreshed.deliveryHistory.push({ action: 'failed', at: new Date(), to, status: 'failed', error: deliveryError.message });
    }

    await refreshed.save();
    res.json({ ...refreshed.toObject(), delivery });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id })).populate('clientId caseId createdBy');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'draft' || invoice.status === 'ready_to_bill') await recalcInvoiceTotals(invoice._id);
    const refreshed = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id })).populate('clientId caseId createdBy');
    const pdf = await buildInvoicePdfBuffer(refreshed);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${refreshed.invoiceNumber || refreshed._id}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
};

export const previewInvoiceHtml = async (req, res) => {
  try {
    const invoice = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id })).populate('clientId caseId createdBy');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'draft' || invoice.status === 'ready_to_bill') await recalcInvoiceTotals(invoice._id);
    const refreshed = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id })).populate('clientId caseId createdBy');
    const html = await buildInvoiceHtml(refreshed);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to render invoice document' });
  }
};

/**
 * POST /api/invoices/:id/void
 */
export const voidInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await Invoice.findOne(workspaceFilter(req, { _id: id }));
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    if (inv.status === 'paid') return res.status(409).json({ error: 'Paid invoices require a refund or revision workflow' });
    inv.status = 'void';
    await inv.save();
    res.json(inv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to void invoice' });
  }
};

export const finaliseInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id })).session(session);
    if (!invoice) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (!assertDraft(invoice, res)) {
      await session.abortTransaction();
      return;
    }

    const totals = await recalcInvoiceTotals(invoice._id, { session });
    invoice.subtotal = totals.subtotal;
    invoice.tax = totals.tax;
    invoice.total = totals.total;
    invoice.subtotalPaise = totals.subtotalPaise;
    invoice.taxPaise = totals.taxPaise;
    invoice.totalPaise = totals.totalPaise;
    const snapshots = await buildInvoiceSnapshots(invoice, { actorId: req.user?.id, session });
    if (invoice.templateType === 'solo_advocate_fee_invoice') assertSoloAdvocateReady(snapshots);
    invoice.invoiceNumber = invoice.invoiceNumber || await nextInvoiceNumber(req.workspaceId || invoice.workspaceId, session);
    invoice.status = 'finalised';
    invoice.finalisedAt = new Date();
    invoice.finalisedBy = req.user?.id;
    invoice.balancePaise = totals.totalPaise;
    Object.assign(invoice, snapshots);
    invoice.immutableSnapshot.totals = totals;
    await invoice.save({ session });
    await session.commitTransaction();
    res.json(invoice);
  } catch (error) {
    await session.abortTransaction();
    if (error?.code === 11000) return res.status(409).json({ error: 'Invoice number already exists' });
    res.status(500).json({ error: 'Failed to finalise invoice' });
  } finally {
    session.endSession();
  }
};

export const reviseInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const original = await Invoice.findOne(workspaceFilter(req, { _id: req.params.id })).session(session);
    if (!original) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (original.status === 'draft') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Draft invoices can be edited directly' });
    }
    original.status = 'revised';
    await original.save({ session });
    const [revision] = await Invoice.create([{
      clientId: original.clientId,
      caseId: original.caseId,
      currency: original.currency,
      templateType: original.templateType,
      taxTreatment: original.taxTreatment,
      taxNote: original.taxNote,
      taxName: original.taxName,
      taxRatePct: original.taxRatePct,
      taxInclusive: original.taxInclusive,
      status: 'draft',
      revisionOf: original._id,
      revisionReason: req.body?.reason,
      createdBy: req.user?.id,
      workspaceId: req.workspaceId,
      subtotal: 0,
      total: 0,
      subtotalPaise: 0,
      totalPaise: 0,
      balancePaise: 0,
    }], { session });
    await session.commitTransaction();
    res.status(201).json({ original, revision });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Failed to revise invoice' });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/invoices/__pipeline
 * Returns totals grouped by status for kanban/pipeline views.
 */
export const getPipeline = async (req, res) => {
  try {
    const { clientId, caseId } = req.query;
    const match = workspaceAggregateMatch(req);
    if (clientId) match.clientId = new mongoose.Types.ObjectId(clientId);
    if (caseId) match.caseId = new mongoose.Types.ObjectId(caseId);

    const agg = [
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: { $ifNull: ['$total', 0] } },
          subtotal: { $sum: { $ifNull: ['$subtotal', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const rows = await Invoice.aggregate(agg);
    const pipeline = rows.map(r => ({ status: r._id, count: r.count, subtotal: r.subtotal, total: r.total }));
    res.json(pipeline);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to build pipeline' });
  }
};

// GET /api/invoices/__analytics/pending-by-client
// Summarize total pending amount per client.
// "Pending" = invoices that are NOT paid or void.
export const getPendingSummaryByClient = async (req, res) => {
  try {
    const { clientId } = req.query;

    const match = {
      ...workspaceAggregateMatch(req),
      status: { $nin: ["paid", "void"] }, // treat all other statuses as pending
    };

    if (clientId) {
      match.clientId = new mongoose.Types.ObjectId(clientId);
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: "$clientId",
          // support either total or totalAmount fields
          totalPending: {
            $sum: {
              $ifNull: ["$total", "$totalAmount"],
            },
          },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          clientId: "$_id",
          clientName: {
            $ifNull: [
              "$client.displayName",
              {
                $ifNull: ["$client.name", "Unknown client"],
              },
            ],
          },
          totalPending: 1,
          invoiceCount: 1,
        },
      },
      { $sort: { totalPending: -1 } },
    ];

    const rows = await Invoice.aggregate(pipeline);
    // Frontend handles both {items: []} and [] so this is safe:
    res.json({ items: rows });
  } catch (error) {
    console.error("getPendingSummaryByClient error", error);
    res
      .status(500)
      .json({ error: "Failed to compute pending summary by client" });
  }
};

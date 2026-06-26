// src/controllers/paymentController.js
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../../invoices/models/Invoice.js';
import { nextReceiptNumber } from '../../finance/sequenceService.js';
import { fromPaise, toPaise } from '../../finance/money.js';

const PORTAL_TOKEN_DAYS = 30;

function workspaceFilter(req, extra = {}) {
  return req.workspaceId ? { workspaceId: req.workspaceId, ...extra } : extra;
}

function workspaceAggregateMatch(workspaceId, extra = {}) {
  if (!workspaceId) return extra;
  const value = mongoose.Types.ObjectId.isValid(workspaceId)
    ? new mongoose.Types.ObjectId(workspaceId)
    : workspaceId;
  return { workspaceId: value, ...extra };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function paymentPortalConfig() {
  return {
    upiId: String(process.env.PAYMENT_UPI_ID || '').trim(),
    upiName: String(process.env.PAYMENT_UPI_NAME || process.env.FIRM_NAME || 'BillSync Legal').trim(),
    mockGatewayEnabled: process.env.PAYMENT_MOCK_GATEWAY_ENABLED
      ? String(process.env.PAYMENT_MOCK_GATEWAY_ENABLED).toLowerCase() === 'true'
      : process.env.NODE_ENV !== 'production',
  };
}

function buildAudit(action, req, changes, note) {
  return {
    action,
    actorId: req.user?.id,
    at: new Date(),
    changes,
    note,
  };
}

/** Recalculate an invoice's status from cleared payments and persist */
async function recomputeInvoiceStatus(invoiceId, session = null, workspaceId = null) {
  const clearedPaiseRows = await Payment.aggregate([
    { $match: workspaceAggregateMatch(workspaceId, { invoiceId: new mongoose.Types.ObjectId(invoiceId), status: 'cleared', transactionType: { $in: ['payment', 'write_off', 'refund'] } }) },
    {
      $group: {
        _id: '$invoiceId',
        paidPaise: {
          $sum: {
            $cond: [
              { $eq: ['$transactionType', 'refund'] },
              { $multiply: ['$amountPaise', -1] },
              '$amountPaise',
            ],
          },
        },
      },
    },
  ]).session(session);
  const paidPaise = Math.max(0, clearedPaiseRows[0]?.paidPaise || 0);
  const paidAmount = fromPaise(paidPaise);

  const inv = await Invoice.findOne(workspaceId ? { _id: invoiceId, workspaceId } : { _id: invoiceId }).session(session);
  if (!inv) return null;

  inv.balancePaise = Math.max(0, Number(inv.totalPaise || toPaise(inv.total)) - paidPaise);
  const newStatus = inv.computeStatus(paidAmount);
  inv.status = newStatus;
  await inv.save({ session });
  return { invoice: inv, paidAmount, paidPaise, balancePaise: inv.balancePaise, newStatus };
}

async function clearedPaidPaise(invoiceId, session = null, workspaceId = null) {
  const rows = await Payment.aggregate([
    { $match: workspaceAggregateMatch(workspaceId, { invoiceId: new mongoose.Types.ObjectId(invoiceId), status: 'cleared', transactionType: { $in: ['payment', 'write_off'] } }) },
    {
      $group: {
        _id: '$invoiceId',
        paidPaise: {
          $sum: '$amountPaise',
        },
      },
    },
  ]).session(session);
  return rows[0]?.paidPaise || 0;
}

async function netPaidPaise(invoiceId, session = null, workspaceId = null) {
  const result = await recomputeInvoiceStatus(invoiceId, session, workspaceId);
  return result?.paidPaise || 0;
}

async function outstandingPaise(invoiceId, session, workspaceId = null) {
  const invoice = await Invoice.findOne(workspaceId ? { _id: invoiceId, workspaceId } : { _id: invoiceId }).session(session);
  if (!invoice) return null;
  await recomputeInvoiceStatus(invoiceId, session, workspaceId);
  const fresh = await Invoice.findOne(workspaceId ? { _id: invoiceId, workspaceId } : { _id: invoiceId }).session(session);
  return { invoice: fresh, outstanding: Number(fresh.balancePaise ?? fresh.totalPaise ?? toPaise(fresh.total)) };
}

function requireReference({ method, reference }) {
  return ['bank_transfer', 'upi'].includes(method) && !String(reference || '').trim();
}

/**
 * GET /api/payments
 * Query: invoiceId?, status?, from?, to?
 */
export const listPayments = async (req, res) => {
  try {
    const { invoiceId, status, from, to } = req.query;
    const q = workspaceFilter(req);
    if (invoiceId) q.invoiceId = invoiceId;
    if (status) q.status = status;
    if (from || to) {
      q.receivedDate = {};
      if (from) q.receivedDate.$gte = new Date(from);
      if (to) q.receivedDate.$lte = new Date(to);
    }
    const rows = await Payment.find(q).sort({ receivedDate: -1 });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list payments' });
  }
};

/**
 * POST /api/payments
 * Body: { invoiceId, amount, method, receivedDate, reference?, status?, receivedBy?, notes? }
 * Side-effects: updates related invoice.status based on cleared payments.
 */
export const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const data = req.body || {};
    if (!data.invoiceId) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'invoiceId is required' });
    }
    const idempotencyKey = req.get?.('idempotency-key') || data.idempotencyKey;
    if (idempotencyKey) {
      const existing = await Payment.findOne(workspaceFilter(req, { idempotencyKey })).session(session);
      if (existing) {
        await session.commitTransaction();
        return res.status(200).json({ payment: existing, idempotent: true });
      }
    }
    if (requireReference(data)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Reference is required for bank transfer and UPI payments' });
    }

    const inv = await Invoice.findOne(workspaceFilter(req, { _id: data.invoiceId })).session(session);
    if (!inv) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (inv.status === 'void') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot record payment against a void invoice' });
    }
    const amountPaise = data.amountPaise ?? toPaise(data.amount);
    const current = await outstandingPaise(inv._id, session, req.workspaceId);
    const transactionType = data.transactionType || 'payment';
    if (['payment', 'write_off'].includes(transactionType) && amountPaise > current.outstanding && !data.creditApplied) {
      await session.abortTransaction();
      return res.status(400).json({ error: transactionType === 'write_off' ? 'Write-off cannot exceed outstanding amount' : 'Payment exceeds outstanding balance' });
    }
    if (transactionType === 'refund' && amountPaise > (await clearedPaidPaise(inv._id, session, req.workspaceId))) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Refund cannot exceed cleared paid amount' });
    }
    if (transactionType === 'write_off' && !String(data.notes || data.reason || '').trim()) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Write-off reason is required' });
    }

    const payment = await Payment.create([{
      ...data,
      amount: fromPaise(amountPaise),
      amountPaise,
      transactionType,
      receivedBy: data.receivedBy || req.user?.id,
      idempotencyKey,
      receiptNumber: await nextReceiptNumber(req.workspaceId || inv.workspaceId, session),
      workspaceId: req.workspaceId,
      auditTrail: [buildAudit('created', req, { status: data.status || 'cleared', amount: data.amount })],
    }], { session });
    const result = await recomputeInvoiceStatus(inv._id, session, req.workspaceId);

    await session.commitTransaction();
    res.status(201).json({ payment: payment[0], invoice: result?.invoice, paidAmount: result?.paidAmount, status: result?.newStatus });
  } catch (e) {
    console.error(e);
    await session.abortTransaction();
    res.status(500).json({ error: 'Failed to create payment' });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/payments/:id/reconcile
 * Body: { status: 'cleared' | 'failed' | 'pending', receivedDate? }
 * Side-effects: updates related invoice.status
 */
export const reconcilePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { status, receivedDate } = req.body || {};
    if (!['cleared', 'failed', 'pending'].includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payment = await Payment.findOne(workspaceFilter(req, { _id: id })).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Payment not found' });
    }

    const previousStatus = payment.status;
    if (receivedDate) payment.receivedDate = new Date(receivedDate);
    payment.status = status;
    payment.auditTrail.push(buildAudit('reconciled', req, { status: { from: previousStatus, to: status } }));
    await payment.save({ session });

    const result = await recomputeInvoiceStatus(payment.invoiceId, session, req.workspaceId);

    await session.commitTransaction();
    session.endSession();
    res.json({ payment, invoice: result?.invoice, paidAmount: result?.paidAmount, status: result?.newStatus });
  } catch (e) {
    console.error(e);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: 'Failed to reconcile payment' });
  }
};

/**
 * DELETE /api/payments/:id
 * Side-effects: updates related invoice.status
 */
export const deletePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const payment = await Payment.findOne(workspaceFilter(req, { _id: id })).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Payment not found' });
    }
    const previousStatus = payment.status;
    payment.status = 'failed';
    payment.auditTrail.push(buildAudit('voided', req, { status: { from: previousStatus, to: 'failed' } }, 'Payment voided instead of hard deleted for audit retention'));
    await payment.save({ session });
    const result = await recomputeInvoiceStatus(payment.invoiceId, session, req.workspaceId);

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, invoice: result?.invoice, paidAmount: result?.paidAmount, status: result?.newStatus });
  } catch (e) {
    console.error(e);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

export const createWriteOff = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const inv = await Invoice.findOne(workspaceFilter(req, { _id: req.body.invoiceId })).session(session);
    if (!inv) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (inv.status === 'void') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot write off a void invoice' });
    }
    const amountPaise = req.body.amountPaise ?? toPaise(req.body.amount);
    const current = await outstandingPaise(inv._id, session, req.workspaceId);
    if (amountPaise > current.outstanding) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Write-off cannot exceed outstanding amount' });
    }
    if (!String(req.body.notes || req.body.reason || '').trim()) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Write-off reason is required' });
    }
    const [payment] = await Payment.create([{
      invoiceId: req.body.invoiceId,
      amount: fromPaise(amountPaise),
      amountPaise,
      transactionType: 'write_off',
      method: 'other',
      receivedDate: new Date(),
      reference: req.body.reference,
      status: 'cleared',
      receivedBy: req.user?.id,
      receiptNumber: await nextReceiptNumber(req.workspaceId || inv.workspaceId, session),
      workspaceId: req.workspaceId,
      notes: req.body.notes,
      auditTrail: [buildAudit('write_off_created', req, { amount: req.body.amount }, req.body.notes)],
    }], { session });
    const result = await recomputeInvoiceStatus(inv._id, session, req.workspaceId);
    await session.commitTransaction();
    res.status(201).json({ payment, invoice: result?.invoice, paidAmount: result?.paidAmount, status: result?.newStatus });
  } catch (e) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Failed to create write-off' });
  } finally {
    session.endSession();
  }
};

export const financeSummary = async (req, res) => {
  try {
    const workspaceMatch = workspaceAggregateMatch(req.workspaceId);
    const [invoiceAgg, paymentAgg] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...workspaceMatch, status: { $ne: 'void' } } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalPaise: { $sum: { $ifNull: ['$totalPaise', { $round: [{ $multiply: [{ $ifNull: ['$total', 0] }, 100] }, 0] }] } } } },
      ]),
      Payment.aggregate([
        { $match: { ...workspaceMatch, status: 'cleared' } },
        { $group: { _id: '$transactionType', count: { $sum: 1 }, totalPaise: { $sum: { $ifNull: ['$amountPaise', { $round: [{ $multiply: ['$amount', 100] }, 0] }] } } } },
      ]),
    ]);
    const invoiceTotalPaise = invoiceAgg.reduce((sum, row) => sum + row.totalPaise, 0);
    const clearedPaymentsPaise = paymentAgg.filter((row) => row._id === 'payment').reduce((sum, row) => sum + row.totalPaise, 0);
    const writeOffsPaise = paymentAgg.filter((row) => row._id === 'write_off').reduce((sum, row) => sum + row.totalPaise, 0);
    const invoiceTotal = fromPaise(invoiceTotalPaise);
    const clearedPayments = fromPaise(clearedPaymentsPaise);
    const writeOffs = fromPaise(writeOffsPaise);
    res.json({
      ok: true,
      data: {
        invoiceTotal,
        invoiceTotalPaise,
        clearedPayments,
        clearedPaymentsPaise,
        writeOffs,
        writeOffsPaise,
        outstanding: fromPaise(Math.max(invoiceTotalPaise - clearedPaymentsPaise - writeOffsPaise, 0)),
        outstandingPaise: Math.max(invoiceTotalPaise - clearedPaymentsPaise - writeOffsPaise, 0),
        invoiceByStatus: invoiceAgg.map((row) => ({ ...row, total: fromPaise(row.totalPaise || 0) })),
        paymentByType: paymentAgg.map((row) => ({ ...row, total: fromPaise(row.totalPaise || 0) })),
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to build finance summary' });
  }
};

export const createPortalLink = async (req, res) => {
  try {
    const invoice = await Invoice.findOne(workspaceFilter(req, { _id: req.params.invoiceId })).populate('clientId', 'displayName name email');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'void') return res.status(400).json({ error: 'Cannot create payment portal for a void invoice' });
    const token = crypto.randomBytes(24).toString('base64url');
    invoice.paymentPortal = {
      enabled: true,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PORTAL_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      lastGeneratedAt: new Date(),
    };
    await invoice.save();
    const frontend = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    res.json({
      ok: true,
      data: {
        token,
        url: `${frontend}/pay/${token}`,
        expiresAt: invoice.paymentPortal.expiresAt,
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create payment portal link' });
  }
};

async function loadPortalInvoice(token, session = null) {
  const tokenHash = hashToken(token);
  return Invoice.findOne({
    'paymentPortal.enabled': true,
    'paymentPortal.tokenHash': tokenHash,
    'paymentPortal.expiresAt': { $gt: new Date() },
  }).session(session).populate('clientId', 'displayName name email').populate('caseId', 'title name');
}

async function clearedAmountForInvoice(invoiceId, session = null, workspaceId = null) {
  return fromPaise(await netPaidPaise(invoiceId, session, workspaceId));
}

async function outstandingForPortal(invoiceId, session = null) {
  const invoice = await Invoice.findById(invoiceId).session(session);
  const result = await recomputeInvoiceStatus(invoiceId, session, invoice?.workspaceId);
  return result?.balancePaise ?? 0;
}

export const getPortalInvoice = async (req, res) => {
  try {
    const invoice = await loadPortalInvoice(req.params.token);
    if (!invoice) return res.status(404).json({ ok: false, message: 'Payment link is invalid or expired' });
    const paidAmount = await clearedAmountForInvoice(invoice._id, null, invoice.workspaceId);
    res.json({
      ok: true,
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber || String(invoice._id),
        clientName: invoice.clientId?.displayName || invoice.clientId?.name,
        matter: invoice.caseId?.title || invoice.caseId?.name,
        currency: invoice.currency || 'INR',
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        paidAmount,
        outstanding: Math.max(Number(invoice.total || 0) - paidAmount, 0),
        dueDate: invoice.dueDate,
        status: invoice.status,
        paymentConfig: paymentPortalConfig(),
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'Failed to load payment link' });
  }
};

export const submitPortalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await loadPortalInvoice(req.params.token);
    if (!invoice) {
      await session.abortTransaction();
      return res.status(404).json({ ok: false, message: 'Payment link is invalid or expired' });
    }
    if (req.body.method === 'upi' && !String(req.body.reference || '').trim()) {
      await session.abortTransaction();
      return res.status(400).json({ ok: false, message: 'UPI reference or UTR is required' });
    }
    const amountPaise = req.body.amountPaise ?? toPaise(req.body.amount);
    const outstanding = await outstandingForPortal(invoice._id, session);
    if (amountPaise > outstanding) {
      await session.abortTransaction();
      return res.status(400).json({ ok: false, message: 'Payment exceeds outstanding balance' });
    }
    const [payment] = await Payment.create([{
      invoiceId: invoice._id,
      workspaceId: invoice.workspaceId,
      amount: fromPaise(amountPaise),
      amountPaise,
      method: req.body.method,
      receivedDate: new Date(),
      reference: req.body.reference,
      status: 'pending',
      notes: req.body.notes,
      transactionType: 'payment',
      portal: {
        submittedByClient: true,
        payerName: req.body.payerName,
        payerEmail: req.body.payerEmail,
        upiId: req.body.upiId,
        submittedAt: new Date(),
      },
      auditTrail: [{ action: 'portal_submitted', at: new Date(), changes: { amount: req.body.amount, method: req.body.method } }],
    }], { session });
    await session.commitTransaction();
    res.status(201).json({ ok: true, data: { paymentId: payment._id, status: payment.status } });
  } catch (e) {
    await session.abortTransaction();
    res.status(500).json({ ok: false, message: 'Failed to submit portal payment' });
  } finally {
    session.endSession();
  }
};

export const mockCompletePortalPayment = async (req, res) => {
  const config = paymentPortalConfig();
  if (!config.mockGatewayEnabled) {
    return res.status(404).json({ ok: false, message: 'Mock payment gateway is disabled' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await loadPortalInvoice(req.params.token, session);
    if (!invoice) {
      await session.abortTransaction();
      return res.status(404).json({ ok: false, message: 'Payment link is invalid or expired' });
    }
    if (invoice.status === 'void') {
      await session.abortTransaction();
      return res.status(400).json({ ok: false, message: 'Cannot pay a void invoice' });
    }

    const outstanding = await outstandingForPortal(invoice._id, session);
    const requestedPaise = req.body?.amountPaise || toPaise(req.body?.amount || fromPaise(outstanding));
    const amountPaise = Math.min(requestedPaise, outstanding);
    if (!amountPaise) {
      await session.abortTransaction();
      return res.status(400).json({ ok: false, message: 'This invoice has no outstanding amount' });
    }
    const amount = fromPaise(amountPaise);

    const reference = `MOCK-UPI-${Date.now()}`;
    const [payment] = await Payment.create([{
      invoiceId: invoice._id,
      workspaceId: invoice.workspaceId,
      amount,
      amountPaise,
      method: 'upi',
      receivedDate: new Date(),
      reference,
      status: 'cleared',
      notes: 'Mock UPI gateway payment for testing',
      transactionType: 'payment',
      portal: {
        submittedByClient: true,
        payerName: req.body?.payerName,
        payerEmail: req.body?.payerEmail,
        upiId: req.body?.upiId || 'mockpayer@upi',
        submittedAt: new Date(),
      },
      auditTrail: [{
        action: 'mock_gateway_success',
        at: new Date(),
        changes: { amount, method: 'upi', reference },
        note: 'Test-only mock gateway completion',
      }],
    }], { session });

    const result = await recomputeInvoiceStatus(invoice._id, session, invoice.workspaceId);
    await session.commitTransaction();
    res.status(201).json({
      ok: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        reference,
        paidAmount: result?.paidAmount,
        invoiceStatus: result?.newStatus,
      },
    });
  } catch (e) {
    await session.abortTransaction();
    res.status(500).json({ ok: false, message: 'Failed to complete mock payment' });
  } finally {
    session.endSession();
  }
};

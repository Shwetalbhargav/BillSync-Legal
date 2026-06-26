// src/controllers/reportsController.js
import { Parser as Json2csv } from 'json2csv';
import mongoose from 'mongoose';
import { TimeEntry } from '../../timeEntries/models/TimeEntry.js';
import { Invoice } from '../../invoices/models/Invoice.js';
import { fromPaise, toPaise } from '../../finance/money.js';
import { Payment } from '../../payments/models/Payment.js';
import { Client } from '../../clients/models/Client.js';
import { Case } from '../../cases/models/Case.js';

function asDate(s, fallback = null) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function asObjectId(value) {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(value) : false;
}

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

function idString(value) {
  return value?._id ? String(value._id) : value ? String(value) : '';
}

function displayClient(client) {
  return client?.displayName || client?.name || '';
}

function displayCase(matter) {
  return matter?.title || matter?.name || '';
}

function displayUser(user) {
  return user?.name || user?.email || '';
}

function paiseValue(row, paiseField, decimalField) {
  return row?.[paiseField] ?? toPaise(row?.[decimalField] || 0);
}

function dateRange(query = {}) {
  const from = asDate(query.from);
  const to = asDate(query.to);
  const range = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return Object.keys(range).length ? range : null;
}

function monthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

function agingBucket(dueDate, asOf = new Date()) {
  const days = Math.floor((asOf.getTime() - new Date(dueDate || asOf).getTime()) / 86400000);
  if (days <= 0) return 'current';
  if (days <= 30) return '1_30';
  if (days <= 60) return '31_60';
  if (days <= 90) return '61_90';
  return '90_plus';
}

function sendCsv(res, rows, filename, fields) {
  const parser = new Json2csv({ fields });
  const csv = parser.parse(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
}

/**
 * GET /api/reports/time-entries.csv
 * Query: from?, to?, clientId?, caseId?, userId?, status?
 */
export const exportTimeEntriesCsv = async (req, res) => {
  try {
    const { clientId, caseId, userId, status } = req.query;
    const from = asDate(req.query.from);
    const to = asDate(req.query.to);
    const clientObjectId = asObjectId(clientId);
    const caseObjectId = asObjectId(caseId);
    const userObjectId = asObjectId(userId);
    if ((clientId && !clientObjectId) || (caseId && !caseObjectId) || (userId && !userObjectId)) {
      return res.status(400).json({ error: 'Invalid clientId, caseId, or userId' });
    }

    const q = workspaceFilter(req);
    if (clientObjectId) q.clientId = clientObjectId;
    if (caseObjectId) q.caseId = caseObjectId;
    if (userObjectId) q.userId = userObjectId;
    if (status) q.status = status;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }

    const rows = await TimeEntry.find(q)
      .select('date clientId caseId userId narrative billableMinutes nonbillableMinutes rateApplied amount status createdAt updatedAt')
      .populate('clientId', 'displayName name')
      .populate('caseId', 'title name')
      .populate('userId', 'name email role')
      .sort({ date: 1 })
      .lean();

    const shaped = rows.map(r => ({
      date: r.date?.toISOString()?.slice(0, 10),
      clientId: idString(r.clientId),
      clientName: displayClient(r.clientId),
      caseId: idString(r.caseId),
      caseTitle: displayCase(r.caseId),
      userId: idString(r.userId),
      userName: displayUser(r.userId),
      userRole: r.userId?.role || '',
      narrative: r.narrative,
      billableMinutes: r.billableMinutes || 0,
      nonbillableMinutes: r.nonbillableMinutes || 0,
      rateApplied: r.rateApplied ?? '',
      amount: r.amount ?? '',
      status: r.status,
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    }));

    return sendCsv(res, shaped, 'time-entries.csv', [
      'date',
      'clientId',
      'clientName',
      'caseId',
      'caseTitle',
      'userId',
      'userName',
      'userRole',
      'narrative',
      'billableMinutes',
      'nonbillableMinutes',
      'rateApplied',
      'amount',
      'status',
      'createdAt',
      'updatedAt',
    ]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to export time entries CSV' });
  }
};

/**
 * GET /api/reports/invoices.csv
 * Query: from?, to?, clientId?, caseId?, status?
 */
export const exportInvoicesCsv = async (req, res) => {
  try {
    const { clientId, caseId, status } = req.query;
    const from = asDate(req.query.from);
    const to = asDate(req.query.to);
    const clientObjectId = asObjectId(clientId);
    const caseObjectId = asObjectId(caseId);
    if ((clientId && !clientObjectId) || (caseId && !caseObjectId)) {
      return res.status(400).json({ error: 'Invalid clientId or caseId' });
    }

    const q = workspaceFilter(req);
    if (clientObjectId) q.clientId = clientObjectId;
    if (caseObjectId) q.caseId = caseObjectId;
    if (status) q.status = status;
    if (from || to) {
      q.issueDate = {};
      if (from) q.issueDate.$gte = from;
      if (to) q.issueDate.$lte = to;
    }

    const rows = await Invoice.find(q)
      .select('issueDate dueDate clientId caseId currency invoiceNumber subtotal subtotalPaise tax taxPaise taxName taxRatePct taxInclusive total totalPaise balancePaise status sentAt deliveryStatus createdAt updatedAt')
      .populate('clientId', 'displayName name')
      .populate('caseId', 'title name')
      .sort({ issueDate: 1 })
      .lean();

    const shaped = rows.map(r => ({
      invoiceId: idString(r._id),
      issueDate: r.issueDate?.toISOString()?.slice(0, 10),
      dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : '',
      clientId: idString(r.clientId),
      clientName: displayClient(r.clientId),
      caseId: idString(r.caseId),
      caseTitle: displayCase(r.caseId),
      currency: r.currency || 'INR',
      invoiceNumber: r.invoiceNumber || '',
      subtotalPaise: paiseValue(r, 'subtotalPaise', 'subtotal'),
      subtotal: fromPaise(paiseValue(r, 'subtotalPaise', 'subtotal')),
      taxName: r.taxName || 'GST',
      taxRatePct: r.taxRatePct ?? 0,
      taxInclusive: Boolean(r.taxInclusive),
      taxPaise: paiseValue(r, 'taxPaise', 'tax'),
      tax: fromPaise(paiseValue(r, 'taxPaise', 'tax')),
      totalPaise: paiseValue(r, 'totalPaise', 'total'),
      total: fromPaise(paiseValue(r, 'totalPaise', 'total')),
      balancePaise: r.balancePaise ?? paiseValue(r, 'totalPaise', 'total'),
      balance: fromPaise(r.balancePaise ?? paiseValue(r, 'totalPaise', 'total')),
      status: r.status,
      sentAt: r.sentAt?.toISOString() || '',
      deliveryStatus: r.deliveryStatus || '',
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    }));

    return sendCsv(res, shaped, 'invoices.csv', [
      'invoiceId',
      'issueDate',
      'dueDate',
      'clientId',
      'clientName',
      'caseId',
      'caseTitle',
      'currency',
      'invoiceNumber',
      'subtotalPaise',
      'subtotal',
      'taxName',
      'taxRatePct',
      'taxInclusive',
      'taxPaise',
      'tax',
      'totalPaise',
      'total',
      'balancePaise',
      'balance',
      'status',
      'sentAt',
      'deliveryStatus',
      'createdAt',
      'updatedAt',
    ]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to export invoices CSV' });
  }
};

/**
 * GET /api/reports/gst-summary
 * Query: from?, to?, clientId?, caseId?, status?
 */
export const getGstSummary = async (req, res) => {
  try {
    const { clientId, caseId, status } = req.query;
    const from = asDate(req.query.from);
    const to = asDate(req.query.to);
    const clientObjectId = asObjectId(clientId);
    const caseObjectId = asObjectId(caseId);
    if ((clientId && !clientObjectId) || (caseId && !caseObjectId)) {
      return res.status(400).json({ error: 'Invalid clientId or caseId' });
    }

    const match = workspaceAggregateMatch(req, { status: { $ne: 'void' } });
    if (clientObjectId) match.clientId = clientObjectId;
    if (caseObjectId) match.caseId = caseObjectId;
    if (status) match.status = status;
    if (from || to) {
      match.issueDate = {};
      if (from) match.issueDate.$gte = from;
      if (to) match.issueDate.$lte = to;
    }

    const [summary] = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          invoiceCount: { $sum: 1 },
          taxableAmountPaise: { $sum: { $ifNull: ['$subtotalPaise', { $round: [{ $multiply: [{ $ifNull: ['$subtotal', 0] }, 100] }, 0] }] } },
          gstAmountPaise: { $sum: { $ifNull: ['$taxPaise', { $round: [{ $multiply: [{ $ifNull: ['$tax', 0] }, 100] }, 0] }] } },
          grossAmountPaise: { $sum: { $ifNull: ['$totalPaise', { $round: [{ $multiply: [{ $ifNull: ['$total', 0] }, 100] }, 0] }] } },
        },
      },
      {
        $project: {
          _id: 0,
          invoiceCount: 1,
          taxableAmountPaise: 1,
          gstAmountPaise: 1,
          grossAmountPaise: 1,
          taxableAmount: { $divide: ['$taxableAmountPaise', 100] },
          gstAmount: { $divide: ['$gstAmountPaise', 100] },
          grossAmount: { $divide: ['$grossAmountPaise', 100] },
        },
      },
    ]);

    res.json(summary || { invoiceCount: 0, taxableAmountPaise: 0, gstAmountPaise: 0, grossAmountPaise: 0, taxableAmount: 0, gstAmount: 0, grossAmount: 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to build GST summary' });
  }
};

/**
 * GET /api/reports/gst.csv
 * Query: from?, to?, clientId?, caseId?, status?
 */
export const exportGstCsv = async (req, res) => {
  try {
    const { clientId, caseId, status } = req.query;
    const from = asDate(req.query.from);
    const to = asDate(req.query.to);
    const clientObjectId = asObjectId(clientId);
    const caseObjectId = asObjectId(caseId);
    if ((clientId && !clientObjectId) || (caseId && !caseObjectId)) {
      return res.status(400).json({ error: 'Invalid clientId or caseId' });
    }

    const q = workspaceFilter(req, { status: { $ne: 'void' } });
    if (clientObjectId) q.clientId = clientObjectId;
    if (caseObjectId) q.caseId = caseObjectId;
    if (status) q.status = status;
    if (from || to) {
      q.issueDate = {};
      if (from) q.issueDate.$gte = from;
      if (to) q.issueDate.$lte = to;
    }

    const rows = await Invoice.find(q)
      .select('issueDate dueDate clientId caseId currency subtotal subtotalPaise tax taxPaise taxName taxRatePct taxInclusive total totalPaise status sentAt deliveryStatus createdAt')
      .populate('clientId', 'displayName name')
      .populate('caseId', 'title name')
      .sort({ issueDate: 1 })
      .lean();

    const shaped = rows.map(r => ({
      invoiceId: idString(r._id),
      issueDate: r.issueDate?.toISOString()?.slice(0, 10),
      clientName: displayClient(r.clientId),
      caseTitle: displayCase(r.caseId),
      currency: r.currency || 'INR',
      taxableAmountPaise: paiseValue(r, 'subtotalPaise', 'subtotal'),
      taxableAmount: fromPaise(paiseValue(r, 'subtotalPaise', 'subtotal')),
      gstName: r.taxName || 'GST',
      gstRatePct: r.taxRatePct ?? 0,
      gstInclusive: Boolean(r.taxInclusive),
      gstAmountPaise: paiseValue(r, 'taxPaise', 'tax'),
      gstAmount: fromPaise(paiseValue(r, 'taxPaise', 'tax')),
      grossAmountPaise: paiseValue(r, 'totalPaise', 'total'),
      grossAmount: fromPaise(paiseValue(r, 'totalPaise', 'total')),
      status: r.status,
      deliveryStatus: r.deliveryStatus || '',
      sentAt: r.sentAt?.toISOString() || '',
      createdAt: r.createdAt?.toISOString() || '',
    }));

    return sendCsv(res, shaped, 'gst-report.csv', [
      'invoiceId',
      'issueDate',
      'clientName',
      'caseTitle',
      'currency',
      'taxableAmountPaise',
      'taxableAmount',
      'gstName',
      'gstRatePct',
      'gstInclusive',
      'gstAmountPaise',
      'gstAmount',
      'grossAmountPaise',
      'grossAmount',
      'status',
      'deliveryStatus',
      'sentAt',
      'createdAt',
    ]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to export GST CSV' });
  }
};

/**
 * GET /api/reports/utilization.csv
 * Query: from(required), to(required), groupBy=user|case|client
 * Output: percentage utilization per group (billable / (billable+nonbillable))
 */
export const exportUtilizationCsv = async (req, res) => {
  try {
    const from = asDate(req.query.from);
    const to = asDate(req.query.to);
    const groupBy = (req.query.groupBy || 'user').toLowerCase();
    if (!from || !to) return res.status(400).json({ error: 'from and to are required' });
    if (!['user', 'case', 'client'].includes(groupBy)) return res.status(400).json({ error: 'groupBy must be user|case|client' });

    const groupField = groupBy === 'user' ? '$userId' : groupBy === 'case' ? '$caseId' : '$clientId';

    const rows = await TimeEntry.aggregate([
      { $match: workspaceAggregateMatch(req, { date: { $gte: from, $lte: to } }) },
      {
        $group: {
          _id: groupField,
          billable: { $sum: { $ifNull: ['$billableMinutes', 0] } },
          nonbillable: { $sum: { $ifNull: ['$nonbillableMinutes', 0] } },
        },
      },
      {
        $project: {
          groupId: '$_id',
          billable: 1,
          nonbillable: 1,
          utilization: {
            $cond: [
              { $gt: [{ $add: ['$billable', '$nonbillable'] }, 0] },
              { $divide: ['$billable', { $add: ['$billable', '$nonbillable'] }] },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { groupId: 1 } },
    ]);

    const shaped = rows.map(r => ({
      groupBy,
      groupId: r.groupId,
      billableMinutes: r.billable,
      nonbillableMinutes: r.nonbillable,
      utilization: Number((r.utilization * 100).toFixed(2)), // %
    }));

    return sendCsv(res, shaped, `utilization_${groupBy}.csv`, [
      'groupBy',
      'groupId',
      'billableMinutes',
      'nonbillableMinutes',
      'utilization',
    ]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to export utilization CSV' });
  }
};

/**
 * GET /api/reports/workflow
 * Commercial workflow report bundle with workspace/date filters.
 */
export const getWorkflowReports = async (req, res) => {
  try {
    const range = dateRange(req.query);
    const clientId = asObjectId(req.query.clientId);
    const caseId = asObjectId(req.query.caseId || req.query.matterId);
    if ((req.query.clientId && !clientId) || ((req.query.caseId || req.query.matterId) && !caseId)) {
      return res.status(400).json({ error: 'Invalid clientId or caseId' });
    }

    const workMatch = workspaceAggregateMatch(req);
    const invoiceMatch = workspaceAggregateMatch(req, { status: { $nin: ['void', 'revised'] } });
    const paymentMatch = workspaceAggregateMatch(req, { status: 'cleared' });
    if (clientId) {
      workMatch.clientId = clientId;
      invoiceMatch.clientId = clientId;
    }
    if (caseId) {
      workMatch.caseId = caseId;
      invoiceMatch.caseId = caseId;
    }
    if (range) {
      workMatch.date = range;
      invoiceMatch.issueDate = range;
      paymentMatch.receivedDate = range;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [
      workTodayRows,
      unreviewedRows,
      wipRows,
      invoices,
      payments,
      clients,
      matters,
      timeByRows,
    ] = await Promise.all([
      TimeEntry.aggregate([
        { $match: { ...workMatch, date: { $gte: todayStart, $lt: todayEnd } } },
        { $group: { _id: null, minutes: { $sum: { $add: [{ $ifNull: ['$billableMinutes', 0] }, { $ifNull: ['$nonbillableMinutes', 0] }] } }, billableMinutes: { $sum: { $ifNull: ['$billableMinutes', 0] } }, amountPaise: { $sum: { $ifNull: ['$amountPaise', { $round: [{ $multiply: [{ $ifNull: ['$amount', 0] }, 100] }, 0] }] } } } },
      ]),
      TimeEntry.aggregate([
        { $match: { ...workMatch, status: { $in: ['draft', 'submitted'] } } },
        { $group: { _id: '$status', count: { $sum: 1 }, minutes: { $sum: { $add: [{ $ifNull: ['$billableMinutes', 0] }, { $ifNull: ['$nonbillableMinutes', 0] }] } } } },
      ]),
      TimeEntry.aggregate([
        { $match: { ...workMatch, status: { $in: ['draft', 'submitted', 'approved', 'ready_to_bill'] } } },
        { $group: { _id: null, count: { $sum: 1 }, amountPaise: { $sum: { $ifNull: ['$amountPaise', { $round: [{ $multiply: [{ $ifNull: ['$amount', 0] }, 100] }, 0] }] } }, minutes: { $sum: { $ifNull: ['$billableMinutes', 0] } } } },
      ]),
      Invoice.find(invoiceMatch).select('clientId caseId issueDate dueDate status total totalPaise balancePaise').lean(),
      Payment.find(paymentMatch).select('invoiceId receivedDate amount amountPaise transactionType').lean(),
      Client.find(workspaceFilter(req, clientId ? { _id: clientId } : {})).select('displayName name').lean(),
      Case.find(workspaceFilter(req, caseId ? { _id: caseId } : clientId ? { clientId } : {})).select('title name clientId').lean(),
      TimeEntry.aggregate([
        { $match: workMatch },
        { $group: { _id: { userId: '$userId', activityCode: '$activityCode' }, minutes: { $sum: { $ifNull: ['$billableMinutes', 0] } }, amountPaise: { $sum: { $ifNull: ['$amountPaise', { $round: [{ $multiply: [{ $ifNull: ['$amount', 0] }, 100] }, 0] }] } } } },
      ]),
    ]);

    const invoiceById = new Map(invoices.map((invoice) => [String(invoice._id), invoice]));
    const clientNames = new Map(clients.map((client) => [String(client._id), client.displayName || client.name || String(client._id)]));
    const matterNames = new Map(matters.map((matter) => [String(matter._id), matter.title || matter.name || String(matter._id)]));
    const paymentRows = payments.map((payment) => ({ ...payment, invoice: invoiceById.get(String(payment.invoiceId)) })).filter((payment) => payment.invoice);

    const byMonth = (rows, dateField, paiseSelector) => {
      const map = new Map();
      rows.forEach((row) => {
        const key = monthKey(row[dateField] || new Date());
        map.set(key, (map.get(key) || 0) + paiseSelector(row));
      });
      return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, amountPaise]) => ({ month, amountPaise, amount: fromPaise(amountPaise) }));
    };

    const revenueBy = (field, names) => {
      const map = new Map();
      paymentRows.forEach((payment) => {
        const key = String(payment.invoice?.[field] || '');
        if (!key) return;
        const sign = payment.transactionType === 'refund' ? -1 : 1;
        map.set(key, (map.get(key) || 0) + sign * paiseValue(payment, 'amountPaise', 'amount'));
      });
      return [...map.entries()].map(([id, amountPaise]) => ({ id, name: names.get(id) || id, amountPaise, amount: fromPaise(amountPaise) }));
    };

    const outstandingInvoices = invoices
      .filter((invoice) => Number(invoice.balancePaise ?? paiseValue(invoice, 'totalPaise', 'total')) > 0)
      .map((invoice) => ({
        invoiceId: invoice._id,
        clientId: invoice.clientId,
        caseId: invoice.caseId,
        dueDate: invoice.dueDate,
        status: invoice.status,
        outstandingPaise: invoice.balancePaise ?? paiseValue(invoice, 'totalPaise', 'total'),
        outstanding: fromPaise(invoice.balancePaise ?? paiseValue(invoice, 'totalPaise', 'total')),
      }));
    const aging = outstandingInvoices.reduce((acc, invoice) => {
      const bucket = agingBucket(invoice.dueDate);
      acc[bucket] = (acc[bucket] || 0) + invoice.outstandingPaise;
      return acc;
    }, { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 });

    res.json({
      ok: true,
      filters: { from: req.query.from || null, to: req.query.to || null, clientId: clientId || null, caseId: caseId || null },
      data: {
        workToday: {
          minutes: workTodayRows[0]?.minutes || 0,
          billableMinutes: workTodayRows[0]?.billableMinutes || 0,
          amountPaise: workTodayRows[0]?.amountPaise || 0,
          amount: fromPaise(workTodayRows[0]?.amountPaise || 0),
        },
        unreviewedWork: unreviewedRows,
        unbilledWip: {
          count: wipRows[0]?.count || 0,
          minutes: wipRows[0]?.minutes || 0,
          amountPaise: wipRows[0]?.amountPaise || 0,
          amount: fromPaise(wipRows[0]?.amountPaise || 0),
        },
        billingByMonth: byMonth(invoices, 'issueDate', (invoice) => paiseValue(invoice, 'totalPaise', 'total')),
        collectionsByMonth: byMonth(paymentRows, 'receivedDate', (payment) => (payment.transactionType === 'refund' ? -1 : 1) * paiseValue(payment, 'amountPaise', 'amount')),
        outstandingInvoices,
        receivablesAging: Object.fromEntries(Object.entries(aging).map(([bucket, amountPaise]) => [bucket, { amountPaise, amount: fromPaise(amountPaise) }])),
        revenueByClient: revenueBy('clientId', clientNames),
        revenueByMatter: revenueBy('caseId', matterNames),
        timeByLawyerActivity: timeByRows.map((row) => ({
          userId: row._id.userId,
          activityCode: row._id.activityCode || 'OTHER',
          minutes: row.minutes,
          amountPaise: row.amountPaise,
          amount: fromPaise(row.amountPaise),
        })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build workflow reports' });
  }
};

export const exportWorkflowCsv = async (req, res) => {
  const rows = [];
  const capture = {
    status(code) { this.statusCode = code; return this; },
    json(payload) { rows.push(...(payload.data?.outstandingInvoices || [])); },
  };
  await getWorkflowReports(req, capture);
  return sendCsv(res, rows, 'outstanding-invoices.csv', ['invoiceId', 'clientId', 'caseId', 'dueDate', 'status', 'outstandingPaise', 'outstanding']);
};

export const getReportCatalog = async (_req, res) => {
  res.json({
    ok: true,
    pdfReports: false,
    csvReports: ['time-entries', 'invoices', 'gst', 'utilization', 'outstanding-invoices'],
    dashboards: ['workflow', 'gst-summary'],
  });
};

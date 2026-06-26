// src/controllers/clientController.js
import { Client } from '../models/Client.js';
import { Case } from '../../cases/models/Case.js';
import { Invoice } from '../../invoices/models/Invoice.js';
import { Payment } from '../../payments/models/Payment.js';
import { TimeEntry } from '../../timeEntries/models/TimeEntry.js';
import User from '../../users/models/User.js';
import mongoose from 'mongoose';
import { Parser as Json2csv } from 'json2csv';

const toNumber = (v, d = 0) => (v === undefined || v === null || Number.isNaN(Number(v)) ? d : Number(v));
const CLIENT_MUTABLE_FIELDS = ['displayName', 'name', 'email', 'phone', 'contactInfo', 'billingAddress', 'gst', 'notes', 'paymentTerms', 'status', 'contacts', 'integrations'];
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const pickClientPayload = (payload = {}) =>
  CLIENT_MUTABLE_FIELDS.reduce((acc, field) => {
    if (hasOwn(payload, field)) acc[field] = payload[field];
    return acc;
  }, {});

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

const escapeCsvRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const csvValue = (row, key) => row?.[key] == null ? '' : String(row[key]).trim();
const workspaceFilter = (req, extra = {}) => ({ workspaceId: req.workspaceId, ...extra });

const parseCsvRows = (csv = '') => {
  const lines = String(csv || '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const parseLine = (line) => {
    const values = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };
  const headers = parseLine(lines.shift()).map((header) => header.trim());
  return lines.map((line) => {
    const values = parseLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
};

const clientFinancials = async (clientIds, workspaceId) => {
  if (typeof Invoice.aggregate !== 'function' || typeof Payment.aggregate !== 'function' || typeof TimeEntry.aggregate !== 'function') {
    return new Map(clientIds.map((id) => [String(id), { billedPaise: 0, collectedPaise: 0, outstandingPaise: 0, wipPaise: 0 }]));
  }
  const ids = clientIds.map((id) => new mongoose.Types.ObjectId(id));
  const [invoiceRows, paymentRows, wipRows] = await Promise.all([
    Invoice.aggregate([
      { $match: { workspaceId, clientId: { $in: ids }, status: { $nin: ['void', 'revised'] } } },
      { $group: { _id: '$clientId', billedPaise: { $sum: { $ifNull: ['$totalPaise', { $round: [{ $multiply: [{ $ifNull: ['$total', 0] }, 100] }, 0] }] } }, balancePaise: { $sum: { $ifNull: ['$balancePaise', 0] } } } },
    ]),
    Payment.aggregate([
      { $match: { workspaceId, status: 'cleared' } },
      { $lookup: { from: 'invoices', localField: 'invoiceId', foreignField: '_id', as: 'invoice' } },
      { $unwind: '$invoice' },
      { $match: { 'invoice.workspaceId': workspaceId, 'invoice.clientId': { $in: ids } } },
      { $group: { _id: '$invoice.clientId', collectedPaise: { $sum: { $ifNull: ['$amountPaise', { $round: [{ $multiply: ['$amount', 100] }, 0] }] } } } },
    ]),
    TimeEntry.aggregate([
      { $match: { workspaceId, clientId: { $in: ids }, status: { $in: ['draft', 'submitted', 'approved', 'ready_to_bill'] } } },
      { $group: { _id: '$clientId', wipPaise: { $sum: { $ifNull: ['$amountPaise', { $round: [{ $multiply: [{ $ifNull: ['$amount', 0] }, 100] }, 0] }] } } } },
    ]),
  ]);
  const map = new Map(ids.map((id) => [String(id), { billedPaise: 0, collectedPaise: 0, outstandingPaise: 0, wipPaise: 0 }]));
  invoiceRows.forEach((row) => {
    const entry = map.get(String(row._id)) || {};
    map.set(String(row._id), { ...entry, billedPaise: row.billedPaise || 0, outstandingPaise: row.balancePaise || 0 });
  });
  paymentRows.forEach((row) => {
    const entry = map.get(String(row._id)) || {};
    map.set(String(row._id), { ...entry, collectedPaise: row.collectedPaise || 0 });
  });
  wipRows.forEach((row) => {
    const entry = map.get(String(row._id)) || {};
    map.set(String(row._id), { ...entry, wipPaise: row.wipPaise || 0 });
  });
  return map;
};

const withClientFinancials = async (clients, workspaceId) => {
  const plain = clients.map((client) => client.toObject ? client.toObject() : client);
  const financials = await clientFinancials(plain.map((client) => client._id), workspaceId);
  return plain.map((client) => {
    const totals = financials.get(String(client._id)) || {};
    return {
      ...client,
      financialSummary: {
        ...totals,
        billed: toNumber(totals.billedPaise) / 100,
        collected: toNumber(totals.collectedPaise) / 100,
        outstanding: toNumber(totals.outstandingPaise) / 100,
        wip: toNumber(totals.wipPaise) / 100,
      },
    };
  });
};

const validationFailed = (res, errors) =>
  res.status(400).json({
    ok: false,
    message: 'Validation failed',
    errors,
  });

const validateReferenceIds = async (payload, res) => {
  const errors = [];

  if (hasOwn(payload, 'ownerUserId') && payload.ownerUserId !== null) {
    const ownerExists = await User.exists({ _id: payload.ownerUserId });
    if (!ownerExists) {
      errors.push({ field: 'ownerUserId', message: 'ownerUserId does not reference an existing user' });
    }
  }

  if (errors.length) {
    validationFailed(res, errors);
    return false;
  }

  return true;
};

const clientExists = async (clientId, req, res) => {
  const exists = await Client.exists(workspaceFilter(req, { _id: clientId }));
  if (!exists) {
    res.status(404).json({ ok: false, message: 'Client not found' });
    return false;
  }
  return true;
};

export const getAllClients = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = workspaceFilter(req);
    const requesterId = req.user?.id;
    const requesterRole = String(req.user?.role || '').toLowerCase();

    if (req.query.status) filter.status = req.query.status;
    if (req.query.ownerUserId) filter.ownerUserId = req.query.ownerUserId;
    if (req.query.q) {
      const pattern = new RegExp(escapeCsvRegex(req.query.q), 'i');
      filter.$or = [{ displayName: pattern }, { email: pattern }, { phone: pattern }];
    }
    if (requesterRole !== 'admin' && requesterId && mongoose.Types.ObjectId.isValid(requesterId)) {
      const assignedCaseClientIds = await Case.find(workspaceFilter(req, {
        $or: [
          { leadPartnerId: requesterId },
          { managingLawyerId: requesterId },
          { primaryLawyerId: requesterId },
          { assignedUsers: requesterId },
        ],
      })).distinct('clientId');
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { ownerUserId: requesterId },
            { _id: { $in: assignedCaseClientIds } },
          ],
        },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(filter)
      .select('displayName name email phone contactInfo billingAddress gst notes paymentTerms status ownerUserId contacts integrations createdAt updatedAt')
      .populate('ownerUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
      Client.countDocuments(filter),
    ]);

    res.json({ ok: true, data: await withClientFinancials(clients, req.workspaceId), meta: buildMeta({ page, limit }, total) });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch clients' });
  }
};

export const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne(workspaceFilter(req, { _id: req.params.clientId }))
      .populate('ownerUserId', 'name email');
    if (!client) return res.status(404).json({ ok: false, message: 'Client not found' });
    const [data] = await withClientFinancials([client], req.workspaceId);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch client' });
  }
};

export const createClient = async (req, res) => {
  try {
    const payload = pickClientPayload(req.body);
    const refsValid = await validateReferenceIds(payload, res);
    if (!refsValid) return;

    const doc = await Client.create({ ...payload, workspaceId: req.workspaceId });
    res.status(201).json({ ok: true, data: doc });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const exportClientsCsv = async (req, res) => {
  try {
    const filter = workspaceFilter(req);
    if (req.query.status) filter.status = req.query.status;
    const rows = await Client.find(filter).sort({ displayName: 1 }).lean();
    const shaped = (await withClientFinancials(rows, req.workspaceId)).map((client) => ({
      displayName: client.displayName,
      email: client.email || '',
      phone: client.phone || '',
      status: client.status,
      paymentTerms: client.paymentTerms,
      gstin: client.gst?.gstin || '',
      gstTreatment: client.gst?.treatment || '',
      billingLine1: client.billingAddress?.line1 || '',
      billingCity: client.billingAddress?.city || '',
      billingState: client.billingAddress?.state || '',
      billingPostalCode: client.billingAddress?.postalCode || '',
      primaryContact: client.contacts?.find((contact) => contact.isPrimary)?.name || client.contacts?.[0]?.name || '',
      notes: client.notes || '',
      outstanding: client.financialSummary.outstanding,
      wip: client.financialSummary.wip,
    }));
    const csv = new Json2csv({ fields: Object.keys(shaped[0] || {
      displayName: '', email: '', phone: '', status: '', paymentTerms: '', gstin: '', gstTreatment: '', billingLine1: '', billingCity: '', billingState: '', billingPostalCode: '', primaryContact: '', notes: '', outstanding: '', wip: '',
    }) }).parse(shaped);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to export clients CSV' });
  }
};

export const importClientsCsv = async (req, res) => {
  try {
    const rows = parseCsvRows(req.body?.csv || req.body?.data || '');
    const results = [];
    for (const row of rows) {
      const displayName = csvValue(row, 'displayName') || csvValue(row, 'name');
      if (!displayName) {
        results.push({ ok: false, error: 'displayName is required', row });
        continue;
      }
      const payload = {
        displayName,
        email: csvValue(row, 'email').toLowerCase() || undefined,
        phone: csvValue(row, 'phone') || undefined,
        status: csvValue(row, 'status').toLowerCase() || 'active',
        paymentTerms: (csvValue(row, 'paymentTerms') || 'NET30').toUpperCase(),
        notes: csvValue(row, 'notes') || undefined,
        gst: {
          gstin: csvValue(row, 'gstin').toUpperCase() || undefined,
          treatment: csvValue(row, 'gstTreatment') || 'gst',
          registered: Boolean(csvValue(row, 'gstin')),
        },
        billingAddress: {
          line1: csvValue(row, 'billingLine1') || undefined,
          city: csvValue(row, 'billingCity') || undefined,
          state: csvValue(row, 'billingState') || undefined,
          postalCode: csvValue(row, 'billingPostalCode') || undefined,
          country: csvValue(row, 'billingCountry') || 'India',
        },
      };
      const contactName = csvValue(row, 'primaryContact');
      if (contactName) payload.contacts = [{ name: contactName, email: payload.email, phone: payload.phone, isPrimary: true }];
      const doc = await Client.findOneAndUpdate(
        workspaceFilter(req, { displayName }),
        { $set: payload, $setOnInsert: { workspaceId: req.workspaceId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      results.push({ ok: true, clientId: doc._id, displayName: doc.displayName });
    }
    res.status(201).json({ ok: true, imported: results.filter((row) => row.ok).length, failed: results.filter((row) => !row.ok).length, results });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message || 'Failed to import clients CSV' });
  }
};

export const updateClient = async (req, res) => {
  try {
    const payload = pickClientPayload(req.body);
    const refsValid = await validateReferenceIds(payload, res);
    if (!refsValid) return;

    const updated = await Client.findOneAndUpdate(workspaceFilter(req, { _id: req.params.clientId }), payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ ok: false, message: 'Client not found' });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne(workspaceFilter(req, { _id: req.params.clientId })).select('_id');
    if (!client) return res.status(404).json({ ok: false, message: 'Client not found' });

    const [caseCount, invoiceDocs, timeEntryCount] = await Promise.all([
      Case.countDocuments(workspaceFilter(req, { clientId: req.params.clientId })),
      Invoice.find(workspaceFilter(req, { clientId: req.params.clientId })).select('_id'),
      TimeEntry.countDocuments(workspaceFilter(req, { clientId: req.params.clientId })),
    ]);
    const invoiceIds = invoiceDocs.map((invoice) => invoice._id);
    const paymentCount = invoiceIds.length
      ? await Payment.countDocuments(workspaceFilter(req, { invoiceId: { $in: invoiceIds } }))
      : 0;

    if (caseCount || invoiceIds.length || timeEntryCount || paymentCount) {
      return res.status(409).json({
        ok: false,
        message: 'Client has related records and cannot be deleted',
        details: {
          cases: caseCount,
          invoices: invoiceIds.length,
          timeEntries: timeEntryCount,
          payments: paymentCount,
        },
      });
    }

    await Client.findOneAndDelete(workspaceFilter(req, { _id: req.params.clientId }));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to delete client' });
  }
};

// -------- owner mapping / payment terms --------
export const assignOwner = async (req, res) => {
  try {
    const { ownerUserId, paymentTerms } = req.body; // either or both
    const update = {};
    if (hasOwn(req.body, 'ownerUserId')) {
      update.ownerUserId = ownerUserId ? new mongoose.Types.ObjectId(ownerUserId) : null;
    }
    if (hasOwn(req.body, 'paymentTerms')) update.paymentTerms = paymentTerms;

    const refsValid = await validateReferenceIds(update, res);
    if (!refsValid) return;

    const updated = await Client.findOneAndUpdate(workspaceFilter(req, { _id: req.params.clientId }), update, {
      new: true,
      runValidators: true,
    })
      .populate('ownerUserId', 'name email');

    if (!updated) return res.status(404).json({ ok: false, message: 'Client not found' });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// -------- related lists --------
export const listClientCases = async (req, res) => {
  try {
    const exists = await clientExists(req.params.clientId, req, res);
    if (!exists) return;

    const { page, limit, skip } = getPagination(req.query);
    const filter = workspaceFilter(req, { clientId: req.params.clientId });
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Case.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Case.countDocuments(filter),
    ]);

    res.json({ ok: true, data: items, meta: buildMeta({ page, limit }, total) });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const listClientInvoices = async (req, res) => {
  try {
    const exists = await clientExists(req.params.clientId, req, res);
    if (!exists) return;

    const { page, limit, skip } = getPagination(req.query);
    const filter = workspaceFilter(req, { clientId: req.params.clientId });
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Invoice.find(filter).sort({ issueDate: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);

    res.json({ ok: true, data: items, meta: buildMeta({ page, limit }, total) });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const listClientPayments = async (req, res) => {
  try {
    const exists = await clientExists(req.params.clientId, req, res);
    if (!exists) return;

    const { page, limit, skip } = getPagination(req.query);
    // payments for client invoices
    const invoices = await Invoice.find(workspaceFilter(req, { clientId: req.params.clientId })).select('_id');
    const ids = invoices.map(i => i._id);
    const filter = workspaceFilter(req, { invoiceId: { $in: ids } });
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = ids.length
      ? await Promise.all([
        Payment.find(filter).sort({ receivedDate: -1 }).skip(skip).limit(limit),
        Payment.countDocuments(filter),
      ])
      : [[], 0];

    res.json({ ok: true, data: items, meta: buildMeta({ page, limit }, total) });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// -------- client financial summary (WIP/Billed/AR) --------
export const clientSummary = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const exists = await clientExists(clientId, req, res);
    if (!exists) return;

    const clearedOnly = req.query.clearedOnly !== 'false';

    // WIP: unbilled hours for all client cases (heuristic: submitted|approved)
    const wipEntries = await TimeEntry.find({
      workspaceId: req.workspaceId,
      clientId,
      status: { $in: ['submitted', 'approved'] }
    }).select('billableMinutes rateApplied amount');

    const wip = wipEntries.reduce((sum, te) => {
      const minutes = toNumber(te.billableMinutes, 0);
      const rate = toNumber(te.rateApplied, 0);
      const amt = typeof te.amount === 'number' ? te.amount : rate * (minutes / 60);
      return sum + amt;
    }, 0);

    // Billed & payments
    const invoices = await Invoice.find({
      workspaceId: req.workspaceId,
      clientId,
      status: { $in: ['draft', 'sent', 'partial', 'paid', 'overdue'] }
    }).select('total');

    const billed = invoices.reduce((s, i) => s + toNumber(i.total, 0), 0);

    const ids = invoices.map(i => i._id);
    let pQuery = workspaceFilter(req, { invoiceId: { $in: ids } });
    if (clearedOnly) pQuery.status = 'cleared';

    const payments = ids.length ? await Payment.find(pQuery).select('amount') : [];
    const paid = payments.reduce((s, p) => s + toNumber(p.amount, 0), 0);

    const ar = Math.max(0, billed - paid);

    res.json({
      ok: true,
      data: {
        clientId,
        wip: +wip.toFixed(2),
        billed: +billed.toFixed(2),
        paid: +paid.toFixed(2),
        ar: +ar.toFixed(2),
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to compute client summary' });
  }
};

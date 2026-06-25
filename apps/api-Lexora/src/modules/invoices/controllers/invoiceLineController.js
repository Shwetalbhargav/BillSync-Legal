// src/controllers/invoiceLineController.js
import { InvoiceLine } from '../models/InvoiceLine.js';
import { Invoice } from '../models/Invoice.js';
import { recalcInvoiceTotals } from '../services/invoiceTotalsService.js';
import { toPaise } from '../../finance/money.js';

async function ensureMutableInvoice(invoiceId, res) {
  const invoice = await Invoice.findById(invoiceId).select('status');
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return false;
  }
  if (invoice.status !== 'draft' && invoice.status !== 'ready_to_bill') {
    res.status(409).json({ error: 'Finalised invoices are immutable. Create a revision or credit instead.' });
    return false;
  }
  return true;
}

export const listLines = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    if (!await ensureMutableInvoice(invoiceId, res)) return;
    const lines = await InvoiceLine.find({ invoiceId }).populate('timeEntryId');
    res.json(lines);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch invoice lines' });
  }
};

export const addLine = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { description, qtyHours = 0, rate = 0, amount, timeEntryId, billableId, taxCategory } = req.body;

    const computed = amount != null ? Number(amount) : Number((Number(qtyHours) * Number(rate)).toFixed(2));
    const line = await InvoiceLine.create({ invoiceId, description, qtyHours, rate, ratePaise: toPaise(rate), amount: computed, amountPaise: toPaise(computed), timeEntryId, billableId, taxCategory });
    const totals = await recalcInvoiceTotals(invoiceId);
    res.status(201).json({ line, totals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add invoice line' });
  }
};

export const updateLine = async (req, res) => {
  try {
    const { invoiceId, lineId } = req.params;
    if (!await ensureMutableInvoice(invoiceId, res)) return;
    const { description, qtyHours, rate, amount, taxCategory } = req.body;

    const patch = {};
    if (description != null) patch.description = description;
    if (qtyHours != null) patch.qtyHours = qtyHours;
    if (rate != null) patch.rate = rate;
    if (rate != null) patch.ratePaise = toPaise(rate);
    if (amount != null) {
      patch.amount = amount;
      patch.amountPaise = toPaise(amount);
    }
    if (taxCategory != null) patch.taxCategory = taxCategory;
    if ((qtyHours != null || rate != null) && amount == null) {
      const q = qtyHours != null ? qtyHours : undefined;
      const r = rate != null ? rate : undefined;
      const existing = await InvoiceLine.findById(lineId);
      const finalQty = q != null ? Number(q) : Number(existing.qtyHours || 0);
      const finalRate = r != null ? Number(r) : Number(existing.rate || 0);
      patch.amount = Number((finalQty * finalRate).toFixed(2));
      patch.amountPaise = toPaise(patch.amount);
    }

    const line = await InvoiceLine.findOneAndUpdate({ _id: lineId, invoiceId }, patch, { new: true });
    if (!line) return res.status(404).json({ error: 'Line not found' });
    const totals = await recalcInvoiceTotals(invoiceId);
    res.json({ line, totals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update invoice line' });
  }
};

export const deleteLine = async (req, res) => {
  try {
    const { invoiceId, lineId } = req.params;
    if (!await ensureMutableInvoice(invoiceId, res)) return;
    const del = await InvoiceLine.findOneAndDelete({ _id: lineId, invoiceId });
    if (!del) return res.status(404).json({ error: 'Line not found' });
    const totals = await recalcInvoiceTotals(invoiceId);
    res.json({ success: true, totals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete invoice line' });
  }
};

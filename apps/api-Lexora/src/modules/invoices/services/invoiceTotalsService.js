import { Client } from '../../clients/models/Client.js';
import { Firm } from '../../firms/models/Firm.js';
import { Invoice } from '../models/Invoice.js';
import { InvoiceLine } from '../models/InvoiceLine.js';
import { addPaise, calculateTax, fromPaise, toPaise } from '../../finance/money.js';

export function roundMoney(value) {
  return fromPaise(toPaise(value));
}

function normalizeTaxSettings(settings = {}) {
  return {
    taxName: settings.taxName || 'GST',
    taxRatePct: Number(settings.taxRatePct) || 0,
    inclusive: Boolean(settings.inclusive),
  };
}

export async function getInvoiceTaxSettings(invoice, session) {
  if (['rcm_applicable', 'gst_not_applicable', 'gst_exempt'].includes(invoice?.taxTreatment)) {
    return normalizeTaxSettings({
      taxName: invoice.taxName || 'GST',
      taxRatePct: 0,
      inclusive: false,
    });
  }

  if (invoice?.taxRatePct != null || invoice?.taxName || invoice?.taxInclusive != null) {
    return normalizeTaxSettings({
      taxName: invoice.taxName,
      taxRatePct: invoice.taxRatePct,
      inclusive: invoice.taxInclusive,
    });
  }

  const client = invoice?.clientId
    ? await Client.findById(invoice.clientId).select('firmId').session(session || null)
    : null;
  const firm = client?.firmId
    ? await Firm.findById(client.firmId).select('taxSettings').session(session || null)
    : await Firm.findOne({}).select('taxSettings').session(session || null);

  return normalizeTaxSettings(firm?.taxSettings);
}

export function computeTotalsFromLines(lines = [], taxSettings = {}) {
  const settings = normalizeTaxSettings(taxSettings);
  const lineTotalPaise = addPaise(lines.map((line) => ({
    amountPaise: line.amountPaise || toPaise(line.amount),
  })));
  const { subtotalPaise, taxPaise, totalPaise } = calculateTax({
    grossOrNetPaise: lineTotalPaise,
    taxRatePct: settings.taxRatePct,
    inclusive: settings.inclusive,
  });
  const taxableAmount = fromPaise(subtotalPaise);
  const tax = fromPaise(taxPaise);
  const total = fromPaise(totalPaise);

  return {
    subtotal: taxableAmount,
    subtotalPaise,
    tax,
    taxPaise,
    total,
    totalPaise,
    balancePaise: totalPaise,
    taxName: settings.taxName,
    taxRatePct: settings.taxRatePct,
    taxInclusive: settings.inclusive,
    taxDetails: {
      taxName: settings.taxName,
      taxRatePct: settings.taxRatePct,
      inclusive: settings.inclusive,
      taxableAmount,
      taxAmount: tax,
      grossAmount: total,
      taxableAmountPaise: subtotalPaise,
      taxAmountPaise: taxPaise,
      grossAmountPaise: totalPaise,
    },
  };
}

export async function recalcInvoiceTotals(invoiceId, { session } = {}) {
  const invoice = await Invoice.findById(invoiceId).session(session || null);
  if (!invoice) return null;

  const lines = await InvoiceLine.find({ invoiceId }).session(session || null);
  const taxSettings = await getInvoiceTaxSettings(invoice, session);
  const totals = computeTotalsFromLines(lines, taxSettings);
  const items = lines.map((line) => ({
    billableId: line.billableId,
    timeEntryId: line.timeEntryId,
    lineType: line.lineType || 'hourly',
    serviceDate: line.serviceDate,
    periodLabel: line.periodLabel,
    receiptDocumentId: line.receiptDocumentId,
    description: line.description,
    durationMinutes: roundMoney((Number(line.qtyHours) || 0) * 60),
    qtyHours: line.qtyHours,
    rate: line.rate,
    ratePaise: line.ratePaise || toPaise(line.rate),
    amount: line.amount,
    amountPaise: line.amountPaise || toPaise(line.amount),
  }));

  const update = { ...totals, items };
  if (invoice.status !== 'draft') delete update.balancePaise;
  await Invoice.findByIdAndUpdate(invoiceId, update, { session });
  return totals;
}

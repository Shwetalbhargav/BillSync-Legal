import { Firm } from '../firms/models/Firm.js';

function formatSequence(prefix, seq) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

export async function nextInvoiceNumber(workspaceId, session) {
  const firm = await Firm.findOneAndUpdate(
    { _id: workspaceId },
    { $inc: { nextInvoiceSequence: 1 } },
    { new: true, session }
  );
  const seq = firm?.nextInvoiceSequence || 1;
  return formatSequence(firm?.invoicePrefix || 'INV', seq);
}

export async function nextReceiptNumber(workspaceId, session) {
  const firm = await Firm.findOneAndUpdate(
    { _id: workspaceId },
    { $inc: { nextReceiptSequence: 1 } },
    { new: true, session }
  );
  const seq = firm?.nextReceiptSequence || 1;
  return formatSequence(firm?.receiptPrefix || 'RCT', seq);
}

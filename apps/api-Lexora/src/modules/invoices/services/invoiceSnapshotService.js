import { Case } from '../../cases/models/Case.js';
import { Client } from '../../clients/models/Client.js';
import User from '../../users/models/User.js';
import LawyerProfile from '../../users/models/LawyerProfile.js';
import PartnerProfile from '../../users/models/PartnerProfile.js';
import { InvoiceLine } from '../models/InvoiceLine.js';
import { fromPaise, toPaise } from '../../finance/money.js';

function dateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function addressText(address) {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ');
}

function lineAmount(line) {
  if (line.amountPaise != null) return fromPaise(line.amountPaise);
  return Number(line.amount || 0);
}

export async function buildInvoiceSnapshots(invoice, { actorId, session } = {}) {
  const client = invoice.clientId?._id
    ? invoice.clientId
    : await Client.findById(invoice.clientId).session(session || null);
  const matter = invoice.caseId?._id
    ? invoice.caseId
    : invoice.caseId
      ? await Case.findById(invoice.caseId).session(session || null)
      : null;
  const advocateUserId = actorId || invoice.createdBy?._id || invoice.createdBy || matter?.assignedAdvocate || matter?.primaryLawyerId;
  const advocateUser = advocateUserId
    ? await User.findById(advocateUserId).select('name email mobile address role').session(session || null)
    : null;
  const profile = advocateUserId
    ? await LawyerProfile.findOne({ userId: advocateUserId }).session(session || null)
      || await PartnerProfile.findOne({ userId: advocateUserId }).session(session || null)
    : null;
  const lines = await InvoiceLine.find({ invoiceId: invoice._id }).sort({ createdAt: 1 }).session(session || null).lean();

  const invoiceLines = lines.map((line) => ({
    lineType: line.lineType || 'hourly',
    serviceDate: dateOnly(line.serviceDate),
    periodLabel: line.periodLabel || '',
    description: line.description,
    qtyHours: line.qtyHours || 0,
    ratePaise: line.ratePaise || toPaise(line.rate),
    amountPaise: line.amountPaise || toPaise(line.amount),
    amount: lineAmount(line),
    taxCategory: line.taxCategory,
    receiptDocumentId: line.receiptDocumentId,
    source: { timeEntryId: line.timeEntryId, billableId: line.billableId },
  }));

  return {
    advocateSnapshot: {
      name: advocateUser?.name || '',
      email: advocateUser?.email || '',
      mobile: advocateUser?.mobile || '',
      address: profile?.professionalAddress || advocateUser?.address || '',
      stateBarCouncil: profile?.stateBarCouncil || '',
      enrolmentNo: profile?.enrolmentNo || '',
      enrolmentDate: dateOnly(profile?.enrolmentDate),
      pan: profile?.pan || '',
      gstin: profile?.gstin || '',
      gstRegistrationStatus: profile?.gstRegistrationStatus || 'not_applicable',
      signatureImageUrl: profile?.signatureImageUrl || '',
    },
    clientBillingSnapshot: {
      name: client?.legalBillingName || client?.gst?.legalName || client?.displayName || client?.name || '',
      displayName: client?.displayName || client?.name || '',
      email: client?.invoiceEmail || client?.email || '',
      contactPerson: client?.contactPerson || '',
      billingAddress: addressText(client?.billingAddress),
      gstin: client?.gstin || client?.gst?.gstin || '',
      businessEntityType: client?.businessEntityType || '',
      rcmApplicabilityHint: client?.rcmApplicabilityHint || '',
    },
    matterSnapshot: {
      title: matter?.title || '',
      matterNumber: matter?.matterNumber || '',
      caseRefNo: matter?.caseRefNo || matter?.caseDetails?.courtCaseNumber || '',
      courtOrAuthority: matter?.courtOrAuthority || matter?.court?.name || '',
      clientFileReference: matter?.clientFileReference || '',
      billingType: matter?.billingType || '',
    },
    paymentDetailsSnapshot: {
      currency: invoice.currency || 'INR',
      paymentPortalEnabled: Boolean(invoice.paymentPortal?.enabled),
    },
    taxTreatmentSnapshot: {
      treatment: invoice.taxTreatment || 'gst_charged',
      note: invoice.taxNote || '',
      taxName: invoice.taxName || 'GST',
      taxRatePct: Number(invoice.taxRatePct || 0),
      taxInclusive: Boolean(invoice.taxInclusive),
    },
    immutableSnapshot: {
      lines: invoiceLines,
      taxSettings: {
        taxName: invoice.taxName,
        taxRatePct: invoice.taxRatePct,
        taxInclusive: invoice.taxInclusive,
        taxTreatment: invoice.taxTreatment,
        taxNote: invoice.taxNote,
      },
      totals: {
        subtotal: invoice.subtotal,
        subtotalPaise: invoice.subtotalPaise,
        tax: invoice.tax,
        taxPaise: invoice.taxPaise,
        total: invoice.total,
        totalPaise: invoice.totalPaise,
      },
    },
  };
}

export function assertSoloAdvocateReady(snapshots) {
  if (!snapshots?.advocateSnapshot?.enrolmentNo) {
    const error = new Error('Enrolment No. is required before issuing a solo advocate professional fee invoice.');
    error.statusCode = 400;
    throw error;
  }
}

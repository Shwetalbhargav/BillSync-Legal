import { describe, expect, it } from 'vitest';
import {
  maskSensitiveRegistrationValue,
  validateProfessionalRegistration,
} from '../modules/users/utils/professionalRegistration.js';
import { computeTotalsFromLines } from '../modules/invoices/services/invoiceTotalsService.js';
import { buildInvoicePdfBuffer } from '../modules/invoices/services/invoiceDeliveryService.js';

describe('solo advocate invoice support', () => {
  it('validates Indian PAN and GSTIN formats', () => {
    expect(validateProfessionalRegistration({ pan: 'ABCDE1234F', gstin: '27ABCDE1234F1Z5' })).toEqual([]);
    expect(validateProfessionalRegistration({ pan: 'BADPAN', gstin: 'BADGSTIN' })).toEqual([
      expect.objectContaining({ field: 'pan' }),
      expect.objectContaining({ field: 'gstin' }),
    ]);
  });

  it('masks tax identifiers for audit logging', () => {
    expect(maskSensitiveRegistrationValue('pan', 'ABCDE1234F')).toBe('ABC****F');
    expect(maskSensitiveRegistrationValue('gstin', '27ABCDE1234F1Z5')).toBe('27***********Z5');
  });

  it('keeps RCM and exempt treatments tax neutral', () => {
    const totals = computeTotalsFromLines([{ amountPaise: 1000000 }], { taxRatePct: 0, inclusive: false });
    expect(totals.subtotalPaise).toBe(1000000);
    expect(totals.taxPaise).toBe(0);
    expect(totals.totalPaise).toBe(1000000);
  });

  it('generates a professional fee invoice PDF buffer from snapshots', async () => {
    const pdf = await buildInvoicePdfBuffer({
      _id: '64f000000000000000000001',
      templateType: 'solo_advocate_fee_invoice',
      invoiceNumber: 'INV-ADV-001',
      currency: 'INR',
      issueDate: new Date('2026-07-01'),
      dueDate: new Date('2026-07-15'),
      subtotal: 75000,
      tax: 0,
      total: 75000,
      taxName: 'GST',
      taxNote: 'Tax on this supply may be payable by the recipient under reverse charge mechanism, where applicable.',
      advocateSnapshot: {
        name: 'Aarav Mehta, Advocate',
        address: 'District Court, Mumbai',
        enrolmentNo: 'MAH/1234/2015',
        pan: 'ABCDE1234F',
        gstin: '27ABCDE1234F1Z5',
      },
      clientBillingSnapshot: {
        name: 'Acme Private Limited',
        billingAddress: 'Mumbai, Maharashtra',
        gstin: '27AAACA1234A1Z5',
      },
      matterSnapshot: {
        title: 'Commercial recovery proceedings',
        caseRefNo: 'CS/42/2026',
        courtOrAuthority: 'Bombay High Court',
        clientFileReference: 'ACME-LIT-09',
      },
      taxTreatmentSnapshot: {
        treatment: 'rcm_applicable',
        note: 'Tax on this supply may be payable by the recipient under reverse charge mechanism, where applicable.',
      },
      immutableSnapshot: {
        lines: [
          {
            lineType: 'professional_fee',
            serviceDate: '2026-06-30',
            description: 'Professional fee for conference, drafting, and filing',
            amountPaise: 7500000,
          },
        ],
      },
    });

    expect(pdf.subarray(0, 8).toString()).toBe('%PDF-1.4');
    expect(pdf.length).toBeGreaterThan(2500);
  });
});

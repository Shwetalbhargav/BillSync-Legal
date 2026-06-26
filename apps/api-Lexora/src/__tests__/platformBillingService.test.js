import { expect, test } from 'vitest';
import { Invoice } from '../modules/invoices/models/Invoice.js';
import { Payment } from '../modules/payments/models/Payment.js';
import { PlatformInvoice } from '../modules/workspace/models/PlatformInvoice.js';
import { PlatformPayment } from '../modules/workspace/models/PlatformPayment.js';
import { PlatformUsageRecord } from '../modules/workspace/models/PlatformUsageRecord.js';
import {
  PLATFORM_BILLING_PERMISSIONS,
  publicPlatformInvoice,
  publicPlatformPayment,
  resolvePlatformUsage,
} from '../modules/workspace/services/platformBillingService.js';

test('platform billing permissions are separate from legal billing permissions', () => {
  expect(PLATFORM_BILLING_PERMISSIONS).toEqual({
    read: 'platform_billing.read',
    manage: 'platform_billing.manage',
    pay: 'platform_billing.pay',
  });
});

test('platform invoices and payments use separate collections from legal invoices and payments', () => {
  expect(PlatformInvoice.collection.name).toBe('platforminvoices');
  expect(PlatformPayment.collection.name).toBe('platformpayments');
  expect(Invoice.collection.name).toBe('invoices');
  expect(Payment.collection.name).toBe('payments');
});

test('usage resolver represents seats, storage, and AI credit overages', () => {
  const usage = resolvePlatformUsage({
    plan: { limits: { members: 2, storageGb: 5, aiCredits: 10 } },
    seats: 3,
    storageGb: 2.5,
    aiCredits: 12,
  });

  expect(usage.seats).toEqual(expect.objectContaining({ included: 2, used: 3, overage: 1 }));
  expect(usage.storage).toEqual(expect.objectContaining({ included: 5, used: 2.5, remaining: 2.5 }));
  expect(usage.aiCredits).toEqual(expect.objectContaining({ included: 10, used: 12, overage: 2 }));
});

test('platform invoice and payment serializers keep subscription copy explicit', () => {
  const invoice = publicPlatformInvoice({
    _id: '64b000000000000000000111',
    invoiceNumber: 'LEX-202606-0000AA',
    status: 'past_due',
    totalPaise: 499900,
    balancePaise: 499900,
    currency: 'INR',
    lines: [{ metric: 'subscription', label: 'Lexora Professional subscription' }],
  });
  const payment = publicPlatformPayment({
    _id: '64b000000000000000000222',
    platformInvoiceId: '64b000000000000000000111',
    status: 'failed',
    amountPaise: 499900,
    currency: 'INR',
    failureMessage: 'Payment method needs review.',
  });

  expect(invoice.number).toBe('LEX-202606-0000AA');
  expect(invoice.lines[0].label).toContain('Lexora');
  expect(payment.status).toBe('failed');
  expect(payment.failureMessage).toBe('Payment method needs review.');
});

test('platform usage records are workspace scoped by metric and period', () => {
  const indexes = PlatformUsageRecord.schema.indexes();
  expect(indexes.some(([keys]) => (
    keys.workspaceId === 1
      && keys.metric === 1
      && keys.periodStart === 1
      && keys.periodEnd === 1
  ))).toBe(true);
});

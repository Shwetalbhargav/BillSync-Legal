import { describe, expect, test } from 'vitest';
import { Invoice } from '../modules/invoices/models/Invoice.js';
import {
  calculateLineAmountPaise,
  calculateTax,
  fromPaise,
  toPaise,
} from '../modules/finance/money.js';

describe('financial correctness', () => {
  test('stores and converts money as integer paise', () => {
    expect(toPaise(123.456)).toBe(12346);
    expect(toPaise('99.995')).toBe(10000);
    expect(fromPaise(12346)).toBe(123.46);
  });

  test('calculates exclusive GST with deterministic paise rounding', () => {
    const tax = calculateTax({
      grossOrNetPaise: 10000,
      taxRatePct: 18,
      inclusive: false,
    });

    expect(tax).toEqual({
      subtotalPaise: 10000,
      taxPaise: 1800,
      totalPaise: 11800,
    });
  });

  test('calculates inclusive GST without recalculating history from decimals', () => {
    const tax = calculateTax({
      grossOrNetPaise: 11800,
      taxRatePct: 18,
      inclusive: true,
    });

    expect(tax).toEqual({
      subtotalPaise: 10000,
      taxPaise: 1800,
      totalPaise: 11800,
    });
  });

  test('calculates work-in-progress line amounts in paise', () => {
    expect(calculateLineAmountPaise({
      durationMinutes: 45,
      ratePerHourPaise: 200000,
    })).toBe(150000);
  });

  test('preserves a zero invoice balance during validation', async () => {
    const invoice = new Invoice({
      clientId: '000000000000000000000001',
      subtotal: 100,
      subtotalPaise: 10000,
      tax: 18,
      taxPaise: 1800,
      total: 118,
      totalPaise: 11800,
      balancePaise: 0,
      status: 'paid',
    });

    await expect(invoice.validate()).resolves.toBeUndefined();
    expect(invoice.balancePaise).toBe(0);
  });
});

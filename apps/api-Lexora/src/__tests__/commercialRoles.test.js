import { expect, test } from 'vitest';
import {
  canMutateFinancialRecords,
  canMutateLegalWork,
  canReadFinancialRecords,
  normalizeRole,
} from '../modules/workspace/roles.js';

test('legacy roles migrate to the commercial role model without losing users', () => {
  expect(normalizeRole('admin')).toBe('owner');
  expect(normalizeRole('partner')).toBe('owner');
  expect(normalizeRole('associate')).toBe('lawyer');
  expect(normalizeRole('intern')).toBe('lawyer');
});

test('billing assistant can mutate finance but not legal work', () => {
  expect(canMutateFinancialRecords('billing_assistant')).toBe(true);
  expect(canReadFinancialRecords('billing_assistant')).toBe(true);
  expect(canMutateLegalWork('billing_assistant')).toBe(false);
});

test('accountant has read-only financial access', () => {
  expect(canReadFinancialRecords('accountant')).toBe(true);
  expect(canMutateFinancialRecords('accountant')).toBe(false);
  expect(canMutateLegalWork('accountant')).toBe(false);
});


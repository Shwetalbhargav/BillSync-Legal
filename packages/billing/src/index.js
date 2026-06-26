import { packageBoundary } from '../../shared/src/index.js';

export const BILLING_PACKAGE = packageBoundary('@lexora/billing', ['legal-billing', 'platform-billing', 'invoice-gates']);
export const LEDGER_TYPES = Object.freeze({ platform: 'platform', legal: 'legal' });

import { packageBoundary } from '../../shared/src/index.js';

export const PAYMENTS_PACKAGE = packageBoundary('@lexora/payments', ['client-payments', 'platform-payments', 'payment-state']);

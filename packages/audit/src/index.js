import { packageBoundary } from '../../shared/src/index.js';

export const AUDIT_PACKAGE = packageBoundary('@lexora/audit', ['audit-events', 'sensitive-actions', 'retention']);

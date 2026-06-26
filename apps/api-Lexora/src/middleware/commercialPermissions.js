import { requirePermission } from '../modules/workspace/services/rbacPolicyService.js';

export const requireLegalMutation = requirePermission('matters.write');

export const requireFinancialRead = requirePermission('finance.read', { financialOnly: true, resourceType: 'finance' });

export const requireFinancialMutation = requirePermission('finance.write', { financialOnly: true, resourceType: 'finance' });

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requirePermission } from '../services/rbacPolicyService.js';
import {
  acceptInvitation,
  expireInvitation,
  getWorkspaceContext,
  inviteMember,
  listMemberships,
  removeMembership,
  resendInvitation,
  revokeInvitation,
  updateMembership,
} from '../controllers/membershipController.js';
import {
  getOnboarding,
  updateOnboarding,
  updateWorkReview,
} from '../controllers/onboardingController.js';
import {
  getWorkspaceNavigation,
  listWorkspaceModules,
} from '../controllers/moduleNavigationController.js';
import {
  checkFeatureAccess,
  checkModuleAccess,
  getSubscription,
  listFeatures,
  listPlans,
  updateFeatureOverride,
} from '../controllers/subscriptionController.js';
import {
  getCurrentPermissionSummary,
  listPermissionCatalog,
  listPolicies,
  listRoleTemplates,
  updateRolePermissions,
  upsertPolicy,
} from '../controllers/rbacController.js';
import {
  createCurrentPlatformInvoice,
  getPlatformBilling,
  recordPlatformPayment,
} from '../controllers/platformBillingController.js';
import { PLATFORM_BILLING_PERMISSIONS } from '../services/platformBillingService.js';

const router = Router();

router.post('/invitations/accept', acceptInvitation);

router.use(authenticate);
router.get('/context', getWorkspaceContext);
router.get('/permissions', listPermissionCatalog);
router.get('/roles', listRoleTemplates);
router.get('/permissions/me', getCurrentPermissionSummary);
router.patch('/roles/:roleKey/permissions', requirePermission('roles.manage'), updateRolePermissions);
router.get('/policies', requirePermission('policies.read'), listPolicies);
router.put('/policies', requirePermission('policies.manage'), upsertPolicy);
router.get('/plans', listPlans);
router.get('/features', listFeatures);
router.get('/subscription', getSubscription);
router.get('/platform-billing', requirePermission(PLATFORM_BILLING_PERMISSIONS.read), getPlatformBilling);
router.post('/platform-billing/invoices/current', requirePermission(PLATFORM_BILLING_PERMISSIONS.manage), createCurrentPlatformInvoice);
router.post('/platform-billing/invoices/:invoiceId/payments', requirePermission(PLATFORM_BILLING_PERMISSIONS.pay), recordPlatformPayment);
router.get('/modules', listWorkspaceModules);
router.get('/navigation', getWorkspaceNavigation);
router.get('/features/:featureKey/access', checkFeatureAccess);
router.patch('/features/:featureKey/override', requirePermission('features.manage'), updateFeatureOverride);
router.get('/modules/:moduleKey/access', checkModuleAccess);
router.get('/onboarding', getOnboarding);
router.patch('/onboarding', requirePermission('workspace.manage'), updateOnboarding);
router.patch('/work-review', requirePermission('workspace.manage'), updateWorkReview);
router.get('/memberships', listMemberships);
router.post('/invitations', requirePermission('members.manage'), inviteMember);
router.post('/invitations/:id/resend', requirePermission('members.manage'), resendInvitation);
router.post('/invitations/:id/expire', requirePermission('members.manage'), expireInvitation);
router.post('/invitations/:id/revoke', requirePermission('members.manage'), revokeInvitation);
router.patch('/memberships/:id', requirePermission('members.manage'), updateMembership);
router.delete('/memberships/:id', requirePermission('members.manage'), removeMembership);

export default router;

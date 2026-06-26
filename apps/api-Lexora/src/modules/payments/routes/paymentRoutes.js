import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { BILLING_PERMISSIONS, FINANCE_MODULE_KEY, requireBillingAccess } from '../../billing/services/billingAccessService.js';
import {
  validateCreatePayment,
  validatePortalPayment,
  validateReconcilePayment,
  validateWriteOff,
} from '../validators/paymentValidators.js';
import {
  listPayments,
  createPayment,
  createPortalLink,
  createWriteOff,
  financeSummary,
  getPortalInvoice,
  mockCompletePortalPayment,
  reconcilePayment,
  submitPortalPayment,
  deletePayment,
} from '../controllers/paymentController.js';

const router = Router();

router.get('/portal/:token', getPortalInvoice);
router.post('/portal/:token/pay', validatePortalPayment, submitPortalPayment);
router.post('/portal/:token/mock-upi-success', mockCompletePortalPayment);

router.use(authenticate);

/**
 * Examples:
 *  GET  /api/payments?invoiceId=<id>&status=cleared&from=2025-01-01&to=2025-01-31
 *  POST /api/payments
 *  POST /api/payments/:id/reconcile
 *  DELETE /api/payments/:id
 */
router.get('/', requireBillingAccess(BILLING_PERMISSIONS.invoiceView, { moduleKey: FINANCE_MODULE_KEY }), listPayments);
router.get('/finance-summary', requireBillingAccess(BILLING_PERMISSIONS.invoiceView, { moduleKey: FINANCE_MODULE_KEY }), financeSummary);
router.post('/', requireBillingAccess(BILLING_PERMISSIONS.paymentRecord, { write: true, moduleKey: FINANCE_MODULE_KEY }), validateCreatePayment, createPayment);
router.post('/write-off', requireBillingAccess(BILLING_PERMISSIONS.paymentRecord, { write: true, moduleKey: FINANCE_MODULE_KEY }), validateWriteOff, createWriteOff);
router.post('/portal-link/:invoiceId', requireBillingAccess(BILLING_PERMISSIONS.invoiceSend, { write: true, moduleKey: FINANCE_MODULE_KEY }), createPortalLink);
router.post('/:id/reconcile', requireBillingAccess(BILLING_PERMISSIONS.paymentRecord, { write: true, moduleKey: FINANCE_MODULE_KEY }), validateReconcilePayment, reconcilePayment);
router.delete('/:id', requireBillingAccess(BILLING_PERMISSIONS.paymentRecord, { write: true, moduleKey: FINANCE_MODULE_KEY }), deletePayment);

export default router;

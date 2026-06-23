import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requireFinancialMutation, requireFinancialRead } from '../../../middleware/commercialPermissions.js';
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
router.get('/', requireFinancialRead, listPayments);
router.get('/finance-summary', requireFinancialRead, financeSummary);
router.post('/', requireFinancialMutation, validateCreatePayment, createPayment);
router.post('/write-off', requireFinancialMutation, validateWriteOff, createWriteOff);
router.post('/portal-link/:invoiceId', requireFinancialMutation, createPortalLink);
router.post('/:id/reconcile', requireFinancialMutation, validateReconcilePayment, reconcilePayment);
router.delete('/:id', requireFinancialMutation, deletePayment);

export default router;

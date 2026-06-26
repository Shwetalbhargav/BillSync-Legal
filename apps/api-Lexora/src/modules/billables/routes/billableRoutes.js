import express from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { BILLING_PERMISSIONS, requireBillingAccess } from '../../billing/services/billingAccessService.js';
import {
  validateCreateBillable,
  validateUpdateBillable,
} from '../validators/billableValidators.js';
import {
  createBillable,
  getAllBillables,
  getBillableById,
  updateBillable,
  deleteBillable,
  createFromEmail,
  createExpense,
  listExpenses,
  approveBillable,
  rejectBillable
  } from '../controllers/billableController.js';

const router = express.Router();

router.use(authenticate);

router.post('/', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), validateCreateBillable, createBillable);
router.get('/', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), getAllBillables);
router.post('/expenses', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), createExpense);
router.get('/expenses', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), listExpenses);
router.post('/from-email/:emailEntryId', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), createFromEmail);
router.post('/:id/approve', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), approveBillable);
router.post('/:id/reject', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), rejectBillable);
router.get('/:id', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), getBillableById);
router.put('/:id', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), validateUpdateBillable, updateBillable);
router.delete('/:id', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), deleteBillable);
export default router;

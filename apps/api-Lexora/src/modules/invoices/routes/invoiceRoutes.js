import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { BILLING_PERMISSIONS, requireBillingAccess } from '../../billing/services/billingAccessService.js';
import {
  validateGenerateFromBillables,
  validateGenerateFromTime,
  validateSendInvoice,
} from '../validators/invoiceValidators.js';
import {
  getAllInvoices,
  getInvoiceById,
  generateFromApprovedTime,
  generateFromApprovedBillables,
  autoGenerateFromApprovedBillables,
  sendInvoice,
  downloadInvoicePdf,
  previewInvoiceHtml,
  voidInvoice,
  finaliseInvoice,
  reviseInvoice,
  getPipeline,
  getPendingSummaryByClient
} from '../controllers/invoiceController.js';

const router = Router();

router.use(authenticate);

router.get('/', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), getAllInvoices);
router.post('/from-time', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), validateGenerateFromTime, generateFromApprovedTime);
router.post('/from-billables/auto', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), autoGenerateFromApprovedBillables);
router.post('/from-billables', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), validateGenerateFromBillables, generateFromApprovedBillables);
router.get('/__analytics/pending-by-client', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), getPendingSummaryByClient);
router.get('/__pipeline', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), getPipeline);
router.get('/:id', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), getInvoiceById);
router.get('/:id/pdf', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), downloadInvoicePdf);
router.get('/:id/document', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), previewInvoiceHtml);
router.post('/:id/finalise', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), finaliseInvoice);
router.post('/:id/revise', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), reviseInvoice);
router.post('/:id/send', requireBillingAccess(BILLING_PERMISSIONS.invoiceSend, { write: true }), validateSendInvoice, sendInvoice);
router.post('/:id/void', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), voidInvoice);

export default router;

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requireFinancialMutation, requireFinancialRead } from '../../../middleware/commercialPermissions.js';
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

router.get('/', requireFinancialRead, getAllInvoices);
router.post('/from-time', requireFinancialMutation, validateGenerateFromTime, generateFromApprovedTime);
router.post('/from-billables/auto', requireFinancialMutation, autoGenerateFromApprovedBillables);
router.post('/from-billables', requireFinancialMutation, validateGenerateFromBillables, generateFromApprovedBillables);
router.get('/__analytics/pending-by-client', requireFinancialRead, getPendingSummaryByClient);
router.get('/__pipeline', requireFinancialRead, getPipeline);
router.get('/:id', requireFinancialRead, getInvoiceById);
router.get('/:id/pdf', requireFinancialRead, downloadInvoicePdf);
router.get('/:id/document', requireFinancialRead, previewInvoiceHtml);
router.post('/:id/finalise', requireFinancialMutation, finaliseInvoice);
router.post('/:id/revise', requireFinancialMutation, reviseInvoice);
router.post('/:id/send', requireFinancialMutation, validateSendInvoice, sendInvoice);
router.post('/:id/void', requireFinancialMutation, voidInvoice);

export default router;

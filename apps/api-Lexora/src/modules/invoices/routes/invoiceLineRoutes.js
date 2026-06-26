import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { BILLING_PERMISSIONS, requireBillingAccess } from '../../billing/services/billingAccessService.js';
import { listLines, addLine, updateLine, deleteLine } from '../controllers/invoiceLineController.js';
import { validateInvoiceLine } from '../validators/invoiceValidators.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// nested under /api/invoices/:invoiceId/lines
router.get('/', requireBillingAccess(BILLING_PERMISSIONS.invoiceView), listLines);
router.post('/', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), validateInvoiceLine, addLine);
router.put('/:lineId', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), validateInvoiceLine, updateLine);
router.delete('/:lineId', requireBillingAccess(BILLING_PERMISSIONS.invoiceCreate, { write: true }), deleteLine);

export default router;

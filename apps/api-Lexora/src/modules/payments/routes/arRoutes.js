import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { BILLING_PERMISSIONS, FINANCE_MODULE_KEY, requireBillingAccess } from '../../billing/services/billingAccessService.js';
import { ArController } from '../controllers/arController.js';

const router = Router();

router.use(authenticate);

// A/R aging totals (optional ?clientId=&asOf=&clearedOnly=)
router.get('/aging', requireBillingAccess(BILLING_PERMISSIONS.invoiceView, { moduleKey: FINANCE_MODULE_KEY }), ArController.aging);

// A/R aging grouped by client
router.get('/aging/by-client', requireBillingAccess(BILLING_PERMISSIONS.invoiceView, { moduleKey: FINANCE_MODULE_KEY }), ArController.agingByClient);

export default router;

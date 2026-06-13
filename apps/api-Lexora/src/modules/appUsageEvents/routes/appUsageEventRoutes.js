import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { AppUsageEventController } from '../controllers/appUsageEventController.js';
import { validateAppUsageEvent, validateAppUsageSummaryQuery, validateWorkSessionId } from '../validators/appUsageEventValidators.js';

const router = Router();

router.use(authenticate);

router.get('/summary', validateAppUsageSummaryQuery, AppUsageEventController.listSummary);
router.post('/work-sessions/:id/events', validateWorkSessionId, validateAppUsageEvent, AppUsageEventController.createForSession);
router.get('/work-sessions/:id/timeline', validateWorkSessionId, AppUsageEventController.sessionTimeline);

export default router;

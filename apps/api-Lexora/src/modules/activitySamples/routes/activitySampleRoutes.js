import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { validateActivitySample, validateActivitySummaryQuery, validateWorkSessionId } from '../validators/activitySampleValidators.js';
import { ActivitySampleController } from '../controllers/activitySampleController.js';

const router = Router();

router.use(authenticate);

router.get('/summary', validateActivitySummaryQuery, ActivitySampleController.listSummary);
router.post('/work-sessions/:id/samples', validateWorkSessionId, validateActivitySample, ActivitySampleController.createForSession);
router.get('/work-sessions/:id/summary', validateWorkSessionId, ActivitySampleController.sessionSummary);

export default router;

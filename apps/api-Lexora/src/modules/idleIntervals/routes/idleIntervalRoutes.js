import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { IdleIntervalController } from '../controllers/idleIntervalController.js';
import {
  validateDetectIdleInterval,
  validateIdleIntervalId,
  validateIdleIntervalQuery,
  validateResolveIdleInterval,
  validateWorkSessionId,
} from '../validators/idleIntervalValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateIdleIntervalQuery, IdleIntervalController.list);
router.post('/work-sessions/:id/detect', validateWorkSessionId, validateDetectIdleInterval, IdleIntervalController.detectForSession);
router.get('/work-sessions/:id', validateWorkSessionId, IdleIntervalController.listForSession);
router.post('/:id/resolve', validateIdleIntervalId, validateResolveIdleInterval, IdleIntervalController.resolve);

export default router;

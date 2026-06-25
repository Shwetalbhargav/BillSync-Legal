import { Router } from 'express';
import { alerts, readiness } from '../controllers/healthController.js';

const router = Router();

router.get('/readyz', readiness);
router.get('/alerts', alerts);

export default router;

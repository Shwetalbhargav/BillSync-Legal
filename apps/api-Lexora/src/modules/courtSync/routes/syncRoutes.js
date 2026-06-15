import { Router } from 'express';
import { listJobs, syncAll, syncOne } from '../controllers/syncController.js';

const router = Router();

router.get('/jobs/list', listJobs);
router.post('/all', syncAll);
router.post('/:key', syncOne);

export default router;

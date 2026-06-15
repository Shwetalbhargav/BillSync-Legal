import { Router } from 'express';
import { listSources, seed, updateSource } from '../controllers/sourceController.js';

const router = Router();

router.get('/', listSources);
router.post('/seed', seed);
router.patch('/:key', updateSource);

export default router;

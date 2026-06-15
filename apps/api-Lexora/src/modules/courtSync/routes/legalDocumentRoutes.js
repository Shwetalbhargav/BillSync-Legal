import { Router } from 'express';
import {
  getDocumentById,
  getLatestDocuments,
  getStats,
  listDocuments,
} from '../controllers/legalDocumentController.js';

const router = Router();

router.get('/', listDocuments);
router.get('/latest', getLatestDocuments);
router.get('/stats', getStats);
router.get('/:id', getDocumentById);

export default router;

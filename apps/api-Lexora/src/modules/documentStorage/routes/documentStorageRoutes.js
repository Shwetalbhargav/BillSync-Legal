import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { DocumentStorageController } from '../controllers/documentStorageController.js';
import { DOCUMENT_PERMISSIONS, requireDocumentAccess } from '../services/documentAccessService.js';
import {
  validateCreateDocument,
  validateDocumentId,
  validateDocumentStatus,
  validateListDocuments,
  validateUpdateDocument,
} from '../validators/documentStorageValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', requireDocumentAccess(DOCUMENT_PERMISSIONS.read), validateListDocuments, DocumentStorageController.list);
router.post('/', requireDocumentAccess(DOCUMENT_PERMISSIONS.create, { write: true }), validateCreateDocument, DocumentStorageController.create);
router.get('/:documentId', requireDocumentAccess(DOCUMENT_PERMISSIONS.read), validateDocumentId, DocumentStorageController.getById);
router.patch('/:documentId', requireDocumentAccess(DOCUMENT_PERMISSIONS.create, { write: true }), validateDocumentId, validateUpdateDocument, DocumentStorageController.update);
router.post('/:documentId/status', requireDocumentAccess(DOCUMENT_PERMISSIONS.delete, { write: true }), validateDocumentId, validateDocumentStatus, DocumentStorageController.setStatus);

export default router;

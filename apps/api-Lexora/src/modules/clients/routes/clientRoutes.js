import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import {
  assignOwnerFields,
  clientWriteFields,
  normalizeClientPayload,
  rejectUnknownClientFields,
  requireClientBodyFields,
  validateAssignOwner,
  validateClientIdParam,
  validateCreateClient,
  validateListClientsQuery,
  validateRelatedClientQuery,
  validateUpdateClient,
} from '../validators/clientValidators.js';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  assignOwner,
  listClientCases,
  listClientInvoices,
  listClientPayments,
  clientSummary,
  exportClientsCsv,
  importClientsCsv,
} from '../controllers/clientController.js';
import { CLIENT_PERMISSIONS, requireClientAccess } from '../services/clientAccessService.js';

const router = Router();

router.use(authenticate);

// CRUD
router.get('/', requireClientAccess(CLIENT_PERMISSIONS.read), validateListClientsQuery, getAllClients);
router.get('/export.csv', requireClientAccess(CLIENT_PERMISSIONS.read), validateListClientsQuery, exportClientsCsv);
router.post('/import.csv', requireClientAccess(CLIENT_PERMISSIONS.create, { write: true }), importClientsCsv);
router.post(
  '/',
  requireClientAccess(CLIENT_PERMISSIONS.create, { write: true }),
  rejectUnknownClientFields(clientWriteFields),
  normalizeClientPayload,
  validateCreateClient,
  createClient
);
router.get('/:clientId', requireClientAccess(CLIENT_PERMISSIONS.read), validateClientIdParam, getClientById);
router.put(
  '/:clientId',
  requireClientAccess(CLIENT_PERMISSIONS.edit, { write: true }),
  validateClientIdParam,
  rejectUnknownClientFields(clientWriteFields),
  normalizeClientPayload,
  requireClientBodyFields(clientWriteFields),
  validateUpdateClient,
  updateClient
);
router.delete('/:clientId', requireClientAccess(CLIENT_PERMISSIONS.delete, { write: true }), validateClientIdParam, deleteClient);

// Owner mapping + payment terms
router.patch(
  '/:clientId/assign-owner',
  requireClientAccess(CLIENT_PERMISSIONS.edit, { write: true }),
  validateClientIdParam,
  rejectUnknownClientFields(assignOwnerFields),
  normalizeClientPayload,
  requireClientBodyFields(assignOwnerFields),
  validateAssignOwner,
  assignOwner
);

// Related lists
router.get('/:clientId/cases', requireClientAccess(CLIENT_PERMISSIONS.read), validateClientIdParam, validateRelatedClientQuery, listClientCases);
router.get('/:clientId/invoices', requireClientAccess(CLIENT_PERMISSIONS.read), validateClientIdParam, validateRelatedClientQuery, listClientInvoices);
router.get('/:clientId/payments', requireClientAccess(CLIENT_PERMISSIONS.read), validateClientIdParam, validateRelatedClientQuery, listClientPayments);

// Financial summary
router.get('/:clientId/summary', requireClientAccess(CLIENT_PERMISSIONS.read), validateClientIdParam, clientSummary);

export default router;

import mongoose from 'mongoose';
import {
  objectId,
  oneOf,
  required,
  string,
  validateBody,
  validateParams,
  validateQuery,
} from '../../../middleware/validate.js';

export const CLIENT_STATUSES = ['active', 'inactive', 'prospect', 'archived'];
export const PAYMENT_TERMS = [
  'DUE_ON_RECEIPT',
  'NET7',
  'NET15',
  'NET30',
  'NET45',
  'NET60',
  'NET90',
];

const CLIENT_WRITE_FIELDS = new Set([
  'displayName',
  'name',
  'email',
  'phone',
  'contactInfo',
  'billingAddress',
  'gst',
  'notes',
  'firmId',
  'ownerUserId',
  'paymentTerms',
  'status',
  'contacts',
  'integrations',
]);

const ASSIGN_OWNER_FIELDS = new Set(['ownerUserId', 'paymentTerms']);

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const email = () => (value, field) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return `${field} must be a string`;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? null
    : `${field} must be a valid email address`;
};

const stringWhenPresent = ({ min = 0, max } = {}) => (value, field, payload) => {
  if (!hasOwn(payload, field)) return null;
  if (typeof value !== 'string') return `${field} must be a string`;
  const trimmed = value.trim();
  if (trimmed.length < min) return `${field} must be at least ${min} characters`;
  if (max && trimmed.length > max) return `${field} must be at most ${max} characters`;
  return null;
};

const nullableObjectId = () => (value, field, payload) => {
  if (!hasOwn(payload, field)) return null;
  if (value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return mongoose.Types.ObjectId.isValid(value) ? null : `${field} must be a valid ObjectId`;
};

const contactsArray = () => (value, field, payload) => {
  if (!hasOwn(payload, field)) return null;
  if (!Array.isArray(value)) return `${field} must be an array`;
  for (const [index, contact] of value.entries()) {
    if (!isPlainObject(contact)) return `${field}.${index} must be an object`;
    const allowed = new Set(['name', 'email', 'phone', 'role', 'isPrimary', 'notes', 'integrations']);
    const unknown = Object.keys(contact).filter((key) => !allowed.has(key));
    if (unknown.length) return `${field}.${index}.${unknown[0]} is not allowed`;
  }
  return null;
};

const plainObjectWhenPresent = () => (value, field, payload) => {
  if (!hasOwn(payload, field)) return null;
  return isPlainObject(value) ? null : `${field} must be an object`;
};

const positiveIntQuery = ({ min = 1, max } = {}) => (value, field) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return `${field} must be an integer`;
  if (parsed < min) return `${field} must be at least ${min}`;
  if (max !== undefined && parsed > max) return `${field} must be at most ${max}`;
  return null;
};

export const rejectUnknownClientFields = (allowedFields = CLIENT_WRITE_FIELDS) => (req, res, next) => {
  const body = req.body || {};
  if (!isPlainObject(body)) {
    return res.status(400).json({
      ok: false,
      message: 'Validation failed',
      errors: [{ field: 'body', message: 'body must be an object' }],
    });
  }

  const unknown = Object.keys(body).filter((field) => !allowedFields.has(field));
  if (unknown.length) {
    return res.status(400).json({
      ok: false,
      message: 'Validation failed',
      errors: unknown.map((field) => ({ field, message: `${field} is not allowed` })),
    });
  }

  next();
};

export const requireClientBodyFields = (allowedFields = CLIENT_WRITE_FIELDS) => (req, res, next) => {
  const body = req.body || {};
  const hasAllowedField = Object.keys(body).some((field) => allowedFields.has(field));
  if (!hasAllowedField) {
    return res.status(400).json({
      ok: false,
      message: 'Validation failed',
      errors: [{ field: 'body', message: 'At least one field is required' }],
    });
  }

  next();
};

export const normalizeClientPayload = (req, _res, next) => {
  const body = req.body || {};

  for (const field of ['displayName', 'name', 'email', 'phone', 'contactInfo', 'firmId', 'ownerUserId', 'paymentTerms', 'status', 'notes']) {
    if (typeof body[field] === 'string') body[field] = body[field].trim();
  }

  if (body.email) body.email = body.email.toLowerCase();
  if (body.paymentTerms) body.paymentTerms = body.paymentTerms.toUpperCase();
  if (body.status) body.status = body.status.toLowerCase();
  if (body.ownerUserId === '') body.ownerUserId = null;

  for (const field of ['name', 'email', 'phone', 'contactInfo', 'firmId', 'paymentTerms', 'status']) {
    if (body[field] === '') delete body[field];
  }

  next();
};

export const validateClientIdParam = validateParams({
  clientId: [required, objectId()],
});

export const validateListClientsQuery = validateQuery({
  q: [string({ max: 160 })],
  status: [oneOf(CLIENT_STATUSES)],
  firmId: [objectId()],
  ownerUserId: [objectId()],
  page: [positiveIntQuery({ min: 1 })],
  limit: [positiveIntQuery({ min: 1, max: 200 })],
});

export const validateRelatedClientQuery = validateQuery({
  status: [string({ max: 40 })],
  page: [positiveIntQuery({ min: 1 })],
  limit: [positiveIntQuery({ min: 1, max: 200 })],
});

export const validateCreateClient = validateBody({
  displayName: [required, string({ min: 1, max: 160 })],
  name: [string({ max: 160 })],
  email: [string({ max: 254 }), email()],
  phone: [string({ max: 40 })],
  contactInfo: [string({ max: 500 })],
  billingAddress: [plainObjectWhenPresent()],
  gst: [plainObjectWhenPresent()],
  notes: [string({ max: 4000 })],
  firmId: [objectId()],
  ownerUserId: [nullableObjectId()],
  paymentTerms: [string({ max: 40 }), oneOf(PAYMENT_TERMS)],
  status: [oneOf(CLIENT_STATUSES)],
  contacts: [contactsArray()],
  integrations: [plainObjectWhenPresent()],
});

export const validateUpdateClient = validateBody({
  displayName: [stringWhenPresent({ min: 1, max: 160 })],
  name: [string({ max: 160 })],
  email: [string({ max: 254 }), email()],
  phone: [string({ max: 40 })],
  contactInfo: [string({ max: 500 })],
  billingAddress: [plainObjectWhenPresent()],
  gst: [plainObjectWhenPresent()],
  notes: [string({ max: 4000 })],
  firmId: [objectId()],
  ownerUserId: [nullableObjectId()],
  paymentTerms: [string({ max: 40 }), oneOf(PAYMENT_TERMS)],
  status: [oneOf(CLIENT_STATUSES)],
  contacts: [contactsArray()],
  integrations: [plainObjectWhenPresent()],
});

export const validateAssignOwner = validateBody({
  ownerUserId: [nullableObjectId()],
  paymentTerms: [string({ max: 40 }), oneOf(PAYMENT_TERMS)],
});

export const clientWriteFields = CLIENT_WRITE_FIELDS;
export const assignOwnerFields = ASSIGN_OWNER_FIELDS;

import { AsyncLocalStorage } from 'node:async_hooks';
import mongoose from 'mongoose';

const workspaceStorage = new AsyncLocalStorage();

export const OWNERSHIP_FIELDS = new Set([
  'workspaceId',
  'firmId',
  'ownerUserId',
  'ownerId',
  'tenantId',
]);

export function runWorkspaceContext(req, _res, next) {
  workspaceStorage.run({ workspaceId: null, enforce: false }, next);
}

export function getWorkspaceStore() {
  return workspaceStorage.getStore() || null;
}

export function setRequestWorkspace(workspaceId) {
  const store = getWorkspaceStore();
  if (store) {
    store.workspaceId = workspaceId ? String(workspaceId) : null;
    store.enforce = Boolean(workspaceId);
  }
}

export function getCurrentWorkspaceId() {
  const store = getWorkspaceStore();
  return store?.enforce ? store.workspaceId : null;
}

export function workspaceObjectId(workspaceId = getCurrentWorkspaceId()) {
  if (!workspaceId) return null;
  return mongoose.Types.ObjectId.isValid(workspaceId)
    ? new mongoose.Types.ObjectId(workspaceId)
    : workspaceId;
}

export function sanitizeOwnershipFields(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    value.forEach(sanitizeOwnershipFields);
    return value;
  }

  for (const key of Object.keys(value)) {
    if (OWNERSHIP_FIELDS.has(key)) {
      delete value[key];
      continue;
    }
    if (key.startsWith('$')) {
      delete value[key];
      continue;
    }
    sanitizeOwnershipFields(value[key]);
  }
  return value;
}

export function rejectOwnershipFields(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const body = req.body;
  if (!body || typeof body !== 'object') return next();

  const blocked = [];
  const visit = (node, path = '') => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      const childPath = path ? `${path}.${key}` : key;
      if (OWNERSHIP_FIELDS.has(key) || key.startsWith('$')) blocked.push(childPath);
      visit(child, childPath);
    }
  };
  visit(body);

  if (blocked.length) {
    return res.status(400).json({
      ok: false,
      message: 'Ownership and operator fields are not accepted in client payloads',
      fields: blocked,
    });
  }
  next();
}


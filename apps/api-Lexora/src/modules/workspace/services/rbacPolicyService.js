import Membership from '../models/Membership.js';
import Permission from '../models/Permission.js';
import Policy from '../models/Policy.js';
import Role from '../models/Role.js';
import { normalizeRole } from '../roles.js';
import { CORE_PERMISSIONS, CORE_ROLES } from './workspaceFoundationService.js';

export const PERMISSION_DENIED_MESSAGE = 'You do not have access to this area.';

const CORE_ROLE_BY_KEY = new Map(CORE_ROLES.map((role) => [role.key, role]));
const CORE_PERMISSION_BY_KEY = new Map(CORE_PERMISSIONS.map((permission) => [permission.key, permission]));

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function idText(value) {
  return value == null ? '' : String(value);
}

function containsId(values = [], id) {
  const target = idText(id);
  return Array.isArray(values) && values.map(idText).includes(target);
}

export function normalizePermissionKey(permission) {
  return String(permission || '').trim().toLowerCase();
}

export function publicPermission(permission) {
  if (!permission) return null;
  const obj = typeof permission.toObject === 'function' ? permission.toObject() : permission;
  const fallback = CORE_PERMISSION_BY_KEY.get(obj.key) || {};
  return {
    key: obj.key,
    name: obj.name || fallback.name,
    moduleKey: obj.moduleKey || fallback.moduleKey,
    action: obj.action || fallback.action,
    resource: obj.resource || fallback.resource,
    status: obj.status || fallback.status || 'active',
    description: obj.description || fallback.description,
  };
}

export function publicRole(role) {
  if (!role) return null;
  const obj = typeof role.toObject === 'function' ? role.toObject() : role;
  const fallback = CORE_ROLE_BY_KEY.get(obj.key) || {};
  return {
    key: obj.key,
    name: obj.name || fallback.name,
    status: obj.status || fallback.status || 'active',
    permissionKeys: obj.permissionKeys || fallback.permissionKeys || [],
    system: obj.system !== undefined ? obj.system : true,
    description: obj.description || fallback.description,
  };
}

export function scopeMatchesPolicy({ policy, userId, user = {}, resource = {} }) {
  const obj = typeof policy.toObject === 'function' ? policy.toObject() : policy;
  const conditions = obj.conditions || {};
  const scope = obj.scope || conditions.scope || 'workspace';

  if (scope === 'workspace') return true;

  if (scope === 'assigned_matter') {
    return containsId(resource.assignedUserIds, userId)
      || containsId(resource.matter?.assignedUserIds, userId)
      || idText(resource.assignedUserId || resource.matter?.assignedUserId) === idText(userId);
  }

  if (scope === 'department') {
    const allowed = conditions.departmentKeys || conditions.departments || [];
    return containsId(allowed, resource.departmentKey || user.departmentKey);
  }

  if (scope === 'office') {
    const allowed = conditions.officeKeys || conditions.offices || [];
    return containsId(allowed, resource.officeKey || user.officeKey);
  }

  if (scope === 'practice_group') {
    const allowed = conditions.practiceGroupKeys || conditions.practiceGroups || [];
    return containsId(allowed, resource.practiceGroupKey || user.practiceGroupKey);
  }

  if (scope === 'financial_only') {
    return Boolean(resource.financialOnly || resource.financial)
      || String(resource.resourceType || '').startsWith('finance')
      || String(resource.resourceType || '').startsWith('billing');
  }

  return false;
}

async function canReadCollections() {
  return process.env.NODE_ENV !== 'test' || Membership.db?.readyState === 1;
}

async function getMembership({ userId, workspaceId, user }) {
  if (await canReadCollections()) {
    const membership = await Membership.findOne({ userId, workspaceId, status: 'active' }).lean();
    if (membership) return membership;
  }
  if (!user) return null;
  return {
    userId,
    workspaceId,
    status: 'active',
    role: normalizeRole(user.commercialRole || user.role),
    permissions: user.permissions || [],
  };
}

async function getRole(roleKey) {
  const key = normalizeRole(roleKey);
  if (await canReadCollections()) {
    const role = await Role.findOne({ key, status: 'active' }).lean();
    if (role) return role;
  }
  return CORE_ROLE_BY_KEY.get(key) || null;
}

async function getPolicies({ workspaceId, roleKey, permissionKey }) {
  if (!(await canReadCollections())) return [];
  return Policy.find({
    workspaceId,
    status: 'active',
    roleKey: { $in: [roleKey, '*', null] },
    permissionKey: { $in: [permissionKey, '*', null] },
  }).lean();
}

export async function can(userId, workspaceId, permission, resource = {}, options = {}) {
  const permissionKey = normalizePermissionKey(permission);
  const user = options.user || null;
  if (!userId || !workspaceId || !permissionKey) {
    return {
      allowed: false,
      reason: PERMISSION_DENIED_MESSAGE,
      source: 'missing_context',
      permissionKey,
    };
  }

  const membership = await getMembership({ userId, workspaceId, user });
  if (!membership) {
    return {
      allowed: false,
      reason: PERMISSION_DENIED_MESSAGE,
      source: 'membership',
      permissionKey,
    };
  }

  const roleKey = normalizeRole(membership.role || user?.commercialRole || user?.role);
  const role = await getRole(roleKey);
  const rolePermissionKeys = role?.permissionKeys || [];
  const directPermissionKeys = membership.permissions || [];
  const policies = await getPolicies({ workspaceId, roleKey, permissionKey });
  const matchingPolicies = policies.filter((policy) => scopeMatchesPolicy({ policy, userId, user, resource }));
  const denyPolicy = matchingPolicies.find((policy) => policy.effect === 'deny');
  if (denyPolicy) {
    return {
      allowed: false,
      reason: denyPolicy.reason || PERMISSION_DENIED_MESSAGE,
      source: 'policy',
      permissionKey,
      roleKey,
      scope: denyPolicy.scope || denyPolicy.conditions?.scope || 'workspace',
    };
  }

  const hasTemplatePermission = rolePermissionKeys.includes(permissionKey);
  const hasDirectPermission = directPermissionKeys.includes(permissionKey);
  const hasAllowPolicy = matchingPolicies.some((policy) => policy.effect === 'allow');
  const allowed = hasTemplatePermission || hasDirectPermission || hasAllowPolicy;

  return {
    allowed,
    reason: allowed ? null : PERMISSION_DENIED_MESSAGE,
    source: hasAllowPolicy ? 'policy' : hasDirectPermission ? 'membership' : hasTemplatePermission ? 'role' : 'role',
    permissionKey,
    roleKey,
    scope: matchingPolicies[0]?.scope || matchingPolicies[0]?.conditions?.scope || 'workspace',
  };
}

export async function getPermissionCatalog() {
  if (await canReadCollections()) {
    const rows = await Permission.find({ status: { $ne: 'retired' } }).sort({ moduleKey: 1, key: 1 }).lean();
    if (rows.length) return rows.map(publicPermission);
  }
  return CORE_PERMISSIONS.map(publicPermission);
}

export async function getRoleTemplates() {
  if (await canReadCollections()) {
    const rows = await Role.find({ status: { $ne: 'retired' } }).sort({ key: 1 }).lean();
    if (rows.length) return rows.map(publicRole);
  }
  return CORE_ROLES.map(publicRole);
}

export async function getCurrentUserPermissionSummary({ userId, workspaceId, user }) {
  const membership = await getMembership({ userId, workspaceId, user });
  if (!membership) {
    return {
      workspaceId: idText(workspaceId),
      roleKey: null,
      permissions: [],
      scopes: [],
    };
  }
  const roleKey = normalizeRole(membership.role || user?.commercialRole || user?.role);
  const role = await getRole(roleKey);
  const policies = (await canReadCollections())
    ? await Policy.find({ workspaceId, roleKey: { $in: [roleKey, '*', null] }, status: 'active' }).lean()
    : [];
  const denied = new Set(policies.filter((policy) => policy.effect === 'deny').map((policy) => policy.permissionKey));
  const allowedByPolicy = policies.filter((policy) => policy.effect === 'allow').map((policy) => policy.permissionKey);
  const permissionKeys = uniq([
    ...(role?.permissionKeys || []),
    ...(membership.permissions || []),
    ...allowedByPolicy,
  ]).filter((key) => key && !denied.has(key));

  return {
    workspaceId: idText(workspaceId),
    roleKey,
    permissions: permissionKeys,
    scopes: uniq(policies.map((policy) => policy.scope || policy.conditions?.scope || 'workspace')),
  };
}

export function requirePermission(permission, resourceBuilder) {
  return async (req, res, next) => {
    try {
      const resource = typeof resourceBuilder === 'function' ? await resourceBuilder(req) : (resourceBuilder || {});
      const workspaceId = req.workspaceId
        || req.user?.workspaceId
        || (process.env.NODE_ENV === 'test' ? req.user?.firmId || 'test-workspace' : null);
      const decision = await can(req.user?.id, workspaceId, permission, resource, { user: req.user });
      if (!decision.allowed) {
        return res.status(403).json({ ok: false, message: PERMISSION_DENIED_MESSAGE, permission: decision.permissionKey });
      }
      req.authorization = decision;
      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, message: 'Failed to check access.' });
    }
  };
}

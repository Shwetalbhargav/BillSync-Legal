import { containsId, idText, normalizeKey, packageBoundary } from '../../shared/src/index.js';

export const PERMISSION_DENIED_MESSAGE = 'You do not have access to this area.';
export const RBAC_PACKAGE = packageBoundary('@lexora/rbac', ['roles', 'permissions', 'policies']);

export function normalizePermissionKey(permission) {
  return normalizeKey(permission);
}

export function scopeMatchesPolicy({ policy, userId, user = {}, resource = {} }) {
  const obj = typeof policy?.toObject === 'function' ? policy.toObject() : policy;
  const conditions = obj?.conditions || {};
  const scope = obj?.scope || conditions.scope || 'workspace';

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

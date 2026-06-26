import {
  getCurrentUserPermissionSummary,
  getPermissionCatalog,
  getRoleTemplates,
} from '../services/rbacPolicyService.js';
import Policy from '../models/Policy.js';
import Role from '../models/Role.js';
import { CORE_PERMISSIONS } from '../services/workspaceFoundationService.js';

const POLICY_SCOPES = ['workspace', 'assigned_matter', 'department', 'office', 'practice_group', 'financial_only'];

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

export async function listPermissionCatalog(req, res) {
  try {
    const permissions = await getPermissionCatalog();
    res.json({ ok: true, data: permissions });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load permissions.' });
  }
}

export async function listRoleTemplates(req, res) {
  try {
    const roles = await getRoleTemplates();
    res.json({ ok: true, data: roles });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load roles.' });
  }
}

export async function getCurrentPermissionSummary(req, res) {
  try {
    const summary = await getCurrentUserPermissionSummary({
      userId: req.user?.id,
      workspaceId: req.workspaceId,
      user: req.user,
    });
    res.json({ ok: true, data: summary });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load your permissions.' });
  }
}

export async function updateRolePermissions(req, res) {
  try {
    const roleKey = normalizeKey(req.params.roleKey);
    const knownPermissions = new Set(CORE_PERMISSIONS.map((permission) => permission.key));
    const permissionKeys = Array.isArray(req.body?.permissionKeys)
      ? req.body.permissionKeys.map(normalizeKey).filter((key) => knownPermissions.has(key))
      : null;
    if (!roleKey || !permissionKeys) {
      return res.status(400).json({ ok: false, message: 'Choose a role and permissions.' });
    }
    const role = await Role.findOneAndUpdate(
      { key: roleKey },
      { $set: { permissionKeys, status: 'active', system: false } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ ok: true, data: role });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message || 'Failed to update role permissions.' });
  }
}

export async function listPolicies(req, res) {
  try {
    const policies = await Policy.find({ workspaceId: req.workspaceId, status: 'active' }).sort({ roleKey: 1, permissionKey: 1 });
    res.json({ ok: true, data: policies });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load policies.' });
  }
}

export async function upsertPolicy(req, res) {
  try {
    const roleKey = normalizeKey(req.body?.roleKey);
    const permissionKey = normalizeKey(req.body?.permissionKey);
    const effect = normalizeKey(req.body?.effect || 'allow');
    const scope = normalizeKey(req.body?.scope || 'workspace');
    if (!roleKey || !permissionKey || !['allow', 'deny'].includes(effect) || !POLICY_SCOPES.includes(scope)) {
      return res.status(400).json({ ok: false, message: 'Choose a role, permission, effect, and scope.' });
    }
    const policy = await Policy.findOneAndUpdate(
      { workspaceId: req.workspaceId, roleKey, permissionKey },
      {
        $set: {
          effect,
          scope,
          status: 'active',
          conditions: req.body?.conditions || {},
          reason: req.body?.reason,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ ok: true, data: policy });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message || 'Failed to save policy.' });
  }
}

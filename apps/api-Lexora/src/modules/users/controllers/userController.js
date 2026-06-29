// src/controllers/userController.js (updated)
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Admin from '../models/admin.js';
import LawyerProfile from '../models/LawyerProfile.js';
import AssociateProfile from '../models/AssociateProfile.js';
import PartnerProfile from '../models/PartnerProfile.js';
import InternProfile from '../models/InternProfile.js';
import { toSafeUser } from '../utils/safeUser.js';

const LIST_USER_SORT_FIELDS = new Set(['name', 'email', 'mobile', 'role', 'commercialRole', 'createdAt', 'updatedAt']);
const MAX_LIST_USER_LIMIT = 100;

/**
 * Helpers
 */
function modelForRole(role) {
  switch (role) {
    case 'partner': return PartnerProfile;
    case 'lawyer': return LawyerProfile;
    case 'associate': return AssociateProfile;
    case 'intern': return InternProfile;
    default: return null;
  }
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanQueryString(value) {
  const first = firstQueryValue(value);
  if (first === undefined || first === null) return '';
  return String(first).trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInteger(value, fallback, { max = Number.MAX_SAFE_INTEGER } = {}) {
  const normalized = cleanQueryString(value);
  if (!normalized) return fallback;
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) return null;
  return parsed;
}

function parseUserSort(value) {
  const normalized = cleanQueryString(value) || 'name';
  const direction = normalized.startsWith('-') ? '-' : '';
  const field = direction ? normalized.slice(1) : normalized;
  if (!LIST_USER_SORT_FIELDS.has(field)) return null;
  return `${direction}${field}`;
}

/**
 * POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, role, firmId, password, mobile, address, qualifications } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, role, firmId, passwordHash, mobile, address, qualifications });
    res.status(201).json({ success: true, user: toSafeUser(user) });
  } catch (err) {
    console.error('createUser error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }
    const user = await User.findByIdAndUpdate(id, updates, { new: true, select: '-passwordHash' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: toSafeUser(user) });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/users
 */
export const listUsers = async (req, res) => {
  try {
    const role = cleanQueryString(req.query.role);
    const q = cleanQueryString(req.query.q);
    const firmId = cleanQueryString(req.query.firmId);
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, { max: MAX_LIST_USER_LIMIT });
    const sort = parseUserSort(req.query.sort);

    if (!page) return res.status(400).json({ error: 'page must be a positive integer' });
    if (!limit) return res.status(400).json({ error: `limit must be a positive integer up to ${MAX_LIST_USER_LIMIT}` });
    if (!sort) return res.status(400).json({ error: 'sort is not supported' });
    if (firmId && !mongoose.Types.ObjectId.isValid(firmId)) {
      return res.status(400).json({ error: 'firmId must be a valid ObjectId' });
    }

    const filter = {};
    if (role) filter.role = role;
    if (firmId) filter.firmId = firmId;
    if (q) {
      const escaped = escapeRegex(q);
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { mobile: { $regex: escaped, $options: 'i' } },
        { address: { $regex: escaped, $options: 'i' } },
      ];
    }
    const projection = { passwordHash: 0 };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter, projection).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, page, limit, total, items });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const u = await User.findById(req.params.id, { passwordHash: 0 });
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: u });
  } catch (err) {
    console.error('getUserById error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/users/me
 * Assumes auth middleware populates req.user.id
 */
export const getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user.id, { passwordHash: 0 });
    if (!me) return res.status(404).json({ error: 'User not found' });
    const admin = await Admin.findOne({ userId: me._id });
    res.json({ success: true, user: toSafeUser(me), isAdmin: !!admin, adminRole: admin?.role || null });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/users/:id/profile
 * Returns the role-specific profile and a default rate (billingRate) if present.
 */
export const getUserProfile = async (req, res) => {
  try {
    const u = await User.findById(req.params.id, { passwordHash: 0 });
    if (!u) return res.status(404).json({ error: 'User not found' });
    const Model = modelForRole(u.role);
    if (!Model) return res.json({ success: true, user: u, profile: null, defaultRate: null, note: 'No profile model for this role.' });
    const profile = await Model.findOne({ userId: u._id });
    res.json({ success: true, user: u, profile, defaultRate: profile?.billingRate ?? null });
  } catch (err) {
    console.error('getUserProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /api/users/:id/profile
 * Upsert role-specific profile (billingRate, etc.)
 */
export const upsertUserProfile = async (req, res) => {
  try {
    const u = await User.findById(req.params.id, { passwordHash: 0 });
    if (!u) return res.status(404).json({ error: 'User not found' });
    const Model = modelForRole(u.role);
    if (!Model) return res.status(400).json({ error: 'No profile model available for this role' });

    const update = { ...req.body, userId: u._id };
    const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
    const profile = await Model.findOneAndUpdate({ userId: u._id }, update, opts);
    res.json({ success: true, profile, defaultRate: profile?.billingRate ?? null });
  } catch (err) {
    console.error('upsertUserProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/users/:id/default-rate
 * Returns default hourly rate from profile (if any).
 */
export const getUserDefaultRate = async (req, res) => {
  try {
    const u = await User.findById(req.params.id, { passwordHash: 0 });
    if (!u) return res.status(404).json({ error: 'User not found' });
    const Model = modelForRole(u.role);
    if (!Model) return res.json({ userId: u._id, defaultRate: null });
    const profile = await Model.findOne({ userId: u._id });
    res.json({ userId: u._id, defaultRate: profile?.billingRate ?? null });
  } catch (err) {
    console.error('getUserDefaultRate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/users/me/scopes
 * Convenience endpoint: returns the caller's firmId, role and admin flag.
 */
export const getMyScopes = async (req, res) => {
  try {
    const me = await User.findById(req.user.id, { passwordHash: 0 });
    if (!me) return res.status(404).json({ error: 'User not found' });
    const admin = await Admin.findOne({ userId: me._id });
    res.json({ firmId: me.firmId || null, role: me.role, isAdmin: !!admin });
  } catch (err) {
    console.error('getMyScopes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

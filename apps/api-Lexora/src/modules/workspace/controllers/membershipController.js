import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Firm from '../../firms/models/Firm.js';
import User from '../../users/models/User.js';
import Membership from '../models/Membership.js';
import Invitation from '../models/Invitation.js';
import AuditEvent from '../models/AuditEvent.js';
import { canManageMembership, COMMERCIAL_ROLES, isOwner, normalizeRole } from '../roles.js';

const INVITE_DAYS = 7;

function normalizeMobile(value) {
  return String(value || '').replace(/\D/g, '');
}

function publicInvite(invite, token) {
  return {
    id: invite._id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
    token,
  };
}

async function audit({ workspaceId, actorId, action, targetType, targetId, changes }, options = {}) {
  await AuditEvent.create([{
    workspaceId,
    actorId,
    action,
    targetType,
    targetId,
    changes,
  }], options);
}

async function activeMemberCount(workspaceId, session) {
  return Membership.countDocuments({ workspaceId, status: 'active' }).session(session);
}

async function activeOwnerCount(workspaceId, session) {
  return Membership.countDocuments({ workspaceId, role: 'owner', status: 'active' }).session(session);
}

function requireOwner(req, res) {
  if (!canManageMembership(req.user?.commercialRole || req.user?.role)) {
    res.status(403).json({ ok: false, message: 'Only Owners can manage workspace membership' });
    return false;
  }
  return true;
}

export async function listMemberships(req, res) {
  try {
    const rows = await Membership.find({}).populate('userId', 'name email mobile role commercialRole');
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to list members' });
  }
}

export async function inviteMember(req, res) {
  if (!requireOwner(req, res)) return;
  const session = await Membership.startSession();
  try {
    const { email, role = 'lawyer' } = req.body || {};
    const commercialRole = normalizeRole(role);
    if (!email || !COMMERCIAL_ROLES.includes(commercialRole)) {
      return res.status(400).json({ ok: false, message: 'email and a valid role are required' });
    }

    let invite;
    let token;
    await session.withTransaction(async () => {
      const workspace = await Firm.findById(req.workspaceId).session(session);
      const limit = Number(workspace?.memberLimit || 5);
      const count = await activeMemberCount(req.workspaceId, session);
      if (count >= limit) {
        const error = new Error('Member limit reached for this plan');
        error.statusCode = 409;
        throw error;
      }

      token = crypto.randomBytes(32).toString('base64url');
      [invite] = await Invitation.create([{
        workspaceId: req.workspaceId,
        email,
        role: commercialRole,
        tokenHash: Invitation.hashToken(token),
        invitedBy: req.user.id,
        expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
      }], { session });
      await audit({
        workspaceId: req.workspaceId,
        actorId: req.user.id,
        action: 'membership.invited',
        targetType: 'invitation',
        targetId: invite._id,
        changes: { email, role: commercialRole },
      }, { session });
    });

    res.status(201).json({ ok: true, data: publicInvite(invite, process.env.NODE_ENV === 'production' ? undefined : token) });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to invite member' });
  } finally {
    session.endSession();
  }
}

export async function acceptInvitation(req, res) {
  const session = await Invitation.startSession();
  try {
    const { token, name, mobile, password } = req.body || {};
    if (!token || !name || !mobile || !password) {
      return res.status(400).json({ ok: false, message: 'token, name, mobile and password are required' });
    }

    let user;
    let membership;
    await session.withTransaction(async () => {
      const invite = await Invitation.findOne({
        tokenHash: Invitation.hashToken(token),
        status: 'pending',
        expiresAt: { $gt: new Date() },
      }).session(session);
      if (!invite) {
        const error = new Error('Invitation is invalid or expired');
        error.statusCode = 404;
        throw error;
      }

      const workspace = await Firm.findById(invite.workspaceId).session(session);
      const count = await activeMemberCount(invite.workspaceId, session);
      if (count >= Number(workspace?.memberLimit || 5)) {
        const error = new Error('Member limit reached for this plan');
        error.statusCode = 409;
        throw error;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      [user] = await User.create([{
        name,
        email: invite.email,
        mobile: normalizeMobile(mobile),
        role: invite.role,
        commercialRole: invite.role,
        firmId: invite.workspaceId,
        workspaceId: invite.workspaceId,
        passwordHash,
      }], { session });
      [membership] = await Membership.create([{
        workspaceId: invite.workspaceId,
        userId: user._id,
        role: invite.role,
        status: 'active',
        invitedBy: invite.invitedBy,
        invitedAt: invite.createdAt,
        acceptedAt: new Date(),
      }], { session });
      invite.status = 'accepted';
      invite.acceptedBy = user._id;
      invite.acceptedAt = new Date();
      await invite.save({ session });
      await audit({
        workspaceId: invite.workspaceId,
        actorId: user._id,
        action: 'membership.accepted',
        targetType: 'membership',
        targetId: membership._id,
        changes: { role: invite.role },
      }, { session });
    });

    res.status(201).json({ ok: true, data: { userId: user._id, membership } });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to accept invitation' });
  } finally {
    session.endSession();
  }
}

export async function resendInvitation(req, res) {
  if (!requireOwner(req, res)) return;
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.status !== 'pending') return res.status(404).json({ ok: false, message: 'Invitation not found' });
    const token = crypto.randomBytes(32).toString('base64url');
    invite.tokenHash = Invitation.hashToken(token);
    invite.expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
    invite.resentAt = new Date();
    await invite.save();
    await audit({
      workspaceId: req.workspaceId,
      actorId: req.user.id,
      action: 'membership.invite_resent',
      targetType: 'invitation',
      targetId: invite._id,
      changes: { email: invite.email },
    });
    res.json({ ok: true, data: publicInvite(invite, process.env.NODE_ENV === 'production' ? undefined : token) });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to resend invitation' });
  }
}

export async function expireInvitation(req, res) {
  if (!requireOwner(req, res)) return;
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.status !== 'pending') return res.status(404).json({ ok: false, message: 'Invitation not found' });
    invite.status = 'expired';
    invite.expiresAt = new Date();
    await invite.save();
    await audit({ workspaceId: req.workspaceId, actorId: req.user.id, action: 'membership.invite_expired', targetType: 'invitation', targetId: invite._id });
    res.json({ ok: true, data: invite });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to expire invitation' });
  }
}

export async function revokeInvitation(req, res) {
  if (!requireOwner(req, res)) return;
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.status !== 'pending') return res.status(404).json({ ok: false, message: 'Invitation not found' });
    invite.status = 'revoked';
    invite.revokedAt = new Date();
    await invite.save();
    await audit({ workspaceId: req.workspaceId, actorId: req.user.id, action: 'membership.invite_revoked', targetType: 'invitation', targetId: invite._id });
    res.json({ ok: true, data: invite });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to revoke invitation' });
  }
}

export async function updateMembership(req, res) {
  if (!requireOwner(req, res)) return;
  const session = await Membership.startSession();
  try {
    const nextRole = req.body?.role ? normalizeRole(req.body.role) : null;
    if (nextRole && !COMMERCIAL_ROLES.includes(nextRole)) {
      return res.status(400).json({ ok: false, message: 'Invalid role' });
    }

    let membership;
    await session.withTransaction(async () => {
      membership = await Membership.findById(req.params.id).session(session);
      if (!membership || membership.status !== 'active') {
        const error = new Error('Membership not found');
        error.statusCode = 404;
        throw error;
      }
      if (String(membership.userId) === String(req.user.id) && isOwner(membership.role)) {
        const owners = await activeOwnerCount(req.workspaceId, session);
        if (owners <= 1 && nextRole && nextRole !== 'owner') {
          const error = new Error('Transfer ownership before demoting the final Owner');
          error.statusCode = 409;
          throw error;
        }
      }

      const previousRole = membership.role;
      if (nextRole) membership.role = nextRole;
      if (req.body?.status) membership.status = req.body.status;
      await membership.save({ session });
      await User.updateOne(
        { _id: membership.userId },
        { $set: { role: membership.role, commercialRole: membership.role } },
        { session }
      );
      await audit({
        workspaceId: req.workspaceId,
        actorId: req.user.id,
        action: 'membership.updated',
        targetType: 'membership',
        targetId: membership._id,
        changes: { role: { from: previousRole, to: membership.role }, status: membership.status },
      }, { session });
    });

    res.json({ ok: true, data: membership });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to update membership' });
  } finally {
    session.endSession();
  }
}

export async function removeMembership(req, res) {
  if (!requireOwner(req, res)) return;
  const session = await Membership.startSession();
  try {
    let membership;
    await session.withTransaction(async () => {
      membership = await Membership.findById(req.params.id).session(session);
      if (!membership || membership.status !== 'active') {
        const error = new Error('Membership not found');
        error.statusCode = 404;
        throw error;
      }
      if (String(membership.userId) === String(req.user.id) && isOwner(membership.role)) {
        const owners = await activeOwnerCount(req.workspaceId, session);
        if (owners <= 1) {
          const error = new Error('Transfer ownership before removing the final Owner');
          error.statusCode = 409;
          throw error;
        }
      }
      membership.status = 'removed';
      membership.removedAt = new Date();
      await membership.save({ session });
      await audit({
        workspaceId: req.workspaceId,
        actorId: req.user.id,
        action: 'membership.removed',
        targetType: 'membership',
        targetId: membership._id,
        changes: { userId: membership.userId, role: membership.role },
      }, { session });
    });
    res.json({ ok: true, data: membership });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to remove membership' });
  } finally {
    session.endSession();
  }
}

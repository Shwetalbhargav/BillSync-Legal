import crypto from 'crypto';
import User from '../../users/models/User.js';
import Membership from '../models/Membership.js';
import Invitation from '../models/Invitation.js';
import AuditEvent from '../models/AuditEvent.js';
import Workspace from '../models/Workspace.js';
import { COMMERCIAL_ROLES, normalizeRole } from '../roles.js';
import {
  activeOwnerCount,
  isFinalOwnerDemotion,
  isFinalOwnerRemoval,
} from '../services/membershipPolicyService.js';
import {
  acceptWorkspaceInvitation,
  createWorkspaceInvitation,
  getWorkspaceContextForUser,
  publicInvite,
  publicMembership,
  publicWorkspace,
} from '../services/workspaceMembershipService.js';

const INVITE_DAYS = 7;

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

export async function listMemberships(req, res) {
  try {
    const rows = await Membership.find({ workspaceId: req.workspaceId, status: { $ne: 'removed' } })
      .populate('userId', 'name email mobile role commercialRole')
      .sort({ createdAt: 1 });
    res.json({ ok: true, data: rows.map((row) => publicMembership(row)) });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to list members' });
  }
}

export async function getWorkspaceContext(req, res) {
  try {
    const [workspace, membershipsForUser, workspaceMemberships] = await Promise.all([
      Workspace.findById(req.workspaceId),
      getWorkspaceContextForUser(req.user.id),
      Membership.find({ workspaceId: req.workspaceId, status: 'active' })
        .populate('userId', 'name email mobile role commercialRole')
        .sort({ createdAt: 1 }),
    ]);
    const workspaceMembers = workspaceMemberships.map((membership) => publicMembership(membership, workspace));
    const memberships = workspaceMembers.length ? workspaceMembers : membershipsForUser;
    const activeMembership = memberships.find((membership) => (
      membership.workspaceId === String(req.workspaceId)
      && membership.userId === String(req.user.id)
    )) || membershipsForUser.find((membership) => membership.workspaceId === String(req.workspaceId)) || null;
    res.json({ ok: true, data: { workspace: publicWorkspace(workspace), memberships, activeMembership } });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to load workspace context' });
  }
}

export async function inviteMember(req, res) {
  try {
    const { email, role = 'lawyer' } = req.body || {};
    const commercialRole = normalizeRole(role);
    if (!email || !COMMERCIAL_ROLES.includes(commercialRole)) {
      return res.status(400).json({ ok: false, message: 'email and a valid role are required' });
    }

    const { invite, token } = await createWorkspaceInvitation({
      workspaceId: req.workspaceId,
      actorId: req.user.id,
      email,
      role: commercialRole,
    });

    res.status(201).json({ ok: true, data: publicInvite(invite, process.env.NODE_ENV === 'production' ? undefined : token) });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to invite member' });
  }
}

export async function acceptInvitation(req, res) {
  try {
    const { token, name, mobile, password } = req.body || {};
    if (!token || !name || !mobile || !password) {
      return res.status(400).json({ ok: false, message: 'token, name, mobile and password are required' });
    }

    const { user, membership } = await acceptWorkspaceInvitation({ token, name, mobile, password });

    res.status(201).json({ ok: true, data: { userId: user._id, membership } });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to accept invitation' });
  }
}

export async function resendInvitation(req, res) {
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
      const owners = await activeOwnerCount(req.workspaceId, session);
      if (isFinalOwnerDemotion({ membership, actorUserId: req.user.id, nextRole, ownerCount: owners })) {
        const error = new Error('Transfer ownership before demoting the final Owner');
        error.statusCode = 409;
        throw error;
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
      const owners = await activeOwnerCount(req.workspaceId, session);
      if (isFinalOwnerRemoval({ membership, actorUserId: req.user.id, ownerCount: owners })) {
        const error = new Error('Transfer ownership before removing the final Owner');
        error.statusCode = 409;
        throw error;
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

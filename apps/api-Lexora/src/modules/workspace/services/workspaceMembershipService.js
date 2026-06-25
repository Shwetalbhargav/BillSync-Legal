import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Workspace from '../models/Workspace.js';
import Membership from '../models/Membership.js';
import Invitation from '../models/Invitation.js';
import Subscription from '../models/Subscription.js';
import WorkspaceModule from '../models/WorkspaceModule.js';
import AuditEvent from '../models/AuditEvent.js';
import User from '../../users/models/User.js';
import { CORE_PLANS } from './workspaceFoundationService.js';
import { COMMERCIAL_ROLES, normalizeRole } from '../roles.js';

const INVITE_DAYS = 7;

export function normalizeMobile(value) {
  return String(value || '').replace(/\D/g, '');
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function publicWorkspace(workspace) {
  if (!workspace) return null;
  const obj = typeof workspace.toObject === 'function' ? workspace.toObject() : workspace;
  return {
    id: String(obj._id || obj.id),
    name: obj.name,
    slug: obj.slug,
    status: obj.status,
    currency: obj.currency,
    timezone: obj.timezone,
    limits: obj.limits || {},
    onboarding: obj.onboarding || {},
  };
}

export function publicMembership(membership, workspace) {
  if (!membership) return null;
  const obj = typeof membership.toObject === 'function' ? membership.toObject() : membership;
  const user = obj.userId && typeof obj.userId === 'object' ? obj.userId : null;
  return {
    id: String(obj._id || obj.id),
    workspaceId: String(obj.workspaceId),
    userId: user?._id ? String(user._id) : String(obj.userId),
    role: obj.role,
    status: obj.status,
    permissions: obj.permissions || [],
    acceptedAt: obj.acceptedAt,
    workspace: publicWorkspace(workspace),
    user: user ? {
      id: String(user._id),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      commercialRole: user.commercialRole,
    } : null,
  };
}

export function publicInvite(invite, token) {
  if (!invite) return null;
  const obj = typeof invite.toObject === 'function' ? invite.toObject() : invite;
  return {
    id: String(obj._id || obj.id),
    workspaceId: String(obj.workspaceId),
    email: obj.email,
    role: obj.role,
    status: obj.status,
    expiresAt: obj.expiresAt,
    token,
  };
}

function slugFromName(name, suffix = '') {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `${base || 'workspace'}${suffix ? `-${suffix}` : ''}`;
}

async function uniqueSlug(name, session) {
  const base = slugFromName(name);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = attempt ? slugFromName(name, crypto.randomBytes(2).toString('hex')) : base;
    const existing = await Workspace.findOne({ slug }).session(session);
    if (!existing) return slug;
  }
  return slugFromName(name, crypto.randomBytes(4).toString('hex'));
}

function planByKey(planKey) {
  return CORE_PLANS.find((plan) => plan.key === planKey) || CORE_PLANS[1];
}

async function seedWorkspacePlan(workspace, planKey, session) {
  const plan = planByKey(planKey);
  await Subscription.create([{
    workspaceId: workspace._id,
    planKey: plan.key,
    status: 'active',
    source: 'signup',
    featureKeysSnapshot: plan.featureKeys,
    moduleKeysSnapshot: plan.moduleKeys,
    limitsSnapshot: plan.limits,
    startedAt: new Date(),
  }], { session });

  await WorkspaceModule.create(plan.moduleKeys.map((moduleKey) => ({
    workspaceId: workspace._id,
    moduleKey,
    status: 'enabled',
    source: 'plan',
    enabledAt: new Date(),
  })), { session });
}

export async function createWorkspaceOwnerAccount({
  name,
  email,
  mobile,
  password,
  workspaceName,
  planKey = 'small_workspace',
  address,
  qualifications,
}) {
  const session = await User.startSession();
  try {
    let workspace;
    let user;
    let membership;
    const normalizedMobile = normalizeMobile(mobile);
    const normalizedEmail = normalizeEmail(email);
    const plan = planByKey(planKey);

    await session.withTransaction(async () => {
      const existing = await User.findOne({
        $or: [
          { mobile: normalizedMobile },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      }).session(session);
      if (existing) {
        const error = new Error('An account already exists for those details. Sign in, then create or switch workspaces.');
        error.statusCode = 409;
        throw error;
      }

      [workspace] = await Workspace.create([{
        name: String(workspaceName || `${name}'s Workspace`).trim(),
        slug: await uniqueSlug(workspaceName || `${name}'s Workspace`, session),
        status: 'active',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        contact: { email: normalizedEmail, phone: normalizedMobile },
        limits: plan.limits,
        onboarding: { completedSteps: ['account', 'workspace', 'plan'] },
      }], { session });

      await seedWorkspacePlan(workspace, plan.key, session);

      const passwordHash = await bcrypt.hash(password, 10);
      [user] = await User.create([{
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        address,
        role: 'owner',
        commercialRole: 'owner',
        firmId: workspace._id,
        workspaceId: workspace._id,
        passwordHash,
        qualifications,
      }], { session });

      [membership] = await Membership.create([{
        userId: user._id,
        workspaceId: workspace._id,
        role: 'owner',
        status: 'active',
        acceptedAt: new Date(),
      }], { session });

      await AuditEvent.create([{
        workspaceId: workspace._id,
        actorId: user._id,
        action: 'workspace.created',
        targetType: 'workspace',
        targetId: workspace._id,
        changes: { ownerUserId: user._id, membershipId: membership._id, planKey: plan.key },
      }], { session });
    });

    return { workspace, user, membership };
  } finally {
    session.endSession();
  }
}

export async function getWorkspaceContextForUser(userId) {
  const memberships = await Membership.find({ userId, status: 'active' })
    .populate('workspaceId')
    .sort({ updatedAt: -1 });
  return memberships
    .filter((membership) => membership.workspaceId)
    .map((membership) => publicMembership(membership, membership.workspaceId));
}

export async function switchUserWorkspace({ userId, workspaceId }) {
  const membership = await Membership.findOne({ userId, workspaceId, status: 'active' }).populate('workspaceId');
  if (!membership) {
    const error = new Error('You do not belong to that workspace.');
    error.statusCode = 403;
    throw error;
  }
  const role = normalizeRole(membership.role);
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { workspaceId, firmId: workspaceId, role, commercialRole: role } },
    { new: true },
  );
  return { user, membership: publicMembership(membership, membership.workspaceId) };
}

export async function createWorkspaceInvitation({ workspaceId, actorId, email, role }) {
  const normalizedRole = normalizeRole(role || 'lawyer');
  if (!COMMERCIAL_ROLES.includes(normalizedRole)) {
    const error = new Error('Choose a valid workspace role.');
    error.statusCode = 400;
    throw error;
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  const count = await Membership.countDocuments({ workspaceId, status: 'active' });
  if (count >= Number(workspace.limits?.members || 5)) {
    const error = new Error('This plan has reached its member limit.');
    error.statusCode = 409;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const invite = await Invitation.create({
    workspaceId,
    email: normalizeEmail(email),
    role: normalizedRole,
    tokenHash: Invitation.hashToken(token),
    invitedBy: actorId,
    expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
  });
  await AuditEvent.create({
    workspaceId,
    actorId,
    action: 'membership.invited',
    targetType: 'invitation',
    targetId: invite._id,
    changes: { email: invite.email, role: normalizedRole },
  });
  return { invite, token };
}

export async function acceptWorkspaceInvitation({ token, name, mobile, password }) {
  const session = await Invitation.startSession();
  try {
    let user;
    let membership;
    let invite;

    await session.withTransaction(async () => {
      invite = await Invitation.findOne({
        tokenHash: Invitation.hashToken(token),
        status: 'pending',
        expiresAt: { $gt: new Date() },
      }).session(session);
      if (!invite) {
        const error = new Error('This invitation has expired or is no longer available.');
        error.statusCode = 404;
        throw error;
      }

      const workspace = await Workspace.findById(invite.workspaceId).session(session);
      const count = await Membership.countDocuments({ workspaceId: invite.workspaceId, status: 'active' }).session(session);
      if (count >= Number(workspace?.limits?.members || 5)) {
        const error = new Error('This workspace has reached its member limit.');
        error.statusCode = 409;
        throw error;
      }

      const email = normalizeEmail(invite.email);
      const normalizedMobile = normalizeMobile(mobile);
      user = await User.findOne({ email }).session(session);
      if (!user && normalizedMobile) user = await User.findOne({ mobile: normalizedMobile }).session(session);
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 10);
        [user] = await User.create([{
          name,
          email,
          mobile: normalizedMobile,
          role: invite.role,
          commercialRole: invite.role,
          firmId: invite.workspaceId,
          workspaceId: invite.workspaceId,
          passwordHash,
        }], { session });
      }

      [membership] = await Membership.create([{
        workspaceId: invite.workspaceId,
        userId: user._id,
        role: invite.role,
        status: 'active',
        invitedBy: invite.invitedBy,
        invitedAt: invite.createdAt,
        acceptedAt: new Date(),
      }], { session });

      await User.updateOne(
        { _id: user._id },
        { $set: { workspaceId: invite.workspaceId, firmId: invite.workspaceId, role: invite.role, commercialRole: invite.role } },
        { session },
      );

      invite.status = 'accepted';
      invite.acceptedBy = user._id;
      invite.acceptedAt = new Date();
      await invite.save({ session });
      await AuditEvent.create([{
        workspaceId: invite.workspaceId,
        actorId: user._id,
        action: 'membership.accepted',
        targetType: 'membership',
        targetId: membership._id,
        changes: { role: invite.role },
      }], { session });
    });

    return { user, membership };
  } finally {
    session.endSession();
  }
}

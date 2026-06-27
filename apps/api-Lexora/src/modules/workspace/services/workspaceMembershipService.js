import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Workspace from '../models/Workspace.js';
import Membership from '../models/Membership.js';
import Invitation from '../models/Invitation.js';
import Subscription from '../models/Subscription.js';
import WorkspaceModule from '../models/WorkspaceModule.js';
import AuditEvent from '../models/AuditEvent.js';
import User from '../../users/models/User.js';
import { getPlanDefinition } from './subscriptionFeatureService.js';
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
    const existing = await withSession(Workspace.findOne({ slug }), session);
    if (!existing) return slug;
  }
  return slugFromName(name, crypto.randomBytes(4).toString('hex'));
}

const withSession = (query, session) =>
  session && query && typeof query.session === 'function' ? query.session(session) : query;

const createOptions = (session) => ({
  ordered: true,
  ...(session ? { session } : {}),
});

function isTransactionUnsupported(err) {
  const message = String(err?.message || '');
  return err?.code === 20 ||
    /Transaction numbers are only allowed/i.test(message) ||
    /replica set member or mongos/i.test(message);
}

async function phase(name, work) {
  try {
    return await work();
  } catch (err) {
    if (!err.phase) err.phase = name;
    throw err;
  }
}

async function runSignupTransaction(work) {
  let session;
  try {
    session = await User.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (isTransactionUnsupported(err)) {
      return work(null);
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
}

function planByKey(planKey) {
  return getPlanDefinition(planKey);
}

async function seedWorkspacePlan(workspace, planKey, session) {
  const plan = planByKey(planKey);
  await phase('subscription.create', () => Subscription.create([{
      workspaceId: workspace._id,
      planKey: plan.key,
      status: 'active',
      source: 'signup',
      featureKeysSnapshot: plan.featureKeys,
      moduleKeysSnapshot: plan.moduleKeys,
      limitsSnapshot: plan.limits,
      startedAt: new Date(),
    }], createOptions(session)));

  await phase('workspace_modules.create', () => WorkspaceModule.create(plan.moduleKeys.map((moduleKey) => ({
      workspaceId: workspace._id,
      moduleKey,
      status: 'enabled',
      source: 'plan',
      enabledAt: new Date(),
    })), createOptions(session)));
}

export async function createWorkspaceOwnerAccount({
  name,
  email,
  mobile,
  password,
  workspaceName,
  planKey = 'professional',
  address,
  qualifications,
}) {
  const normalizedMobile = normalizeMobile(mobile);
  const normalizedEmail = normalizeEmail(email);
  const plan = planByKey(planKey);

  return runSignupTransaction(async (session) => {
    const existing = await phase('user.duplicate_check', () => withSession(
        User.findOne({
          $or: [
            { mobile: normalizedMobile },
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ],
        }),
        session,
      ));
    if (existing) {
      const error = new Error('An account already exists for those details. Sign in, then create or switch workspaces.');
      error.statusCode = 409;
      throw error;
    }

    const [workspace] = await phase('workspace.create', async () => Workspace.create([{
        name: String(workspaceName || `${name}'s Workspace`).trim(),
        slug: await uniqueSlug(workspaceName || `${name}'s Workspace`, session),
        status: 'active',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        contact: { email: normalizedEmail, phone: normalizedMobile },
        limits: plan.limits,
        onboarding: { completedSteps: ['account', 'workspace', 'plan'] },
      }], createOptions(session)));

    await seedWorkspacePlan(workspace, plan.key, session);

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await phase('user.create', () => User.create([{
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
      }], createOptions(session)));

    const [membership] = await phase('membership.create', () => Membership.create([{
        userId: user._id,
        workspaceId: workspace._id,
        role: 'owner',
        status: 'active',
        acceptedAt: new Date(),
      }], createOptions(session)));

    await phase('audit_event.create', () => AuditEvent.create([{
        workspaceId: workspace._id,
        actorId: user._id,
        action: 'workspace.created',
        targetType: 'workspace',
        targetId: workspace._id,
        changes: { ownerUserId: user._id, membershipId: membership._id, planKey: plan.key },
      }], createOptions(session)));

    return { workspace, user, membership };
  });
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

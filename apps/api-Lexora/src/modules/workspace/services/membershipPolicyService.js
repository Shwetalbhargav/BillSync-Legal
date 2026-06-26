import Membership from '../models/Membership.js';
import { isOwner, normalizeRole } from '../roles.js';

const OWNER_ROLE_KEY = 'owner';

export async function activeOwnerCount(workspaceId, session) {
  return Membership.countDocuments({ workspaceId, role: OWNER_ROLE_KEY, status: 'active' }).session(session);
}

export function isFinalOwnerDemotion({ membership, actorUserId, nextRole, ownerCount }) {
  return String(membership?.userId) === String(actorUserId)
    && isOwner(membership?.role)
    && ownerCount <= 1
    && nextRole
    && normalizeRole(nextRole) !== OWNER_ROLE_KEY;
}

export function isFinalOwnerRemoval({ membership, actorUserId, ownerCount }) {
  return String(membership?.userId) === String(actorUserId)
    && isOwner(membership?.role)
    && ownerCount <= 1;
}

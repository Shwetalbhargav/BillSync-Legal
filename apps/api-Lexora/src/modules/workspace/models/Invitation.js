import crypto from 'crypto';
import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';
import { COMMERCIAL_ROLES } from '../roles.js';

const InvitationSchema = new mongoose.Schema(
  {
    email: { type: String, trim: true, lowercase: true, required: true, index: true },
    role: { type: String, enum: COMMERCIAL_ROLES, required: true, default: 'lawyer' },
    tokenHash: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'revoked', 'expired'], default: 'pending', index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date },
    revokedAt: { type: Date },
    resentAt: { type: Date },
  },
  { timestamps: true }
);

InvitationSchema.statics.hashToken = function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

InvitationSchema.index({ workspaceId: 1, email: 1, status: 1 });
InvitationSchema.plugin(workspaceScopedPlugin);

export const Invitation = mongoose.model('Invitation', InvitationSchema);
export default Invitation;


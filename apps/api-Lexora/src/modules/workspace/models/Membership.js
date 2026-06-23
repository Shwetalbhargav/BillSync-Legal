import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';
import { COMMERCIAL_ROLES } from '../roles.js';

const MembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: COMMERCIAL_ROLES, required: true, default: 'lawyer', index: true },
    status: { type: String, enum: ['active', 'invited', 'suspended', 'removed'], default: 'active', index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedAt: { type: Date },
    acceptedAt: { type: Date },
    removedAt: { type: Date },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

MembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ workspaceId: 1, role: 1, status: 1 });

MembershipSchema.plugin(workspaceScopedPlugin);

export const Membership = mongoose.model('Membership', MembershipSchema);
export default Membership;


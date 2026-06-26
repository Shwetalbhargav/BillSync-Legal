import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const PolicySchema = new mongoose.Schema(
  {
    roleKey: { type: String, trim: true, lowercase: true, index: true },
    permissionKey: { type: String, trim: true, lowercase: true, index: true },
    effect: { type: String, enum: ['allow', 'deny'], default: 'allow', index: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },
    scope: { type: String, enum: ['workspace', 'assigned_matter', 'department', 'office', 'financial_only'], default: 'workspace', index: true },
    conditions: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

PolicySchema.index({ workspaceId: 1, roleKey: 1, permissionKey: 1 }, { unique: true, sparse: true });
PolicySchema.plugin(workspaceScopedPlugin);

export const Policy = mongoose.model('Policy', PolicySchema);
export default Policy;

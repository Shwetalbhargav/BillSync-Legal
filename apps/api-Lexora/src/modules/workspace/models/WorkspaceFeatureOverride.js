import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const WorkspaceFeatureOverrideSchema = new mongoose.Schema(
  {
    featureKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    status: { type: String, enum: ['enabled', 'disabled', 'read_only'], required: true, index: true },
    behavior: { type: String, enum: ['hide', 'disable', 'read_only'], default: 'disable' },
    source: { type: String, enum: ['owner', 'support', 'billing_system', 'migration'], default: 'owner' },
    limitOverrides: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String, trim: true, maxlength: 500 },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true },
);

WorkspaceFeatureOverrideSchema.index({ workspaceId: 1, featureKey: 1 }, { unique: true });
WorkspaceFeatureOverrideSchema.plugin(workspaceScopedPlugin);

export const WorkspaceFeatureOverride = mongoose.model('WorkspaceFeatureOverride', WorkspaceFeatureOverrideSchema);
export default WorkspaceFeatureOverride;

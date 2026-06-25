import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const WorkspaceModuleSchema = new mongoose.Schema(
  {
    moduleKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    status: { type: String, enum: ['enabled', 'disabled', 'not_configured'], default: 'enabled', index: true },
    source: { type: String, enum: ['plan', 'owner', 'migration', 'system'], default: 'plan' },
    enabledAt: { type: Date },
    disabledAt: { type: Date },
    reason: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

WorkspaceModuleSchema.index({ workspaceId: 1, moduleKey: 1 }, { unique: true });
WorkspaceModuleSchema.plugin(workspaceScopedPlugin);

export const WorkspaceModule = mongoose.model('WorkspaceModule', WorkspaceModuleSchema);
export default WorkspaceModule;

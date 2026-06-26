import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const EnterpriseUnitSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['department', 'office', 'practice_group'], required: true, index: true },
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    parentUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseUnit' },
    leaderMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

EnterpriseUnitSchema.index({ workspaceId: 1, type: 1, key: 1 }, { unique: true });
EnterpriseUnitSchema.index({ workspaceId: 1, type: 1, status: 1 });
EnterpriseUnitSchema.plugin(workspaceScopedPlugin);

export const EnterpriseUnit = mongoose.model('EnterpriseUnit', EnterpriseUnitSchema);
export default EnterpriseUnit;

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const AiUsageEventSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    moduleKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    consumerKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    action: { type: String, required: true, trim: true, lowercase: true, index: true },
    featureKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    permissionKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    credits: { type: Number, min: 0, default: 1 },
    status: { type: String, enum: ['allowed', 'succeeded', 'failed', 'denied'], default: 'allowed', index: true },
    inputChars: { type: Number, min: 0, default: 0 },
    outputChars: { type: Number, min: 0, default: 0 },
    requestId: { type: String, trim: true },
    targetType: { type: String, trim: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

AiUsageEventSchema.index({ workspaceId: 1, memberId: 1, createdAt: -1 });
AiUsageEventSchema.index({ workspaceId: 1, moduleKey: 1, createdAt: -1 });
AiUsageEventSchema.plugin(workspaceScopedPlugin);

export const AiUsageEvent = mongoose.model('AiUsageEvent', AiUsageEventSchema);
export default AiUsageEvent;

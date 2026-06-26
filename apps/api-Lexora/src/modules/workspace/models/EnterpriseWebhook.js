import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const EnterpriseWebhookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    url: { type: String, trim: true, maxlength: 2048 },
    events: [{ type: String, trim: true, lowercase: true }],
    status: { type: String, enum: ['not_configured', 'active', 'disabled'], default: 'not_configured', index: true },
    signingSecretRef: { type: String, trim: true, select: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastDeliveryAt: { type: Date },
    failureCount: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

EnterpriseWebhookSchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });
EnterpriseWebhookSchema.plugin(workspaceScopedPlugin);

export const EnterpriseWebhook = mongoose.model('EnterpriseWebhook', EnterpriseWebhookSchema);
export default EnterpriseWebhook;

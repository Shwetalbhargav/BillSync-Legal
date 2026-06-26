import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const EnterpriseApiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    keyPrefix: { type: String, trim: true, maxlength: 24, index: true },
    keyHash: { type: String, trim: true, select: false },
    scopes: [{ type: String, trim: true, lowercase: true }],
    status: { type: String, enum: ['active', 'disabled', 'revoked'], default: 'disabled', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

EnterpriseApiKeySchema.index({ workspaceId: 1, keyPrefix: 1 }, { unique: true, sparse: true });
EnterpriseApiKeySchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });
EnterpriseApiKeySchema.plugin(workspaceScopedPlugin);

export const EnterpriseApiKey = mongoose.model('EnterpriseApiKey', EnterpriseApiKeySchema);
export default EnterpriseApiKey;

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const EnterpriseSettingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['sso', 'scim', 'api_keys', 'webhooks', 'audit_logs', 'data_retention', 'white_label', 'custom_workflows', 'custom_roles'],
      required: true,
      index: true,
    },
    status: { type: String, enum: ['not_configured', 'enabled', 'disabled'], default: 'not_configured', index: true },
    displayName: { type: String, trim: true, maxlength: 160 },
    configuration: { type: mongoose.Schema.Types.Mixed, default: {} },
    provider: { type: String, trim: true, maxlength: 80 },
    lastCheckedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

EnterpriseSettingSchema.index({ workspaceId: 1, category: 1 }, { unique: true });
EnterpriseSettingSchema.plugin(workspaceScopedPlugin);

export const EnterpriseSetting = mongoose.model('EnterpriseSetting', EnterpriseSettingSchema);
export default EnterpriseSetting;

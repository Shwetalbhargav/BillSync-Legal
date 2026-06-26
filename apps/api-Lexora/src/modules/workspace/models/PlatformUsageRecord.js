import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const PlatformUsageRecordSchema = new mongoose.Schema(
  {
    metric: { type: String, enum: ['seats', 'storage_gb', 'ai_credits'], required: true, index: true },
    quantity: { type: Number, min: 0, required: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true },
    source: { type: String, enum: ['system', 'provider', 'manual'], default: 'system' },
    measuredAt: { type: Date, default: Date.now, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

PlatformUsageRecordSchema.index({ workspaceId: 1, metric: 1, periodStart: 1, periodEnd: 1 });
PlatformUsageRecordSchema.plugin(workspaceScopedPlugin);

export const PlatformUsageRecord = mongoose.model('PlatformUsageRecord', PlatformUsageRecordSchema);
export default PlatformUsageRecord;

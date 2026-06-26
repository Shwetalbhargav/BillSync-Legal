import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'platform', index: true },
    status: { type: String, enum: ['active', 'draft', 'retired'], default: 'draft', index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    gateBehavior: { type: String, enum: ['hide', 'disable', 'read_only'], default: 'disable' },
    unavailableMessage: { type: String, trim: true, maxlength: 500 },
    usageMetric: { type: String, enum: ['none', 'seats', 'storage_gb', 'ai_credits'], default: 'none', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

FeatureSchema.index({ key: 1 }, { unique: true });

export const Feature = mongoose.model('Feature', FeatureSchema);
export default Feature;

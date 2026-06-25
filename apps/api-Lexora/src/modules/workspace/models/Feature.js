import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'platform', index: true },
    status: { type: String, enum: ['active', 'draft', 'retired'], default: 'draft', index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

FeatureSchema.index({ key: 1 }, { unique: true });

export const Feature = mongoose.model('Feature', FeatureSchema);
export default Feature;

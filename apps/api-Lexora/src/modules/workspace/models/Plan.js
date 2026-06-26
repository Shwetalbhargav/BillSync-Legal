import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'draft', 'retired'], default: 'draft', index: true },
    featureKeys: { type: [String], default: [] },
    moduleKeys: { type: [String], default: [] },
    limits: {
      members: { type: Number, min: 1, default: 1 },
      workspaces: { type: Number, min: 1, default: 1 },
      storageGb: { type: Number, min: 0, default: 1 },
      aiCredits: { type: Number, min: 0, default: 0 },
    },
    usage: {
      seats: { type: Number, min: 1, default: 1 },
      storageGb: { type: Number, min: 0, default: 1 },
      aiCredits: { type: Number, min: 0, default: 0 },
    },
    price: {
      currency: { type: String, trim: true, uppercase: true, default: 'INR' },
      amountPaise: { type: Number, min: 0, default: 0 },
      interval: { type: String, enum: ['month', 'year', 'pilot'], default: 'month' },
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

PlanSchema.index({ key: 1 }, { unique: true });

export const Plan = mongoose.model('Plan', PlanSchema);
export default Plan;

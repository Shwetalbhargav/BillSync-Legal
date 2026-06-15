import mongoose from 'mongoose';

const sourceConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    sourceType: String,
    jurisdiction: {
      country: String,
      court: String,
      level: String,
      state: String,
    },
    documentType: String,
    url: { type: String, required: true },
    strategy: String,
    enabled: { type: Boolean, default: true },
    recommendedForScraping: mongoose.Schema.Types.Mixed,
    reason: String,
    tags: [String],
    rateLimit: {
      delayMs: { type: Number, default: 3000 },
      maxRequestsPerHour: { type: Number, default: 100 },
    },
    selectors: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const SourceConfig =
  mongoose.models.SourceConfig || mongoose.model('SourceConfig', sourceConfigSchema);

export default SourceConfig;

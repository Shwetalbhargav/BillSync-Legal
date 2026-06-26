import mongoose from 'mongoose';

const ModuleRegistrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'draft', 'retired'], default: 'draft', index: true },
    state: { type: String, enum: ['enabled', 'hidden', 'disabled', 'read_only', 'experimental'], default: 'enabled', index: true },
    routeBase: { type: String, trim: true },
    requiredPlanKey: { type: String, trim: true, lowercase: true },
    featureKeys: { type: [String], default: [] },
    permissionKeys: { type: [String], default: [] },
    dependencies: { type: [String], default: [] },
    navigation: {
      label: { type: String, trim: true },
      path: { type: String, trim: true },
      iconKey: { type: String, trim: true },
      section: { type: String, trim: true },
      order: { type: Number },
    },
    order: { type: Number, default: 100 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

ModuleRegistrySchema.index({ key: 1 }, { unique: true });
ModuleRegistrySchema.index({ status: 1, order: 1 });

export const ModuleRegistry = mongoose.model('ModuleRegistry', ModuleRegistrySchema);
export default ModuleRegistry;

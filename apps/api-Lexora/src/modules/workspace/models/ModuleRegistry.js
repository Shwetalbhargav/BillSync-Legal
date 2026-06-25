import mongoose from 'mongoose';

const ModuleRegistrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'draft', 'retired'], default: 'draft', index: true },
    routeBase: { type: String, trim: true },
    featureKeys: { type: [String], default: [] },
    permissionKeys: { type: [String], default: [] },
    order: { type: Number, default: 100 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

ModuleRegistrySchema.index({ key: 1 }, { unique: true });
ModuleRegistrySchema.index({ status: 1, order: 1 });

export const ModuleRegistry = mongoose.model('ModuleRegistry', ModuleRegistrySchema);
export default ModuleRegistry;

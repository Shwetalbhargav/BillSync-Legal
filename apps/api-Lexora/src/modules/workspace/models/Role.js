import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'draft', 'retired'], default: 'active', index: true },
    permissionKeys: { type: [String], default: [] },
    system: { type: Boolean, default: true },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

RoleSchema.index({ key: 1 }, { unique: true });

export const Role = mongoose.model('Role', RoleSchema);
export default Role;

import mongoose from 'mongoose';

const PermissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    moduleKey: { type: String, trim: true, lowercase: true, index: true },
    action: { type: String, required: true, trim: true, lowercase: true },
    resource: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'draft', 'retired'], default: 'active', index: true },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

PermissionSchema.index({ key: 1 }, { unique: true });

export const Permission = mongoose.model('Permission', PermissionSchema);
export default Permission;

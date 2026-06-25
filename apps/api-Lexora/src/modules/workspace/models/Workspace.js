import mongoose from 'mongoose';

const TaxSettingsSchema = new mongoose.Schema(
  {
    taxName: { type: String, default: 'GST', trim: true, maxlength: 80 },
    taxRatePct: { type: Number, default: 0, min: 0, max: 100 },
    inclusive: { type: Boolean, default: false },
  },
  { _id: false },
);

const AddressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 180 },
    line2: { type: String, trim: true, maxlength: 180 },
    city: { type: String, trim: true, maxlength: 180 },
    state: { type: String, trim: true, maxlength: 180 },
    postalCode: { type: String, trim: true, maxlength: 180 },
    country: { type: String, trim: true, uppercase: true, default: 'IN', maxlength: 180 },
  },
  { _id: false },
);

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, trim: true, lowercase: true, maxlength: 180 },
    status: { type: String, enum: ['active', 'trialing', 'suspended', 'archived'], default: 'active', index: true },
    legacyFirmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm' },
    timezone: { type: String, trim: true, default: 'Asia/Kolkata' },
    currency: { type: String, trim: true, uppercase: true, minlength: 3, maxlength: 3, default: 'INR' },
    contact: {
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 40 },
    },
    address: { type: AddressSchema },
    taxSettings: { type: TaxSettingsSchema, default: () => ({}) },
    billingPreferences: {
      defaultRate: { type: Number, min: 0 },
      autoSync: { type: Boolean, default: false },
    },
    limits: {
      members: { type: Number, min: 1, default: 5 },
      workspaces: { type: Number, min: 1, default: 1 },
    },
    onboarding: {
      completedSteps: { type: [String], default: [] },
      completedAt: { type: Date },
      firstClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
      firstMatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
      firstWorkEntryId: { type: mongoose.Schema.Types.ObjectId },
    },
    workReview: {
      enabled: { type: Boolean, default: false },
      reviewerRole: { type: String, enum: ['owner'], default: 'owner' },
      soloOwnerBypass: { type: Boolean, default: true },
      readyStatusLabel: { type: String, default: 'Ready to Bill' },
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

WorkspaceSchema.index({ slug: 1 }, { unique: true, sparse: true });
WorkspaceSchema.index({ legacyFirmId: 1 }, { unique: true, sparse: true });
WorkspaceSchema.index({ status: 1, updatedAt: -1 });

export const Workspace = mongoose.model('Workspace', WorkspaceSchema);
export default Workspace;

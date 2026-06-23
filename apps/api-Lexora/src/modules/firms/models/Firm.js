// src/models/Firm.js

import mongoose from 'mongoose';

const TaxSettingsSchema = new mongoose.Schema(
  {
    taxName: { type: String, default: 'GST', trim: true, maxlength: 80 },
    taxRatePct: { type: Number, default: 0, min: 0, max: 100 },
    inclusive: { type: Boolean, default: false },
  },
  { _id: false }
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
  { _id: false }
);

const FirmSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, trim: true, uppercase: true, minlength: 3, maxlength: 3, default: 'INR' },
    taxSettings: { type: TaxSettingsSchema, default: () => ({}) },
    address: { type: AddressSchema },
    contact: {
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 40 },
    },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 32 },
    timezone: { type: String, trim: true, default: 'Asia/Kolkata' },
    invoicePrefix: { type: String, trim: true, uppercase: true, default: 'INV' },
    paymentInstructions: { type: String, trim: true, maxlength: 2000 },
    paymentTerms: { type: String, trim: true, uppercase: true, default: 'NET30' },
    memberLimit: { type: Number, default: 5, min: 1, max: 5 },
    restrictedMatterVisibility: { type: Boolean, default: false },
    workReview: {
      enabled: { type: Boolean, default: false },
      reviewerRole: { type: String, enum: ['owner'], default: 'owner' },
      soloOwnerBypass: { type: Boolean, default: true },
      readyStatusLabel: { type: String, default: 'Ready to Bill' },
    },
    onboarding: {
      completedSteps: { type: [String], default: [] },
      completedAt: { type: Date },
      firstClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
      firstMatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
      firstWorkEntryId: { type: mongoose.Schema.Types.ObjectId },
    },
    billingPreferences: {
      defaultRate: { type: Number, min: 0 },
      autoSync: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

FirmSchema.index({ name: 1 });

export const Firm = mongoose.model('Firm', FirmSchema);
export default Firm;

// src/models/Client.js 

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

export const CLIENT_STATUSES = ['active', 'inactive', 'prospect', 'archived'];
export const PAYMENT_TERMS = [
  'DUE_ON_RECEIPT',
  'NET7',
  'NET15',
  'NET30',
  'NET45',
  'NET60',
  'NET90',
];

const ClientContactSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    role: String,
    isPrimary: { type: Boolean, default: false },
    notes: String,
    integrations: {
      zoho: {
        crmRecordId: { type: String },
        lastSyncedAt: { type: Date },
      },
    },
  },
  { _id: false }
);

const ClientSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true },
    name: { type: String, trim: true }, // deprecated
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    contactInfo: { type: String },
    legalBillingName: { type: String, trim: true },
    billingAddress: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    gst: {
      gstin: { type: String, trim: true, uppercase: true },
      legalName: { type: String, trim: true },
      placeOfSupply: { type: String, trim: true },
      registered: { type: Boolean, default: false },
      treatment: { type: String, enum: ['gst', 'no_gst', 'export', 'sez'], default: 'gst' },
    },
    gstin: { type: String, trim: true, uppercase: true },
    contactPerson: { type: String, trim: true },
    invoiceEmail: { type: String, trim: true, lowercase: true },
    businessEntityType: {
      type: String,
      enum: ['individual', 'proprietorship', 'partnership', 'llp', 'company', 'trust', 'government', 'other'],
      default: 'individual',
    },
    rcmApplicabilityHint: { type: String, trim: true },
    notes: { type: String, trim: true },

    firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm' },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: CLIENT_STATUSES, default: 'active', index: true },
    paymentTerms: { type: String, enum: PAYMENT_TERMS, default: 'NET30', trim: true, uppercase: true },
    contacts: { type: [ClientContactSchema], default: [] },
    integrations: {
      zoho: {
        crmModule: { type: String, default: 'Accounts' },
        crmRecordId: { type: String },
        lastSyncedAt: { type: Date },
      },
    },
  },
  { timestamps: true }
);

ClientSchema.index({ displayName: 'text', email: 1, phone: 1 });
ClientSchema.index({ workspaceId: 1, displayName: 1 }, { unique: true });
ClientSchema.index({ workspaceId: 1, email: 1 });
ClientSchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });

ClientSchema.plugin(workspaceScopedPlugin);
export const Client = mongoose.model('Client', ClientSchema);
export default Client;

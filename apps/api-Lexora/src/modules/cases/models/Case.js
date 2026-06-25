// src/models/Case.js

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const CaseSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    matterNumber: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    name: { type: String }, // deprecated
    description: { type: String },

    status: { type: String, enum: ['open', 'closed', 'pending', 'archived'], default: 'open', index: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },

    leadPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managingLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    primaryLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    billingType: { type: String, enum: ['hourly', 'fixed_fee', 'contingency', 'retainer'], default: 'hourly' },
    fixedFeeAmount: { type: Number, min: 0 },
    fixedFeeAmountPaise: { type: Number, min: 0 },
    fixedFeeDescription: { type: String, trim: true },

    case_type: { type: String, trim: true },
    case_type_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    court: {
      name: { type: String, trim: true },
      bench: { type: String, trim: true },
      courtroom: { type: String, trim: true },
      judge: { type: String, trim: true },
    },
    caseDetails: {
      courtCaseNumber: { type: String, trim: true },
      filingNumber: { type: String, trim: true },
      cnrNumber: { type: String, trim: true },
      opposingParty: { type: String, trim: true },
      opposingCounsel: { type: String, trim: true },
    },
    importantDates: {
      filingDate: { type: Date },
      nextHearingDate: { type: Date },
      limitationDate: { type: Date },
      targetCloseDate: { type: Date },
    },
    integrations: {
      zoho: {
        crmModule: { type: String, default: 'Deals' },
        crmRecordId: { type: String },
        workdriveFolderId: { type: String },
        workdriveFolderUrl: { type: String },
        lastSyncedAt: { type: Date },
      },
    },
  },
  { timestamps: true }
);

CaseSchema.pre('validate', function(next) {
  if (this.fixedFeeAmountPaise == null && this.fixedFeeAmount != null) {
    this.fixedFeeAmountPaise = Math.round(Number(this.fixedFeeAmount || 0) * 100);
  }
  next();
});

CaseSchema.index({ clientId: 1, status: 1 });
CaseSchema.index({ workspaceId: 1, matterNumber: 1 }, { unique: true, sparse: true });
CaseSchema.index({ title: 'text', description: 'text' });

CaseSchema.plugin(workspaceScopedPlugin);
export const Case = mongoose.model('Case', CaseSchema);
export default Case;

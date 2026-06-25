// models/Billable.js
import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

export const BILLABLE_STATUSES = ['draft', 'pending', 'ready_to_bill', 'approved', 'billed', 'excluded', 'rejected'];

const LEGACY_STATUS_MAP = {
  Pending: 'pending',
  Logged: 'billed',
  Failed: 'rejected',
};

export function normalizeBillableStatus(status = 'pending') {
  const value = String(status || 'pending').trim();
  return LEGACY_STATUS_MAP[value] || value.toLowerCase();
}

export function billableStatusQuery(status) {
  const normalized = normalizeBillableStatus(status);
  const legacyAliases = Object.entries(LEGACY_STATUS_MAP)
    .filter(([, canonical]) => canonical === normalized)
    .map(([legacy]) => legacy);
  return { $in: [normalized, ...legacyAliases] };
}

const BillableSchema = new mongoose.Schema({
  caseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },

  // Added to match frontend/controller
  subject: { type: String },
  status:  {
    type: String,
    enum: BILLABLE_STATUSES,
    default: 'pending',
    index: true
  },
  activityCode: {
    type: String,
    enum: ['EMAIL','CALL','MEETING','DOC_REVIEW','RESEARCH','NEGOTIATION','ADMIN','OTHER'],
    default: 'EMAIL'
  },

  // Existing fields (used by controller & invoices)
  category: {
    type: String,
    enum: [
      'Email drafting/review',
      'Contract drafting/review',
      'Legal research',
      'Client consultation (calls/meetings)',
      'Case preparation/documentation',
      'Court appearance or hearing attendance',
      'Negotiation/settlement discussions',
      'IP filing & compliance work',
      'Dispute resolution activities',
      'Miscellaneous administrative legal work'
    ],
    required: true
  },
  description:     { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  rate:            { type: Number, required: true },
  ratePaise:       { type: Number, min: 0, default: 0 },
  amount:          { type: Number, required: true },
  amountPaise:     { type: Number, min: 0, default: 0 },
  adjustmentPaise: { type: Number, default: 0 },
  adjustmentReason:{ type: String, trim: true },
  expense: {
    isExpense: { type: Boolean, default: false },
    category: { type: String, trim: true },
    vendor: { type: String, trim: true },
    gstTreatment: { type: String, enum: ['gst', 'no_gst', 'inclusive', 'exempt'], default: 'gst' },
    gstRatePct: { type: Number, min: 0, max: 100, default: 0 },
    billable: { type: Boolean, default: true },
    approvalRequired: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected'], default: 'not_required' },
    receiptDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoredDocument' },
  },
  billingSnapshot: { type: mongoose.Schema.Types.Mixed },
  date:            { type: Date, required: true },

  // optional push metadata
  invoiceId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', index: true },
  pushedAt:        { type: Date },
  externalEntryId: { type: String },
  sourceFingerprint: { type: String, trim: true },

  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String }
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true }
});

BillableSchema.pre('validate', function(next) {
  this.status = normalizeBillableStatus(this.status);
  if ((this.amount == null || this.amount === 0) && this.rate != null && this.durationMinutes != null) {
    this.amount = Math.round((this.rate * (this.durationMinutes / 60)) * 100) / 100;
  }
  this.ratePaise = this.ratePaise || Math.round(Number(this.rate || 0) * 100);
  this.amountPaise = this.amountPaise || Math.round(Number(this.amount || 0) * 100);
  next();
});

function normalizeStatusUpdate(next) {
  const update = this.getUpdate() || {};
  if (update.status) update.status = normalizeBillableStatus(update.status);
  if (update.$set?.status) update.$set.status = normalizeBillableStatus(update.$set.status);
  this.setUpdate(update);
  next();
}

BillableSchema.pre('findOneAndUpdate', normalizeStatusUpdate);
BillableSchema.pre('updateOne', normalizeStatusUpdate);
BillableSchema.pre('updateMany', normalizeStatusUpdate);

BillableSchema.virtual('hours').get(function () {
  return this.durationMinutes / 60;
});

BillableSchema.index({ clientId: 1, caseId: 1, date: -1 });
BillableSchema.index({ userId: 1, date: -1 });
BillableSchema.index({ activityId: 1, date: -1 });
BillableSchema.index(
  { workspaceId: 1, sourceFingerprint: 1 },
  { unique: true, partialFilterExpression: { sourceFingerprint: { $exists: true, $type: 'string' } } }
);
BillableSchema.index(
  { activityId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      activityId: { $exists: true },
    },
  }
);
BillableSchema.plugin(workspaceScopedPlugin);
const Billable = mongoose.model('Billable', BillableSchema);
export default Billable;
export { Billable };

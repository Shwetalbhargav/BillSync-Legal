// src/models/Invoice.js

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const InvoiceSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },

    periodStart: { type: Date },
    periodEnd: { type: Date },

    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date },

    currency: { type: String, default: 'INR' },
    templateType: {
      type: String,
      enum: ['standard', 'solo_advocate_fee_invoice'],
      default: 'standard',
      index: true,
    },
    invoiceNumber: { type: String, trim: true },
    revisionOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    revisionReason: { type: String, trim: true },

    subtotal: { type: Number, default: 0 },
    subtotalPaise: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxPaise: { type: Number, default: 0 },
    taxName: { type: String, default: 'GST', trim: true },
    taxRatePct: { type: Number, default: 0, min: 0, max: 100 },
    taxInclusive: { type: Boolean, default: false },
    taxDetails: {
      taxName: { type: String, default: 'GST' },
      taxRatePct: { type: Number, default: 0 },
      inclusive: { type: Boolean, default: false },
      taxableAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      grossAmount: { type: Number, default: 0 },
    },
    taxTreatment: {
      type: String,
      enum: ['rcm_applicable', 'gst_charged', 'gst_not_applicable', 'gst_exempt'],
      default: 'gst_charged',
    },
    taxNote: {
      type: String,
      trim: true,
      default: 'Tax on this supply may be payable by the recipient under reverse charge mechanism, where applicable.',
    },
    total: { type: Number, required: true },
    totalPaise: { type: Number, required: true, default: 0 },
    balancePaise: { type: Number, default: 0 },
    finalisedAt: { type: Date },
    finalisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    immutableSnapshot: {
      lines: { type: [mongoose.Schema.Types.Mixed], default: [] },
      taxSettings: { type: mongoose.Schema.Types.Mixed },
      totals: { type: mongoose.Schema.Types.Mixed },
    },
    advocateSnapshot: { type: mongoose.Schema.Types.Mixed },
    clientBillingSnapshot: { type: mongoose.Schema.Types.Mixed },
    matterSnapshot: { type: mongoose.Schema.Types.Mixed },
    paymentDetailsSnapshot: { type: mongoose.Schema.Types.Mixed },
    taxTreatmentSnapshot: { type: mongoose.Schema.Types.Mixed },

    status: { type: String, enum: ['draft', 'ready_to_bill', 'finalised', 'sent', 'partial', 'paid', 'overdue', 'void', 'revised'], default: 'draft', index: true },
    pdfUrl: { type: String },
    sentAt: { type: Date },
    sentTo: { type: String, trim: true, lowercase: true },
    deliveryStatus: { type: String, enum: ['not_sent', 'sent', 'failed'], default: 'not_sent' },
    deliveryError: { type: String },
    deliveryHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
    paymentPortal: {
      enabled: { type: Boolean, default: false },
      tokenHash: { type: String, index: true },
      expiresAt: { type: Date },
      lastGeneratedAt: { type: Date },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    integrations: {
      zoho: {
        crmModule: { type: String, default: 'Invoices' },
        crmRecordId: { type: String },
        lastSyncedAt: { type: Date },
      },
    },

    items: [
      { 
        billableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billable', index: true  },
        timeEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeEntry', index: true },
        lineType: { type: String, enum: ['hourly', 'professional_fee', 'reimbursable_expense'], default: 'hourly' },
        serviceDate: Date,
        periodLabel: String,
        receiptDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoredDocument' },
        description: String,
        durationMinutes: Number,
        qtyHours: Number,
        rate: Number,
        ratePaise: Number,
        amount: Number,
        amountPaise: Number,
      },
    ],
  },
  { timestamps: true }
);

InvoiceSchema.pre('validate', function(next) {
  const items = this.items || [];
  if (items.length) {
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const subtotalPaise = items.reduce((s, i) => s + (i.amountPaise || Math.round((i.amount || 0) * 100)), 0);
    this.subtotal = Math.round(subtotal * 100) / 100;
    this.subtotalPaise = subtotalPaise;
  }
  const tax = this.tax || 0;
  this.total = Math.round((this.subtotal + tax) * 100) / 100;
  if (this.taxPaise == null) this.taxPaise = Math.round(tax * 100);
  if (this.totalPaise == null) this.totalPaise = Math.round(this.total * 100);
  if (this.balancePaise == null) this.balancePaise = this.totalPaise;
  next();
});

InvoiceSchema.methods.computeStatus = function (paidAmount = 0) {
  if (this.status === 'void') return 'void';
  const total = this.total || 0;
  const now = new Date();
  if (paidAmount >= total) return 'paid';
  if (paidAmount > 0) return 'partial';
  if (this.dueDate && this.dueDate < now) return 'overdue';
  return this.status === 'draft' ? 'draft' : 'sent';
};

InvoiceSchema.index({ clientId: 1, status: 1, issueDate: 1 });
InvoiceSchema.index({ caseId: 1, status: 1 });
InvoiceSchema.index({ workspaceId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });

InvoiceSchema.plugin(workspaceScopedPlugin);
export const Invoice = mongoose.model('Invoice', InvoiceSchema);
export default Invoice;

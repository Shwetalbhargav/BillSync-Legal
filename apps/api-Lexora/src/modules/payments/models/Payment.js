// src/models/Payment.js

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const PaymentAuditSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    changes: { type: mongoose.Schema.Types.Mixed },
    note: { type: String },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, required: true, min: 0, default: 0 },
    transactionType: { type: String, enum: ['payment', 'write_off', 'refund'], default: 'payment', index: true },
    creditApplied: { type: Boolean, default: false },
    method: { type: String, enum: ['bank_transfer', 'cheque', 'cash', 'card', 'upi', 'wallet', 'other'], required: true },
    receivedDate: { type: Date, required: true },
    reference: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true },
    receiptNumber: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'cleared', 'failed'], default: 'cleared' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
    portal: {
      submittedByClient: { type: Boolean, default: false },
      payerName: { type: String, trim: true, maxlength: 160 },
      payerEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
      upiId: { type: String, trim: true, lowercase: true, maxlength: 160 },
      submittedAt: { type: Date },
    },
    auditTrail: { type: [PaymentAuditSchema], default: [] },
  },
  { timestamps: true }
);

PaymentSchema.index({ invoiceId: 1, receivedDate: -1 });
PaymentSchema.index({ transactionType: 1, status: 1, receivedDate: -1 });
PaymentSchema.index({ workspaceId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ workspaceId: 1, receiptNumber: 1 }, { unique: true, sparse: true });

PaymentSchema.pre('validate', function(next) {
  this.amountPaise = this.amountPaise || Math.round(Number(this.amount || 0) * 100);
  next();
});

PaymentSchema.plugin(workspaceScopedPlugin);
export const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;

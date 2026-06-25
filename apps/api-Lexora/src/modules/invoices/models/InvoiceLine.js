// src/models/InvoiceLine.js

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const InvoiceLineSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    timeEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeEntry' },
    billableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billable', index: true },
    description: { type: String, required: true },
    qtyHours: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    ratePaise: { type: Number, min: 0, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, min: 0, default: 0 },
    taxRatePct: { type: Number, min: 0, max: 100, default: 0 },
    taxInclusive: { type: Boolean, default: false },
    taxPaise: { type: Number, min: 0, default: 0 },
    snapshot: {
      sourceType: { type: String, enum: ['time_entry', 'billable', 'expense', 'manual'], default: 'manual' },
      sourceStatus: { type: String },
      rateSource: { type: String },
      description: { type: String },
      capturedAt: { type: Date },
    },
    taxCategory: { type: String, default: 'GST', trim: true },
  },
  { timestamps: true }
);

InvoiceLineSchema.plugin(workspaceScopedPlugin);
export const InvoiceLine = mongoose.model('InvoiceLine', InvoiceLineSchema);
export default InvoiceLine;

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const PlatformInvoiceLineSchema = new mongoose.Schema(
  {
    metric: { type: String, enum: ['subscription', 'seats', 'storage_gb', 'ai_credits', 'adjustment'], required: true },
    label: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 0, default: 1 },
    unitAmountPaise: { type: Number, min: 0, default: 0 },
    amountPaise: { type: Number, min: 0, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

const PlatformInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', index: true },
    providerInvoiceId: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'open', 'paid', 'past_due', 'void', 'uncollectible'],
      default: 'open',
      index: true,
    },
    billingReason: {
      type: String,
      enum: ['subscription_cycle', 'plan_change', 'usage_overage', 'manual_adjustment'],
      default: 'subscription_cycle',
    },
    currency: { type: String, trim: true, uppercase: true, default: 'INR' },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true },
    dueAt: { type: Date },
    paidAt: { type: Date },
    subtotalPaise: { type: Number, min: 0, default: 0 },
    taxPaise: { type: Number, min: 0, default: 0 },
    totalPaise: { type: Number, min: 0, default: 0 },
    balancePaise: { type: Number, min: 0, default: 0 },
    lines: { type: [PlatformInvoiceLineSchema], default: [] },
    hostedInvoiceUrl: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

PlatformInvoiceSchema.index({ workspaceId: 1, invoiceNumber: 1 }, { unique: true });
PlatformInvoiceSchema.index({ workspaceId: 1, status: 1, dueAt: -1 });
PlatformInvoiceSchema.plugin(workspaceScopedPlugin);

export const PlatformInvoice = mongoose.model('PlatformInvoice', PlatformInvoiceSchema);
export default PlatformInvoice;

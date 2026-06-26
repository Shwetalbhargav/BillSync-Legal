import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const PlatformPaymentSchema = new mongoose.Schema(
  {
    platformInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformInvoice', required: true, index: true },
    providerPaymentId: { type: String, trim: true, index: true },
    amountPaise: { type: Number, min: 0, required: true },
    currency: { type: String, trim: true, uppercase: true, default: 'INR' },
    status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], default: 'pending', index: true },
    method: { type: String, trim: true },
    failureCode: { type: String, trim: true },
    failureMessage: { type: String, trim: true },
    receivedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

PlatformPaymentSchema.index({ workspaceId: 1, status: 1, receivedAt: -1 });
PlatformPaymentSchema.plugin(workspaceScopedPlugin);

export const PlatformPayment = mongoose.model('PlatformPayment', PlatformPaymentSchema);
export default PlatformPayment;

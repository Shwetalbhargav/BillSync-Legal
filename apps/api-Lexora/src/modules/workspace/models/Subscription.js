import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const SubscriptionSchema = new mongoose.Schema(
  {
    planKey: { type: String, required: true, trim: true, lowercase: true, index: true },
    status: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled', 'cancelled'], default: 'active', index: true },
    source: { type: String, enum: ['migration', 'owner', 'signup', 'billing_system', 'seed'], default: 'migration' },
    startedAt: { type: Date },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    canceledAt: { type: Date },
    featureKeysSnapshot: { type: [String], default: [] },
    moduleKeysSnapshot: { type: [String], default: [] },
    limitsSnapshot: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

SubscriptionSchema.index({ workspaceId: 1, status: 1 });
SubscriptionSchema.index({ workspaceId: 1, planKey: 1, status: 1 });
SubscriptionSchema.plugin(workspaceScopedPlugin);

export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export default Subscription;

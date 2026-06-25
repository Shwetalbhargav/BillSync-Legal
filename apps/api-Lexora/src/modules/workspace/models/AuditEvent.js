import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const AuditEventSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    changes: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditEventSchema.index({ workspaceId: 1, createdAt: -1 });
AuditEventSchema.plugin(workspaceScopedPlugin);

export const AuditEvent = mongoose.model('AuditEvent', AuditEventSchema);
export default AuditEvent;


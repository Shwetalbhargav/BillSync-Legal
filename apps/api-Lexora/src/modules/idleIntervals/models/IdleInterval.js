import mongoose from 'mongoose';

const IdleIntervalSchema = new mongoose.Schema(
  {
    workSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkSession', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', index: true },
    intervalStart: { type: Date, required: true, index: true },
    intervalEnd: { type: Date, required: true, index: true },
    durationSeconds: { type: Number, required: true, min: 1, max: 86400 },
    thresholdSeconds: { type: Number, required: true, min: 60, max: 3600 },
    detectionSource: {
      type: String,
      enum: ['activity_sample', 'heartbeat_gap', 'return_prompt', 'manual_review'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'kept', 'discarded'],
      default: 'pending',
      index: true,
    },
    reason: { type: String, trim: true, maxlength: 500 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
    payableImpactSeconds: { type: Number, default: 0, min: 0 },
    privacyPolicy: {
      type: String,
      enum: ['idle_timing_only_no_content'],
      default: 'idle_timing_only_no_content',
      required: true,
    },
  },
  { timestamps: true }
);

IdleIntervalSchema.index({ workSessionId: 1, intervalStart: 1, intervalEnd: 1 }, { unique: true });
IdleIntervalSchema.index({ userId: 1, status: 1, intervalStart: -1 });

export const IdleInterval = mongoose.model('IdleInterval', IdleIntervalSchema);
export default IdleInterval;

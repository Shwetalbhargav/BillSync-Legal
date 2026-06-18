import mongoose from 'mongoose';

const ActivitySampleSchema = new mongoose.Schema(
  {
    workSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkSession', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', index: true },

    windowStart: { type: Date, required: true, index: true },
    windowEnd: { type: Date, required: true, index: true },
    sampleSeconds: { type: Number, required: true, min: 1, max: 3600 },
    activeSeconds: { type: Number, required: true, min: 0, max: 3600 },
    inactiveSeconds: { type: Number, required: true, min: 0, max: 3600 },
    keyboardCount: { type: Number, required: true, min: 0, max: 100000 },
    mouseCount: { type: Number, required: true, min: 0, max: 100000 },
    sourceDevice: {
      type: String,
      enum: ['web', 'desktop', 'mobile', 'chrome_extension', 'unknown'],
      default: 'web',
      index: true,
    },
    sourceApp: {
      type: String,
      enum: ['web_meter', 'desktop_agent', 'mobile_agent', 'manual_agent', 'chrome_extension', 'unknown'],
      default: 'web_meter',
      index: true,
    },
    activityPercent: { type: Number, required: true, min: 0, max: 100 },
    privacyPolicy: {
      type: String,
      enum: ['counts_only_no_key_values_no_content'],
      default: 'counts_only_no_key_values_no_content',
      required: true,
    },
  },
  { timestamps: true, strict: true }
);

ActivitySampleSchema.index({ workSessionId: 1, windowStart: 1 }, { unique: true });
ActivitySampleSchema.index({ userId: 1, windowStart: -1 });
ActivitySampleSchema.index({ caseId: 1, windowStart: -1 });

export const ActivitySample = mongoose.model('ActivitySample', ActivitySampleSchema);
export default ActivitySample;
